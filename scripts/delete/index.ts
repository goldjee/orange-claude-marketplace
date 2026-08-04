import { run } from '../lib/cli';
import { readMarketplaceManifest } from '../lib/marketplace';
import { deletePlugin } from '../lib/plugin';
import { getHelpText, parseCliArgs } from './cli-arguments';

run(async () => {
    const runOptions = parseCliArgs();

    if ('help' in runOptions) {
        console.log(getHelpText());
        return;
    }

    // Read the entry first so the prompt can name what is about to go, and so a missing plugin
    // fails before the user is asked anything.
    const marketplace = await readMarketplaceManifest();
    const entry = marketplace.plugins.find((plugin) => plugin.name === runOptions.name);
    if (!entry)
        throw new Error(`A plugin with the name "${runOptions.name}" does not exist in the marketplace. Aborting.`);

    if (!runOptions.yes) {
        // isTTY is undefined when stdin is piped or the script runs in CI, where prompt() cannot
        // be answered. Refusing beats hanging or deleting unasked.
        if (!process.stdin.isTTY) throw new Error('Refusing to delete without confirmation. Re-run with --yes.');

        const answer = prompt(`Delete "${entry.name}" and everything in ${entry.source}? [y/N]`);
        if (answer?.trim().toLowerCase() !== 'y') {
            console.log('Aborted.');
            return;
        }
    }

    await deletePlugin(entry.name);
    console.log(`Deleted "${entry.name}".`);
});
