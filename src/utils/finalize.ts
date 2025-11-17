import { access, mkdir, rename } from "node:fs/promises";
import type { BuildParams } from "../types/BuildParams.ts";
import { getEntries } from "./getEntries.ts";

export async function finalize({ targetDir, publicAssetsDir }: BuildParams) {
  let serverCSSFiles = (
    await Promise.all(
      (
        await getEntries()
      ).map(async (entry) => {
        let path = `${targetDir}/entries/${entry}/server.css`;

        try {
          await access(path);

          return { entry, path };
        } catch {}
      }),
    )
  ).filter((item) => item !== undefined);

  await Promise.all(
    serverCSSFiles.map(async ({ entry, path: sourcePath }) => {
      let targetPath = `${publicAssetsDir}/-/${entry}/index.css`;

      try {
        await access(`${publicAssetsDir}/-/${entry}`);
      } catch {
        await mkdir(`${publicAssetsDir}/-/${entry}`, { recursive: true });
      }

      try {
        await rename(sourcePath, targetPath);
      } catch {}
    }),
  );
}
