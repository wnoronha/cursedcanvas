import {
  BarChart,
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Code,
  CollapsibleSection,
  Diagram,
  DiffStats,
  DiffView,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  IconButton,
  LineChart,
  Link,
  PieChart,
  Pill,
  Row,
  Select,
  Spacer,
  Stack,
  Stat,
  Swatch,
  Table,
  Text,
  TextArea,
  TextInput,
  TodoList,
  TodoListCard,
  Toggle,
  UsageBar,
  computeDAGLayout,
  useCanvasAction,
  useCanvasState,
  useHostTheme,
  type DiagramTheme,
} from "cursor/canvas";

type TabId =
  | "intro"
  | "typography"
  | "layout"
  | "surfaces"
  | "charts"
  | "diff"
  | "forms"
  | "lists"
  | "pele"
  | "c4";

const TABS: { id: TabId; label: string }[] = [
  { id: "intro", label: "Intro" },
  { id: "typography", label: "Typography" },
  { id: "layout", label: "Layout" },
  { id: "surfaces", label: "Surfaces" },
  { id: "charts", label: "Charts" },
  { id: "diff", label: "Diff & DAG" },
  { id: "forms", label: "Forms" },
  { id: "lists", label: "Lists" },
  { id: "pele", label: "Pele" },
  { id: "c4", label: "C4" },
];

const TODOS = [
  { id: "1", content: "Scaffold Vite app", status: "completed" as const },
  {
    id: "2",
    content: "Implement cursor/canvas shim",
    status: "completed" as const,
  },
  {
    id: "3",
    content: "Document agent authoring skill",
    status: "in_progress" as const,
  },
  { id: "4", content: "Polish Pele examples", status: "pending" as const },
];

const THEMES: { id: DiagramTheme; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
  { id: "host", label: "Host" },
];

/* ─── Pele diagram catalog (from pele-examples) ─── */

type ExampleId =
  | "flowchart"
  | "sequence"
  | "class"
  | "state"
  | "er"
  | "c4"
  | "block"
  | "gantt"
  | "git"
  | "kanban"
  | "mindmap"
  | "pie"
  | "journey"
  | "timeline"
  | "quadrant"
  | "xychart"
  | "sankey"
  | "packet"
  | "requirement"
  | "architecture"
  | "agentflow"
  | "swimlane"
  | "treemap"
  | "treeview"
  | "usecase"
  | "venn"
  | "wardley"
  | "radar"
  | "railroad"
  | "cynefin"
  | "ishikawa"
  | "eventmodeling";

const EXAMPLES: { id: ExampleId; label: string }[] = [
  { id: "flowchart" as const, label: "Flowchart" },
  { id: "sequence" as const, label: "Sequence" },
  { id: "class" as const, label: "Class" },
  { id: "state" as const, label: "State" },
  { id: "er" as const, label: "ER" },
  { id: "c4" as const, label: "C4" },
  { id: "block" as const, label: "Block" },
  { id: "gantt" as const, label: "Gantt" },
  { id: "git" as const, label: "Git" },
  { id: "kanban" as const, label: "Kanban" },
  { id: "mindmap" as const, label: "Mindmap" },
  { id: "pie" as const, label: "Pie" },
  { id: "journey" as const, label: "Journey" },
  { id: "timeline" as const, label: "Timeline" },
  { id: "quadrant" as const, label: "Quadrant" },
  { id: "xychart" as const, label: "XY chart" },
  { id: "sankey" as const, label: "Sankey" },
  { id: "packet" as const, label: "Packet" },
  { id: "requirement" as const, label: "Requirement" },
  { id: "architecture" as const, label: "Architecture" },
  { id: "agentflow" as const, label: "Agentflow" },
  { id: "swimlane" as const, label: "Swimlane" },
  { id: "treemap" as const, label: "Treemap" },
  { id: "treeview" as const, label: "Tree view" },
  { id: "usecase" as const, label: "Use case" },
  { id: "venn" as const, label: "Venn" },
  { id: "wardley" as const, label: "Wardley" },
  { id: "radar" as const, label: "Radar" },
  { id: "railroad" as const, label: "Railroad" },
  { id: "cynefin" as const, label: "Cynefin" },
  { id: "ishikawa" as const, label: "Ishikawa" },
  { id: "eventmodeling" as const, label: "Event modeling" },
];

/** When-to-use tips shown under each Pele H2. */
const PELE_USAGE: Record<ExampleId, string> = {
  flowchart:
    "Branching processes and decisions — pick this over sequence when control flow matters more than who talks to whom.",
  sequence:
    "Time-ordered interactions between actors/services. Prefer over flowchart when the story is messages, not branches.",
  class: "Type relationships and methods — domain models, SDK surfaces, Level-4 code sketches.",
  state: "Lifecycle of one entity (idle → running → paused). Not for multi-actor conversations.",
  er: "Data model: entities, cardinality, keys. Use before diving into class/API detail.",
  c4: "System context / containers / components. Prefer the C4 tab for full zoom stories; this is the Pele dialect sample.",
  block: "Block layout / spatial composition when boxes-and-arrows need column grids.",
  gantt: "Schedules and overlapping workstreams — milestones, phases, dependencies in time.",
  git: "Branch/commit topology for explaining release or review flow.",
  kanban:
    "Work-in-progress boards — columns of cards, not temporal schedules (use Gantt for that).",
  mindmap: "Hierarchical brainstorming. Avoid naming a child node mindmap (keyword collision).",
  pie: "Part-to-whole shares when exact values matter less than proportions (else use charts tab PieChart).",
  journey: "User/customer experience steps and emotions across a path.",
  timeline: "Chronological events without resource loading (Gantt) or message order (sequence).",
  quadrant: "2×2 prioritization (e.g. effort vs impact).",
  xychart: "Numeric series on X/Y — trends when you want Mermaid, not the SDK LineChart.",
  sankey: "Flow magnitudes between nodes (budget, traffic, conversion).",
  packet: "Bit/byte layouts for protocols and binary formats.",
  requirement: "Requirements traceability and satisfaction links.",
  architecture: "Cloud/deployment topology style architecture diagrams.",
  agentflow: "Agent/tool orchestration paths — who calls what tool next.",
  swimlane: "Process steps partitioned by actor/team (lanes).",
  treemap: "Hierarchical proportions (disk, budget) where area encodes weight.",
  treeview: "File/org trees when hierarchy matters more than proportions.",
  usecase: "Actors and use-case bubbles for product scope.",
  venn: "Overlapping set membership — keep sets few.",
  wardley: "Value-chain evolution / mapping strategy.",
  radar: "Multi-axis scores (skills, tech radar rings as data).",
  railroad: "Grammar / syntax diagrams for parsers and DSLs.",
  cynefin: "Complexity-domain framing (clear / complicated / complex / chaotic).",
  ishikawa: "Root-cause (fishbone) analysis.",
  eventmodeling: "Event-sourced flows — commands, events, and read models over time.",
};

