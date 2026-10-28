import { render } from "pele";

const samples = {
  flowchart: `flowchart LR
  A[Mermaid text] --> B[SVG]`,
  sequence: `sequenceDiagram
  Alice->>Bob: Hello
  Bob-->>Alice: Hi`,
  classD: `classDiagram
  Animal <|-- Duck
  Animal : +int age
  Duck : +swim()`,
  state: `stateDiagram-v2
  [*] --> Still
  Still --> Moving`,
  er: `erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE-ITEM : contains`,
  gantt: `gantt
  title A Gantt
  dateFormat YYYY-MM-DD
  section S
  Task :a1, 2026-01-01, 3d`,
  mindmap: `mindmap
  root((Pele))
    Flow
      flowchart
      sequence
    Data
      ER
      Class
      pie
    Plan
      Gantt
      Mind maps
      Timeline`,
  pie: `pie showData
  title Pets
  "Dogs" : 386
  "Cats" : 85`,
  git: `gitGraph
  commit id: "A"
  branch develop
  commit id: "B"
  checkout main
  merge develop`,
  kanban: `kanban
  Todo
    [Task 1]
  Doing
    [Task 2]
  Done
    [Task 3]`,
  journey: `journey
  title User day
  section Morning
    Coffee: 5: Me
    Code: 3: Me`,
  timeline: `timeline
  title History
  2024 : Start
  2025 : Ship
  2026 : Pele`,
  quadrant: `quadrantChart
  title Reach vs Effort
  x-axis Low Effort --> High Effort
  y-axis Low Reach --> High Reach
  A: [0.3, 0.6]
  B: [0.7, 0.8]`,
  xy: `xychart-beta
  title Sales
  x-axis [Jan, Feb, Mar]
  y-axis "Revenue" 0 --> 100
  bar [30, 50, 70]
  line [20, 40, 60]`,
  sankey: `sankey-beta
  A,B,10
  B,C,5
  B,D,5`,
  block: `block-beta
  columns 3
  A B C
  D["Wide"]:2 E`,
  packet: `packet-beta
  0-15: Source Port
  16-31: Dest Port`,
  requirement: `requirementDiagram
  requirement req1 {
    id: 1
    text: The system shall render diagrams
    risk: low
    verifymethod: test
  }
  element canvas {
    type: simulation
  }
  canvas - satisfies -> req1`,
  architecture: `architecture-beta
  group api(cloud)[API]
  service web(server)[Web] in api
  service db(database)[DB] in api
  web:R --> L:db`,
  c4: `C4Context
  Person(u, "User", "A user")
  System(s, "System", "Does things")
  Rel(u, s, "Uses")`,
  treemap: `treemap-beta
  "Root"
    "A": 40
    "B": 60`,
  treeview: `treeView-beta
  root
    src
      App.tsx
      main.tsx
    canvases
      demo.canvas.tsx`,
  wardley: `wardley-beta
  title Sample
  component A [0.3, 0.7]
  component B [0.6, 0.4]
  A->B`,
  venn: `venn-beta
  title Sets
  A
  B
  A&B`,
  usecase: `usecase-beta
  left side
  actor User
  User --> (Login)
  User --> (View canvas)`,
  swimlane: `swimlane-beta LR
  lane Agent
    write[Write canvas]
  lane Browser
    view[Review]
  write --> view`,
  radar: `radar-beta
  title Skills
  axis A, B, C, D
  curve Team A: 3, 4, 2, 5`,
  railroad: `railroad-beta
  Diagram -> "flowchart" | "sequence" | "C4"`,
  cynefin: `cynefin-beta
  clear: "Known knowns"
  complicated: "Known unknowns"
  complex: "Unknown unknowns"
  chaotic: "Unknowable"
  disorder: "Confusion"`,
  ishikawa: `ishikawa-beta
  effect: Broken mindmap
  People
    Keyword collision
  Process
    Bad sample`,
  eventmodeling: `eventmodeling
  title Canvas flow
  Actor: Author
  Command: WriteCanvas
  Event: CanvasSaved
  ReadModel: Sidebar`,
  agentflow: `agentflow-beta TB
  start([Start]) --> think[Plan]
  think --> tool[Call tool]
  tool --> endNode([Done])`,
};

const bad = [];
const good = [];
for (const [k, s] of Object.entries(samples)) {
  try {
    const r = render(s);
    good.push(`${k}: ${r.type} ${r.width}x${r.height}`);
  } catch (e) {
    bad.push(`${k}: ${e.message.split("\n")[0]}`);
  }
}
console.log("GOOD", good.length);
console.log(good.join("\n"));
console.log("BAD", bad.length);
console.log(bad.join("\n"));
