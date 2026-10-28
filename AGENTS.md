# Agent notes — developing Cursed Canvas

This file is for agents **working on this repository** (runtime, SDK shim, bridge, viewer).  
End-user canvas authoring / live annotate monitoring belongs in **[CURSED_SKILL.md](./CURSED_SKILL.md)** — that is the skill humans import into their agent.

## Repo map

| Path                   | Role                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `packages/sdk/`        | `cursor/canvas` API shim (layout, charts, hooks, Pele `Diagram`)                   |
| `packages/cursor-pkg/` | File package so Vite/TS resolve `cursor/canvas`                                    |
| `canvases/`            | Drop folder for `*.canvas.tsx` (viewer loads these, not `~/.cursor/.../canvases/`) |
| `src/`                 | Vite viewer (`App`, annotate tool, bridge client)                                  |
| `bridge/`              | Localhost SSE event bus (`:8787`) — in-memory, no agent spawn                      |
| `CURSED_SKILL.md`      | **Importable skill** for canvas authors / event monitors                           |
| `README.md`            | Human quick start                                                                  |

## Local run (Bun)

```bash
bun install
bun run bridge   # :8787 SSE
bun run dev      # Vite viewer
bun run check    # fmt:check + lint + typecheck + test + build
```

- Viewer: http://localhost:5173
- Events: `curl -N http://127.0.0.1:8787/events`
- Tooling: **oxfmt**, **oxlint**, **tsc**, **vitest**

## Development rules

1. Keep the public canvas API compatible with Cursor’s `cursor/canvas` surface; extend carefully and mirror types/docs in the skill when behavior changes.
2. Canvases for this project live only under repo `canvases/`. Do **not** write product canvases to `~/.cursor/projects/.../canvases/` for this runtime — the browser viewer does not load that path.
3. Prefer changing `packages/sdk` over special-casing the viewer when fixing primitive behavior (charts, theme, forms).
4. Bridge stays **SSE publish/subscribe** (annotate + actions). Do not reintroduce adapter spawn as the default path.
5. When you change event payload fields, buffer semantics, or annotate UX, update **[CURSED_SKILL.md](./CURSED_SKILL.md)** so imported skills stay accurate.
6. Smoke-test UI flows with `agent-browser` when touching annotate or viewer chrome.

## Release

- Package name: `cursedcanvas` (bins: `cursedcanvas`, `cc`) — run via `bunx` / `npx`.
- Tag `v*.*.*` → `.github/workflows/release.yml` (`bun run check`, pack, `npm publish --provenance`, GitHub Release).
- CI: `ubuntu-latest`, `actions/checkout@v7`, `oven-sh/setup-bun@v2`, `actions/upload-artifact@v7`; release notes via `softprops/action-gh-release@v3`.
- Needs repo secret `NPM_TOKEN`.

## What not to put here

Do not expand this file into a full canvas authoring guide. Point agents at `CURSED_SKILL.md` for that.