const SOURCES: Record<ExampleId, { title: string; source: string }> = {
  flowchart: {
    title: "Flowchart",
    source: `flowchart TD
  A[Christmas] -->|Get money| B(Go shopping)
  B --> C{Let me think}
  C -->|One| D[Laptop]
  C -->|Two| E[iPhone]
  C -->|Three| F[Car]
  D --> B
  E --> A
`,
  },
  sequence: {
    title: "Sequence",
    source: `sequenceDiagram
  autonumber
  actor Customer
  participant Web as Web app
  participant API as API gateway
  participant Bank
  Customer->>Web: Place order
  Web->>API: POST /orders
  activate API
  API->>Bank: Authorise payment
  Bank-->>API: Approved
  API-->>Web: 201 Created
  deactivate API
  Web-->>Customer: Order confirmed
  Note over Customer,Bank: One order, one transaction
`,
  },
  class: {
    title: "Class",
    source: `---
title: Animal example
---
classDiagram
    note "From Duck till Zebra"
    Animal <|-- Duck
    note for Duck "can fly<br>can swim<br>can dive<br>can help in debugging"
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
    class Fish{
        -int sizeInFeet
        -canEat()
    }
    class Zebra{
        +bool is_wild
        +run()
    }
`,
  },
  state: {
    title: "State",
    source: `stateDiagram-v2
  [*] --> Idle
  Idle --> Running : start
  Running --> Idle : stop
  Running --> Paused : pause
  Paused --> Running : resume
  Paused --> Idle : stop
  Running --> [*]
`,
  },
  er: {
    title: "ER",
    source: `erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE_ITEM : contains
  CUSTOMER }|..|{ ADDRESS : uses
  ORDER }o--|| ADDRESS : "ships to"
  PRODUCT ||--o{ LINE_ITEM : "appears in"
`,
  },
  c4: {
    title: "C4",
    source: `    C4Context
      title System Context diagram for Internet Banking System
      Enterprise_Boundary(b0, "BankBoundary0") {
        Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")
        Person(customerB, "Banking Customer B")
        Person_Ext(customerC, "Banking Customer C", "desc")

        Person(customerD, "Banking Customer D", "A customer of the bank, <br/> with personal bank accounts.")

        System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")

        Enterprise_Boundary(b1, "BankBoundary") {

          SystemDb_Ext(SystemE, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")

          System_Boundary(b2, "BankBoundary2") {
            System(SystemA, "Banking System A")
            System(SystemB, "Banking System B", "A system of the bank, with personal bank accounts. next line.")
          }

          System_Ext(SystemC, "E-mail system", "The internal Microsoft Exchange e-mail system.")
          SystemDb(SystemD, "Banking System D Database", "A system of the bank, with personal bank accounts.")

          Boundary(b3, "BankBoundary3", "boundary") {
            SystemQueue(SystemF, "Banking System F Queue", "A system of the bank.")
            SystemQueue_Ext(SystemG, "Banking System G Queue", "A system of the bank, with personal bank accounts.")
          }
        }
      }

      BiRel(customerA, SystemAA, "Uses")
      BiRel(SystemAA, SystemE, "Uses")
      Rel(SystemAA, SystemC, "Sends e-mails", "SMTP")
      Rel(SystemC, customerA, "Sends e-mails to")

      UpdateElementStyle(customerA, $fontColor="red", $bgColor="grey", $borderColor="red")
      UpdateRelStyle(customerA, SystemAA, $textColor="blue", $lineColor="blue", $offsetX="5")
      UpdateRelStyle(SystemAA, SystemE, $textColor="blue", $lineColor="blue", $offsetY="-10")
      UpdateRelStyle(SystemAA, SystemC, $textColor="blue", $lineColor="blue", $offsetY="-40", $offsetX="-50")
      UpdateRelStyle(SystemC, customerA, $textColor="red", $lineColor="red", $offsetX="-50", $offsetY="20")

      UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")


`,
  },
  block: {
    title: "Block",
    source: `block
columns 1
  db(("DB"))
  blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
  block:ID
    A
    B["A wide one in the middle"]
    C
  end
  space
  D
  ID --> D
  C --> D
  style B fill:#969,stroke:#333,stroke-width:4px
`,
  },
  gantt: {
    title: "Gantt",
    source: `gantt
    title A Gantt Diagram
    dateFormat YYYY-MM-DD
    section Section
        A task          :a1, 2014-01-01, 30d
        Another task    :after a1, 20d
    section Another
        Task in Another :2014-01-12, 12d
        another task    :24d
`,
  },
  git: {
    title: "Git",
    source: `---
title: Example Git diagram
---
gitGraph
   commit
   commit
   branch develop
   checkout develop
   commit
   commit
   checkout main
   merge develop
   commit
   commit
`,
  },
  kanban: {
    title: "Kanban",
    source: `kanban
  column1[Column Title]
    task1[Task Description]
`,
  },
  mindmap: {
    title: "Mindmap",
    source: `mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularization
        British popular psychology author Tony Buzan
    Research
      On effectiveness<br/>and features
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid

`,
  },
  pie: {
    title: "Pie",
    source: `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15
`,
  },
  journey: {
    title: "Journey",
    source: `journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me
`,
  },
  timeline: {
    title: "Timeline",
    source: `timeline
    title History of Social Media Platform
    2002 : LinkedIn
    2004 : Facebook
         : Google
    2005 : YouTube
    2006 : Twitter
`,
  },
  quadrant: {
    title: "Quadrant",
    source: `quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
    Campaign E: [0.40, 0.34]
    Campaign F: [0.35, 0.78]
`,
  },
  xychart: {
    title: "XY chart",
    source: `xychart
    title "Sales Revenue"
    x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
    y-axis "Revenue (in $)" 4000 --> 11000
    bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
`,
  },
  sankey: {
    title: "Sankey",
    source: `---
config:
  sankey:
    showValues: false
---
sankey

Agricultural 'waste',Bio-conversion,124.729
Bio-conversion,Liquid,0.597
Bio-conversion,Losses,26.862
Bio-conversion,Solid,280.322
Bio-conversion,Gas,81.144
Biofuel imports,Liquid,35
Biomass imports,Solid,35
Coal imports,Coal,11.606
Coal reserves,Coal,63.965
Coal,Solid,75.571
District heating,Industry,10.639
District heating,Heating and cooling - commercial,22.505
District heating,Heating and cooling - homes,46.184
Electricity grid,Over generation / exports,104.453
Electricity grid,Heating and cooling - homes,113.726
Electricity grid,H2 conversion,27.14
Electricity grid,Industry,342.165
Electricity grid,Road transport,37.797
Electricity grid,Agriculture,4.412
Electricity grid,Heating and cooling - commercial,40.858
Electricity grid,Losses,56.691
Electricity grid,Rail transport,7.863
Electricity grid,Lighting & appliances - commercial,90.008
Electricity grid,Lighting & appliances - homes,93.494
Gas imports,Ngas,40.719
Gas reserves,Ngas,82.233
Gas,Heating and cooling - commercial,0.129
Gas,Losses,1.401
Gas,Thermal generation,151.891
Gas,Agriculture,2.096
Gas,Industry,48.58
Geothermal,Electricity grid,7.013
H2 conversion,H2,20.897
H2 conversion,Losses,6.242
H2,Road transport,20.897
Hydro,Electricity grid,6.995
Liquid,Industry,121.066
Liquid,International shipping,128.69
Liquid,Road transport,135.835
Liquid,Domestic aviation,14.458
Liquid,International aviation,206.267
Liquid,Agriculture,3.64
Liquid,National navigation,33.218
Liquid,Rail transport,4.413
Marine algae,Bio-conversion,4.375
Ngas,Gas,122.952
Nuclear,Thermal generation,839.978
Oil imports,Oil,504.287
Oil reserves,Oil,107.703
Oil,Liquid,611.99
Other waste,Solid,56.587
Other waste,Bio-conversion,77.81
Pumped heat,Heating and cooling - homes,193.026
Pumped heat,Heating and cooling - commercial,70.672
Solar PV,Electricity grid,59.901
Solar Thermal,Heating and cooling - homes,19.263
Solar,Solar Thermal,19.263
Solar,Solar PV,59.901
Solid,Agriculture,0.882
Solid,Thermal generation,400.12
Solid,Industry,46.477
Thermal generation,Electricity grid,525.531
Thermal generation,Losses,787.129
Thermal generation,District heating,79.329
Tidal,Electricity grid,9.452
UK land based bioenergy,Bio-conversion,182.01
Wave,Electricity grid,19.013
Wind,Electricity grid,289.366
`,
  },
  packet: {
    title: "Packet",
    source: `---
title: "TCP Packet"
---
packet
0-15: "Source Port"
16-31: "Destination Port"
32-63: "Sequence Number"
64-95: "Acknowledgment Number"
96-99: "Data Offset"
100-105: "Reserved"
106: "URG"
107: "ACK"
108: "PSH"
109: "RST"
110: "SYN"
111: "FIN"
112-127: "Window"
128-143: "Checksum"
144-159: "Urgent Pointer"
160-191: "(Options and Padding)"
192-255: "Data (variable length)"
`,
  },
  requirement: {
    title: "Requirement",
    source: `requirementDiagram
  requirement fast {
    id: 1
    text: Renders quickly
  }
  requirement small {
    id: 2
    text: Ships little code
  }
  element layout {
    type: module
  }
  layout - satisfies -> fast
  layout - satisfies -> small
  fast - derives -> small
  small - refines -> fast
`,
  },
  architecture: {
    title: "Architecture",
    source: `architecture-beta
    group sources(cloud)[Sources]
        service src_a(server)[Source A] in sources
        service src_b(server)[Source B] in sources
        service src_c(server)[Source C] in sources

    group storage(database)[Storage]
        service db_one(database)[DB One] in storage
        service db_two(database)[DB Two] in storage
        service db_three(database)[DB Three] in storage

    group output(disk)[Output]
        service brief(disk)[Brief] in output
        service analyst(server)[Analyst] in output
        service delivery(cloud)[Delivery] in output

    src_a:B --> T:db_one
    src_b:B --> T:db_two
    src_c:B --> T:db_three
    db_two:B --> T:brief
    brief:R --> L:analyst
    analyst:R --> L:delivery

    align row src_a src_b src_c
    align row db_one db_two db_three
    align row brief analyst delivery

    align column src_a db_one
    align column src_b db_two brief
    align column src_c db_three
`,
  },
  agentflow: {
    title: "Agentflow",
    source: `agentflow-beta TB
  flow reviewer["Review Agent"]
    changes["Gather changes"]@{ shape: input }
    analyze["Analyze diff"]@{ shape: task }
    lint["run_linter"]@{ shape: tool }
    ok["Clean?"]@{ shape: decision }

    changes --> analyze --> lint --> ok
  end
`,
  },
  swimlane: {
    title: "Swimlane",
    source: `swimlane-beta LR
  subgraph Customer
    Browse[Browse catalogue]
    Pay[Pay]
  end
  subgraph Warehouse
    Pick[Pick items]
    Ship[Ship order]
  end
  subgraph Finance
    Invoice[Raise invoice]
  end
  Browse --> Pay
  Pay --> Pick
  Pick --> Ship
  Pay --> Invoice
`,
  },
  treemap: {
    title: "Treemap",
    source: `treemap-beta
"Category A"
    "Item A1": 10
    "Item A2": 20
"Category B"
    "Item B1": 15
    "Item B2": 25
`,
  },
  treeview: {
    title: "Tree view",
    source: `treeView-beta
  project/
    this_is_a_long_filename_that_needs_to_wrap_on_a_phone.ts :::highlight ## A description that stays with the file when the layout narrows
    source/
      app.ts
`,
  },
  usecase: {
    title: "Use case",
    source: `usecase-beta
direction LR
actor Customer("Customer")
systemBoundary "Order system"
  Checkout("Place order")
end
Customer --> Checkout
`,
  },
  venn: {
    title: "Venn",
    source: `venn-beta
  title What makes a good feature
  set Desirable
  set Feasible
  set Viable
  union Desirable,Feasible["Buildable"]
  union Feasible,Viable["Sustainable"]
  union Desirable,Viable["Marketable"]
  union Desirable,Feasible,Viable["Ship it"]
`,
  },
  wardley: {
    title: "Wardley",
    source: `wardley-beta
title Tea Shop Value Chain

anchor Business [0.95, 0.63]
component Cup of Tea [0.79, 0.61]
component Tea [0.63, 0.81]
component Hot Water [0.52, 0.80]
component Kettle [0.43, 0.35]
component Power [0.10, 0.70]

Business -> Cup of Tea
Cup of Tea -> Tea
Cup of Tea -> Hot Water
Hot Water -> Kettle
Kettle -> Power

evolve Kettle 0.62
evolve Power 0.89

note "Standardising power allows Kettles to evolve faster" [0.30, 0.49]
`,
  },
  radar: {
    title: "Radar",
    source: `---
title: "Grades"
---
radar-beta
  axis m["Math"], s["Science"], e["English"]
  axis h["History"], g["Geography"], a["Art"]
  curve a["Alice"]{85, 90, 80, 70, 75, 90}
  curve b["Bob"]{70, 75, 85, 80, 90, 85}

  max 100
  min 0
`,
  },
  railroad: {
    title: "Railroad",
    source: `railroad-ebnf-beta
title "JSON Grammar"

json = element ;
element = object | array | string | number | "true" | "false" | "null" ;
object = "{" [ member ( "," member )* ] "}" ;
array = "[" [ element ( "," element )* ] "]" ;
member = string ":" element ;
`,
  },
  cynefin: {
    title: "Cynefin",
    source: `cynefin-beta
  title Incident Response

  complex
    "Investigate root cause"
    "Run chaos experiment"

  complicated
    "Analyze performance data"
    "Expert review needed"

  clear
    "Restart service"
    "Apply known fix"

  chaotic
    "Page on-call immediately"

  confusion
    "Unknown failure mode"
`,
  },
  ishikawa: {
    title: "Ishikawa",
    source: `ishikawa-beta
    Blurry Photo
    Process
        Out of focus
        Shutter speed too slow
        Protective film not removed
        Beautification filter applied
    User
        Shaky hands
    Equipment
        LENS
            Inappropriate lens
            Damaged lens
            Dirty lens
        SENSOR
            Damaged sensor
            Dirty sensor
    Environment
        Subject moved too quickly
        Too dark
`,
  },
  eventmodeling: {
    title: "Event modeling",
    source: `eventmodeling

tf 01 ui CartUI
tf 02 cmd AddItem [[AddItem01]]
tf 03 evt ItemAdded [[ItemAdded]]
tf 04 cmd AddItem [[AddItem02]]
tf 05 evt ItemAdded [[ItemAdded]]

data AddItem01 {
  description: 'john'
  image: 'avatar_john'
  price: 20.4
}

data AddItem02 {
  description: 'jack'
  image: 'avatar_jack'
  price: 12.5
}

data ItemAdded {
  description: string
  image: string
  price: number
}
`,
  },
};

