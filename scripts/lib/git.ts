import { PLUGINS_PATHSPEC, ROOT } from './constants';

/**
 * Runs git from the repository root, tolerating a non-zero exit.
 *
 * Bun's shell escapes each element of an interpolated array into its own argument, so paths
 * containing spaces need no quoting here.
 */
async function git(args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    const result = await Bun.$`git ${args}`.cwd(ROOT).quiet().nothrow();
    return { exitCode: result.exitCode, stdout: result.stdout.toString(), stderr: result.stderr.toString() };
}

/** Splits the NUL-separated output of a `-z` git command. */
function splitNulSeparated(output: string): string[] {
    return output.split('\0').filter((entry) => entry.length > 0);
}

/** Whether the repository root is inside a git working tree. */
export async function isRepository(): Promise<boolean> {
    return (await git(['rev-parse', '--is-inside-work-tree'])).exitCode === 0;
}

/** Whether the repository has at least one commit, i.e. whether `HEAD` can be resolved. */
export async function hasCommits(): Promise<boolean> {
    return (await git(['rev-parse', '--verify', 'HEAD'])).exitCode === 0;
}

/**
 * Whether a file's working-tree content differs from the copy staged for the next commit.
 * @param pathspec Path relative to the repository root.
 * @param content The working-tree content to compare against.
 */
export async function differsFromIndex(pathspec: string, content: string): Promise<boolean> {
    // An empty ref reads the index; undefined means the file is not staged at all, so it differs.
    return (await readBlob('', pathspec)) !== content;
}

/**
 * Stages a path.
 * @param path Path to stage, absolute or relative to the repository root.
 */
export async function stageFile(path: string): Promise<void> {
    const result = await git(['add', '--', path]);
    if (result.exitCode !== 0) throw new Error(`Failed to stage ${path}. ${result.stderr.trim()}`);
}

/**
 * Reads a file's contents at a given revision.
 * @param ref Revision to read from. Pass an empty string to read the staged copy from the index.
 * @param path Path relative to the repository root.
 * @returns The contents, or undefined when the file does not exist at that revision
 */
export async function readBlob(ref: string, path: string): Promise<string | undefined> {
    const result = await git(['show', `${ref}:${path}`]);
    return result.exitCode === 0 ? result.stdout : undefined;
}

/**
 * Lists the files under the plugins directory that a commit would change.
 * @param includeWorkingTree Also count unstaged edits and untracked files.
 * @returns Paths relative to the repository root
 */
export async function changedPluginFiles(includeWorkingTree: boolean): Promise<string[]> {
    if (!includeWorkingTree) {
        const staged = await git(['diff', '--cached', '--name-only', '-z', 'HEAD', '--', PLUGINS_PATHSPEC]);
        return splitNulSeparated(staged.stdout);
    }

    // `diff HEAD` covers staged and unstaged edits but never untracked files, and a new file inside
    // an existing plugin is an edit to that plugin.
    const [tracked, untracked] = await Promise.all([
        git(['diff', '--name-only', '-z', 'HEAD', '--', PLUGINS_PATHSPEC]),
        git(['ls-files', '--others', '--exclude-standard', '-z', '--', PLUGINS_PATHSPEC]),
    ]);

    return [...new Set([...splitNulSeparated(tracked.stdout), ...splitNulSeparated(untracked.stdout)])];
}
