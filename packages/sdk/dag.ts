export type DAGLayoutOptions = {
  nodes: Array<{ id: string }>;
  edges: Array<{ from: string; to: string }>;
  direction?: "vertical" | "horizontal";
  nodeWidth?: number;
  nodeHeight?: number;
  rankGap?: number;
  nodeGap?: number;
  padding?: number;
};

export type DAGLayoutNode = {
  id: string;
  x: number;
  y: number;
  rank: number;
  order: number;
};

export type DAGLayoutEdge = {
  from: string;
  to: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  isBackEdge: boolean;
};

export type DAGLayoutRank = {
  rank: number;
  x: number;
  y: number;
  width: number;
  height: number;
  nodeIds: string[];
};

export type DAGLayoutResult = {
  nodes: DAGLayoutNode[];
  edges: DAGLayoutEdge[];
  ranks: DAGLayoutRank[];
  direction: "vertical" | "horizontal";
  width: number;
  height: number;
};

/**
 * Hierarchical layout for DAGs. Cycles are detected; back-edges are flagged
 * and excluded from ranking.
 */
export function computeDAGLayout(options: DAGLayoutOptions): DAGLayoutResult {
  const direction = options.direction ?? "vertical";
  const nodeWidth = options.nodeWidth ?? 160;
  const nodeHeight = options.nodeHeight ?? 40;
  const rankGap = options.rankGap ?? 64;
  const nodeGap = options.nodeGap ?? 48;
  const padding = options.padding ?? 24;

  const ids = options.nodes.map((n) => n.id);
  const idSet = new Set(ids);
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  for (const id of ids) {
    outgoing.set(id, []);
    incoming.set(id, []);
  }

  const backEdges = new Set<string>();
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const adj = new Map<string, string[]>();
  for (const id of ids) adj.set(id, []);
  for (const e of options.edges) {
    if (!idSet.has(e.from) || !idSet.has(e.to)) continue;
    adj.get(e.from)!.push(e.to);
  }

  function dfs(u: string) {
    visiting.add(u);
    for (const v of adj.get(u) ?? []) {
      if (visiting.has(v)) {
        backEdges.add(`${u}->${v}`);
        continue;
      }
      if (!visited.has(v)) dfs(v);
    }
    visiting.delete(u);
    visited.add(u);
  }
  for (const id of ids) {
    if (!visited.has(id)) dfs(id);
  }

  for (const e of options.edges) {
    if (!idSet.has(e.from) || !idSet.has(e.to)) continue;
    if (backEdges.has(`${e.from}->${e.to}`)) continue;
    outgoing.get(e.from)!.push(e.to);
    incoming.get(e.to)!.push(e.from);
  }

  const rankOf = new Map<string, number>();
  const roots = ids.filter((id) => (incoming.get(id) ?? []).length === 0);
  const queue = roots.length > 0 ? [...roots] : ids.slice(0, 1);
  for (const r of queue) rankOf.set(r, 0);

  let guard = 0;
  while (queue.length && guard++ < ids.length * ids.length + 10) {
    const u = queue.shift()!;
    const ru = rankOf.get(u) ?? 0;
    for (const v of outgoing.get(u) ?? []) {
      const next = ru + 1;
      if (!rankOf.has(v) || (rankOf.get(v) ?? 0) < next) {
        rankOf.set(v, next);
        queue.push(v);
      }
    }
  }
  for (const id of ids) {
    if (!rankOf.has(id)) rankOf.set(id, 0);
  }

  const byRank = new Map<number, string[]>();
  for (const id of ids) {
    const r = rankOf.get(id)!;
    const list = byRank.get(r) ?? [];
    list.push(id);
    byRank.set(r, list);
  }
  const ranksSorted = [...byRank.keys()].sort((a, b) => a - b);

  const nodes: DAGLayoutNode[] = [];
  const ranks: DAGLayoutRank[] = [];
  let maxX = 0;
  let maxY = 0;

  for (const rank of ranksSorted) {
    const nodeIds = byRank.get(rank)!;
    const count = nodeIds.length;
    if (direction === "vertical") {
      const totalW = count * nodeWidth + Math.max(0, count - 1) * nodeGap;
      const startX = padding;
      const y = padding + rank * (nodeHeight + rankGap);
      nodeIds.forEach((id, order) => {
        const x = startX + order * (nodeWidth + nodeGap);
        nodes.push({ id, x, y, rank, order });
        maxX = Math.max(maxX, x + nodeWidth);
        maxY = Math.max(maxY, y + nodeHeight);
      });
      ranks.push({
        rank,
        x: startX,
        y,
        width: totalW,
        height: nodeHeight,
        nodeIds,
      });
    } else {
      const totalH = count * nodeHeight + Math.max(0, count - 1) * nodeGap;
      const startY = padding;
      const x = padding + rank * (nodeWidth + rankGap);
      nodeIds.forEach((id, order) => {
        const y = startY + order * (nodeHeight + nodeGap);
        nodes.push({ id, x, y, rank, order });
        maxX = Math.max(maxX, x + nodeWidth);
        maxY = Math.max(maxY, y + nodeHeight);
      });
      ranks.push({
        rank,
        x,
        y: startY,
        width: nodeWidth,
        height: totalH,
        nodeIds,
      });
    }
  }

  const pos = new Map(nodes.map((n) => [n.id, n]));
  const edges: DAGLayoutEdge[] = options.edges
    .filter((e) => idSet.has(e.from) && idSet.has(e.to))
    .map((e) => {
      const a = pos.get(e.from)!;
      const b = pos.get(e.to)!;
      const isBackEdge = backEdges.has(`${e.from}->${e.to}`);
      if (direction === "vertical") {
        return {
          from: e.from,
          to: e.to,
          sourceX: a.x + nodeWidth / 2,
          sourceY: a.y + nodeHeight,
          targetX: b.x + nodeWidth / 2,
          targetY: b.y,
          isBackEdge,
        };
      }
      return {
        from: e.from,
        to: e.to,
        sourceX: a.x + nodeWidth,
        sourceY: a.y + nodeHeight / 2,
        targetX: b.x,
        targetY: b.y + nodeHeight / 2,
        isBackEdge,
      };
    });

  return {
    nodes,
    edges,
    ranks,
    direction,
    width: maxX + padding,
    height: maxY + padding,
  };
}