/* ─── C4 stories ─── */

const RUNTIME_C4 = {
  c1: {
    label: "C1 Context",
    blurb: "Authors, reviewers, and neighboring tools.",
    source: `C4Context
title System Context — Cursed Canvas
Person(author, "Agent author", "Cursor / Gemini / Codex writing canvases")
Person(reviewer, "Human reviewer", "Opens diagrams in the browser")
System(runtime, "cursedcanvas", "Renders .canvas.tsx with a cursor/canvas-compatible SDK")
System_Ext(pele, "Pele", "Mermaid-compatible SVG renderer")
System_Ext(cursoride, "Cursor IDE", "Optional host that also understands canvases")

Rel(author, runtime, "Writes canvases/*.canvas.tsx")
Rel(reviewer, runtime, "Reviews in browser")
Rel(runtime, pele, "Renders Mermaid / C4 via Diagram")
Rel(author, cursoride, "May also open in")
Rel_Back(cursoride, runtime, "Same authoring contract")`,
  },
  c2: {
    label: "C2 Container",
    blurb: "Repo folders and the Vite browser app.",
    source: `C4Container
title Container diagram — Cursed Canvas
Person(author, "Agent author", "Writes Mermaid/C4 in TSX")
Person(reviewer, "Human reviewer", "Selects canvases in sidebar")

System_Boundary(runtime, "Cursed Canvas") {
  Container(canvases, "canvases/", "TSX files", "Agent drop folder of *.canvas.tsx")
  Container(viewer, "Vite SPA", "React", "Lists canvases and mounts default exports")
  Container(sdk, "packages/sdk", "TypeScript", "cursor/canvas shim + Diagram")
}

System_Ext(pele, "Pele npm package", "Renders Mermaid → SVG")
System_Ext(browser, "Browser", "localStorage for useCanvasState")

Rel(author, canvases, "Writes")
Rel(viewer, canvases, "import.meta.glob")
Rel(viewer, sdk, "Imports primitives")
Rel(canvases, sdk, "Imports cursor/canvas only")
Rel(sdk, pele, "mount() / render()")
Rel(reviewer, viewer, "Uses")
Rel(viewer, browser, "Persists UI state")`,
  },
  c3: {
    label: "C3 Component",
    blurb: "Pieces inside the viewer + SDK.",
    source: `C4Component
title Component diagram — Vite viewer + SDK
Container_Boundary(viewer, "Vite SPA") {
  Component(app, "App", "React", "Sidebar list + Suspense canvas host")
  Component(provider, "CanvasRuntimeProvider", "React context", "Theme + canvasId for state keys")
}

Container_Boundary(sdk, "packages/sdk") {
  Component(ui, "UI primitives", "React", "Stack, Card, Table, …")
  Component(diagram, "Diagram", "React + Pele", "Mermaid drop-in")
  Component(hooks, "Hooks", "React", "useHostTheme, useCanvasState, useCanvasAction")
}

Component_Ext(pele, "pele", "npm", "SVG layout engine")

Rel(app, provider, "Wraps selected canvas")
Rel(app, diagram, "Canvases call Diagram")
Rel(diagram, pele, "mount(source)")
Rel(app, hooks, "Viewer chrome")
Rel(diagram, hooks, "Theme CSS variables")`,
  },
  code: {
    label: "Code",
    blurb: "Diagram mount path in the SDK.",
    source: `classDiagram
  class Diagram {
    +children: string
    +title?: string
    +caption?: string
    +zoom?: boolean | auto
  }
  class PeleMount {
    +update(text)
    +refresh()
    +destroy()
  }
  class useHostTheme {
    +bg
    +text
    +stroke
    +fill
  }
  Diagram --> PeleMount : mount(host, source)
  Diagram --> useHostTheme : --pele-* CSS vars`,
  },
} as const;

