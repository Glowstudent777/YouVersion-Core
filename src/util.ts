import booksJson from "./db/books.json";
import versionsJson from "./db/versions.json";
import type { BookInfo } from "./types";

export const bookMap = new Map<string, BookInfo>();

for (const b of (booksJson as { books: BookInfo[] }).books) {
  bookMap.set(b.book.toLowerCase(), b);
  for (const a of b.aliases) {
    bookMap.set(a.toUpperCase(), b);
  }
}

export type VersionMap = Record<string, number>;

export const versionMap: VersionMap = Object.fromEntries(
  Object.entries(versionsJson as Record<string, number>).map(([k, v]) => [
    k.toUpperCase(),
    v,
  ])
);

export const versionIdToKey = new Map<number, string>();
for (const [k, v] of Object.entries(versionsJson as Record<string, number>)) {
  versionIdToKey.set(v, k);
}

export const resolveVersion = (input: string): { key: string; id: number } => {
  const parsed = Number.parseInt(input, 10);
  if (!Number.isNaN(parsed)) {
    const key = versionIdToKey.get(parsed) ?? "NIV";
    return { key, id: parsed };
  }

  const upper = input.toUpperCase();
  const id = versionMap[upper] ?? versionMap["NIV"] ?? 111;
  const key = versionIdToKey.get(id) ?? "NIV";
  return { key, id };
};

export const resolveBook = (input: string): BookInfo | undefined => {
  let b = bookMap.get(input.toLowerCase());
  if (b) return b;

  b = bookMap.get(input.toUpperCase());
  return b;
};
