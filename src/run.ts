#!/usr/bin/env node
import {rm} from 'node:fs/promises';
import type {BuildParams} from './types/BuildParams';
import {build} from './build';

const defaultTargetDir = 'dist';

async function clean({targetDir, publicAssetsDir}: BuildParams) {
    return Promise.all(
        [`${targetDir}/entries`, `${targetDir}/server`, `${publicAssetsDir}/-`]
            .map(dir => rm(dir, {recursive: true, force: true})),
    );
}

async function run() {
    let args = process.argv.slice(2);
    let publicAssetsDir = args[0];
    let targetDir = args[1];

    if (!publicAssetsDir || publicAssetsDir.startsWith('--'))
        throw new Error('Public assets directory is undefined');

    if (!targetDir || targetDir.startsWith('--'))
        targetDir = defaultTargetDir;

    let params: BuildParams = {
        targetDir,
        publicAssetsDir,
        silent: args.includes('--silent'),
        init: args.includes('--init'),
        skipInit: args.includes('--skip-init'),
    };

    if (args.includes('--clean-only')) {
        await clean(params);
        return;
    }

    if (args.includes('--clean'))
        await clean(params);

    await build(params);
}

(async () => {
    await run();
})();