const BANKING_C4 = {
  c1: {
    label: "C1 Context",
    blurb: "People and systems — what the product sits among.",
    source: `C4Context
title System Context — Internet Banking
Enterprise_Boundary(bank, "Personal Banking") {
  Person(customer, "Personal Banking Customer", "A customer of the bank with personal accounts")
  System(banking, "Internet Banking System", "Allows customers to view accounts and make payments")
}
System_Ext(mail, "E-mail System", "The bank's existing e-mail system")
System_Ext(mainframe, "Mainframe Banking System", "Stores core banking data")

Rel(customer, banking, "Uses")
Rel(banking, mail, "Sends e-mails using")
Rel(banking, mainframe, "Gets account information from", "XML/HTTPS")`,
  },
  c2: {
    label: "C2 Container",
    blurb: "Apps, databases, and how they talk.",
    source: `C4Container
title Container diagram — Internet Banking System
Person(customer, "Personal Banking Customer", "A customer of the bank")

System_Boundary(banking, "Internet Banking System") {
  Container(web, "Web Application", "JavaScript, React", "Delivers the static content and SPA")
  Container(spa, "Single-Page App", "JavaScript, React", "Provides Internet banking features")
  Container(api, "API Application", "Java, Spring MVC", "Provides banking functionality via JSON/HTTPS API")
  ContainerDb(db, "Database", "Oracle Database Schema", "Stores user registration, hashed passwords, etc.")
}

System_Ext(mail, "E-mail System", "The bank's existing e-mail system")
System_Ext(mainframe, "Mainframe Banking System", "Stores core banking data")

Rel(customer, web, "Visits bigbank.com/ib using", "HTTPS")
Rel(customer, spa, "Uses", "HTTPS")
Rel(web, spa, "Delivers to the customer's web browser")
Rel(spa, api, "Makes API calls to", "JSON/HTTPS")
Rel(api, db, "Reads from and writes to", "SQL/TCP")
Rel(api, mail, "Sends e-mail using")
Rel(api, mainframe, "Makes API calls to", "XML/HTTPS")`,
  },
  c3: {
    label: "C3 Component",
    blurb: "Major pieces inside one container (API app).",
    source: `C4Component
title Component diagram — API Application
Container_Boundary(api, "API Application") {
  Component(signin, "Sign In Controller", "Spring MVC Rest Controller", "Allows users to sign in")
  Component(accounts, "Accounts Summary Controller", "Spring MVC Rest Controller", "Provides account summaries")
  Component(reset, "Reset Password Controller", "Spring MVC Rest Controller", "Password reset flows")
  Component(security, "Security Component", "Spring Bean", "Provides authentication / authorization")
  Component(facade, "Mainframe Banking System Facade", "Spring Bean", "Wraps mainframe XML API")
  Component(email, "E-mail Component", "Spring Bean", "Sends e-mails")
  ComponentDb(db, "Database", "Relational Database Schema", "Stores user data")
}

Rel(signin, security, "Uses")
Rel(accounts, security, "Uses")
Rel(reset, security, "Uses")
Rel(reset, email, "Uses")
Rel(security, db, "Reads from and writes to", "SQL")
Rel(accounts, facade, "Uses")
Rel(signin, facade, "Uses")`,
  },
  code: {
    label: "Code",
    blurb: "Level 4 sketch — classDiagram for a hot path.",
    source: `classDiagram
  direction LR
  class SignInController {
    +POST /signin
    +authenticate(credentials)
  }
  class SecurityComponent {
    +authenticate(user, pass)
    +authorize(principal, action)
  }
  class UserRepository {
    +findByEmail(email)
    +updatePassword(userId, hash)
  }
  class MainframeFacade {
    +getAccounts(customerId)
  }
  SignInController --> SecurityComponent : authenticate
  SecurityComponent --> UserRepository : load user
  SignInController --> MainframeFacade : optional account prefetch`,
  },
} as const;

