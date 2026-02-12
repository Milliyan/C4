import { memo } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { CircuitNodeData } from '@/types';
import { Trash2 } from 'lucide-react';

const getIcon = (type: string) => {
  switch (type) {
    case 'resistor': return 'R';
    case 'capacitor': return 'C';
    case 'inductor': return 'L';
    case 'voltage_source': return 'V';
    case 'current_source': return 'I';
    case 'ground': return 'GND';
    case 'op_amp': return 'OP';
    case 'junction': return '•';
    default: return '?';
  }
};

const CircuitNode = ({ id, data, selected }: NodeProps<CircuitNodeData>) => {
  // 1. Get the delete function from React Flow
  const { deleteElements } = useReactFlow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the side panel when clicking delete
    deleteElements({ nodes: [{ id }] });
  };

  const isJunction = data.type === 'junction';

  // Special style for Junction (Small dot)
  if (isJunction) {
    return (
      <div className={`relative group w-4 h-4 rounded-full bg-slate-900 ${selected ? 'ring-2 ring-blue-500' : ''}`}>
        <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-transparent" />
        {/* Delete Button for Junction (Shows on Hover) */}
        <button 
          onClick={handleDelete}
          className="absolute -bottom-8 -left-2 hidden group-hover:flex bg-white text-red-500 border border-slate-200 shadow-sm p-1 rounded-full hover:bg-red-50 z-50"
          title="Delete Junction"
        >
          <Trash2 size={10} />
        </button>
        <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-transparent" />
      </div>
    );
  }

  // Standard Style for other components
  return (
    <div className={`min-w-[100px] bg-white rounded-lg border-2 transition-all shadow-sm ${
      selected ? 'border-blue-500 shadow-blue-100' : 'border-slate-200 hover:border-slate-300'
    }`}>
      {/* Input Handle */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 !bg-slate-400 !border-2 !border-white" 
      />

      <div className="p-3 flex flex-col items-center gap-2">
        {/* Icon & Label */}
        <div className="flex items-center gap-2 text-slate-800 font-semibold">
          <div className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded border border-slate-200 text-xs">
            {getIcon(data.type)}
          </div>
          <span className="text-xs uppercase tracking-wider">{data.label}</span>
        </div>

        {/* Value Display */}
        <div className="text-sm font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded w-full text-center border border-slate-100">
          {data.value} {
            data.type === 'resistor' ? 'Ω' :
            data.type === 'capacitor' ? 'µF' :
            data.type === 'inductor' ? 'mH' :
            data.type === 'voltage_source' ? 'V' :
            data.type === 'current_source' ? 'A' : ''
          }
          {/* Show Phase if it exists */}
          {(data.type === 'voltage_source' || data.type === 'current_source') && data.phase ? (
             <span className="text-blue-500 ml-1">∠{data.phase}°</span>
          ) : null}
        </div>

        {/* NEW: Delete Button (Below Value) */}
        <button
            onClick={handleDelete}
            className="mt-1 w-full flex items-center justify-center gap-1 text-[10px] text-red-500 hover:bg-red-50 py-1 rounded transition-colors"
        >
            <Trash2 size={12} />
            DELETE
        </button>
      </div>

      {/* Output Handle */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 !bg-slate-400 !border-2 !border-white" 
      />
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
const MemoizedNode = memo(CircuitNode);

// Export mapped types
export const nodeTypes = {
  resistor: MemoizedNode,
  capacitor: MemoizedNode,
  inductor: MemoizedNode,
  voltage_source: MemoizedNode,
  current_source: MemoizedNode,
  ground: MemoizedNode,
  op_amp: MemoizedNode,
  junction: MemoizedNode,
};
