/**
 * Checks that every changed plugin has had its version raised.
 */

import commandLineArgs from 'command-line-args';
import { buildHelpText, type DocumentedOption, HELP_OPTION } from '../lib/cli';

const optionDefinitions: DocumentedOption[] = [
    {
        name: 'working-tree',
        alias: 'w',
        type: Boolean,
        defaultValue: false,
        description: 'Also check unstaged edits and untracked files, not just what is staged.',
    },
    HELP_OPTION,
];

/**
 * Raw CLI options parsed from command-line arguments. Every option is optional: anything the user
 * omits is absent at runtime, whatever the parsed shape claims.
 */
type CliOptions = {
    workingTree?: boolean;
    help?: boolean;
};

/**
 * Parsed options returned from the CLI.
 */
type Options = { workingTree: boolean } | { help: true };

/**
 * Parses and validates command-line arguments.
 * @returns Parsed options or help flag
 */
export function parseCliArgs(): Options {
    // camelCase maps `--working-tree` onto `workingTree`.
    const args = commandLineArgs(optionDefinitions, { camelCase: true }) as CliOptions;

    if (args.help) return { help: true };

    return { workingTree: args.workingTree === true };
}

/**
 * Generates formatted help text for the CLI.
 * @returns Formatted help message
 */
export function getHelpText(): string {
    return buildHelpText(
        'version-check',
        'Fails when a plugin has been changed without raising its version. Intended for a pre-commit hook, so by default it checks the staged changes a commit would contain.',
        '$ bun run version-check [--working-tree]',
        optionDefinitions,
    );
}
