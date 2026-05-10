# pi-block-no-verify

Pi extension that prevents AI agents from bypassing local git hooks.

Delegates all detection to [block-no-verify](https://github.com/tupe12334/block-no-verify) — catches `--no-verify` flags, `core.hooksPath` overrides, and GitHub MCP tools that write through the API.

## Install

```bash
pi install https://github.com/rikby/pi-block-no-verify
```

## What it blocks

| Vector | Example |
|---|---|
| `--no-verify` flag | `git commit --no-verify -m "fix"` |
| `-n` shorthand (commit only) | `git commit -n -m "fix"` |
| `core.hooksPath` override | `git -c core.hooksPath=/dev/null commit -m "fix"` |
| GitHub MCP write tools | `mcp__github__push_files`, `create_or_update_file`, `merge_pull_request`, etc. |

## How it works

1. Every `tool_call` is serialized as JSON and piped to the `block-no-verify` CLI
2. Exit code **0** → allowed, **2** → blocked (agent sees the reason), **1** → CLI error (passes through)

The extension is a thin bridge — all detection logic lives in `block-no-verify`.

## Development

```bash
# Test locally without installing
pi -e ./pi-block-no-verify

# Install as a Pi package
pi install ./pi-block-no-verify
```

## License

MIT
