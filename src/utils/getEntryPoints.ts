import { getEntries } from "./getEntries";
import { getFirstAvailable } from "./getFirstAvailable";

type EntryPoint = {
  name: string;
  path: string;
};

export async function getEntryPoints(
  path: string | string[],
): Promise<EntryPoint[]> {
  let entries = await getEntries();

  return (
    await Promise.all(
      entries.map(async (name) => {
        let resolvedPath = await getFirstAvailable(`src/entries/${name}`, path);

        return resolvedPath === undefined ? undefined : { name, path: resolvedPath };
      }),
    )
  ).filter((item) => item !== undefined);
}
