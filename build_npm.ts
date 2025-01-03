import { build, emptyDir } from "jsr:@deno/dnt";

const outDir = "./dist";

await emptyDir(outDir);

await build({
  entryPoints: ["./src/index.ts"],
  outDir,
  shims: { deno: true },
  scriptModule: false,
  importMap: "deno.json",
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
    Deno.mkdirSync(`${outDir}/esm/example-pages`, { recursive: true });
    for (const entry of Deno.readDirSync("./example-pages")) {
      Deno.copyFileSync(
        `./example-pages/${entry.name}`,
        `${outDir}/esm/example-pages/${entry.name}`,
      );
    }
    Deno.copyFileSync("./LICENSE", `${outDir}/LICENSE`);
    Deno.copyFileSync("./README.md", `${outDir}/README.md`);
  },
});
