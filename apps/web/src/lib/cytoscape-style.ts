/**
 * Cytoscape stylesheet — tuned for dark UI. Node size scales with LOC,
 * colour scales with hotspot. Edges fade based on kind.
 *
 * Typed as `unknown[]` and cast at the call-site because cytoscape's
 * published types reject `mapData()` strings in `width`/`height` even though
 * they're the documented way to bind to data.
 */
export const helixStylesheet: unknown[] = [
  {
    selector: 'node',
    style: {
      'background-color': '#7c5cff',
      'border-color': '#a78bfa',
      'border-width': 1,
      label: 'data(label)',
      color: '#e8e8f0',
      'font-family': 'Inter, sans-serif',
      'font-size': 10,
      'text-valign': 'bottom',
      'text-halign': 'center',
      'text-margin-y': 4,
      'text-outline-color': '#0a0a0f',
      'text-outline-width': 2,
      width: 'mapData(loc, 0, 2000, 10, 60)',
      height: 'mapData(loc, 0, 2000, 10, 60)',
    },
  },
  {
    selector: 'node[kind = "module"]',
    style: {
      'background-color': '#0f0f17',
      'border-color': '#7c5cff',
      'border-width': 2,
      shape: 'round-rectangle',
      width: 80,
      height: 80,
      'font-size': 14,
    },
  },
  {
    selector: 'node[kind = "function"]',
    style: {
      'background-color': '#22c55e',
      'border-color': '#16a34a',
      shape: 'ellipse',
      width: 'mapData(complexity, 1, 30, 8, 30)',
      height: 'mapData(complexity, 1, 30, 8, 30)',
    },
  },
  {
    selector: 'node[hotspot > 0.4]',
    style: { 'background-color': '#f59e0b', 'border-color': '#fb923c' },
  },
  {
    selector: 'node[hotspot > 0.7]',
    style: { 'background-color': '#ef4444', 'border-color': '#fca5a5' },
  },
  {
    selector: 'edge',
    style: {
      'curve-style': 'bezier',
      width: 1,
      'line-color': '#1f1f2b',
      'target-arrow-color': '#1f1f2b',
      'target-arrow-shape': 'triangle-backcurve',
      opacity: 0.6,
    },
  },
  {
    selector: 'edge[kind = "imports"]',
    style: { 'line-color': '#7c5cff', 'target-arrow-color': '#7c5cff', opacity: 0.4 },
  },
  {
    selector: 'edge[kind = "calls"]',
    style: { 'line-color': '#22c55e', 'target-arrow-color': '#22c55e', opacity: 0.5 },
  },
  {
    selector: 'edge[kind = "co-changed"]',
    style: {
      'line-color': '#f59e0b',
      'target-arrow-shape': 'none',
      'line-style': 'dashed',
      width: 'mapData(weight, 1, 50, 1, 4)',
    },
  },
  {
    selector: ':selected',
    style: {
      'border-color': '#fff',
      'border-width': 3,
      'overlay-padding': 6,
      'overlay-color': '#a78bfa',
      'overlay-opacity': 0.2,
    },
  },
];
