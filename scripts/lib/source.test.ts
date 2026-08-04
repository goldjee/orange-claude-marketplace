import { describe, expect, test } from 'bun:test';
import { assertRepo, assertSha, describeSource, isExternalSource, isPluginSource, withPin } from './source';

describe('isPluginSource', () => {
    test('accepts a relative path', () => {
        expect(isPluginSource('./plugins/thing')).toBe(true);
    });

    test('accepts every source type with only its required fields', () => {
        expect(isPluginSource({ source: 'github', repo: 'acme/tools' })).toBe(true);
        expect(isPluginSource({ source: 'url', url: 'https://gitlab.com/team/p.git' })).toBe(true);
        expect(isPluginSource({ source: 'git-subdir', url: 'acme/mono', path: 'tools/plugin' })).toBe(true);
        expect(isPluginSource({ source: 'npm', package: '@acme/plugin' })).toBe(true);
    });

    test('accepts the optional fields of each source type', () => {
        expect(isPluginSource({ source: 'github', repo: 'acme/tools', ref: 'v2.0.0', sha: 'a'.repeat(40) })).toBe(true);
        expect(isPluginSource({ source: 'npm', package: '@acme/p', version: '^2.0.0', registry: 'https://n' })).toBe(
            true,
        );
    });

    test('rejects a missing required field', () => {
        expect(isPluginSource({ source: 'github' })).toBe(false);
        expect(isPluginSource({ source: 'git-subdir', url: 'acme/mono' })).toBe(false);
        expect(isPluginSource({ source: 'npm' })).toBe(false);
    });

    test('rejects an empty required field, which locates nothing', () => {
        expect(isPluginSource({ source: 'github', repo: '' })).toBe(false);
    });

    test('rejects an optional field of the wrong type', () => {
        expect(isPluginSource({ source: 'github', repo: 'acme/tools', ref: 2 })).toBe(false);
    });

    test('rejects an unknown or missing discriminator', () => {
        expect(isPluginSource({ source: 'gitlab', repo: 'acme/tools' })).toBe(false);
        expect(isPluginSource({ repo: 'acme/tools' })).toBe(false);
        expect(isPluginSource(undefined)).toBe(false);
        expect(isPluginSource([])).toBe(false);
    });

    test('ignores fields it does not model, so a newer schema still loads', () => {
        expect(isPluginSource({ source: 'github', repo: 'acme/tools', somethingNew: 'x' })).toBe(true);
    });
});

describe('isExternalSource', () => {
    test('separates a path from a source object', () => {
        expect(isExternalSource('./plugins/thing')).toBe(false);
        expect(isExternalSource({ source: 'github', repo: 'acme/tools' })).toBe(true);
    });
});

describe('withPin', () => {
    test('leaves a source alone when nothing is pinned', () => {
        const source = { source: 'github', repo: 'acme/tools' } as const;
        expect(withPin(source, {})).toEqual(source);
    });

    test('keeps the ref when only a sha arrives, for hosts that cannot fetch a bare commit', () => {
        const sha = 'a'.repeat(40);
        expect(withPin({ source: 'github', repo: 'acme/tools', ref: 'main' }, { sha })).toEqual({
            source: 'github',
            repo: 'acme/tools',
            ref: 'main',
            sha,
        });
    });

    test('replaces a ref it is given', () => {
        expect(withPin({ source: 'url', url: 'https://x/p.git', ref: 'main' }, { ref: 'v2.0.0' })).toEqual({
            source: 'url',
            url: 'https://x/p.git',
            ref: 'v2.0.0',
        });
    });

    test('refuses to pin an npm package to a commit', () => {
        expect(() => withPin({ source: 'npm', package: '@acme/p' }, { ref: 'main' })).toThrow(/npm package/);
    });

    test('leaves an npm package alone when there is nothing to pin', () => {
        const source = { source: 'npm', package: '@acme/p' } as const;
        expect(withPin(source, {})).toEqual(source);
    });
});

describe('describeSource', () => {
    test('returns a path unchanged', () => {
        expect(describeSource('./plugins/thing')).toBe('./plugins/thing');
    });

    test('renders each source type', () => {
        expect(describeSource({ source: 'github', repo: 'acme/tools' })).toBe('github:acme/tools');
        expect(describeSource({ source: 'url', url: 'https://x/p.git' })).toBe('url:https://x/p.git');
        expect(describeSource({ source: 'git-subdir', url: 'acme/mono', path: 'tools/p' })).toBe(
            'git-subdir:acme/mono#tools/p',
        );
        expect(describeSource({ source: 'npm', package: '@acme/p', version: '^2.0.0' })).toBe('npm:@acme/p@^2.0.0');
    });

    test('shows the sha rather than the ref, since the sha is what gets checked out', () => {
        const sha = 'a'.repeat(40);
        expect(describeSource({ source: 'github', repo: 'acme/tools', ref: 'main', sha })).toBe(
            `github:acme/tools@${sha}`,
        );
        expect(describeSource({ source: 'github', repo: 'acme/tools', ref: 'main' })).toBe('github:acme/tools@main');
    });
});

describe('assertRepo', () => {
    test('accepts owner/repo', () => {
        expect(() => assertRepo('acme/tools')).not.toThrow();
    });

    test('rejects anything else', () => {
        expect(() => assertRepo('tools')).toThrow(/owner\/repo/);
        expect(() => assertRepo('https://github.com/acme/tools')).toThrow();
        expect(() => assertRepo('acme/tools/extra')).toThrow();
        expect(() => assertRepo('acme /tools')).toThrow();
    });
});

describe('assertSha', () => {
    test('accepts a full lowercase sha', () => {
        expect(() => assertSha('a1b2c3d4e5'.repeat(4))).not.toThrow();
    });

    test('rejects an abbreviated or uppercase sha', () => {
        expect(() => assertSha('a1b2c3d')).toThrow(/40-character/);
        expect(() => assertSha('A'.repeat(40))).toThrow();
    });
});
