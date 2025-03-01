import {
  assertEquals,
  assertNotEquals,
  assertStringIncludes,
} from "std-assert";
import { pipe, sideEffect } from "gamla";
import {
  filterPageParts,
  findInSimplifiedTree,
  mainList,
  simplifiedHtmlToString,
  type SimplifiedNode,
  simplifyHtml,
} from "./index.ts";

const writeToFile = <T>(obj: T) =>
  Deno.writeFileSync(
    "./output.json",
    new TextEncoder().encode(JSON.stringify(obj, null, 2)),
  );

const readText = (file: string) =>
  Deno.readTextFileSync(`./example-pages/${file}`);

const removeHashSubstructures = (x: SimplifiedNode): SimplifiedNode => {
  if (x.type === "primitive") return { ...x, substructures: [] };
  if (x.type === "labeled") {
    return { ...x, children: x.children.map(removeHashSubstructures) };
  }
  if (x.type === "unlabeled") {
    return { ...x, children: x.children.map(removeHashSubstructures) };
  }
  if (x.type === "empty") {
    return x;
  }
  throw new Error("unhandled");
};

const simplifyFile = pipe(
  readText,
  simplifyHtml,
  removeHashSubstructures,
  sideEffect(writeToFile<SimplifiedNode>),
);

Deno.test("test runs without errors", () => {
  ["imdb1.html", "moviequotes.html", "facebook.html"].forEach(simplifyFile);
});

Deno.test("colon", () => {
  const value =
    `[Cal Jacobs](/name/nm0199312/?ref_=ttqu_qu) : I'm envious of your generation, you know. You guys don't care as much about the rules.`;
  assertEquals(
    findInSimplifiedTree(
      (x: SimplifiedNode) =>
        x.type === "primitive" && x.value.includes("Cal Jacobs"),
    )(simplifyFile("imdb2.html")),
    { type: "primitive", value, substructures: [] },
  );
});

Deno.test("imdb3", () => {
  const value =
    "[Alejandro Jodorowsky](/name/nm0423524/?ref_=ttqu_qu) : What is the goal of the life? It's to create yourself a soul. For me, movies are an art... more than an industry. And its the search of the human soul... as painting, as literature, as poetry. Movies are that for me.";
  assertEquals(
    findInSimplifiedTree((x) =>
      x.type === "primitive" && x.value.includes("Alejandro Jodorowsky")
    )(
      simplifyFile("imdb3.html"),
    ),
    { type: "primitive", value, substructures: [] },
  );
});

Deno.test("headline understanding", () => {
  assertEquals(mainList(simplifyFile("tvfanatic.html")).children.length, 12);
});

Deno.test("stringify", () => {
  assertStringIncludes(
    simplifiedHtmlToString(simplifyFile("facebook.html")),
    "6 THURSDAY, JUNE 6, 2024 AT 9:00 PM IDT SEABED DREAMS | GOA TRANCE PARTY | FREE ENTRANCE",
  );
});

Deno.test("remove page parts", () => {
  assertStringIncludes(
    pipe(
      simplifyFile,
      filterPageParts(
        (x: SimplifiedNode) =>
          x.type !== "primitive" || x.value !== "Related events",
      ),
      simplifiedHtmlToString,
    )("facebook.html"),
    "6 THURSDAY, JUNE 6, 2024 AT 9:00 PM IDT SEABED DREAMS | GOA TRANCE PARTY | FREE ENTRANCE",
  );
});

Deno.test("smart substructure identification", () => {
  assertNotEquals(
    findInSimplifiedTree(
      (x: SimplifiedNode) =>
        x.type === "primitive" &&
        x.value.includes(
          "Hypnotic Discotheque w/ Amit Stark, DJ Shatta, Levayev, Ohad Peleg, Sigi OM Doors @ 23:00 • Free entry until 00:00 Saturday",
        ),
    )(simplifyFile("facebook2.html")),
    null,
  );
});

Deno.test("links remain", () => {
  assertNotEquals(
    findInSimplifiedTree(
      (x: SimplifiedNode) =>
        x.type === "primitive" &&
        x.value.includes(
          "/title/tt0944947/?ref_=ttqu_rvi_tt_t_6",
        ),
    )(simplifyFile("imdb1.html")),
    null,
  );
});