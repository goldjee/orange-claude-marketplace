import { run } from '../lib/cli';
import { addExternalPlugin } from '../lib/plugin';
import { describeSource } from '../lib/source';
import { getHelpText, parseCliArgs } from './cli-arguments';

run(async () => {
    const runOptions = parseCliArgs();

    if ('help' in runOptions) {
        console.log(getHelpText());
        return;
    }

    const entry = await addExternalPlugin(runOptions.plugin, { update: runOptions.update });

    console.log(`${runOptions.update ? 'Updated' : 'Added'} "${entry.name}" (${describeSource(entry.source)}).`);
});
