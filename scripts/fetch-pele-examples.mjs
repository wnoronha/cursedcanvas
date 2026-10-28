import { writeFileSync } from "node:fs";
import { render } from "pele";

const paths = [
  "block",
  "c4",
  "class",
  "cynefin",
  "er",
  "eventmodeling",
  "flowchart",
  "gantt",
  "git",
  "ishikawa",
  "journey",
  "kanban",
  "mindmap",
  "packet",
  "pie",
  "quadrant",
  "radar",
  "railroad",
  "requirement",
  "sankey",
  "sequence",
  "state",
  "swimlane",
  "timeline",
  "treemap",
  "treeview",
  "usecase",
  "venn",
  "wardley",
  "xychart",
  "agentflow",
  "architecture",
];

const out = {};
for (const path of paths) {
  const res = await fetch(`https://pele.run/examples/${path}`);
  const html = await res.text();
  const match = html.match(/playground#source=([^"&]+)/);
  if (!match) {
    out[path] = { error: "no playground source" };
    console.log("MISS", path);
    continue;
  }
  // Query-string style: "+" is a space; then percent-decode.
  const source = decodeURIComponent(match[1].replaceAll("+", " "));
  out[path] = { source };
  try {
    const r = render(source);
    console.log("OK", path, r.type, `${r.width}x${r.height}`);
  } catch (e) {
    console.log("BAD", path, String(e.message).split("\n")[0]);
  }
}

writeFileSync(
  new URL("./pele-example-sources.json", import.meta.url),
  JSON.stringify(out, null, 2),
);
console.log("wrote scripts/pele-example-sources.json");
