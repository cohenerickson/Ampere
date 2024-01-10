import { config } from "./src/config";
import { BuildOptions, build } from "esbuild";
import { clean } from "esbuild-plugin-clean";
import { createServer } from "esbuild-server";
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
  sourcemap: true,
  plugins: [
    clean({
      patterns: ["./dist/*", "!./dist/index.d.ts"]
    })
  ],
  entryPoints: {
    [getFileName(config.files.config)]: "./src/config.ts",
    [getFileName(config.files.client)]: "./src/client/index.ts",
    [getFileName(config.files.worker)]: "./src/worker.ts",
    [getFileName(config.files.bundle)]: "./src/bundle.ts"
  },
  outdir: "./dist/",
  metafile: true
};

if (isDev) {
  // start dev server
  const server = createServer(baseConfig, {
    static: "./public/",
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000
  });

  await server.start();

  console.log("Dev server started!");
  console.log(server.url);
} else {
  // bundle for production
  const start = Date.now();

  console.log("Building...");

  // minify and treeshake output for production
  await build({
    ...baseConfig,
    treeShaking: true,
    minify: true
  });

  console.log("Done!");
  console.log(`Built in ${Date.now() - start}ms`);
}
