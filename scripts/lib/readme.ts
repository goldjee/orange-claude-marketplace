import { README_PATH } from './constants';
import type { MarketplaceEntry } from './types';

/**
 * Delimiters around the generated plugin table. They are HTML comments, so they stay invisible when
 * the README renders, and they make the region unambiguous: the file holds several other tables.
 */
const START_MARKER = '<!-- plugins:start -->';
const END_MARKER = '<!-- plugins:end -->';

const TABLE_HEADER = ['| Plugin | What it does |', '| --- | --- |'];

/**
 * Makes a description safe to place in a table cell. An unescaped `|` would split the row into
 * extra columns, and a newline would end the row early.
 */
function escapeCell(value: string): string {
    return value
        .replace(/\s*\n\s*/g, ' ')
        .replaceAll('|', '\\|')
        .trim();
}

/** Renders the plugin table, header included, so an empty marketplace still yields valid markdown. */
function renderTable(entries: MarketplaceEntry[]): string {
    const rows = entries.map((entry) => {
        const description = typeof entry.description === 'string' ? escapeCell(entry.description) : '';
        return `| \`${entry.name}\` | ${description} |`;
    });

    return [...TABLE_HEADER, ...rows].join('\n');
}

/**
 * Rewrites the delimited plugin table in the README.
 * @param entries Marketplace entries, in the order they should be listed.
 * @returns Whether the README changed
 */
export async function syncReadmePluginTable(entries: MarketplaceEntry[]): Promise<boolean> {
    const content = await Bun.file(README_PATH).text();

    const start = content.indexOf(START_MARKER);
    const end = content.indexOf(END_MARKER);
    if (start === -1 || end === -1 || end < start)
        throw new Error(
            `${README_PATH} is missing the plugin table markers. Wrap the table in ${START_MARKER} and ${END_MARKER}. Aborting.`,
        );

    const before = content.slice(0, start + START_MARKER.length);
    const after = content.slice(end);
    const updated = `${before}\n${renderTable(entries)}\n${after}`;

    if (updated === content) return false;

    await Bun.write(README_PATH, updated);

    return true;
}
