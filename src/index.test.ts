import { assertEquals } from "assert";
import { pipe, sideEffect } from "gamla";
import {
  SimplifiedNode,
  findInSimplifiedTree,
  mainList,
  simplifyHtml,
} from "./index.ts";

const writeToFile = <T>(obj: T) =>
  Deno.writeFileSync(
    "./output.json",
    new TextEncoder().encode(JSON.stringify(obj, null, 2)),
  );

const readText = (file: string) =>
  new TextDecoder().decode(Deno.readFileSync("./example-pages/" + file));

const simplifyFile = pipe(
  readText,
  simplifyHtml,
  sideEffect(writeToFile<SimplifiedNode>),
);

Deno.test("test runs without errors", () => {
  ["imdb1.html", "moviequotes.html"].forEach(simplifyFile);
});

Deno.test("colon", () => {
  const value =
    "Cal Jacobs : I'm envious of your generation, you know. You guys don't care as much about the rules.";
  assertEquals(
    findInSimplifiedTree(
      (x: SimplifiedNode) => x.type === "primitive" && x.value === value,
    )(simplifyFile("imdb2.html")),
    { type: "primitive", value },
  );
});

Deno.test("imdb3", () => {
  const value =
    "Alejandro Jodorowsky : What is the goal of the life? It's to create yourself a soul. For me, movies are an art... more than an industry. And its the search of the human soul... as painting, as literature, as poetry. Movies are that for me.";
  assertEquals(
    findInSimplifiedTree((x) => x.type === "primitive" && x.value === value)(
      simplifyFile("imdb3.html"),
    ),
    { type: "primitive", value },
  );
});

Deno.test("headline understanding", () => {
  const main = mainList(simplifyFile("tvfanatic.html"));
  assertEquals(main.children.length, 12);
});
