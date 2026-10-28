import { readFileSync, writeFileSync } from "node:fs";

const sources = JSON.parse(
  readFileSync(new URL("./pele-example-sources.json", import.meta.url), "utf8"),
);

/** Stable sidebar order matching https://pele.run/examples groupings. */
const ORDER = [
  ["flowchart", "Flowchart"],
  ["sequence", "Sequence"],
  ["class", "Class"],
  ["state", "State"],
  ["er", "ER"],
  ["c4", "C4"],
  ["block", "Block"],
  ["gantt", "Gantt"],
  ["git", "Git"],
  ["kanban", "Kanban"],
  ["mindmap", "Mindmap"],
  ["pie", "Pie"],
  ["journey", "Journey"],
  ["timeline", "Timeline"],
  ["quadrant", "Quadrant"],
  ["xychart", "XY chart"],
  ["sankey", "Sankey"],
  ["packet", "Packet"],
  ["requirement", "Requirement"],
  ["architecture", "Architecture"],
  ["agentflow", "Agentflow"],
  ["swimlane", "Swimlane"],
  ["treemap", "Treemap"],
  ["treeview", "Tree view"],
  ["usecase", "Use case"],
  ["venn", "Venn"],
  ["wardley", "Wardley"],
  ["radar", "Radar"],
  ["railroad", "Railroad"],
  ["cynefin", "Cynefin"],
  ["ishikawa", "Ishikawa"],
  ["eventmodeling", "Event modeling"],
];

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

const ids = ORDER.map(([id]) => id);
const examplesLit = ORDER.map(
  ([id, label]) => `  { id: "${id}" as const, label: "${label}" },`,
).join("\n");

const sourcesLit = ORDER.map(([id, label]) => {
  const source = sources[id]?.source;
  if (!source) throw new Error(`missing source for ${id}`);
  return `  ${id}: {\n    title: ${JSON.stringify(label)},\n    source: \`${esc(source)}\`,\n  },`;
}).join("\n");

const file = `import {
  Callout,
  Code,
  Diagram,
  H1,
  H2,
  Pill,
  Row,
  Stack,
  Text,
  useCanvasState,
  useHostTheme,
  type DiagramTheme,
} from "cursor/canvas";

type ExampleId = ${ids.map((id) => `"${id}"`).join(" | ")};

const EXAMPLES: { id: ExampleId; label: string }[] = [
${examplesLit}
];

const SOURCES: Record<ExampleId, { title: string; source: string }> = {
${sourcesLit}
};

const THEMES: { id: DiagramTheme; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
  { id: "host", label: "Host (Cursor)" },
];

export default function PeleExamples() {
  const host = useHostTheme();
  const [active, setActive] = useCanvasState<ExampleId>(
    "pele-example",
    "flowchart",
  );
  const [diagramTheme, setDiagramTheme] = useCanvasState<DiagramTheme>(
    "pele-theme",
    "auto",
  );
  const example = SOURCES[active] ?? SOURCES.flowchart;

  return (
    <Stack gap={20}>
      <Stack gap={8}>
        <H1>Pele diagram examples</H1>
        <Text tone="secondary">
          All types from <Code>https://pele.run/examples</Code>, rendered by{" "}
          <Code>pele</Code> via <Code>Diagram</Code>. Mermaid syntax is a
          drop-in.
        </Text>
      </Stack>

      <Callout tone="info" title="Dark mode / Cursor theme">
        Pele themes with CSS variables (no re-layout). Use{" "}
        <Code>theme="auto"</Code> for host light/dark, <Code>"dark"</Code> /{" "}
        <Code>"light"</Code> for Pele’s stock sheets, or <Code>"host"</Code> to
        map solid Cursor palette colors into <Code>--pele-*</Code>. Host kind
        now: <Code>{host.kind}</Code>.
      </Callout>

      <Stack gap={6}>
        <Text size="small" tone="secondary">
          Diagram theme
        </Text>
        <Row gap={6} wrap>
          {THEMES.map((t) => (
            <Pill
              key={t.id}
              active={diagramTheme === t.id}
              onClick={() => setDiagramTheme(t.id)}
            >
              {t.label}
            </Pill>
          ))}
        </Row>
      </Stack>

      <Row gap={6} wrap>
        {EXAMPLES.map((ex) => (
          <Pill
            key={ex.id}
            active={active === ex.id}
            onClick={() => setActive(ex.id)}
          >
            {ex.label}
          </Pill>
        ))}
      </Row>

      <H2>{EXAMPLES.find((e) => e.id === active)?.label ?? active}</H2>
      <Diagram
        theme={diagramTheme}
        title={example.title}
        caption="Source: pele.run/examples · Pele Mermaid syntax"
      >
        {example.source}
      </Diagram>
    </Stack>
  );
}
`;

// Pele gallery now ships inside canvases/example-overview.canvas.tsx (Pele tab).
// This script remains a source of truth for regenerating diagram snippets;
// paste SOURCES into the overview rather than restoring a separate canvas.
writeFileSync(new URL("./pele-examples.generated.tsx", import.meta.url), file);
console.log(
  "wrote scripts/pele-examples.generated.tsx (merge SOURCES into example-overview Pele tab)",
);
