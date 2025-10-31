import fs from "fs/promises";
import path from "path";

type VersionEntry = { version: string; vid: number };

export async function sortVersionsFile(
  inputPath = path.join(__dirname, "..", "db", "versions.json"),
  descending = true
): Promise<VersionEntry[]> {
  const content = await fs.readFile(inputPath, "utf8");
  const obj = JSON.parse(content) as Record<string, number>;

  const arr: VersionEntry[] = Object.keys(obj).map((k) => ({
    version: k.toUpperCase(),
    vid: obj[k],
  }));

  arr.sort((a, b) => (descending ? b.vid - a.vid : a.vid - b.vid));

  return arr;
}

async function main() {
  const argv = process.argv.slice(2);
  const file = argv[0] || path.join(__dirname, "..", "db", "versions.json");
  const order = (argv[1] || "desc").toLowerCase();
  const descending = order !== "asc";

  try {
    const sorted = await sortVersionsFile(file, descending);

    const outObj: Record<string, number> = {};
    for (const { version, vid } of sorted) {
      outObj[version] = vid;
    }

    const outJson = JSON.stringify(outObj, null, 2) + "\n";
    await fs.writeFile(file, outJson, "utf8");
    console.log(`Sorted and uppercased versions in ${file}`);
  } catch (err) {
    console.error("Error sorting versions:", err);
    process.exitCode = 2;
  }
}

if (require.main === module) {
  main();
}

export default sortVersionsFile;
