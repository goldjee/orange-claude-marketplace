export type ReleaseType = 'major' | 'minor' | 'patch';

/**
 * Plain `MAJOR.MINOR.PATCH` only. Prerelease and build identifiers (`1.2.3-beta.1`) are rejected
 * rather than mangled, since incrementing them correctly is a larger problem than these scripts need.
 */
const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

/** Parses a version into its three components, or throws explaining what was expected. */
function parseVersion(value: string): [major: number, minor: number, patch: number] {
    const match = VERSION_PATTERN.exec(value);
    if (!match) throw new Error(`Invalid version "${value}". Expected MAJOR.MINOR.PATCH, such as 1.2.3. Aborting.`);

    const [, major, minor, patch] = match;
    // Guaranteed by the pattern, but the compiler cannot see that through the match array.
    if (major === undefined || minor === undefined || patch === undefined)
        throw new Error(`Invalid version "${value}". Expected MAJOR.MINOR.PATCH, such as 1.2.3. Aborting.`);

    return [Number(major), Number(minor), Number(patch)];
}

/**
 * Validates a version string.
 * @param value Version to check.
 * @throws Error if the version is not MAJOR.MINOR.PATCH
 */
export function assertVersion(value: string): void {
    parseVersion(value);
}

/**
 * Compares two versions numerically, so 1.10.0 correctly ranks above 1.9.0.
 * @param a Left version.
 * @param b Right version.
 * @returns Greater than zero when `a` is newer, zero when equal, less than zero when older
 */
export function compareVersions(a: string, b: string): number {
    const [aMajor, aMinor, aPatch] = parseVersion(a);
    const [bMajor, bMinor, bPatch] = parseVersion(b);

    return aMajor - bMajor || aMinor - bMinor || aPatch - bPatch;
}

/**
 * Increments a version.
 * @param current Version to increment.
 * @param release Which component to raise; lower components reset to zero.
 * @returns The incremented version
 */
export function nextVersion(current: string, release: ReleaseType): string {
    const [major, minor, patch] = parseVersion(current);

    switch (release) {
        case 'major':
            return `${major + 1}.0.0`;
        case 'minor':
            return `${major}.${minor + 1}.0`;
        case 'patch':
            return `${major}.${minor}.${patch + 1}`;
    }
}
