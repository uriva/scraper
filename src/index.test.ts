import { equals, pipe, sideEffect } from "gamla";
import { SimplifiedNode, findInSimplifiedTree, simplifyHtml } from "./index.ts";
import { assertEquals } from "assert";

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

Deno.test("test title link with colon after", () => {
  const desiredString =
    "Cal Jacobs : I'm envious of your generation, you know. You guys don't care as much about the rules.";
  assertEquals(
    findInSimplifiedTree(equals<null | string | SimplifiedNode>(desiredString))(
      simplifyFile("imdb2.html"),
    ),
    desiredString,
  );
});