function ArchitectureDiagram() {
  const theme = useHostTheme();
  const nodeWidth = 120;
  const nodeHeight = 36;
  const layout = computeDAGLayout({
    nodes: [{ id: "agents" }, { id: "files" }, { id: "viewer" }, { id: "browser" }],
    edges: [
      { from: "agents", to: "files" },
      { from: "files", to: "viewer" },
      { from: "viewer", to: "browser" },
    ],
    nodeWidth,
    nodeHeight,
  });

  const labels: Record<string, string> = {
    agents: "Agents",
    files: "canvases/",
    viewer: "Vite app",
    browser: "Browser",
  };

  return (
    <svg
      width="100%"
      height={layout.height}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      style={{ maxWidth: 520 }}
    >
      {layout.edges.map((e) => (
        <line
          key={`${e.from}-${e.to}`}
          x1={e.sourceX}
          y1={e.sourceY}
          x2={e.targetX}
          y2={e.targetY}
          stroke={theme.stroke.secondary}
          strokeWidth={1.5}
        />
      ))}
      {layout.nodes.map((n) => (
        <g key={n.id} transform={`translate(${n.x},${n.y})`}>
          <rect
            width={nodeWidth}
            height={nodeHeight}
            rx={6}
            fill={theme.fill.tertiary}
            stroke={theme.stroke.secondary}
          />
          <text
            x={nodeWidth / 2}
            y={nodeHeight / 2 + 4}
            textAnchor="middle"
            fill={theme.text.primary}
            fontSize={12}
          >
            {labels[n.id] ?? n.id}
          </text>
        </g>
      ))}
    </svg>
  );
}

function DemoCard({ label }: { label: string }) {
  return (
    <Card>
      <CardBody>
        <Text size="small">{label}</Text>
      </CardBody>
    </Card>
  );
}

function IntroSection() {
  return (
    <Stack gap={16}>
      <Callout tone="info" title="Packaged catalog">
        This canvas is the shipped docs surface for the runtime. Use the tabs for SDK primitives,
        then <Code>Pele</Code> and <Code>C4</Code> for every diagram example on one page each.
      </Callout>

      <H2>Primitive index</H2>
      <Table
        headers={["Family", "Primitives", "Tab"]}
        rows={[
          ["Typography", "H1 H2 H3 Text Code Link", "Typography"],
          ["Layout", "Stack Row Grid Spacer Divider", "Layout"],
          ["Surfaces", "Card Pill Stat Callout Table", "Surfaces"],
          ["Charts", "Bar Line Pie UsageBar Swatch", "Charts"],
          ["Diff & DAG", "DiffView DiffStats computeDAGLayout", "Diff & DAG"],
          ["Forms", "inputs Button IconButton hooks", "Forms"],
          ["Lists", "TodoList TodoListCard CollapsibleSection", "Lists"],
          ["Diagrams", "Diagram / Mermaid via Pele", "Pele · C4"],
        ]}
        striped
      />

      <H2>Also in this canvas</H2>
      <Text size="small" tone="secondary">
        <Code>Pele</Code> stacks every Pele diagram type. <Code>C4</Code> stacks the Cursed Canvas
        runtime story and the Internet Banking sample (C1–Code).
      </Text>
    </Stack>
  );
}

