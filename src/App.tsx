import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  ReactFlowInstance,
  ConnectionLineType,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Sidebar } from '@/components/Sidebar';
import { PropertiesPanel } from '@/components/PropertiesPanel';
import { TopToolbar } from '@/components/TopToolbar';
import { ResultsModal } from '@/components/ResultsModal';
import { nodeTypes } from '@/components/nodes/CustomNodes';
import { CircuitNodeData, AnalysisMethod } from '@/types';
import { solveCircuit, SolverResult } from '@/lib/solver';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import Footer from '@/components/Footer';

// 1. IMPORT THE TOUR GUIDE COMPONENT
import TourGuide from '@/components/TourGuide';

const initialNodes: Node<CircuitNodeData>[] = [];
const initialEdges: Edge[] = [];

let id = 0;
const getId = () => `node_${id++}`;

const AppContent = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [globalFrequency, setGlobalFrequency] = useState<number>(60); // 60 Hz default
  const [analysisMethod, setAnalysisMethod] = useState<AnalysisMethod>('nodal');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [solverResult, setSolverResult] = useState<SolverResult | null>(null);

  const { takeSnapshot, undo, redo, canUndo, canRedo } = useUndoRedo(initialNodes, initialEdges, setNodes, setEdges);

  const onConnect = useCallback(
    (params: Connection) => {
        setEdges((eds) => {
            const newEdges = addEdge({ 
                ...params, 
                type: 'step', 
                style: { stroke: '#0f172a', strokeWidth: 2 },
            }, eds);
            takeSnapshot(nodes, newEdges);
            return newEdges;
        });
    },
    [nodes, setEdges, takeSnapshot],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow') as CircuitNodeData['type'];

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node<CircuitNodeData> = {
        id: getId(),
        type,
        position,
        data: { 
            label: `${type} node`, 
            type,
            value: 0,
            unit: '?',
            phase: 0
        },
      };

      setNodes((nds) => {
          const newNodes = nds.concat(newNode);
          takeSnapshot(newNodes, edges);
          return newNodes;
      });
    },
    [reactFlowInstance, setNodes, edges, takeSnapshot],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleUpdateNode = (id: string, data: Partial<CircuitNodeData>) => {
    setNodes((nds) => {
      const newNodes = nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, ...data },
          };
        }
        return node;
      });
      takeSnapshot(newNodes, edges);
      return newNodes;
    });
  };

  const handleDeleteNode = (id: string) => {
      const newNodes = nodes.filter(n => n.id !== id);
      const newEdges = edges.filter(e => e.source !== id && e.target !== id);
      
      setNodes(newNodes);
      setEdges(newEdges);
      takeSnapshot(newNodes, newEdges);
      setSelectedNodeId(null);
  };

  const onNodeDragStop = useCallback((_: React.MouseEvent, __: Node) => {
      // Snapshot state after drag
      takeSnapshot(nodes, edges);
  }, [nodes, edges, takeSnapshot]);

  const onEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    
    if (!reactFlowWrapper.current || !reactFlowInstance) return;

    // 1. Get Coordinates
    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    // 2. Create Junction Node
    const junctionId = getId();
    const newJunction: Node<CircuitNodeData> = {
      id: junctionId,
      type: 'junction',
      position: { x: position.x - 10, y: position.y - 10 }, // Center the 20x20 wrapper
      data: { 
        label: 'Junction', 
        type: 'junction',
        value: 0, 
        unit: '',
        phase: 0
      },
    };

    // 3. Create New Edges
    const id1 = `e_${edge.source}-${junctionId}_${Date.now()}_1`;
    const id2 = `e_${junctionId}-${edge.target}_${Date.now()}_2`;

    const freshEdge1: Edge = {
        id: id1,
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: junctionId,
        targetHandle: 'left', 
        type: 'step',
        style: { stroke: '#0f172a', strokeWidth: 2 },
    };

    const freshEdge2: Edge = {
        id: id2,
        source: junctionId,
        sourceHandle: 'right',
        target: edge.target,
        targetHandle: edge.targetHandle,
        type: 'step',
        style: { stroke: '#0f172a', strokeWidth: 2 },
    };

    // 4. Update State
    const newNodes = [...nodes, newJunction];
    const newEdges = edges.filter(e => e.id !== edge.id).concat([freshEdge1, freshEdge2]);

    setNodes(newNodes);
    setEdges(newEdges);
    takeSnapshot(newNodes, newEdges);

  }, [nodes, edges, reactFlowInstance, setNodes, setEdges, takeSnapshot]);

  const handleAnalyze = () => {
      const result = solveCircuit(nodes, edges, globalFrequency, analysisMethod);
      setSolverResult(result);
      setIsModalOpen(true);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50">
      {/* 2. PLACE THE TOUR COMPONENT AT THE TOP */}
      <TourGuide />

      <TopToolbar 
        onAnalyze={handleAnalyze} 
        method={analysisMethod}
        setMethod={setAnalysisMethod}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      
      <div className="flex flex-1 overflow-hidden pb-10">
        <Sidebar />
        
        {/* 3. ADD CLASS "tour-canvas" HERE */}
        <div className="flex-1 h-full relative tour-canvas" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            connectionLineType={ConnectionLineType.Step}
            connectionMode={ConnectionMode.Loose}
            defaultEdgeOptions={{
                type: 'step',
                style: { stroke: '#0f172a', strokeWidth: 2 },
            }}
            fitView
          >
            <Controls />
            <Background color="#e5e7eb" gap={20} variant={BackgroundVariant.Dots} />
          </ReactFlow>
        </div>

        <PropertiesPanel 
          selectedNode={selectedNode} 
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          globalFrequency={globalFrequency}
          setGlobalFrequency={setGlobalFrequency}
        />
      </div>

      <Footer />

      <ResultsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        results={solverResult} 
      />
    </div>
  );
};

export const App = () => (
  <ReactFlowProvider>
    <AppContent />
  </ReactFlowProvider>
);
