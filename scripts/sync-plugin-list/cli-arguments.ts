/**
 * Mirrors plugin manifest fields onto their marketplace entries.
 */

import commandLineArgs from 'command-line-args';
import { buildHelpText, type DocumentedOption, HELP_OPTION } from '../lib/cli';

const optionDefinitions: DocumentedOption[] = [
    {
        name: 'stage',
        alias: 's',
        type: Boolean,
        defaultValue: false,
        description: 'Stage the marketplace manifest if it changed. Used by the pre-commit hook.',
    },
    HELP_OPTION,
];

/**
 * Raw CLI options parsed from command-line arguments. Every option is optional: anything the user
 * omits is absent at runtime, whatever the parsed shape claims.
 */
type CliOptions = {
    stage?: boolean;
    help?: boolean;
};

/**
 * Parsed options returned from the CLI.
 */
type Options = { stage: boolean } | { help: true };

/**
 * Parses and validates command-line arguments.
 * @returns Parsed options or help flag
 */
export function parseCliArgs(): Options {
    const args = commandLineArgs(optionDefinitions) as CliOptions;

    if (args.help) return { help: true };

    return { stage: args.stage === true };
}

/**
 * Generates formatted help text for the CLI.
 * @returns Formatted help message
 */
export function getHelpText(): string {
    return buildHelpText(
        'sync-plugin-list',
        'Copies every field from each plugin manifest onto its marketplace entry, so the marketplace reflects what the manifests say. Fields the manifest no longer carries are removed from the entry; the marketplace-owned source, category, tags and strict are left alone.',
        '$ bun run sync-plugin-list [--stage]',
        optionDefinitions,
    );
}