function TypographySection() {
  return (
    <Stack gap={16}>
      <Text size="small" tone="secondary">
        Heading scale, body weights/tones, inline <Code>Code</Code>, and links. Multi-line samples
        use <Code>DiffView</Code> with a <Code>language</Code> (or <Code>path</Code>) hint for
        highlight.
      </Text>

      <H2>Headings</H2>
      <Text size="small" tone="tertiary">
        Sample copy under each level so PageUp / PageDown can step heading to heading while
        scrolling.
      </Text>
      <H1>Heading 1 — Lorem ipsum dolor</H1>
      <Text>
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
        dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
      </Text>
      <Text>
        Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
        laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi
        architecto beatae vitae dicta.
      </Text>
      <H2>Heading 2 — Sit amet consectetur</H2>
      <Text>
        Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
        consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam
        est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.
      </Text>
      <Text>
        At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium
        voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati
        cupiditate non provident.
      </Text>
      <H3>Heading 3 — Adipiscing elit</H3>
      <Text>
        Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut
        et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a
        sapiente delectus.
      </Text>
      <Text size="small" tone="secondary">
        Ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus
        asperiores repellat — useful filler so the next section sits further down the page.
      </Text>

      <H2>Body text</H2>
      <Text size="small" tone="secondary">
        <Code>Text</Code> is the body primitive — weights, tones, sizes, italic, truncate. Compose
        with <Code>Link</Code> and inline <Code>Code</Code>. There is no markdown renderer and no{" "}
        <Code>Image</Code> / blockquote component; use the patterns below instead.
      </Text>
      <Text>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mix{" "}
        <Text weight="medium">medium</Text>, <Text weight="semibold">semibold</Text>,{" "}
        <Text weight="bold">bold</Text>, and{" "}
        <Text italic tone="secondary">
          italic secondary
        </Text>
        . Inline <Code>useHostTheme()</Code> and a{" "}
        <Link href="https://pele.run/examples">Link</Link>.
      </Text>
      <Text>
        Longer paragraphs are just more <Code>Text</Code> nodes in a <Code>Stack</Code>. Prefer
        short sections over walls of copy — canvases are for structured review, not articles.
      </Text>
      <Text size="small" tone="tertiary">
        Small tertiary caption — axis notes, source lines, helpers.
      </Text>
      <Text size="small" tone="quaternary">
        Quaternary is the quietest tone for de-emphasized metadata.
      </Text>

      <H3>Quotes (no Blockquote)</H3>
      <Text size="small" tone="secondary">
        Use italic <Code>Text</Code> or a <Code>Callout</Code> — there is no dedicated quote
        primitive.
      </Text>
      <Text italic tone="secondary">
        “Canvases should feel like documents agents wrote, not dashboards they generated.”
      </Text>
      <Callout tone="neutral" title="Pull-quote via Callout">
        Callouts carry a title + body when the quote needs more weight than italic text alone.
      </Callout>

      <H3>Tables</H3>
      <Text size="small" tone="secondary">
        Yes — <Code>Table</Code> with headers, optional row tones, striping. See also the Surfaces
        tab for a larger example.
      </Text>
      <Table
        headers={["Need", "Primitive", "Notes"]}
        rows={[
          ["Body copy", "Text", "weights · tones · sizes"],
          ["Inline code", "Code", "no language / highlight"],
          ["External URL", "Link", "opens in browser"],
          ["Tabular data", "Table", "this component"],
          ["Emphasis block", "Callout", "tones: info…neutral"],
          ["Images", "—", "no Image primitive; no fetch()"],
        ]}
        rowTone={["neutral", "neutral", "info", "success", "info", "warning"]}
        striped
      />

      <H3>Images</H3>
      <Callout tone="warning" title="Not supported">
        Official <Code>cursor/canvas</Code> has no <Code>Image</Code> component. Canvases must not{" "}
        <Code>fetch()</Code> or load remote assets. Show structure with charts, <Code>Diagram</Code>
        , or describe the asset in text.
      </Callout>

      <H2>Code blocks (DiffView + language)</H2>
      <Card>
        <CardHeader trailing={<Pill size="sm">javascript</Pill>}>greet.js</CardHeader>
        <CardBody style={{ padding: 0 }}>
          <DiffView
            language="javascript"
            path="greet.js"
            lines={[
              {
                type: "unchanged",
                content: "const greet = (name) => `Hello, ${name}!`;",
                lineNumber: 1,
              },
              {
                type: "unchanged",
                content: 'const el = document.querySelector("[data-canvas]");',
                lineNumber: 2,
              },
            ]}
          />
        </CardBody>
      </Card>
      <Card>
        <CardHeader trailing={<Pill size="sm">python</Pill>}>greet.py</CardHeader>
        <CardBody style={{ padding: 0 }}>
          <DiffView
            language="python"
            path="greet.py"
            lines={[
              {
                type: "unchanged",
                content: "def greet(name: str) -> str:",
                lineNumber: 1,
              },
              {
                type: "unchanged",
                content: '    return f"Hello, {name}!"',
                lineNumber: 2,
              },
            ]}
          />
        </CardBody>
      </Card>
      <Card>
        <CardHeader trailing={<Pill size="sm">html</Pill>}>report.html</CardHeader>
        <CardBody style={{ padding: 0 }}>
          <DiffView
            language="html"
            path="report.html"
            lines={[
              {
                type: "unchanged",
                content: "<section data-canvas>",
                lineNumber: 1,
              },
              {
                type: "unchanged",
                content: "  <h1>Report</h1>",
                lineNumber: 2,
              },
              {
                type: "unchanged",
                content: "</section>",
                lineNumber: 3,
              },
            ]}
          />
        </CardBody>
      </Card>
    </Stack>
  );
}

function LayoutSection() {
  return (
    <Stack gap={16}>
      <Text size="small" tone="secondary">
        Five primitives: <Code>Stack</Code>, <Code>Row</Code>, <Code>Grid</Code>,{" "}
        <Code>Spacer</Code>, <Code>Divider</Code>. No page/sidebar layout component.
      </Text>

      <H2>Stack</H2>
      <Text size="small" tone="tertiary">
        Vertical flex column with <Code>gap</Code>.
      </Text>
      <Stack gap={8}>
        <DemoCard label="col 1" />
        <DemoCard label="col 2" />
        <DemoCard label="col 3" />
      </Stack>

      <H2>Row + Spacer</H2>
      <Text size="small" tone="tertiary">
        Horizontal flex; <Code>Spacer</Code> pushes trailing content.
      </Text>
      <Row gap={8} align="stretch">
        <DemoCard label="col 1" />
        <Spacer />
        <DemoCard label="col 2" />
        <DemoCard label="col 3" />
      </Row>

      <H2>Grid</H2>
      <Text size="small" tone="tertiary">
        <Code>columns</Code> as a count or template string.
      </Text>
      <Grid columns={3} gap={8}>
        <DemoCard label="col 1" />
        <DemoCard label="col 2" />
        <DemoCard label="col 3" />
      </Grid>

      <H2>Divider</H2>
      <Text size="small">Content above the divider.</Text>
      <Divider />
      <Text size="small">Content below the divider — the split is visual only.</Text>
    </Stack>
  );
}

