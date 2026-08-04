import type { OptionDefinition } from 'command-line-args';
import commandLineUsage, { type Section } from 'command-line-usage';

/** An option definition carrying its own help text, so the two cannot drift apart. */
export type DocumentedOption = OptionDefinition & { description: string };

/** Options shared by every command. */
export const NAME_OPTION: DocumentedOption = { name: 'name', alias: 'n', type: String, description: 'Plugin name.' };
export const HELP_OPTION: DocumentedOption = {
    name: 'help',
    alias: 'h',
    type: Boolean,
    defaultValue: false,
    description: 'Displays this message.',
};

/**
 * Runs a command entry point, reporting a failure as a single line and a non-zero exit code so
 * callers can tell success from failure.
 * @param main The command body.
 */
export async function run(main: () => Promise<void>): Promise<void> {
    try {
        await main();
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    }
}

/**
 * Generates formatted help text for a command.
 * @param command Command name, used as the heading.
 * @param summary One-line description of what the command does.
 * @param synopsis Example invocation.
 * @param options The command's options.
 * @returns Formatted help message
 */
export function buildHelpText(command: string, summary: string, synopsis: string, options: DocumentedOption[]): string {
    const sections: Section[] = [
        { header: command, content: summary },
        { header: 'Synopsis', content: synopsis },
        { header: 'Options', optionList: options },
    ];

    return commandLineUsage(sections);
}
