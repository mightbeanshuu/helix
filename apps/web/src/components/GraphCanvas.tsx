import cytoscape, { type Core } from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { useEffect, useRef } from 'react';

import { helixStylesheet } from '../lib/cytoscape-style.js';
import { useUI } from '../stores/ui.js';

import type { CytoscapeGraph } from '@helix/shared';

cytoscape.use(fcose);

interface Props {
  graph: CytoscapeGraph | null;
}

export function GraphCanvas({ graph }: Props): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const { setSelectedFileId, setGraphView, graphView } = useUI();

  useEffect(() => {
    if (!containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: helixStylesheet as never,
      wheelSensitivity: 0.2,
      minZoom: 0.1,
      maxZoom: 4,
    });
    cy.on('tap', 'node', (evt: cytoscape.EventObject) => {
      const target = evt.target as cytoscape.NodeSingular;
      const id = target.id();
      const kind = target.data('kind') as string;
      if (kind === 'file') setSelectedFileId(id);
    });
    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [setSelectedFileId]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !graph) return;
    cy.elements().remove();
    cy.add([...graph.nodes, ...graph.edges]);
    cy.layout({
      name: 'fcose',
      animate: true,
      animationDuration: 600,
      randomize: true,
      nodeRepulsion: 4500,
      idealEdgeLength: 80,
      packComponents: true,
    } as never).run();
    cy.fit(cy.elements(), 50);
  }, [graph]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute left-3 top-3 flex gap-1">
        {(['files', 'modules', 'functions', 'classes'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setGraphView(v)}
            className={`btn !py-1 text-xs ${graphView === v ? '!bg-helix-accent !text-white' : ''}`}
          >
            {v}
          </button>
        ))}
      </div>
      {!graph?.nodes.length && (
        <div className="absolute inset-0 grid place-items-center text-helix-fg-muted">
          <div className="text-center">
            <div className="mb-2 text-sm">No data yet</div>
            <div className="text-xs">Graph will appear when the scan completes.</div>
          </div>
        </div>
      )}
    </div>
  );
}
