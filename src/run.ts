#!/usr/bin/env node
import { rm } from "node:fs/promises";
import { build } from "./build.ts";
import type { BuildParams } from "./types/BuildParams.ts";

const defaultTargetDir = "dist";

async function clean({ targetDir, publicAssetsDir }: BuildParams) {
  return Promise.all(
    [`${targetDir}/server`, `${publicAssetsDir}/-`].map((dir) =>
      rm(dir, { recursive: true, force: true }),
    ),
  );
}

async function run() {
  let args = process.argv.slice(2);
  let publicAssetsDir = args[0];
  let targetDir = args[1];

  if (!publicAssetsDir || publicAssetsDir.startsWith("--"))
    throw new Error("Public assets directory is undefined");

  if (!targetDir || targetDir.startsWith("--")) targetDir = defaultTargetDir;

  let params: BuildParams = {
    targetDir,
    publicAssetsDir,
    silent: args.includes("--silent"),
    watch: args.includes("--watch"),
    watchServer: args.includes("--watch-server"),
    watchClient: args.includes("--watch-client"),
  };

  if (args.includes("--clean-only")) {
    await clean(params);
    return;
  }

  if (args.includes("--clean")) await clean(params);

  await build(params);
}

await run();
