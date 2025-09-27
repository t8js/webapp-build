import { access, unlink } from "node:fs/promises";
import esbuild from "esbuild";
import { commonBuildOptions } from "../const/commonBuildOptions";
import type { BuildParams } from "../types/BuildParams";
import { getEntryPoints } from "./getEntryPoints";
import { getServerExternals } from "./getServerExternals";
import { toImportPath } from "./toImportPath";
import { writeModifiedFile } from "./writeModifiedFile";

export async function buildServer({ targetDir, init, skipInit }: BuildParams) {
  let [serverEntries, initEntries, external] = await Promise.all([
    getEntryPoints(["server", "server/index"]),
    skipInit ? [] : getEntryPoints(["init", "init/index"]),
    getServerExternals(),
  ]);

  let initPath = `src/entries/init_${Math.random().toString(36).slice(2)}.ts`;

  await Promise.all([
    ...(init ? [] : serverEntries).map(({ entry, path }) =>
      esbuild.build({
        entryPoints: [path],
        bundle: true,
        outfile: `${targetDir}/entries/${entry}/server.js`,
        platform: "node",
        external,
        ...commonBuildOptions,
      }),
    ),
    ...initEntries.map(({ entry, path }) =>
      esbuild.build({
        entryPoints: [path],
        bundle: true,
        outfile: `${targetDir}/entries/${entry}/init.js`,
        platform: "node",
        external,
        ...commonBuildOptions,
      }),
    ),
    skipInit
      ? null
      : (async () => {
          let head: string[] = [];
          let tail: string[] = [];

          if (serverEntries.length === 0)
            tail.push(
              "\n// Returns all `server` exports from `src/entries/*/server(/index)?.(js|ts)`" +
                "\nexport const entries = [];",
            );
          else {
            tail.push("\nexport const entries = [");

            for (let i = 0; i < serverEntries.length; i++) {
              head.push(
                `import { server as server${i} } from ` +
                  `"${toImportPath(serverEntries[i].path, "src/server")}";`,
              );
              tail.push(`  server${i},`);
            }

            tail.push("];");
          }

          return writeModifiedFile(
            "src/server/entries.ts",
            "// Populated automatically during the build phase\n" +
              head.join("\n") +
              "\n" +
              tail.join("\n") +
              "\n",
          );
        })(),
    skipInit
      ? null
      : (async () => {
          let head: string[] = [];
          let tail: string[] = [];

          if (initEntries.length === 0) tail.push("(/* async */ () => {})();");
          else {
            tail.push("\n(async () => {" + "\n  await Promise.all([");

            for (let i = 0; i < initEntries.length; i++) {
              head.push(
                `import { init as init${i} } from ` +
                  `"${toImportPath(initEntries[i].path, "src/entries")}";`,
              );
              tail.push(`    init${i}(),`);
            }

            tail.push("  ]);\n})();");
          }

          return writeModifiedFile(
            initPath,
            "// Populated automatically during the build phase\n" +
              head.join("\n") +
              "\n" +
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
          entryPoints: [initPath],
          bundle: false,
          outfile: `${targetDir}/entries/init.js`,
          platform: "node",
          format: "cjs",
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
          outfile: `${targetDir}/server/index.js`,
          platform: "node",
          external: [...external, "../entries/*"],
        }),
  ]);

  try {
    await access(initPath);
    await unlink(initPath);
  } catch {}
}
