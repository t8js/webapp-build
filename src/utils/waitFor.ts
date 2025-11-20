import { access } from "node:fs/promises";

export async function waitFor(path: string, timeout = 10000) {
  let t0 = Date.now();

  return new Promise<string | undefined | void>((resolve, reject) => {
    async function run() {
      try {
        await access(path);
        resolve();
      }
      catch {
        if (Date.now() - t0 > timeout) reject("timed out");
        else setTimeout(run, 1);
      }
    }

    run();
  });
}
