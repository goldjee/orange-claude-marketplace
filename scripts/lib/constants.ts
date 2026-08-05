import { relative, resolve } from 'node:path';

/** Repository root. This file lives in `scripts/lib/`, two levels below it. */
export const ROOT = resolve(import.meta.dir, '../..');

/** Absolute, so the scripts behave the same from any working directory. */
export const MARKETPLACE_PATH = resolve(ROOT, '.claude-plugin/marketplace.json');
export const PLUGINS_DIR = resolve(ROOT, 'plugins');
export const README_PATH = resolve(ROOT, 'README.md');

/** Paths relative to the repository root, for use as git pathspecs. */
export const PLUGINS_PATHSPEC = relative(ROOT, PLUGINS_DIR);
export const MARKETPLACE_PATHSPEC = relative(ROOT, MARKETPLACE_PATH);
export const README_PATHSPEC = relative(ROOT, README_PATH);

/**
 * Prefix for marketplace `source` values. These stay relative to the marketplace root and the
 * schema requires the leading `./`, so they must never be resolved to an absolute path.
 */
export const PLUGINS_SOURCE_PREFIX = './plugins';

/**
 * Skills live in `<plugin>/skills/<skill>/SKILL.md`. Claude Code also loads a lone `SKILL.md` at the
 * plugin root, but Claude Desktop scans `skills/`, `agents/` and `commands/` only, so that layout
 * ships a plugin whose skills are invisible in half the clients.
 */
export const PLUGIN_SKILLS_DIR = 'skills';

export const MARKETPLACE_SCHEMA_URL = 'https://www.schemastore.org/claude-code-marketplace.json';
export const PLUGIN_SCHEMA_URL = 'https://www.schemastore.org/claude-code-plugin-manifest.json';
