import axios from "axios";
import * as cheerio from "cheerio";
import { resolveVersion, resolveBook } from "./util";
import type {
  GetVerseResult,
  FullChapterResult,
  SingleVerseResult,
} from "./types";

const BASE_URL = "https://www.bible.com/bible";

const cleanText = (html: string): string => {
  return html
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s+([)"”'’\]\}])/g, "$1")
    .replace(/([.,;:!?'"”’\)\]\}])(?=[A-Za-z0-9(\[\{])/g, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
};

export const getVerse = async (
  book: string,
  chapter: string,
  verses: string,
  version: string
): Promise<GetVerseResult> => {
  const { id: versionId } = resolveVersion(version);
  const bookInfo = resolveBook(book);

  if (!bookInfo) {
    return {
      code: 400,
      message: `Could not find book '${book}' by name or alias.`,
    };
  }

  const alias = bookInfo.aliases[0];
  const url =
    verses === "-1"
      ? `${BASE_URL}/${versionId}/${alias}.${chapter}`
      : `${BASE_URL}/${versionId}/${alias}.${chapter}.${verses}`;

  try {
    const { data } = await axios.get<string>(url, {
      timeout: 8000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 11.00; Win64; x64; rv:10.0) Gecko/20100101 Firefox/10.0",
      },
    });

    const $ = cheerio.load(data);

    if ($("p:contains('No Available Verses')").length) {
      return { code: 400, message: "Verse not found." };
    }

    const nextScript = $("script#__NEXT_DATA__").first();
    if (nextScript.length) {
      const json = JSON.parse(nextScript.html() || "");

      if (verses !== "-1") {
        const verseData = json.props.pageProps.verses?.[0];
        if (!verseData)
          return { code: 400, message: "Verse not found in JSON data." };

        const passage = cleanText(cheerio.load(verseData.content).text());
        const reference = verseData.reference.human;

        return {
          citation: reference,
          passage,
        } as SingleVerseResult;
      }

      const chapterHtml = json.props.pageProps.chapterInfo?.content;
      if (!chapterHtml)
        return { code: 400, message: "Chapter content not found." };

      const chapter$ = cheerio.load(chapterHtml);
      let title =
        chapter$(".heading").first().text().trim() ||
        chapter$(".d").first().text().trim() ||
        `${bookInfo.book} ${chapter}`;

      const versesArray: { verseNumber: number; verseContent: string }[] = [];

      const paverses = chapterHtml.split(/<span class="label">\d+<\/span>/g);
      let titleText = cheerio.load(paverses[0])(".heading").text();
      paverses.shift();

      paverses.forEach((verse: any, index: number) => {
        const verseNumber = index + 1;
        let verseText = cheerio.load(verse)(".content").text();
        verseText = cleanText(verseText);

        if (verseText)
          versesArray.push({
            verseNumber,
            verseContent: verseText,
          });
      });

      const versesObj = versesArray.reduce(
        (acc: Record<number, string>, verse) => {
          acc[verse.verseNumber] = verse.verseContent;
          return acc;
        },
        {}
      );

      return {
        title: titleText || title,
        verses: versesObj,
        citation: `${bookInfo.book} ${chapter}`,
      } as FullChapterResult;
    }

    const wrapper = $(".text-17");
    const versesArray: string[] = [];

    wrapper.each((_, p) => {
      const text = cleanText($(p).text());
      if (text) versesArray.push(text);
    });

    return {
      citation: `${bookInfo.book} ${chapter}:${verses}`,
      passage: versesArray[0] || "",
    } as SingleVerseResult;
  } catch (err) {
    console.error("Error fetching or parsing verse:", err);
    return { code: 400, message: "Failed to fetch or parse verse data." };
  }
};
