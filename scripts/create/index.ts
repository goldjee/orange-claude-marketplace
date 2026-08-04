import { run } from '../lib/cli';
import { PLUGIN_SCHEMA_URL } from '../lib/constants';
import { createPlugin } from '../lib/plugin';
import type { Plugin } from '../lib/types';
import { getHelpText, parseCliArgs } from './cli-arguments';

run(async () => {
    const runOptions = parseCliArgs();

    if ('help' in runOptions) {
        console.log(getHelpText());
        return;
    }

    const newPlugin: Plugin = {
        $schema: PLUGIN_SCHEMA_URL,
        name: runOptions.name,
        description: runOptions.description,
        version: '1.0.0',
        author: {
            name: runOptions.author || 'Unknown',
        },
    };
    await createPlugin(newPlugin);
});
