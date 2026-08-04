import { isRecord } from './json';

/** A plugin in a GitHub repository, addressed by its `owner/repo` shorthand. */
type GithubSource = { source: 'github'; repo: string; ref?: string; sha?: string };

/** A plugin at the root of any git repository. */
type GitUrlSource = { source: 'url'; url: string; ref?: string; sha?: string };

/** A plugin in a subdirectory of a git repository, fetched with a sparse clone. */
type GitSubdirSource = { source: 'git-subdir'; url: string; path: string; ref?: string; sha?: string };

/** A plugin published as an npm package. */
export type NpmSource = { source: 'npm'; package: string; version?: string; registry?: string };

/** The git-backed sources, which are the ones a `ref` or `sha` can pin. */
type GitSource = GithubSource | GitUrlSource | GitSubdirSource;

/** A plugin fetched from outside this repository. */
export type ExternalSource = GitSource | NpmSource;

/**
 * Where a marketplace entry's plugin comes from: a path relative to the marketplace root for the
 * plugins kept in this repository, or an {@link ExternalSource} for the ones that are not.
 */
export type PluginSource = string | ExternalSource;

/**
 * The fields each source type needs, and the ones it merely allows. Unlisted keys are left alone:
 * the marketplace schema gains fields faster than these scripts do, and rejecting an unknown one
 * would refuse a file Claude Code itself accepts.
 */
const SOURCE_FIELDS = {
    github: { required: ['repo'], optional: ['ref', 'sha'] },
    url: { required: ['url'], optional: ['ref', 'sha'] },
    'git-subdir': { required: ['url', 'path'], optional: ['ref', 'sha'] },
    npm: { required: ['package'], optional: ['version', 'registry'] },
} as const satisfies Record<ExternalSource['source'], { required: readonly string[]; optional: readonly string[] }>;

function isSourceType(value: unknown): value is ExternalSource['source'] {
    return typeof value === 'string' && value in SOURCE_FIELDS;
}

export function isPluginSource(value: unknown): value is PluginSource {
    if (typeof value === 'string') return true;
    if (!isRecord(value) || !isSourceType(value.source)) return false;

    const { required, optional } = SOURCE_FIELDS[value.source];

    return (
        required.every((field) => typeof value[field] === 'string' && value[field] !== '') &&
        optional.every((field) => value[field] === undefined || typeof value[field] === 'string')
    );
}

/** Whether a plugin lives outside this repository, and so has no manifest on disk. */
export function isExternalSource(source: PluginSource): source is ExternalSource {
    return typeof source !== 'string';
}

/** The commit a git source follows. */
export type Pin = { ref?: string; sha?: string };

/**
 * Applies a pin to a source, so a plugin can be re-pinned without restating where it comes from.
 *
 * `ref` and `sha` are set independently: an existing `ref` is kept when only a `sha` arrives, since
 * hosts that cannot fetch a bare commit still need the branch it is reachable from.
 *
 * @param source The source to pin.
 * @param pin The branch or commit to follow. An empty pin leaves the source alone.
 * @throws Error if the source is an npm package, which has versions rather than commits
 */
export function withPin(source: ExternalSource, pin: Pin): ExternalSource {
    if (pin.ref === undefined && pin.sha === undefined) return source;

    if (source.source === 'npm')
        throw new Error(
            `${describeSource(source)} is an npm package, pinned with a version rather than a ref or a sha. Aborting.`,
        );

    const pinned = { ...source };
    if (pin.ref !== undefined) pinned.ref = pin.ref;
    if (pin.sha !== undefined) pinned.sha = pin.sha;

    return pinned;
}

/** Renders a git source's pin. `sha` wins, because Claude Code checks the commit out directly. */
function describePin(source: GitSource): string {
    const pin = source.sha ?? source.ref;

    return pin === undefined ? '' : `@${pin}`;
}

/**
 * Renders a source as one line, for prompts and error messages.
 * @param source The source to describe.
 * @returns A short human-readable form, such as `github:acme/tools@v2.0.0`
 */
export function describeSource(source: PluginSource): string {
    if (!isExternalSource(source)) return source;

    switch (source.source) {
        case 'github':
            return `github:${source.repo}${describePin(source)}`;
        case 'url':
            return `url:${source.url}${describePin(source)}`;
        case 'git-subdir':
            return `git-subdir:${source.url}#${source.path}${describePin(source)}`;
        case 'npm':
            return `npm:${source.package}${source.version === undefined ? '' : `@${source.version}`}`;
    }
}

/** GitHub's `owner/repo` shorthand: two non-empty segments and nothing else. */
const REPO_PATTERN = /^[^/\s]+\/[^/\s]+$/;

/** Claude Code pins to a full commit, so an abbreviated SHA is rejected rather than silently ignored. */
const SHA_PATTERN = /^[0-9a-f]{40}$/;

/**
 * Validates a GitHub repository shorthand.
 * @param value Repository to check.
 * @throws Error if the value is not `owner/repo`
 */
export function assertRepo(value: string): void {
    if (!REPO_PATTERN.test(value))
        throw new Error(`Invalid repository "${value}". Expected owner/repo, such as acme/tools. Aborting.`);
}

/**
 * Validates a commit SHA.
 * @param value SHA to check.
 * @throws Error if the value is not a full 40-character SHA
 */
export function assertSha(value: string): void {
    if (!SHA_PATTERN.test(value))
        throw new Error(`Invalid commit "${value}". Expected a full 40-character SHA. Aborting.`);
}
