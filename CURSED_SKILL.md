# Cursed Canvas skill

Importable skill for agents that **author** or **live-edit** Cursor-style `.canvas.tsx` files against a standalone cursed-canvas runtime: the Vite viewer and the localhost event bus.

A canvas is a single React TSX file rendered in the browser viewer (or Cursor IDE). Follow these rules whether you are creating a canvas from scratch or applying annotation events from the bus.

## When to write a canvas

Use a canvas for durable standalone artifacts: reports, dashboards, docs walkthroughs,
structured reviews, or interactive tools the human will reopen in the browser.

Do **not** use a canvas for ordinary code edits, short answers, or deliverables that
belong in another tool.

## File rules

- Write **exactly one** file: `canvases/<kebab-name>.canvas.tsx`.
- Import **only** from `cursor/canvas`. No relative imports, no npm packages, no Node built-ins.
- **Default-export** the top-level component.
- Embed all data inline. **No `fetch()` or network calls.**
- Never ship empty placeholder sections. If you lack data, omit the section or ask.

Example:

```tsx
import { H1, Stack, Text, Card, CardHeader, CardBody } from "cursor/canvas";

export default function MyReport() {
  return (
    <Stack gap={16}>
      <H1>My Report</H1>
      <Text>Findings go here.</Text>
      <Card>
        <CardHeader>Service A</CardHeader>
        <CardBody>
          <Text size="small">Healthy</Text>
        </CardBody>
      </Card>
    </Stack>
  );
}
```

## Components and hooks

Prefer built-in primitives over hand-rolled markup:

