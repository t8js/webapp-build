import { type ChildProcess, spawn } from "node:child_process";
import { formatDuration } from "@t8/date-format";
import type { BuildParams } from "./types/BuildParams.ts";
import { buildClient } from "./utils/buildClient.ts";
import { buildServer } from "./utils/buildServer.ts";
import { buildServerCSS } from "./utils/buildServerCSS.ts";
import { createPostbuildPlugins } from "./utils/createPostbuildPlugins.ts";

export async function build(params: BuildParams) {
  let startTime = Date.now();
  let log = params.silent ? () => {} : console.log;

  log("Build started");

  let serverProcess: ChildProcess | null = null;
  let inited = false;

  function startServer() {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }

    if (!inited) {
      log(`Build completed +${formatDuration(Date.now() - startTime)}`);
      inited = true;
    }

    serverProcess = spawn("node", [`${params.targetDir}/server/index.js`], {
      stdio: "inherit",
    });
  }

  let { serverPlugins, serverCSSPlugins } = createPostbuildPlugins(
    params,
    startServer,
  );

  await Promise.all([
    buildServer(params, serverPlugins),
    buildServerCSS(params, serverCSSPlugins),
    buildClient(params),
  ]);
}
