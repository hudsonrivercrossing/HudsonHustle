# How Pencil.dev Works in This Project

## What it is

Pencil.dev is a design tool integrated into VS Code. It stores designs in `.pen` files — an encrypted binary format only readable via the Pencil MCP tools (not with normal file readers).

This project has one design file: `apps/web/src/design/tokens.pen`

## How the pieces connect

```
VS Code (Pencil extension)
        ↕ Unix socket
~/.pencil/mcp/visual_studio_code/out/mcp-server-darwin-arm64
        ↕ MCP protocol
Claude Code
```

When you open VS Code with the Pencil extension active, the extension spawns a native MCP server binary at `~/.pencil/mcp/`. Claude Code connects to it and gains access to tools like `batch_get` and `batch_design` for reading and writing `.pen` files.

## Sync is always manual

There is no auto-sync in either direction. You explicitly ask Claude to:

- **Design → Code**: read the `.pen` file (via `batch_get`) and implement token/style changes in CSS or TSX
- **Code → Design**: update the `.pen` file (via `batch_design`) to reflect decisions made in code

## What you need

| Requirement | Status |
|-------------|--------|
| Pencil VS Code extension | Installed (places files at `~/.pencil/`) |
| MCP server binary | Auto-installed by the extension at `~/.pencil/mcp/visual_studio_code/out/mcp-server-darwin-arm64` |
| Claude Desktop MCP config | Registered at `~/Library/Application Support/Claude/claude_desktop_config.json` |
| `@pencil.dev/cli` npm package | Not needed for this workflow |
| Pencil SKILL.md | Not needed — that's for generating new designs from text prompts, a separate use case |

## How to use it

1. Open VS Code with the Pencil extension active
2. Ask Claude to read or edit the `.pen` file using the MCP tools
3. Claude implements any design changes in the actual code

If the MCP tools return "not connected", VS Code or the Pencil extension is not running.
