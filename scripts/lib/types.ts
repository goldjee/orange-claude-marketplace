import type { MARKETPLACE_SCHEMA_URL, PLUGIN_SCHEMA_URL } from './constants';

/**
 * A marketplace entry. Beyond the two required keys it mirrors whatever the plugin manifest holds,
 * so the extra fields stay open rather than being modelled twice.
 */
export type MarketplaceEntry = {
    name: string;
    source: string;
} & Record<string, unknown>;

export type Marketplace = {
    $schema: typeof MARKETPLACE_SCHEMA_URL;
    name: string;
    owner: {
        name: string;
    };
    plugins: MarketplaceEntry[];
};

export type Plugin = {
    $schema: typeof PLUGIN_SCHEMA_URL;
    name: string;
    description: string;
    version: string;
    author: {
        name: string;
    };
};

/**
 * A plugin manifest as read from disk. Identical to {@link Plugin} plus the optional schema fields
 * this codebase does not model; keeping the open tail here rather than on `Plugin` means a typo in
 * a known field is still a compile error everywhere else.
 */
export type PluginManifest = Plugin & Record<string, unknown>;
