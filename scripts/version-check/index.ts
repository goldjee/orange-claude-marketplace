import { run } from '../lib/cli';
import { PLUGINS_PATHSPEC } from '../lib/constants';
import { changedPluginFiles, hasCommits, isRepository, readBlob } from '../lib/git';
import { parseJson } from '../lib/json';
import { isPlugin } from '../lib/plugin';
import { compareVersions } from '../lib/version';
import { getHelpText, parseCliArgs } from './cli-arguments';

type Offence = {
    name: string;
    from: string;
    to: string;
    reason: 'unchanged' | 'decreased';
};

/** The revision holding the version a commit would record: the index, unless asked otherwise. */
const COMMITTED_REF = '';

function manifestPathFor(name: string): string {
    return `${PLUGINS_PATHSPEC}/${name}/.claude-plugin/plugin.json`;
}

/** Maps changed file paths to the plugins that own them. */
function pluginNamesFrom(paths: string[]): string[] {
    const names = paths
        .map((path) => path.split('/'))
        // Anything directly inside the plugins directory belongs to no plugin.
        .filter((segments) => segments.length > 2)
        .map((segments) => segments[1])
        .filter((name): name is string => name !== undefined && name.length > 0);

    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}

/** Reads a plugin's version at a revision, or from disk when checking the working tree. */
async function versionAt(name: string, ref: string, fromDisk: boolean): Promise<string | undefined> {
    const path = manifestPathFor(name);

    let content: string | undefined;
    if (fromDisk) {
        const file = Bun.file(path);
        content = (await file.exists()) ? await file.text() : undefined;
    } else {
        content = await readBlob(ref, path);
    }

    if (content === undefined) return undefined;

    return parseJson(content, isPlugin, `The manifest for plugin "${name}"`).version;
}

async function inspect(name: string, fromDisk: boolean): Promise<Offence | undefined> {
    const from = await versionAt(name, 'HEAD', false);
    // Absent at HEAD means the plugin is new, so there is nothing to bump from.
    if (from === undefined) return undefined;

    const to = await versionAt(name, COMMITTED_REF, fromDisk);
    // Absent now means the plugin is being deleted.
    if (to === undefined) return undefined;

    const difference = compareVersions(to, from);
    if (difference > 0) return undefined;

    return { name, from, to, reason: difference === 0 ? 'unchanged' : 'decreased' };
}

function report(offences: Offence[]): string {
    const width = Math.max(...offences.map((offence) => offence.name.length));
    const lines = offences.map((offence) => {
        const change = offence.reason === 'unchanged' ? offence.from : `${offence.from} -> ${offence.to}`;
        return `  ${offence.name.padEnd(width)}  ${change} (${offence.reason})`;
    });

    return [
        'Plugins changed without a version bump:',
        '',
        ...lines,
        '',
        'Bump with: bun run version-bump --name <name>',
    ].join('\n');
}

run(async () => {
    const runOptions = parseCliArgs();

    if ('help' in runOptions) {
        console.log(getHelpText());
        return;
    }

    if (!(await isRepository())) throw new Error('Not a git repository. Run git init first.');

    if (!(await hasCommits())) {
        console.log('No commits yet; nothing to check.');
        return;
    }

    const names = pluginNamesFrom(await changedPluginFiles(runOptions.workingTree));
    const inspected = await Promise.all(names.map((name) => inspect(name, runOptions.workingTree)));
    const offences = inspected.filter((offence): offence is Offence => offence !== undefined);

    if (offences.length > 0) throw new Error(report(offences));

    console.log(
        names.length === 0 ? 'No plugins changed.' : `${names.length} changed plugin(s) checked; all versions raised.`,
    );
});
