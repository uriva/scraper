import { equals, pipe, sideEffect, take } from "gamla";
import {
  SimplifiedNode,
  findInSimplifiedTree,
  mainList,
  simplifyHtml,
} from "./index.ts";
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

Deno.test("colon", () => {
  const desiredString =
    "Cal Jacobs : I'm envious of your generation, you know. You guys don't care as much about the rules.";
  assertEquals(
    findInSimplifiedTree(equals<null | string | SimplifiedNode>(desiredString))(
      simplifyFile("imdb2.html"),
    ),
    desiredString,
  );
});

Deno.test("duckduck", () => {
  assertEquals(mainList(simplifyFile("duckduckgo.html"))?.[0], {
    title: "Snow White and the Seven Dwarfs (1937) - IMDb",
    url: "www.imdb.com/title/tt0029583/fullcredits",
    paragraph:
      "Directed by Writing Credits Cast verified as complete Produced by Walt Disney ... producer (uncredited) Music by Art Direction by Second Unit Director or Assistant Director Sound Department Visual Effects by Camera and Electrical Department Animation Department Costume and Wardrobe Department Editorial Department Music Department Additional Crew",
  });
});
