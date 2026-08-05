# orange-claude-marketplace

This is a marketplace for handy plugins for [Claude](https://docs.claude.com/en/docs/claude-code) that I use.

## Using the marketplace

Add the marketplace, then install what you want from it:

```bash
/plugin marketplace add goldjee/orange-claude-marketplace
/plugin install stop-slop@orange-claude-marketplace
/plugin install news-digest-mcp@orange-claude-marketplace
/plugin install context7@orange-claude-marketplace
/plugin install sequential-thinking@orange-claude-marketplace
```

Swap the local path for the repository URL once you publish it.

<!-- plugins:start -->
| Plugin | What it does |
| --- | --- |
| `context7` | Up-to-date documentation lookup. Pull version-specific documentation and code examples directly from source repositories into your LLM context. |
| `hr-job-posting-analysis` | Researches a job posting and judges it as an opportunity: company background, reviews, why the role exists, green and red flags, and CV fit. |
| `news-digest-mcp` | A simple MCP server that fetches news from Telegram and RSS sources. |
| `sequential-thinking` | Structured step-by-step reasoning through the Sequential Thinking MCP server. |
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
| `bun run add-external --name <name> --description <text> --github <owner/repo>` | List a plugin hosted elsewhere |
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

### Adding a plugin from another repository

A plugin does not have to live here. `add-external` writes an entry that points at where it does live,
and nothing is checked out into `plugins/`.

```bash
bun run add-external --name their-plugin --description "What it does." --github owner/their-plugin
bun run add-external --name their-plugin --description "What it does." --url https://gitlab.com/team/p.git --path tools/plugin
bun run add-external --name their-plugin --description "What it does." --npm @acme/claude-plugin
```

Pin a git source with `--ref <branch-or-tag>` or `--sha <commit>`, an npm one with `--npm-version`.
Leave `--version` alone unless you mean to freeze the plugin: without it Claude Code follows the
plugin's own manifest, and otherwise every new commit counts as a new version.

Re-pin or edit an entry with `--update`, which keeps the fields you leave out:

```bash
bun run add-external --name their-plugin --update --github owner/their-plugin --ref v2.0.0
```

There is no local manifest to bump, so `version-bump` refuses these; `delete` removes the entry and
touches nothing on disk.

### What the commit does

Lefthook runs `sync-plugin-list`, `version-check`, then Biome. Skip the version bump and the commit
fails before Biome runs.

`sync-plugin-list` copies every manifest field onto the marketplace entry and stages it, so you never
touch `.claude-plugin/marketplace.json`. Only `source`, `category`, `tags` and `strict` stay yours
to set.

That runs the other way round for a plugin hosted elsewhere: there is no manifest here to copy from,
so its entry is the whole record and the sync leaves it exactly as `add-external` wrote it.

It also regenerates the plugin table above, between the `plugins:start` and `plugins:end` comments.
Edit the manifest, not the table.

### Layout

```
.claude-plugin/marketplace.json   index of all plugins, hosted here or not
plugins/<name>/                   one plugin kept in this repository
  .claude-plugin/plugin.json      its manifest
scripts/                          the commands above; shared code in scripts/lib/
```

Gates: `bun run check` (Biome), `bunx tsc --noEmit`, `bun run knip`.

## License

See [LICENSE.md](LICENSE.md). Different licenses may apply to individual plugins.
