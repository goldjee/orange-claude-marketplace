import { run } from '../lib/cli';
import { MARKETPLACE_PATH, MARKETPLACE_PATHSPEC, README_PATH, README_PATHSPEC } from '../lib/constants';
import { differsFromIndex, stageFile } from '../lib/git';
import { readMarketplaceManifest } from '../lib/marketplace';
import { type EntrySync, syncMarketplaceEntries } from '../lib/plugin';
import { syncReadmePluginTable } from '../lib/readme';
import { isExternalSource } from '../lib/source';
import { getHelpText, parseCliArgs } from './cli-arguments';

/** Files this command may rewrite, paired with the pathspec used to compare them against the index. */
const MANAGED_FILES: [path: string, pathspec: string][] = [
    [MARKETPLACE_PATH, MARKETPLACE_PATHSPEC],
    [README_PATH, README_PATHSPEC],
];

/** Renders one entry's changes as `+added ~changed -removed`. */
function describe(change: EntrySync): string {
    const fields = [
        ...change.added.map((field) => `+${field}`),
        ...change.changed.map((field) => `~${field}`),
        ...change.removed.map((field) => `-${field}`),
    ];

    return `  ${change.name}  ${fields.join(' ')}`;
}

run(async () => {
    const runOptions = parseCliArgs();

    if ('help' in runOptions) {
        console.log(getHelpText());
        return;
    }

    const changes = await syncMarketplaceEntries();

    if (changes.length === 0) {
        console.log('Marketplace entries already in sync.');
    } else {
        for (const change of changes) console.log(describe(change));
        console.log(`${changes.length} marketplace ${changes.length === 1 ? 'entry' : 'entries'} synced.`);
    }

    // Read back rather than reusing `changes`, which holds only the entries that moved.
    const { plugins } = await readMarketplaceManifest();

    // Said out loud, so the summary above is not read as a claim about plugins this never inspected.
    const external = plugins.filter((entry) => isExternalSource(entry.source)).length;
    if (external > 0) console.log(`${external} external ${external === 1 ? 'entry' : 'entries'} left as-is.`);

    console.log(
        (await syncReadmePluginTable(plugins)) ? 'Rewrote the README plugin table.' : 'README already in sync.',
    );

    if (!runOptions.stage) return;

    // Staging is driven by the index, not by whether this run changed anything. `create`,
    // `version-bump` and `delete` all update these files themselves, which leaves the sync nothing
    // to do — but those changes still have to reach the commit, or what is committed desyncs.
    for (const [path, pathspec] of MANAGED_FILES) {
        const content = await Bun.file(path).text();
        if (!(await differsFromIndex(pathspec, content))) continue;

        await stageFile(path);
        console.log(`Staged ${pathspec}.`);
    }
});
