/**
 * Deletes a plugin from the marketplace.
 */

import commandLineArgs from 'command-line-args';
import { buildHelpText, type DocumentedOption, HELP_OPTION, NAME_OPTION } from '../lib/cli';

const optionDefinitions: DocumentedOption[] = [
    NAME_OPTION,
    { name: 'yes', alias: 'y', type: Boolean, defaultValue: false, description: 'Skips the confirmation prompt.' },
    HELP_OPTION,
];

/**
 * Raw CLI options parsed from command-line arguments. Every option is optional: anything the user
 * omits is absent at runtime, whatever the parsed shape claims.
 */
type CliOptions = {
    name?: string;
    yes?: boolean;
    help?: boolean;
};

/**
 * Parsed options returned from the CLI.
 */
type Options = { name: string; yes: boolean } | { help: true };

/**
 * Parses and validates command-line arguments.
 * @returns Parsed options or help flag
 * @throws Error if required arguments are missing
 */
export function parseCliArgs(): Options {
    const args = commandLineArgs(optionDefinitions) as CliOptions;

    if (args.help) return { help: true };

    if (!args.name) throw new Error('Missing required argument: --name is required.');

    return { name: args.name, yes: args.yes === true };
}

/**
 * Generates formatted help text for the CLI.
 * @returns Formatted help message
 */
export function getHelpText(): string {
    return buildHelpText(
        'delete',
        'Deletes a plugin from the marketplace, removing its directory and its marketplace entry.',
        '$ bun run delete --name {underline name} [--yes]',
        optionDefinitions,
    );
}
