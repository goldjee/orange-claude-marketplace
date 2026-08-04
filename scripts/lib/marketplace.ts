import { MARKETPLACE_PATH } from './constants';
import { hasName, isRecord, readJsonFile } from './json';
import type { Marketplace, MarketplaceEntry } from './types';

function isMarketplaceEntry(value: unknown): value is MarketplaceEntry {
    return isRecord(value) && typeof value.name === 'string' && typeof value.source === 'string';
}

function isMarketplace(value: unknown): value is Marketplace {
    return (
        isRecord(value) &&
        typeof value.name === 'string' &&
        hasName(value.owner) &&
        Array.isArray(value.plugins) &&
        value.plugins.every(isMarketplaceEntry)
    );
}

export async function readMarketplaceManifest(): Promise<Marketplace> {
    return readJsonFile(MARKETPLACE_PATH, isMarketplace, 'The marketplace manifest');
}

export async function writeMarketplaceManifest(content: Marketplace): Promise<void> {
    await Bun.write(MARKETPLACE_PATH, JSON.stringify(content, null, 4));
}
