# Cursed Canvas

Lightweight browser runtime for Cursor-style `.canvas.tsx` files (**CC**).

Agents write canvases into `canvases/`. You review them in the browser via a Vite app that reimplements the `cursor/canvas` API, with a localhost SSE bus for annotate → agent loops.

**Bun-first** (`packageManager: bun@1.4.4`). Distributed via [GitHub Releases](https://github.com/wnoronha/cursedcanvas/releases) (not npm).

## Install / run

### From a GitHub Release (prebuilt viewer)

```bash
# pick a tag from https://github.com/wnoronha/cursedcanvas/releases
bunx https://github.com/wnoronha/cursedcanvas/releases/download/v0.1.0/cursedcanvas-0.1.0.tgz
```

Bins inside the package: `cursedcanvas` and `cc`.

```bash
bunx https://github.com/wnoronha/cursedcanvas/releases/download/v0.1.0/cursedcanvas-0.1.0.tgz \
  --dir . --port 5173 --bridge-port 8787
```

| Flag            | Default     | Meaning                            |
| --------------- | ----------- | ---------------------------------- |
| `--dir`         | cwd         | Project root for bridge file paths |
| `--port`        | `5173`      | Viewer                             |
| `--bridge-port` | `8787`      | Event bus (`/events`)              |
| `--host`        | `127.0.0.1` | Bind address                       |
| `--no-bridge`   | off         | Viewer only                        |
| `--no-open`     | off         | Skip opening a browser             |

### From source (HMR authoring)

```bash
git clone https://github.com/wnoronha/cursedcanvas.git
cd cursedcanvas
bun install
bun run bridge   # terminal 1 — SSE on :8787
bun run dev      # terminal 2 — Vite HMR viewer
```

Or serve the production build locally:

```bash
bun run build && bun start
```

Open the URL Vite prints (default http://localhost:5173), then pick a canvas from the topbar switcher.

### Quality gates

```bash
bun run fmt        # oxfmt — write
bun run fmt:check
bun run lint       # oxlint
bun run typecheck  # tsc -b
bun run test       # vitest
bun run build
bun run check      # all of the above (fmt:check → … → build)
```

### Agent event bus

In the viewer: **Annotate** → select a region → comment → Send. That (and canvas `useCanvasAction` buttons) publish to SSE. Agents watch and edit files:

```bash
curl -N http://127.0.0.1:8787/events
```

| Endpoint         | Role                                                    |
| ---------------- | ------------------------------------------------------- |
| `GET /events`    | SSE feed (`hello`, `action`, `annotation`)              |
| `GET /recent`    | JSON ring buffer                                        |
| `POST /annotate` | Freeform note (`text`, `canvasId`, `path`, `target`, …) |
| `POST /action`   | Publish a canvas action                                 |

## Authoring vs developing this repo

| Doc                                      | Audience                                                   |
| ---------------------------------------- | ---------------------------------------------------------- |
| **[CURSED_SKILL.md](./CURSED_SKILL.md)** | Importable skill — canvas authoring + `/events` monitoring |
| **[AGENTS.md](./AGENTS.md)**             | Agents developing _this_ project (SDK, bridge, viewer)     |

- Drop folder: `canvases/*.canvas.tsx`
- SDK: `packages/sdk` (aliased as `cursor/canvas`)
- Diagrams: `Diagram` / `Mermaid` → [Pele](https://pele.run)

## Scripts

| Command          | Purpose                           |
| ---------------- | --------------------------------- |
| `bun run dev`    | Vite HMR viewer                   |
| `bun run bridge` | Event bus on :8787                |
| `bun run build`  | Typecheck + production build      |
| `bun run check`  | fmt + lint + types + test + build |
| `bun start`      | Serve built viewer + bridge       |

## Release

Tag `v*.*.*` → CI runs `bun run check`, packs a tarball (includes `dist/`), and attaches it to a **GitHub Release**. No npm publish.

```bash
git tag v0.1.0
git push origin v0.1.0
```
