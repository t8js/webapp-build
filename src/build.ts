import {formatDuration} from '@t8/date-format';
import type {BuildParams} from './types/BuildParams';
import {buildClient} from './utils/buildClient';
import {buildServer} from './utils/buildServer';
import {finalize} from './utils/finalize';

export async function build(params: BuildParams) {
    let startTime = Date.now();
    let log = params.silent ? (() => {}) : console.log;
    let phase = params.init ? 'Initialization' : 'Build';

    log(`${phase} started`);

    await Promise.all([
        buildServer(params),
        buildClient(params),
    ]);
    await finalize(params);

    log(`${phase} completed +${formatDuration(Date.now() - startTime)}`);
}