function SurfacesSection() {
  return (
    <Stack gap={16}>
      <H2>Stat</H2>
      <Text size="small" tone="secondary">
        Use <Code>Stat</Code> for a small KPI strip at the top of a report — counts, versions,
        health labels. Put them in a <Code>Grid</Code> or <Code>Row</Code>; keep values short.
        Optional <Code>tone</Code> draws the eye to one metric without turning the page into a
        dashboard.
      </Text>
      <Grid columns={4} gap={12}>
        <Stat value="42" label="Canvases" />
        <Stat value="React" label="UI" />
        <Stat value="localStorage" label="State" />
        <Stat value="API-compatible" label="SDK" tone="info" />
      </Grid>

      <H2>Cards</H2>
      <Text size="small" tone="secondary">
        Wrap a titled unit — file, service, diff, finding. Prefer open <Code>H2</Code> +{" "}
        <Code>Text</Code> for plain narrative; reach for <Code>Card</Code> when the block is an
        entity you might collapse or stamp with status. Compose <Code>CardHeader</Code> +{" "}
        <Code>CardBody</Code>; put pills or <Code>DiffStats</Code> in the header trailing slot.
      </Text>
      <Card>
        <CardHeader
          trailing={
            <Pill size="sm" active>
              Healthy
            </Pill>
          }
        >
          Named entity card
        </CardHeader>
        <CardBody>
          <Text size="small">
            Trailing slot fits status pills or <Code>DiffStats</Code>.
          </Text>
        </CardBody>
      </Card>
      <Card collapsible defaultOpen={false}>
        <CardHeader>Collapsible card</CardHeader>
        <CardBody>
          <Text size="small">Body hides while collapsed.</Text>
        </CardBody>
      </Card>

      <H2>Pill</H2>
      <Text size="small" tone="secondary">
        Compact labels for filters, tab chips, and status tags. Use <Code>active</Code> for the
        selected chip; <Code>tone</Code> for diff semantics (added / deleted / …). Keep the label
        short — one or two words.
      </Text>
      <Row gap={8} wrap>
        <Pill active>Active</Pill>
        <Pill>Idle</Pill>
        <Pill size="sm" tone="added">
          added
        </Pill>
        <Pill size="sm" tone="deleted">
          deleted
        </Pill>
      </Row>

      <H2>Callout tones</H2>
      <Text size="small" tone="secondary">
        Call out something the reader must not miss — tip, success, warning, or blocker. Prefer one
        callout per section; use <Code>neutral</Code> for low-emphasis asides instead of another
        Card.
      </Text>
      <Stack gap={8}>
        <Callout tone="info" title="Info">
          Tip or status.
        </Callout>
        <Callout tone="success" title="Success">
          Completed cleanly.
        </Callout>
        <Callout tone="warning" title="Warning">
          Worth a look.
        </Callout>
        <Callout tone="danger" title="Danger">
          Blocking issue.
        </Callout>
        <Callout tone="neutral" title="Neutral">
          Low emphasis note.
        </Callout>
      </Stack>

      <H2>Tables</H2>
      <Text size="small" tone="secondary">
        Compare rows of structured facts — inventories, prop matrices, check results. Add{" "}
        <Code>rowTone</Code> for pass/fail coloring; <Code>striped</Code> for long lists. Pair with
        an <Code>H2</Code> title, not a Card wrapper, unless the table is one file among many.
      </Text>
      <Table
        headers={["Primitive", "Kind", "Notes"]}
        rows={[
          ["BarChart / LineChart / PieChart", "Chart", "SVG, no deps"],
          ["UsageBar / Swatch", "Meter", "Category colors"],
          ["DiffView / DiffStats", "Diff", "Compose with Card"],
          ["computeDAGLayout", "Layout", "You render SVG"],
          ["TodoList / TodoListCard", "List", "Status rows"],
          ["Forms + Button", "Input", "Value-based onChange"],
        ]}
        rowTone={["success", "success", "info", "info", "neutral", "neutral"]}
        striped
      />
    </Stack>
  );
}

function ChartsSection() {
  return (
    <Stack gap={16}>
      <H2>BarChart</H2>
      <Text size="small" tone="secondary">
        Source: illustrative · weekday reviews vs authors
      </Text>
      <BarChart
        categories={["Mon", "Tue", "Wed", "Thu", "Fri"]}
        series={[
          { name: "Reviews", data: [4, 6, 3, 8, 5], tone: "info" },
          { name: "Authors", data: [2, 3, 2, 4, 3], tone: "success" },
        ]}
        height={180}
        valueSuffix=""
        referenceLines={[{ value: 5, label: "Target", tone: "warning" }]}
      />

      <H2>LineChart</H2>
      <Text size="small" tone="secondary">
        Source: illustrative · p95 latency with SLO
      </Text>
      <LineChart
        categories={["00:00", "06:00", "12:00", "18:00", "24:00"]}
        series={[
          { name: "p95 latency", data: [80, 95, 110, 90, 85], tone: "info" },
          { name: "errors", data: [2, 4, 9, 3, 2], tone: "danger" },
        ]}
        height={180}
        fill
        valueSuffix=" ms"
        beginAtZero={false}
        referenceLines={[{ value: 100, label: "SLO", tone: "danger" }]}
      />

      <H2>PieChart</H2>
      <Grid columns={2} gap={24}>
        <PieChart
          data={[
            { label: "IDE", value: 120, tone: "info" },
            { label: "CLI", value: 30, tone: "success" },
            { label: "Cloud", value: 50, tone: "warning" },
          ]}
        />
        <PieChart
          data={[
            { label: "Passing", value: 70, tone: "success" },
            { label: "Failing", value: 30, tone: "danger" },
          ]}
          donut
        />
      </Grid>

      <H2>UsageBar</H2>
      <UsageBar
        total={120_000}
        topLeftLabel="64% Full"
        topRightLabel="76.8K / 120K Tokens"
        segments={[
          { id: "system", value: 8_000, color: "gray" },
          { id: "tools", value: 24_000, color: "purple" },
          { id: "rules", value: 12_000, color: "green" },
          { id: "skills", value: 6_000, color: "yellow" },
          { id: "mcp", value: 4_000, color: "pink" },
          { id: "conversation", value: 14_000, color: "orange" },
        ]}
      />

      <H2>Swatch</H2>
      <Row gap={8} wrap>
        {(
          ["gray", "purple", "green", "yellow", "cyan", "pink", "blue", "orange", "red"] as const
        ).map((c) => (
          <Row key={c} gap={6} align="center">
            <Swatch color={c} />
            <Text size="small">{c}</Text>
          </Row>
        ))}
      </Row>
    </Stack>
  );
}

function DiffSection() {
  return (
    <Stack gap={16}>
      <H2>DiffView + DiffStats</H2>
      <Card>
        <CardHeader trailing={<DiffStats additions={4} deletions={1} />}>
          packages/sdk/index.ts
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          <DiffView
            path="packages/sdk/index.ts"
            lines={[
              {
                type: "unchanged",
                content: 'export { Stack, Card } from "./ui";',
                lineNumber: 10,
              },
              {
                type: "added",
                content: 'export { BarChart, LineChart, PieChart } from "./charts";',
                lineNumber: 11,
              },
              {
                type: "added",
                content: 'export { DiffView, DiffStats } from "./diff";',
                lineNumber: 12,
              },
              {
                type: "removed",
                content: "// proprietary runtime import",
                lineNumber: 13,
              },
              {
                type: "unchanged",
                content: 'export { useCanvasState } from "./hooks";',
                lineNumber: 14,
              },
            ]}
          />
        </CardBody>
      </Card>

      <H2>computeDAGLayout</H2>
      <Text size="small" tone="secondary">
        Layout math only — rendering is caller-owned SVG.
      </Text>
      <ArchitectureDiagram />
    </Stack>
  );
}

