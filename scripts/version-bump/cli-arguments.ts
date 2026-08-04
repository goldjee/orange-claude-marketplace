/**
 * Bumps the version of a plugin in the marketplace.
 */

import commandLineArgs from 'command-line-args';
import { buildHelpText, type DocumentedOption, HELP_OPTION, NAME_OPTION } from '../lib/cli';
import type { ReleaseType } from '../lib/version';

const optionDefinitions: DocumentedOption[] = [
    NAME_OPTION,
    { name: 'major', type: Boolean, defaultValue: false, description: 'Raise the major version: 1.2.3 -> 2.0.0.' },
    { name: 'minor', type: Boolean, defaultValue: false, description: 'Raise the minor version: 1.2.3 -> 1.3.0.' },
    {
        name: 'patch',
        type: Boolean,
        defaultValue: false,
        description: 'Raise the patch version: 1.2.3 -> 1.2.4. The default.',
    },
    { name: 'set', alias: 's', type: String, description: 'Set an exact version, such as 2.1.0.' },
    HELP_OPTION,
];

/**
 * Raw CLI options parsed from command-line arguments. Every option is optional: anything the user
 * omits is absent at runtime, whatever the parsed shape claims.
 */
type CliOptions = {
    name?: string;
    major?: boolean;
    minor?: boolean;
    patch?: boolean;
    set?: string;
    help?: boolean;
};

/**
 * Parsed options returned from the CLI.
 */
type Options = { name: string; release: ReleaseType } | { name: string; version: string } | { help: true };

/**
 * Parses and validates command-line arguments.
 * @returns Parsed options or help flag
 * @throws Error if required arguments are missing or the version selectors conflict
 */
export function parseCliArgs(): Options {
    const args = commandLineArgs(optionDefinitions) as CliOptions;

    if (args.help) return { help: true };

    if (!args.name) throw new Error('Missing required argument: --name is required.');

    const releases: ReleaseType[] = (['major', 'minor', 'patch'] as const).filter((release) => args[release]);
    const selectors = releases.length + (args.set === undefined ? 0 : 1);
    if (selectors > 1) throw new Error('Choose exactly one of --major, --minor, --patch or --set.');

    if (args.set !== undefined) return { name: args.name, version: args.set };

    // No selector means the most common case: a patch release.
    return { name: args.name, release: releases[0] ?? 'patch' };
}

/**
 * Generates formatted help text for the CLI.
 * @returns Formatted help message
 */
export function getHelpText(): string {
    return buildHelpText(
        'version-bump',
        'Bumps the version of a plugin in the marketplace. Versions are plain MAJOR.MINOR.PATCH; prerelease identifiers are not supported.',
        '$ bun run version-bump --name {underline name} [--major | --minor | --patch | --set {underline version}]',
        optionDefinitions,
    );
}
