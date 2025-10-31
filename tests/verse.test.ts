import { getVerse } from "../src/verse";
import { expect, it, describe } from "vitest";
import type { FullChapterResult, SingleVerseResult } from "../src/types";

const expectFullChapter = (result: any): result is FullChapterResult => {
  return "verses" in result && "title" in result;
};

const expectSingleVerse = (result: any): result is SingleVerseResult => {
  return "passage" in result;
};

describe("getVerse", () => {
  it("John 1 (full chapter, NIV)", async () => {
    const result = await getVerse("John", "1", "-1", "NIV");

    if (!expectFullChapter(result)) {
      throw new Error("Expected full chapter result");
    }

    expect(result.citation).toBe("John 1");
    expect(result.title).toBe("The Word Became Flesh");

    expect(result.verses[1]).toBe(
      "In the beginning was the Word, and the Word was with God, and the Word was God."
    );

    expect(result.verses[2]).toBe("He was with God in the beginning.");

    expect(Object.keys(result.verses).length).toBeGreaterThanOrEqual(51);
  }, 10_000);

  it("John 3:16 (single verse, ESV)", async () => {
    const result = await getVerse("John", "3", "16", "ESV");

    if (!expectSingleVerse(result)) {
      throw new Error("Expected single verse result");
    }

    expect(result.citation).toBe("John 3:16");
    expect(result.passage).toContain("For God so loved the world");
    expect(result.passage).toContain("that he gave his one and only Son");
  }, 10_000);

  it("Psalms 23 (full chapter, KJV)", async () => {
    const result = await getVerse("Psalms", "23", "-1", "KJV");

    if (!expectFullChapter(result)) {
      throw new Error("Expected full chapter result");
    }

    expect(result.citation).toBe("Psalms 23");
    expect(result.title).toBe("A Psalm of David.");

    expect(result.verses[1]).toBe("The LORD is my shepherd; I shall not want.");
  }, 10_000);

  it("Invalid book returns error", async () => {
    const result = await getVerse("InvalidBook", "1", "-1", "NIV");
    expect(result).toHaveProperty("code", 400);
    expect((result as any).message).toContain("Could not find book");
  });

  it("Invalid verse returns error", async () => {
    const result = await getVerse("John", "1", "999", "NIV");
    expect(result).toHaveProperty("code", 400);
    expect((result as any).message).toBe("Verse not found.");
  });
});
