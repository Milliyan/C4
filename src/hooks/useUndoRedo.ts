import { useState, useCallback } from 'react';
import { Node, Edge } from 'reactflow';

interface HistoryItem {
  nodes: Node[];
  edges: Edge[];
}

export const useUndoRedo = (
    initialNodes: Node[], 
    initialEdges: Edge[], 
    setNodes: (nodes: Node[] | ((nds: Node[]) => Node[])) => void,
    setEdges: (edges: Edge[] | ((eds: Edge[]) => Edge[])) => void
) => {
  const [history, setHistory] = useState<HistoryItem[]>([{ nodes: initialNodes, edges: initialEdges }]);
  const [pointer, setPointer] = useState(0);

  const takeSnapshot = useCallback((nodes: Node[], edges: Edge[]) => {
      setHistory(prev => {
          const newHistory = prev.slice(0, pointer + 1);
          newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
          return newHistory;
      });
      setPointer(prev => prev + 1);
  }, [pointer]);

  const undo = useCallback(() => {
    if (pointer > 0) {
      const newPointer = pointer - 1;
      const state = history[newPointer];
      // React Flow internal state must be updated
      setNodes(JSON.parse(JSON.stringify(state.nodes))); 
      setEdges(JSON.parse(JSON.stringify(state.edges)));
      setPointer(newPointer);
    }
  }, [pointer, history, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (pointer < history.length - 1) {
      const newPointer = pointer + 1;
      const state = history[newPointer];
      setNodes(JSON.parse(JSON.stringify(state.nodes)));
      setEdges(JSON.parse(JSON.stringify(state.edges)));
      setPointer(newPointer);
    }
  }, [pointer, history, setNodes, setEdges]);
  
  const canUndo = pointer > 0;
  const canRedo = pointer < history.length - 1;

  return { takeSnapshot, undo, redo, canUndo, canRedo };
};
