import {join, relative, posix, sep} from 'node:path';

export function toImportPath(relativePath: string, referencePath = '.') {
    let cwd = process.cwd();
    let importPath = posix
        .join(...relative(join(cwd, referencePath), relativePath).split(sep))
        .replace(/(\/index)?\.[jt]sx?$/, '');

    if (importPath && !/^\.+\//.test(importPath))
        importPath = `./${importPath}`;

    return importPath;
}
