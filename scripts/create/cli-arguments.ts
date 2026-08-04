/**
 * Creates a new plugin in the marketplace.
 */

import commandLineArgs from 'command-line-args';
import { buildHelpText, type DocumentedOption, HELP_OPTION, NAME_OPTION } from '../lib/cli';

const optionDefinitions: DocumentedOption[] = [
    NAME_OPTION,
    { name: 'description', alias: 'd', type: String, description: 'Plugin description.' },
    { name: 'author', alias: 'a', type: String, description: 'Plugin author.' },
    HELP_OPTION,
];

/**
 * Raw CLI options parsed from command-line arguments. Every option is optional: anything the user
 * omits is absent at runtime, whatever the parsed shape claims.
 */
type CliOptions = {
    name?: string;
    description?: string;
    author?: string;
    help?: boolean;
};

/**
 * Parsed options returned from the CLI.
 */
type Options =
    | {
          name: string;
          description: string;
          author?: string;
      }
    | { help: true };

/**
 * Parses and validates command-line arguments.
 * @returns Parsed options or help flag
 * @throws Error if required arguments are missing
 */
export function parseCliArgs(): Options {
    const args = commandLineArgs(optionDefinitions) as CliOptions;

    if (args.help) return { help: true };

    if (!args.name || !args.description)
        throw new Error('Missing required arguments: --name and --description are required.');

    return {
        name: args.name,
        description: args.description,
        author: args.author,
    };
}

/**
 * Generates formatted help text for the CLI.
 * @returns Formatted help message
 */
export function getHelpText(): string {
    return buildHelpText(
        'create',
        'Creates a new plugin in the marketplace.',
        '$ bun run create --name {underline name} --description {underline text} [--author {underline author}]',
        optionDefinitions,
    );
}