function FormsSection() {
  const dispatch = useCanvasAction();
  const [name, setName] = useCanvasState("name", "");
  const [notes, setNotes] = useCanvasState("notes", "");
  const [priority, setPriority] = useCanvasState("priority", "medium");
  const [enabled, setEnabled] = useCanvasState("enabled", true);
  const [agreed, setAgreed] = useCanvasState("agreed", false);

  return (
    <Stack gap={16}>
      <Callout tone="info" title="Agent event bus">
        Run <Code>npm run bridge</Code>. Use <Code>Annotate</Code> → select a region → comment →
        Send. Annotations and <Code>useCanvasAction</Code> publish to <Code>GET /events</Code>{" "}
        (SSE). Agents monitor that stream and edit <Code>canvases/</Code>.
      </Callout>

      <H2>useCanvasAction</H2>
      <Row gap={8} wrap>
        <Button
          variant="primary"
          onClick={() =>
            dispatch({
              type: "openFile",
              path: "canvases/example-overview.canvas.tsx",
              selection: { startLineNumber: 1 },
            })
          }
        >
          openFile
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            dispatch({
              type: "newComposerChat",
              userPrompt:
                "Summarize what official cursor/canvas widgets this overview demonstrates.",
            })
          }
        >
          newComposerChat → askAgent
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            dispatch({
              type: "openAgent",
              agentId: "replace-with-conversation-id",
            })
          }
        >
          openAgent → resume
        </Button>
      </Row>

      <Callout tone="neutral" title="Value-based onChange">
        Form controls pass the value directly (not a DOM event), so they pair with{" "}
        <Code>useCanvasState</Code> setters.
      </Callout>

      <H2>TextInput</H2>
      <TextInput value={name} onChange={setName} placeholder="Your name…" />

      <H2>TextArea</H2>
      <TextArea value={notes} onChange={setNotes} placeholder="Notes…" rows={3} />

      <H2>Select</H2>
      <Select
        value={priority}
        onChange={setPriority}
        options={[
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
        ]}
      />

      <H2>Toggle · Checkbox · IconButton</H2>
      <Row gap={12} align="center">
        <Text>Notifications</Text>
        <Spacer />
        <Toggle checked={enabled} onChange={setEnabled} />
      </Row>
      <Checkbox
        checked={agreed}
        onChange={setAgreed}
        label="Bridge is running and an agent is watching /events"
      />
      <Row gap={8} align="center">
        <IconButton title="Delete" onClick={() => setNotes("")}>
          ✕
        </IconButton>
        <IconButton title="Edit" variant="circle" size="sm">
          ✎
        </IconButton>
        <Text size="small" tone="tertiary">
          IconButton
        </Text>
      </Row>

      <Divider />
      <H2>Button</H2>
      <Row gap={8}>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
      </Row>

      {name || notes ? (
        <Callout tone="success" title="Persisted">
          {name ? (
            <Text>
              Name: <Code>{name}</Code>
            </Text>
          ) : null}
          {notes ? (
            <Text size="small" tone="secondary">
              Notes length {notes.length}
            </Text>
          ) : null}
          <Text size="small" tone="secondary">
            Priority {priority} · notifications {enabled ? "on" : "off"}
          </Text>
        </Callout>
      ) : null}
    </Stack>
  );
}

function ListsSection() {
  return (
    <Stack gap={16}>
      <H2>TodoList</H2>
      <TodoList todos={TODOS} />

      <H2>TodoListCard</H2>
      <TodoListCard todos={TODOS} defaultExpanded />

      <H2>CollapsibleSection</H2>
      <CollapsibleSection
        title="Tools"
        count={4}
        leading={<Swatch color="purple" />}
        trailing={
          <Text size="small" tone="tertiary">
            12.3k
          </Text>
        }
        defaultOpen
      >
        <CollapsibleSection title="Grep" defaultOpen>
          <Text size="small">Nested disclosure rows (no card chrome).</Text>
        </CollapsibleSection>
        <CollapsibleSection title="Read">
          <Text size="small">Another nested section.</Text>
        </CollapsibleSection>
      </CollapsibleSection>
    </Stack>
  );
}

function PeleSection() {
  const [theme, setTheme] = useCanvasState<DiagramTheme>("pele-theme", "auto");

  return (
    <Stack gap={20}>
      <Text size="small" tone="secondary">
        Every Pele diagram type on one page. Theme applies to all <Code>Diagram</Code> mounts below.
      </Text>
      <Row gap={6} wrap>
        {THEMES.map((t) => (
          <Pill key={t.id} active={theme === t.id} onClick={() => setTheme(t.id)}>
            {t.label}
          </Pill>
        ))}
      </Row>
      {EXAMPLES.map((ex) => {
        const entry = SOURCES[ex.id];
        return (
          <Stack key={ex.id} gap={8}>
            <H2>{ex.label}</H2>
            <Text size="small" tone="secondary">
              {PELE_USAGE[ex.id]}
            </Text>
            <Diagram
              title={entry.title}
              theme={theme}
              caption="Source: pele.run/examples · Pele Mermaid syntax"
            >
              {entry.source}
            </Diagram>
          </Stack>
        );
      })}
    </Stack>
  );
}

function C4Section() {
  return (
    <Stack gap={24}>
      <Text size="small" tone="secondary">
        Two C4 stories stacked. C1–C3 use Mermaid <Code>C4Context</Code> / <Code>C4Container</Code>{" "}
        / <Code>C4Component</Code>. Code uses <Code>classDiagram</Code>.
      </Text>

      <H2>Cursed Canvas runtime</H2>
      <Text size="small" tone="tertiary">
        C1 → C2 → C3 → Code for this repo.
      </Text>
      {(Object.keys(RUNTIME_C4) as Array<keyof typeof RUNTIME_C4>).map((id) => {
        const meta = RUNTIME_C4[id];
        return (
          <Stack key={`rt-${id}`} gap={8}>
            <H3>{meta.label}</H3>
            <Text size="small" tone="secondary">
              {meta.blurb}
            </Text>
            <Diagram title={meta.label} caption="Pele · Mermaid C4 / classDiagram">
              {meta.source}
            </Diagram>
          </Stack>
        );
      })}

      <Divider />

      <H2>Internet Banking</H2>
      <Text size="small" tone="tertiary">
        Classic public sample — stakeholders through API internals.
      </Text>
      {(Object.keys(BANKING_C4) as Array<keyof typeof BANKING_C4>).map((id) => {
        const meta = BANKING_C4[id];
        return (
          <Stack key={`bk-${id}`} gap={8}>
            <H3>{meta.label}</H3>
            <Text size="small" tone="secondary">
              {meta.blurb}
            </Text>
            <Diagram
              title={meta.label}
              caption="Pele · Mermaid C4 / classDiagram · Internet Banking sample"
            >
              {meta.source}
            </Diagram>
          </Stack>
        );
      })}
    </Stack>
  );
}

export default function ExampleOverview() {
  const [tab, setTab] = useCanvasState<TabId>("docs-tab-v1", "intro");

  return (
    <Stack gap={20}>
      <Stack gap={8}>
        <H1>cursor/canvas catalog</H1>
        <Text tone="secondary">
          Packaged docs for this runtime — SDK primitives, Pele diagrams, and C4 examples in one
          canvas.
        </Text>
      </Stack>

      <Row gap={6} wrap>
        {TABS.map((t) => (
          <Pill key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </Pill>
        ))}
      </Row>

      {tab === "intro" ? <IntroSection /> : null}
      {tab === "typography" ? <TypographySection /> : null}
      {tab === "layout" ? <LayoutSection /> : null}
      {tab === "surfaces" ? <SurfacesSection /> : null}
      {tab === "charts" ? <ChartsSection /> : null}
      {tab === "diff" ? <DiffSection /> : null}
      {tab === "forms" ? <FormsSection /> : null}
      {tab === "lists" ? <ListsSection /> : null}
      {tab === "pele" ? <PeleSection /> : null}
      {tab === "c4" ? <C4Section /> : null}
    </Stack>
  );
}
