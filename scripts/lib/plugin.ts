import { rename, rm, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { PLUGINS_DIR, PLUGINS_SOURCE_PREFIX } from './constants';
import { hasName, isRecord, readJsonFile } from './json';
import { readMarketplaceManifest, writeMarketplaceManifest } from './marketplace';
import type { Marketplace, MarketplaceEntry, Plugin, PluginManifest } from './types';
import { assertVersion, nextVersion, type ReleaseType } from './version';

/** A plugin's version before and after a change. */
export type VersionChange = { from: string; to: string };

/**
 * Plugin names double as directory names, so they are restricted to the pattern the marketplace
 * schema uses for plugin references. Requiring an alphanumeric first character and excluding path
 * separators keeps a name from escaping {@link PLUGINS_DIR}.
 */
const PLUGIN_NAME_PATTERN = /^[A-Za-z0-9][-A-Za-z0-9._]*$/;

export function isPlugin(value: unknown): value is Plugin {
    return (
        isRecord(value) &&
        typeof value.name === 'string' &&
        typeof value.description === 'string' &&
        typeof value.version === 'string' &&
        hasName(value.author)
    );
}

/**
 * Resolves the directory of a plugin, rejecting names that are invalid or that would resolve
 * outside of {@link PLUGINS_DIR}.
 */
function pluginDirectory(name: string): string {
    if (!PLUGIN_NAME_PATTERN.test(name))
        throw new Error(`Invalid plugin name "${name}". Names must match ${PLUGIN_NAME_PATTERN.source}. Aborting.`);

    const directory = resolve(PLUGINS_DIR, name);
    if (!directory.startsWith(PLUGINS_DIR + sep))
        throw new Error(`The name "${name}" resolves outside of ${PLUGINS_DIR}. Aborting.`);

    return directory;
}

/** Builds the marketplace `source` value, which stays relative to the marketplace root. */
function pluginSource(name: string): string {
    return `${PLUGINS_SOURCE_PREFIX}/${name}`;
}

/**
 * Entry keys the marketplace owns. `name` and `source` identify and locate the plugin, `$schema`
 * on an entry would point at the wrong schema, and the rest have no manifest counterpart — so a
 * sync neither writes nor removes any of them.
 */
const ENTRY_OWNED_FIELDS = new Set(['$schema', 'name', 'source', 'category', 'tags', 'strict']);

/** Manifest keys that never mirror onto an entry, for the reasons above. */
const MANIFEST_PRIVATE_FIELDS = new Set(['$schema', 'name']);

/** The manifest fields an entry mirrors. */
function mirroredFields(manifest: PluginManifest): Record<string, unknown> {
    return Object.fromEntries(Object.entries(manifest).filter(([key]) => !MANIFEST_PRIVATE_FIELDS.has(key)));
}

/**
 * Builds the marketplace entry for a plugin, mirroring its manifest.
 * @param manifest The plugin manifest.
 * @param existing The current entry, whose marketplace-owned fields are preserved.
 */
function entryFor(manifest: PluginManifest, existing?: MarketplaceEntry): MarketplaceEntry {
    // `name` and `source` are recomputed, so a stale pair from a rename must not be carried over.
    const owned = Object.fromEntries(
        Object.entries(existing ?? {}).filter(
            ([key]) => ENTRY_OWNED_FIELDS.has(key) && key !== 'name' && key !== 'source',
        ),
    );

    return {
        name: manifest.name,
        source: pluginSource(manifest.name),
        ...mirroredFields(manifest),
        ...owned,
    };
}

function manifestPath(name: string): string {
    return `${pluginDirectory(name)}/.claude-plugin/plugin.json`;
}

async function readPluginManifest(pluginName: string): Promise<PluginManifest> {
    return readJsonFile(manifestPath(pluginName), isPlugin, `The manifest for plugin "${pluginName}"`);
}

async function writePluginManifest(content: Plugin): Promise<void> {
    await Bun.write(manifestPath(content.name), JSON.stringify(content, null, 4));
}

async function pathExists(path: string): Promise<boolean> {
    try {
        await stat(path);
        return true;
    } catch (error) {
        // Only a missing path means "not there"; permission and I/O errors must surface.
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
        throw error;
    }
}

function withPlugins(marketplace: Marketplace, plugins: MarketplaceEntry[]): Marketplace {
    return { ...marketplace, plugins: [...plugins].sort((a, b) => a.name.localeCompare(b.name)) };
}

/**
 * Creates a plugin from its manifest and adds it to the marketplace.
 * @param plugin {@link Plugin}
 */
export async function createPlugin(plugin: Plugin): Promise<void> {
    const directory = pluginDirectory(plugin.name);
    const marketplace = await readMarketplaceManifest();

    if (marketplace.plugins.some((entry) => entry.name === plugin.name))
        throw new Error(`A plugin with the name "${plugin.name}" already exists in the marketplace. Aborting.`);

    // Checked separately from the marketplace entry: a directory that exists without one holds
    // work that writing the manifest would destroy.
    if (await pathExists(directory))
        throw new Error(
            `The directory ${directory} already exists but is not listed in the marketplace. Remove it or add its entry manually. Aborting.`,
        );

    await writePluginManifest(plugin);

    try {
        await writeMarketplaceManifest(withPlugins(marketplace, [...marketplace.plugins, entryFor(plugin)]));
    } catch (error) {
        // Leaving the directory behind would make it the unlisted directory rejected above.
        await rm(directory, { recursive: true, force: true });
        throw error;
    }
}

/**
 * Updates a plugin from a partial manifest. Every field may be patched, including `name`; changing
 * it renames the plugin directory and rewrites its marketplace entry.
 * @param name Name of the plugin to update.
 * @param patch Fields to merge into the existing manifest.
 */
export async function updatePlugin(name: string, patch: Partial<Plugin>): Promise<void> {
    const directory = pluginDirectory(name);
    const marketplace = await readMarketplaceManifest();

    if (!marketplace.plugins.some((entry) => entry.name === name))
        throw new Error(`A plugin with the name "${name}" does not exist in the marketplace. Aborting.`);
    if (!(await pathExists(directory))) throw new Error(`The directory ${directory} does not exist. Aborting.`);

    const original = await readPluginManifest(name);
    const updated: Plugin = { ...original, ...patch };
    const isRenamed = updated.name !== name;
    let target = directory;

    if (isRenamed) {
        target = pluginDirectory(updated.name);

        // Renaming onto an existing name is the same hazard createPlugin guards against.
        if (marketplace.plugins.some((entry) => entry.name === updated.name))
            throw new Error(`A plugin with the name "${updated.name}" already exists in the marketplace. Aborting.`);
        if (await pathExists(target)) throw new Error(`The directory ${target} already exists. Aborting.`);

        await rename(directory, target);
    }

    try {
        await writePluginManifest(updated);
        await writeMarketplaceManifest(
            withPlugins(
                marketplace,
                marketplace.plugins.map((entry) => (entry.name === name ? entryFor(updated, entry) : entry)),
            ),
        );
    } catch (error) {
        if (isRenamed) await rename(target, directory);
        await writePluginManifest(original);
        throw error;
    }
}

/**
 * Reads the current version, hands it to `next`, and writes the result back.
 * @param name Name of the plugin.
 * @param next Computes the new version from the current one.
 */
async function changeVersion(name: string, next: (current: string) => string): Promise<VersionChange> {
    const from = (await readPluginManifest(name)).version;
    const to = next(from);

    // updatePlugin re-checks existence and handles rollback, so this stays a thin composition.
    await updatePlugin(name, { version: to });

    return { from, to };
}

/**
 * Increments a plugin's version.
 * @param name Name of the plugin.
 * @param release Which version component to raise.
 * @returns The version before and after the bump
 */
export async function bumpPluginVersion(name: string, release: ReleaseType): Promise<VersionChange> {
    return changeVersion(name, (current) => nextVersion(current, release));
}

/**
 * Sets a plugin's version to an exact value.
 * @param name Name of the plugin.
 * @param version The version to set.
 * @returns The version before and after the change
 */
export async function setPluginVersion(name: string, version: string): Promise<VersionChange> {
    assertVersion(version);
    return changeVersion(name, () => version);
}

/** The mirrored fields a single entry gained, changed or lost during a sync. */
export type EntrySync = {
    name: string;
    added: string[];
    changed: string[];
    removed: string[];
};

/**
 * Mirrors every plugin manifest onto its marketplace entry, so the marketplace shows what the
 * manifests actually say. The manifest is the source of truth, so a field it no longer carries is
 * removed from the entry too.
 *
 * Writes only when something changed, leaving a clean working tree clean.
 *
 * @returns The entries that changed
 */
export async function syncMarketplaceEntries(): Promise<EntrySync[]> {
    const marketplace = await readMarketplaceManifest();
    const changes: EntrySync[] = [];

    const entries = await Promise.all(
        marketplace.plugins.map(async (entry) => {
            const updated = entryFor(await readPluginManifest(entry.name), entry);

            const keys = new Set([...Object.keys(entry), ...Object.keys(updated)]);
            const change: EntrySync = { name: entry.name, added: [], changed: [], removed: [] };

            for (const key of keys) {
                const before = entry[key];
                const after = updated[key];
                // Values include objects and arrays, so identity comparison would report drift on
                // every run and rewrite the file on every commit.
                if (Bun.deepEquals(before, after)) continue;

                if (before === undefined) change.added.push(key);
                else if (after === undefined) change.removed.push(key);
                else change.changed.push(key);
            }

            if (change.added.length + change.changed.length + change.removed.length > 0) changes.push(change);

            return updated;
        }),
    );

    if (changes.length > 0) await writeMarketplaceManifest(withPlugins(marketplace, entries));

    return changes;
}

/**
 * Deletes a plugin from the marketplace.
 * @param name Name of the plugin to delete.
 */
export async function deletePlugin(name: string): Promise<void> {
    const directory = pluginDirectory(name);
    const marketplace = await readMarketplaceManifest();

    if (!marketplace.plugins.some((entry) => entry.name === name))
        throw new Error(`A plugin with the name "${name}" does not exist in the marketplace. Aborting.`);

    await rm(directory, { recursive: true, force: true });
    await writeMarketplaceManifest(
        withPlugins(
            marketplace,
            marketplace.plugins.filter((entry) => entry.name !== name),
        ),
    );
}
