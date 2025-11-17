import { access, mkdir, rm } from "node:fs/promises";
import esbuild from "esbuild";
import { commonBuildOptions } from "../const/commonBuildOptions.ts";
import type { BuildParams } from "../types/BuildParams.ts";
import { getEntryPoints } from "./getEntryPoints.ts";
import { getServerExternals } from "./getServerExternals.ts";
import { toImportPath } from "./toImportPath.ts";
import { writeModifiedFile } from "./writeModifiedFile.ts";

export async function buildServer({ targetDir, init, skipInit }: BuildParams) {
  let [serverEntries, initEntries, external] = await Promise.all([
    getEntryPoints(["server", "server/index"]),
    skipInit ? [] : getEntryPoints(["init", "init/index"]),
    getServerExternals(),
  ]);

  let initDir = `src/entries/_init_${Math.random().toString(36).slice(2)}`;

  await Promise.all([
    skipInit
      ? null
      : (async () => {
          let tail: string[] = [];

          if (serverEntries.length === 0)
            tail.push(
              "\n// Returns all `server` exports from `src/entries/*/server(/index)?.(js|ts)`" +
                "\nexport const entries = [];",
            );
          else {
            tail.push("\nexport const entries = (await Promise.all([");

            for (let i = 0; i < serverEntries.length; i++)
              tail.push(`  // ${serverEntries[i].name}
  import("${toImportPath(serverEntries[i].path, "src/server")}"),`);

            tail.push("])).map(({ server }) => server);");
          }

          await writeModifiedFile(
            "src/server/entries.ts",
            "// Populated automatically during the build phase" +
              tail.join("\n") +
              "\n",
          );
        })(),
    skipInit
      ? null
      : (async () => {
          let tail: string[] = [];

          try {
            await access(initDir);
          } catch {
            await mkdir(initDir);
          }

          if (initEntries.length === 0)
            tail.push("\n(/* async */ () => {})();");
          else {
            tail.push(`
function run(module: unknown) {
  if (
    module &&
    typeof module === "object" &&
    "init" in module &&
    typeof module.init === "function"
  )
    return module.init();
}

(async () => {
  await Promise.all([`);

            for (let i = 0; i < initEntries.length; i++) {
              tail.push(
                `    // ${initEntries[i].name}
    import("${toImportPath(initEntries[i].path, initDir)}").then(run),`,
              );
            }

            tail.push("  ]);\n})();");
          }

          await writeModifiedFile(
            `${initDir}/index.ts`,
            "// Populated automatically during the build phase" +
              tail.join("\n") +
              "\n",
          );
        })(),
  ]);

  await Promise.all([
    skipInit
      ? null
      : esbuild.build({
          ...commonBuildOptions,
          entryPoints: [`${initDir}/index.ts`],
          bundle: true,
          splitting: true,
          outdir: `${targetDir}/init`,
          platform: "node",
          format: "esm",
          banner: {
            js: "// Calls all `init` exports from `src/entries/*/init(/index)?.(js|ts)`",
          },
        }),
    init
      ? null
      : esbuild.build({
          ...commonBuildOptions,
          entryPoints: ["src/server/index.ts"],
          bundle: true,
          splitting: true,
          outdir: `${targetDir}/server`,
          platform: "node",
          format: "esm",
          external,
        }),
  ]);

  try {
    await access(initDir);
    await rm(initDir, { force: true, recursive: true });
  } catch {}
}
