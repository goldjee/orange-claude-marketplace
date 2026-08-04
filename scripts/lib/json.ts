/**
 * Reads and validates a JSON manifest.
 *
 * Manifests are user-editable, so a missing file, malformed JSON and an unexpected shape each get
 * their own message naming the file, rather than surfacing as a raw ENOENT or a `TypeError` from
 * whichever property the caller happened to touch first.
 *
 * @param path Absolute path to the file.
 * @param isValid Type guard describing the expected shape.
 * @param label Human-readable name of the manifest, used in error messages.
 */
export async function readJsonFile<T>(
    path: string,
    isValid: (value: unknown) => value is T,
    label: string,
): Promise<T> {
    const file = Bun.file(path);
    if (!(await file.exists())) throw new Error(`${label} was not found at ${path}.`);

    return parseJson(await file.text(), isValid, `${label} at ${path}`);
}

/**
 * Parses and validates JSON that is already in memory, such as a manifest read out of git.
 *
 * @param text The JSON to parse.
 * @param isValid Type guard describing the expected shape.
 * @param label Human-readable name of the manifest, used in error messages.
 */
export function parseJson<T>(text: string, isValid: (value: unknown) => value is T, label: string): T {
    let content: unknown;
    try {
        content = JSON.parse(text);
    } catch (error) {
        throw new Error(`${label} is not valid JSON.`, { cause: error });
    }

    if (!isValid(content)) throw new Error(`${label} does not match the expected shape.`);

    return content;
}

/** Narrows an unknown value to an indexable object. */
export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

/** Checks that `value` is an object with a string `name`, the shape shared by authors and owners. */
export function hasName(value: unknown): boolean {
    return isRecord(value) && typeof value.name === 'string';
}
