# orange-claude-marketplace

A Claude Code plugin marketplace. `.claude-plugin/marketplace.json` indexes the plugins. A plugin
kept here lives in `plugins/<name>/` with its own `.claude-plugin/plugin.json`; a plugin hosted
elsewhere has only a marketplace entry, whose `source` is a `github`, `url`, `git-subdir` or `npm`
object instead of a `./plugins/<name>` path.

## Use the scripts, not manual edits

The two manifests must stay in sync, and the scripts do that with collision checks and rollback.
Editing `marketplace.json` or a `plugin.json` by hand desyncs them.

```bash
bun run create --name <name> --description <text> [--author <name>]
bun run add-external --name <name> --description <text> (--github <owner/repo> | --url <url> [--path <subdir>] | --npm <package>) [--ref <ref>] [--sha <sha>] [--update]
bun run version-bump --name <name> [--major|--minor|--patch|--set <version>]
bun run delete --name <name> [--yes]
bun run sync-plugin-list [--stage]
bun run version-check [--working-tree]
```

## Conventions

- Each command is a folder under `scripts/` with `index.ts` and `cli-arguments.ts`; shared code lives
  in `scripts/lib/`. Wrap command bodies in `run()` from `lib/cli.ts` so failures print one line and
  exit non-zero.
- All paths come from `lib/constants.ts`, which anchors to the repo root via `import.meta.dir`. Never
  derive paths from `process.cwd()` — the commands must work from any directory.
- Keep filesystem paths and manifest `source` values distinct: filesystem paths are absolute,
  `source` stays repo-relative with the leading `./` the schema requires.
- Plugin names become directory names and must match `^[A-Za-z0-9][-A-Za-z0-9._]*$`.
- Versions are plain `MAJOR.MINOR.PATCH`; prerelease identifiers are rejected.
- A local plugin's marketplace entry mirrors its manifest: `sync-plugin-list` copies every manifest
  field except `$schema`, `name` and `source`, and removes entry fields the manifest has dropped.
  Only `source`, `category`, `tags` and `strict` are marketplace-owned. Anything writing such an
  entry must go through `entryFor()` in `lib/plugin.ts`, or the next sync will overwrite it.
  `source` is manifest-private because the mirror is spread over the computed value, so a stray
  `source` key in a `plugin.json` — which the plugin schema has no place for anyway — would decide
  where the marketplace fetches the plugin from.
- The ownership runs the other way for an external plugin: there is no manifest here, so the entry is
  the whole record. `syncMarketplaceEntries()` skips those entries entirely and only `add-external`
  writes them. Everything that reaches for a manifest — `updatePlugin`, the version commands, the
  directory removal in `deletePlugin` — must check `isExternalSource(entry.source)` first;
  `localEntry()` in `lib/plugin.ts` is the shared guard.
- `lib/source.ts` owns the source model. Its `isPluginSource` guard is deliberately permissive about
  unknown keys: the marketplace schema gains fields faster than these scripts do, and rejecting one
  would refuse a file Claude Code accepts. Strict checks (`assertRepo`, `assertSha`) belong on the
  write side, in the CLI.
- Compare mirrored values with `Bun.deepEquals`, not `===` — several are objects or arrays, and
  identity comparison would rewrite the manifest on every commit.
- The plugin table in `README.md` is generated between `<!-- plugins:start -->` and
  `<!-- plugins:end -->`. Don't hand-edit that region or drop the markers; `sync-plugin-list` rewrites
  it from the marketplace entries and fails loudly if either marker is missing. The file holds
  several other tables, which is why the region is delimited rather than found by pattern.
- Validate manifests when reading them (`readJsonFile` / `parseJson` in `lib/json.ts`) rather than
  asserting types.

## Bun

- `bun <file>`, `bun install`, `bun run <script>`, `bunx <pkg>` — not node, npm or npx.
- `Bun.file` over `node:fs` read/write, `Bun.$` over execa, `bun test` over jest or vitest.
- Bun loads `.env` automatically; don't add dotenv.

## Gates

`bun run check` (Biome), `bunx tsc --noEmit`, `bun run knip`. On pre-commit lefthook runs
`sync-plugin-list`, `version-check`, then Biome, so a plugin edit without a version raise blocks the
commit before files are rewritten. The order comes from explicit `priority` values; unset priorities
sort alphabetically, which would put Biome first.

`sync-plugin-list --stage` stages the marketplace manifest itself, because lefthook's `stage_fixed`
only re-stages files already in the index. It stages whenever the working tree differs from the
index — **not** only when the sync changed something. `create`, `version-bump` and `delete` all write
the marketplace manifest themselves, leaving the sync nothing to do; keying staging off the sync's
own changes silently dropped those writes from the commit and desynced the committed manifests.

knip reports `updatePlugin` as an unused export. That is intentional — it and `deletePlugin` back the
version commands and are kept for further development. Don't delete them to quiet the report.
