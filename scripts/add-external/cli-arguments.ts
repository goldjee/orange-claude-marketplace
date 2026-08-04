/**
 * Adds a plugin hosted outside this repository to the marketplace.
 */

import commandLineArgs from 'command-line-args';
import { buildHelpText, type DocumentedOption, HELP_OPTION, NAME_OPTION } from '../lib/cli';
import type { ExternalPlugin } from '../lib/plugin';
import { assertRepo, assertSha, type ExternalSource, type NpmSource, type Pin } from '../lib/source';
import { assertVersion } from '../lib/version';

const optionDefinitions: DocumentedOption[] = [
    NAME_OPTION,
    { name: 'description', alias: 'd', type: String, description: 'Plugin description. Required for a new entry.' },
    { name: 'github', alias: 'g', type: String, description: 'GitHub repository, as {underline owner/repo}.' },
    {
        name: 'url',
        type: String,
        description: 'Git repository URL. Accepts the {underline owner/repo} shorthand when combined with --path.',
    },
    { name: 'path', type: String, description: 'Subdirectory of the repository holding the plugin. Needs --url.' },
    { name: 'npm', type: String, description: 'npm package name.' },
    { name: 'ref', type: String, description: 'Git branch or tag to follow.' },
    { name: 'sha', type: String, description: 'Full 40-character commit SHA to pin to. Takes precedence over --ref.' },
    {
        name: 'npm-version',
        type: String,
        description: 'npm version or range, such as {underline ^2.0.0}. Needs --npm.',
    },
    { name: 'registry', type: String, description: 'npm registry URL. Needs --npm.' },
    { name: 'author', alias: 'a', type: String, description: 'Plugin author.' },
    {
        name: 'version',
        type: String,
        description:
            "Plugin version. Usually omitted: Claude Code prefers the version in the plugin's own manifest and otherwise treats every commit as a new version.",
    },
    { name: 'category', alias: 'c', type: String, description: 'Marketplace category.' },
    { name: 'tags', alias: 't', type: String, multiple: true, description: 'Marketplace tags, separated by spaces.' },
    {
        name: 'strict',
        type: String,
        description: 'Whether the plugin manifest is the authority for its components: true or false.',
    },
    {
        name: 'update',
        alias: 'u',
        type: Boolean,
        defaultValue: false,
        description: 'Rewrite the entry of a plugin that is already listed.',
    },
    HELP_OPTION,
];

/**
 * Raw CLI options parsed from command-line arguments. Every option is optional: anything the user
 * omits is absent at runtime, whatever the parsed shape claims.
 */
type CliOptions = {
    name?: string;
    description?: string;
    github?: string;
    url?: string;
    path?: string;
    npm?: string;
    ref?: string;
    sha?: string;
    npmVersion?: string;
    registry?: string;
    author?: string;
    version?: string;
    category?: string;
    tags?: string[];
    strict?: string;
    update?: boolean;
    help?: boolean;
};

/**
 * Parsed options returned from the CLI.
 */
type Options = { plugin: ExternalPlugin; update: boolean } | { help: true };

/** Reads the pin flags. Applying them is left to the caller, which knows the source they land on. */
function parsePin(args: CliOptions): Pin {
    if (args.sha !== undefined) assertSha(args.sha);

    return { ref: args.ref, sha: args.sha };
}

/**
 * Resolves the source flags into a single source.
 * @returns The source, or undefined when no source flag was given
 * @throws Error if the flags name more than one source, or one that does not exist
 */
function parseSource(args: CliOptions): ExternalSource | undefined {
    const selected = [args.github, args.url, args.npm].filter((value) => value !== undefined);
    if (selected.length > 1) throw new Error('Choose exactly one of --github, --url or --npm.');

    // Checked before the source is built, so a flag that belongs to another source type is reported
    // rather than dropped: silently ignoring --sha would publish an unpinned plugin.
    if (args.npm !== undefined && (args.ref !== undefined || args.sha !== undefined))
        throw new Error('--ref and --sha pin a git source. An npm package is pinned with --npm-version.');
    if (args.npm === undefined && (args.npmVersion !== undefined || args.registry !== undefined))
        throw new Error('--npm-version and --registry apply to an npm source. Add --npm.');
    if (args.url === undefined && args.path !== undefined)
        throw new Error('--path selects a subdirectory of a git repository and needs --url, which takes owner/repo.');

    if (args.github !== undefined) {
        assertRepo(args.github);
        return { source: 'github', repo: args.github };
    }

    if (args.url !== undefined)
        return args.path === undefined
            ? { source: 'url', url: args.url }
            : { source: 'git-subdir', url: args.url, path: args.path };

    if (args.npm !== undefined) {
        const source: NpmSource = { source: 'npm', package: args.npm };
        if (args.npmVersion !== undefined) source.version = args.npmVersion;
        if (args.registry !== undefined) source.registry = args.registry;

        return source;
    }

    return undefined;
}

/** Reads `--strict` as a tri-state: an absent field and an explicit `false` mean different things. */
function parseStrict(value: string | undefined): boolean | undefined {
    if (value === undefined) return undefined;
    if (value !== 'true' && value !== 'false') throw new Error('--strict takes true or false.');

    return value === 'true';
}

function parseTags(values: string[] | undefined): string[] | undefined {
    if (values === undefined) return undefined;

    const tags = values.map((tag) => tag.trim()).filter((tag) => tag.length > 0);
    if (tags.length === 0) throw new Error('--tags needs at least one tag.');

    return tags;
}

/**
 * Parses and validates command-line arguments.
 * @returns Parsed options or help flag
 * @throws Error if required arguments are missing or the source flags conflict
 */
export function parseCliArgs(): Options {
    // camelCase maps `--npm-version` onto `npmVersion`.
    const args = commandLineArgs(optionDefinitions, { camelCase: true }) as CliOptions;

    if (args.help) return { help: true };

    if (!args.name) throw new Error('Missing required argument: --name is required.');

    const update = args.update === true;
    const source = parseSource(args);

    // An update may narrow itself to a single field, falling back on the entry it rewrites; a new
    // entry has nothing to fall back on.
    if (!update) {
        if (!args.description) throw new Error('Missing required argument: --description is required.');
        if (!source) throw new Error('Missing required argument: one of --github, --url or --npm is required.');
    }

    if (args.version !== undefined) assertVersion(args.version);

    return {
        plugin: {
            name: args.name,
            source,
            pin: parsePin(args),
            description: args.description,
            version: args.version,
            author: args.author === undefined ? undefined : { name: args.author },
            category: args.category,
            tags: parseTags(args.tags),
            strict: parseStrict(args.strict),
        },
        update,
    };
}

/**
 * Generates formatted help text for the CLI.
 * @returns Formatted help message
 */
export function getHelpText(): string {
    return buildHelpText(
        'add-external',
        'Adds a plugin hosted outside this repository to the marketplace. The entry is the whole record for such a plugin, so sync-plugin-list never rewrites it; re-run with --update to change a source, a pin or any of the metadata.',
        [
            '$ bun run add-external --name {underline name} --description {underline text} --github {underline owner/repo} [--ref {underline ref}] [--sha {underline sha}]',
            '$ bun run add-external --name {underline name} --description {underline text} --url {underline git-url} [--path {underline subdir}]',
            '$ bun run add-external --name {underline name} --description {underline text} --npm {underline package} [--npm-version {underline range}]',
            '$ bun run add-external --name {underline name} --update [--ref {underline ref}]',
        ].join('\n'),
        optionDefinitions,
    );
}
