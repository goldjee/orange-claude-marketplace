# orange-claude-marketplace

This is a marketplace for handy plugins for [Claude](https://docs.claude.com/en/docs/claude-code) that I use.

## Using the marketplace

Add the marketplace, then install what you want from it:

```bash
/plugin marketplace add goldjee/orange-claude-marketplace
/plugin install stop-slop@orange-claude-marketplace
```

Swap the local path for the repository URL once you publish it.

<!-- plugins:start -->
| Plugin | What it does |
| --- | --- |
| `stop-slop` | A skill for removing AI tells from prose. |
<!-- plugins:end -->

## Developing plugins

```bash
bun install
bunx lefthook install    # once, to activate the git hooks
```

Run the scripts instead of editing `marketplace.json` or a `plugin.json` by hand. They keep both
manifests in step.

| Command | Purpose |
| --- | --- |
| `bun run create --name <name> --description <text> [--author <name>]` | Scaffold a plugin and register it |
| `bun run version-bump --name <name> [--major\|--minor\|--patch\|--set <version>]` | Raise a version, `--patch` by default |
| `bun run delete --name <name> [--yes]` | Remove a plugin and its entry |
| `bun run sync-plugin-list [--stage]` | Copy manifest fields onto marketplace entries and this README |
| `bun run version-check [--working-tree]` | Fail if a changed plugin has no version raise |

### Adding a plugin

1. `bun run create --name my-plugin --description "What it does."`
2. Fill in `plugins/my-plugin/`.
3. Commit.

### Changing a plugin

1. Edit `plugins/my-plugin/`.
2. Raise the version: `bun run version-bump --name my-plugin`.
3. Commit.

### What the commit does

Lefthook runs `sync-plugin-list`, `version-check`, then Biome. Skip the version bump and the commit
fails before Biome runs.

`sync-plugin-list` copies every manifest field onto the marketplace entry and stages it, so you never
touch `.claude-plugin/marketplace.json`. Only `source`, `category`, `tags` and `strict` stay yours
to set.

It also regenerates the plugin table above, between the `plugins:start` and `plugins:end` comments.
Edit the manifest, not the table.

### Layout

```
.claude-plugin/marketplace.json   index of all plugins
plugins/<name>/                   one plugin
  .claude-plugin/plugin.json      its manifest
scripts/                          the commands above; shared code in scripts/lib/
```

Gates: `bun run check` (Biome), `bunx tsc --noEmit`, `bun run knip`.

## License

See [LICENSE.md](LICENSE.md). Different licenses may apply to individual plugins.
