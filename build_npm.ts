import { build, emptyDir } from "dnt";

const outDir = "./dist";

await emptyDir(outDir);

await build({
  entryPoints: ["./src/index.ts"],
  outDir,
  test: false,
  shims: { deno: true },
  mappings: {
    "https://deno.land/x/gamla@39.0.0/src/index.ts": {
      name: "gamla",
      version: "^39.0.0",
    },
  },
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
