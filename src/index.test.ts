import { simplifyHtml } from "./index.ts";

Deno.test("test", () => {
  Deno.writeFileSync(
    "./output.json",
    new TextEncoder().encode(
      JSON.stringify(
        simplifyHtml(
          new TextDecoder().decode(
            Deno.readFileSync("./example-pages/moviequotes.html"),
          ),
        ),
        null,
        2,
      ),
    ),
  );
});
