import { config } from "./src/config";
import { BuildOptions, build } from "esbuild";
import { clean } from "esbuild-plugin-clean";
import { createServer } from "esbuild-server";
import { writeFile } from "fs/promises";
import { basename } from "path";

const isDev = process.argv.includes("--dev");

function getFileName(filename: `${string}.js`): string {
  return (
    (isDev ? `.${config.files.directory}` : "") + basename(filename, ".js")
  );
}

const baseConfig: BuildOptions = {
  bundle: true,
  format: "iife",
  legalComments: "eof",
  plugins: [
    clean({
      patterns: ["./dist/*"]
    })
  ],
  entryPoints: {
    [getFileName(config.files.config)]: "./src/config.ts",
    [getFileName(config.files.client)]: "./src/client/index.ts",
    [getFileName(config.files.worker)]: "./src/worker.ts",
    [getFileName(config.files.bundle)]: "./src/bundle.ts"
  },
  outdir: "./dist/",
  logLevel: "info",
  metafile: true
};

if (isDev) {
  // start dev server
  const server = createServer(
    { ...baseConfig, sourcemap: true },
    {
      static: "./public/",
      port: process.env.PORT ? parseInt(process.env.PORT) : 3000
    }
  );

  await server.start();

  console.log("Dev server started!");
  console.log(server.url);
} else {
  // bundle for production
  console.log("Building...");

  // minify and treeshake output for production
  const result = await build({
    ...baseConfig,
    treeShaking: true,
    minify: true
  });

  if (result.metafile) {
    await writeFile("./metafile.json", JSON.stringify(result.metafile));
  }
}
