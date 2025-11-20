import { Plugin } from "esbuild";

export function createPostbuildPlugins(onRebuild: () => void) {
  let buildCount = 0;

  function handleEnd() {
    // Quit unless both the client and server build are completed.
    if (buildCount < 1) {
      buildCount++;
      return;
    }

    onRebuild();
    buildCount = 0;
  }

  let clientPlugins: Plugin[] = [
    {
      name: "postbuild-client",
      setup(build) {
        build.onEnd(handleEnd);
      },
    },
  ];

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
        build.onEnd(handleEnd);
      },
    },
  ];

  return {
    clientPlugins,
    serverPlugins,
  };
}
