# Agent notes — developing Cursed Canvas

This file is for agents **working on this repository** (runtime, SDK shim, bridge, viewer).  
End-user canvas authoring and live-annotate monitoring belong in **[CURSED_SKILL.md](./CURSED_SKILL.md)** — that is the skill humans import into their agent.

## Repo map

| Path                   | Role                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `packages/sdk/`        | `cursor/canvas` API shim (layout, charts, hooks, Pele `Diagram`)                                      |
| `packages/cursor-pkg/` | File package so Vite/TS resolve `cursor/canvas`                                                       |
| `canvases/`            | Drop folder for `*.canvas.tsx` (the viewer loads these files, not `~/.cursor/projects/.../canvases/`) |
| `src/`                 | Vite viewer (`App`, annotate tool, bridge client)                                                     |
| `bridge/`              | Localhost SSE event bus (`:8787`) — in-memory, no agent spawn                                         |
| `CURSED_SKILL.md`      | **Importable skill** for canvas authors / event monitors                                              |
| `README.md`            | Human quick start                                                                                     |

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

- Keep the public canvas API compatible with Cursor's `cursor/canvas` surface. Extend it carefully, and mirror changed types and docs in the skill.
- Canvases for this project live only under repo `canvases/`. Do **not** write product canvases to `~/.cursor/projects/.../canvases/` for this runtime — the browser viewer does not load that path.
- Prefer changing `packages/sdk` over special-casing the viewer when fixing primitive behavior (charts, theme, forms).
- Bridge stays **SSE publish/subscribe** (annotations and actions). Do not reintroduce adapter spawn as the default path.
- When you change event payload fields, buffer semantics, or annotate UX, update **[CURSED_SKILL.md](./CURSED_SKILL.md)** so imported skills stay accurate.
- When touching annotate or viewer chrome, smoke-test UI flows with `agent-browser`.

## Release

- Package name: `cursedcanvas` (bins: `cursedcanvas`, `cc`).
- Distributed via **GitHub Releases** only (tarball with prebuilt `dist/`) — not npm.
- Tag `v*.*.*` → `.github/workflows/release.yml` (`bun run check`, `bun pm pack`, `softprops/action-gh-release@v3`).
- CI: `ubuntu-latest`, `actions/checkout@v7`, `oven-sh/setup-bun@v2`, `actions/upload-artifact@v7`.
- Install: `bunx -p https://github.com/wnoronha/cursedcanvas/releases/download/vX.Y.Z/cursedcanvas-X.Y.Z.tgz cursedcanvas`

## What not to put here

Do not expand this file into a full canvas authoring guide. Point agents at `CURSED_SKILL.md` for that.
