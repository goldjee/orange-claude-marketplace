import { run } from '../lib/cli';
import { bumpPluginVersion, setPluginVersion } from '../lib/plugin';
import { getHelpText, parseCliArgs } from './cli-arguments';

run(async () => {
    const runOptions = parseCliArgs();

    if ('help' in runOptions) {
        console.log(getHelpText());
        return;
    }

    const { from, to } =
        'version' in runOptions
            ? await setPluginVersion(runOptions.name, runOptions.version)
            : await bumpPluginVersion(runOptions.name, runOptions.release);

    console.log(`${runOptions.name}: ${from} -> ${to}`);
});
