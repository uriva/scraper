import { build, emptyDir } from "https://deno.land/x/dnt@0.33.1/mod.ts";

const outDir = "./dist";

await emptyDir(outDir);

await build({
  entryPoints: ["./src/index.ts"],
  outDir,
  test: false,
  shims: { deno: true },
  package: {
    name: "simplify-html",
    version: Deno.args[0],
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/uriva/scraper.git",
    },
  },
  postBuild() {
    Deno.copyFileSync("./LICENSE", outDir + "/LICENSE");
    Deno.copyFileSync("./README.md", outDir + "/README.md");
  },
});
