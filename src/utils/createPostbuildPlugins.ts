import type { Plugin } from "esbuild";

export function createPostbuildPlugins(onServerRebuild: () => void) {
  let serverPlugins: Plugin[] = [
    {
      name: "skip-css",
      setup(build) {
        /** @see https://github.com/evanw/esbuild/issues/599#issuecomment-745118158 */
        build.onLoad({ filter: /\.css$/ }, () => ({ contents: "" }));
      },
    },
    {
      name: "postbuild-server",
      setup(build) {
        build.onEnd(() => {
          onServerRebuild();
        });
      },
    },
  ];

  return {
    serverPlugins,
  };
}
