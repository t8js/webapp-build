import esbuild from "esbuild";
import { commonBuildOptions } from "../const/commonBuildOptions";
import type { BuildParams } from "../types/BuildParams";
import { getEntryPoints } from "./getEntryPoints";

export async function buildClient({ publicAssetsDir }: BuildParams) {
  let clientEntries = await getEntryPoints(["client/index", "ui/index"]);

  await Promise.all(
    clientEntries.map(({ name, path }) =>
      esbuild.build({
        ...commonBuildOptions,
        entryPoints: [path],
        bundle: true,
        splitting: true,
        format: "esm",
        outdir: `${publicAssetsDir}/-/${name}`,
        minify: process.env.NODE_ENV !== "development",
      }),
    ),
  );
}
