import { assertEquals } from "assert";
import { equals, pipe, sideEffect } from "gamla";
import { SimplifiedNode, findInSimplifiedTree, simplifyHtml } from "./index.ts";
import { mainList } from "./index.ts";

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
  const desiredString =
    "Cal Jacobs : I'm envious of your generation, you know. You guys don't care as much about the rules.";
  assertEquals(
    findInSimplifiedTree(equals<SimplifiedNode>(desiredString))(
      simplifyFile("imdb2.html"),
    ),
    desiredString,
  );
});

Deno.test("imdb3", () => {
  const desiredString =
    "Alejandro Jodorowsky : What is the goal of the life? It's to create yourself a soul. For me, movies are an art... more than an industry. And its the search of the human soul... as painting, as literature, as poetry. Movies are that for me.";
  assertEquals(
    findInSimplifiedTree(equals<SimplifiedNode>(desiredString))(
      simplifyFile("imdb3.html"),
    ),
    desiredString,
  );
});

Deno.test("headline understanding", () => {
  assertEquals(mainList(simplifyFile("tvfanatic.html"))?.length, 12);
});