- Layout: `Stack`, `Row`, `Grid`, `Spacer`, `Divider`
- Type: `H1`, `H2`, `H3`, `Text`, `Code`, `Link`
- Surfaces: `Card`, `CardHeader`, `CardBody`, `Callout`, `Pill`, `Stat`, `Table`
- Forms: `TextInput`, `TextArea`, `Checkbox`, `Toggle`, `Select`, `Button`, `IconButton`
- Visuals: `BarChart`, `LineChart`, `PieChart`, `DiffView`, `DiffStats`, `UsageBar`, `Swatch`, `TodoList`
- Diagrams: `Diagram` (alias `Mermaid`). It renders Mermaid syntax through [Pele](https://pele.run). Use it for `flowchart`, `sequence`, `C4Context`, `C4Container`, `C4Component`, or `classDiagram`.
- Layout math: `computeDAGLayout` (you render SVG/HTML yourself; prefer `Diagram` when Mermaid fits)
- State: `useCanvasState(key, default)` — persists across reloads
- Theme: `useHostTheme()` — use token colors (`theme.text.primary`, `theme.fill.tertiary`, …). No hardcoded hex.
- Actions: `useCanvasAction()` — in Cursor IDE these open the composer or files. In the cursed-canvas browser viewer they **publish** to the localhost event bus (see below)

### Diagrams (Pele)

```tsx
import { Diagram } from "cursor/canvas";

<Diagram title="C1 Context" theme="auto" caption="Source: architecture notes">
  {`C4Context
  Person(user, "User", "…")
  System(app, "App", "…")
  Rel(user, app, "Uses")`}
</Diagram>;
```

C4 levels: `C4Context` (C1), `C4Container` (C2), `C4Component` (C3). For Code (L4), use `classDiagram`.

`Diagram` `theme` prop (see [Pele theming](https://pele.run/theming) for the CSS variables):

- `auto` (default) — Pele light/dark sheet from host kind
- `dark` or `light` — Pele stock sheets
- `host` — map solid Cursor palette colors into `--pele-*` (avoid alpha fill/stroke tokens)

In mindmaps, do not name a child node `mindmap` (keyword collision). Quote or rename it.

## Design constraints

- Flat, minimal UI. No gradients, box-shadows, or decorative emoji.
- Visual hierarchy: one primary focus; mix open sections with cards (not a wall of identical cards).
- Charts/tables must include titles, axis/units context, and source captions when showing metrics.

## Agent monitoring (event bus)

Watch the bridge SSE stream and update canvases when events arrive. The viewer does **not** spawn agents.

```bash
bun run bridge   # http://127.0.0.1:8787
curl -N http://127.0.0.1:8787/events
```

Before debugging an empty stream, check `GET /health` for `{"ok":true,"mode":"events","subscribers":N}`. The bridge binds `127.0.0.1:8787` by default. To change the bind, set `BRIDGE_HOST` or `BRIDGE_PORT` and build the viewer with a matching `VITE_BRIDGE_URL`.

In the viewer, select **Annotate**. Click a block or drag a region. Add a comment. Select **Send to agents**. The viewer publishes an `annotation` event with file metadata, `target`, and `rect`.

Event kinds:

| `event`      | Meaning                                                                                                                                                                                        | What you should do                                                 |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `hello`      | Stream connected (`id: 0` always first); cwd + endpoint hints at `data.action.{cwd,events,annotate}`                                                                                           | Ready to receive                                                   |
| `action`     | Canvas `useCanvasAction` (`openFile`, `newComposerChat`→`askAgent`, `openAgent`→`resumeAgent`; `askAgent`/`resumeAgent` passthrough). Published with `source: "viewer"`; `spawn` field ignored | Read `data.action` + file fields; edit the canvas or open the path |
| `annotation` | Human Annotate → select → comment                                                                                                                                                              | Follow `data.text`; use `data.target`, `absolutePath`, or `path`   |

### Durability and cursors

- Events are kept in an **in-memory ring buffer** (last `200`). Not durable — bridge restart clears the log. This is a live bus, not a persistent queue.
- The server does **not** track per-agent offsets. Live SSE subscribers receive events as they are published.
- On reconnect, send request header `Last-Event-ID: <id>` to replay buffered events with `id > Last-Event-ID`. Plain `curl -N` does not remember a cursor. Agents must store the last consumed `id` themselves (or use `EventSource`, which resends `Last-Event-ID` automatically). An unparsable header falls back to the last 20 buffered events. The server also sends `: ping` heartbeats every 15s.
- `GET /recent?limit=N` returns the same in-memory buffer as JSON (default 20, catch-up without SSE).

Payload shape (JSON in `data:`):

```json
{
  "id": 12,
  "ts": "2026-10-28T15:00:00.000Z",
  "kind": "annotation",
  "cwd": "/Users/you/code/cursedcanvas",
  "canvasId": "example-overview",
  "file": "example-overview.canvas.tsx",
  "path": "canvases/example-overview.canvas.tsx",
  "absolutePath": "/Users/you/code/cursedcanvas/canvases/example-overview.canvas.tsx",
  "target": "Named entity card",
  "text": "Fix the Charts intro copy",
  "instruction": "Edit the canvas file (/Users/you/.../example-overview.canvas.tsx) — focus UI block “Named entity card” — Fix the Charts intro copy",
  "rect": { "top": 120, "left": 24, "width": 640, "height": 96 },
  "c4Id": "svc-a",
  "c4Label": "Service A",
  "c4From": "user",
  "c4To": "svc-a",
  "selection": null,
  "source": "viewer",
  "action": null
}
```

`instruction` is server-synthesized. It reads `Edit the canvas file (<absolutePath>) <C4 hint> — <text>`. The C4 hint is `— C4 Rel from→to (id)`, `— C4 element "label" (id)`, or `— focus UI block "target"`. `action` events carry the mapped host action (`openFile`, `askAgent`, or `resumeAgent`) plus the derived `text` and `instruction`.

Use `absolutePath` (or `cwd` with `path`) to open or edit the file. Use `target` with `text` (or `instruction`) for what to change.

Rules when handling an event:

- Edit **only** the referenced canvas (`absolutePath` or `path`). Ask if it is missing.
- Keep the file a valid `cursor/canvas` default export — still no `fetch()`, no extra imports.
- After writing, the Vite viewer refreshes through HMR. No restart is needed.
- Optional: `GET /recent` or reconnect with `Last-Event-ID` if you missed live events (still only the last 200, in memory).

Publish an annotation yourself from tests or other tools:

```bash
curl -X POST http://127.0.0.1:8787/annotate \
  -H 'Content-Type: application/json' \
  -d '{"text":"Tighten the H1","canvasId":"example-overview","path":"canvases/example-overview.canvas.tsx","target":"H1"}'
```

## Shipped example

This repo packages one catalog canvas: `canvases/example-overview.canvas.tsx` — tabs for SDK primitives, a full Pele diagram gallery, and stacked C4 stories (Cursed Canvas runtime + Internet Banking). Prefer that file when demonstrating the surface.

## After writing

Tell the human the canvas filename. They can review it with the viewer: run `bun run dev` and pick the canvas in the topbar switcher. For live annotate-to-agent updates, also run `bun run bridge`.
