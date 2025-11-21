import { type ChildProcess, spawn } from "node:child_process";
import { formatDuration } from "@t8/date-format";
import type { BuildParams } from "./types/BuildParams.ts";
import { buildClient } from "./utils/buildClient.ts";
import { buildServer } from "./utils/buildServer.ts";
import { createPostbuildPlugins } from "./utils/createPostbuildPlugins.ts";
import { waitFor } from "./utils/waitFor.ts";

export async function build(params: BuildParams) {
  let startTime = Date.now();
  let log = params.silent ? () => {} : console.log;
  let serverProcess: ChildProcess | null = null;

  function startServer() {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }

    let serverPath = `${params.targetDir}/server/index.js`;

    waitFor(serverPath)
      .then(() => {
        serverProcess = spawn("node", [serverPath], { stdio: "inherit" });
      })
      .catch(() => {
        log(`File not found: "${serverPath}"`);
        process.exit(1);
      });
  }

  let { serverPlugins } = createPostbuildPlugins(startServer);

  log("Build started");

  await Promise.all([
    buildServer(params, serverPlugins),
    buildClient(params),
  ]);

  log(`Build completed +${formatDuration(Date.now() - startTime)}`);
  startServer();
}
