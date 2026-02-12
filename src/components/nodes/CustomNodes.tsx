import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CircuitNodeData } from '@/types';

// Helper to render the correct SVG symbol based on type
const renderSymbol = (type: string) => {
  const strokeColor = "#334155"; // slate-700
  const strokeWidth = 2;

  switch (type) {
    case 'resistor':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full">
          <path d="M0 20 L10 20 L15 10 L25 30 L35 10 L45 30 L50 20 L60 20" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'capacitor':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full">
          <line x1="0" y1="20" x2="24" y2="20" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="24" y1="10" x2="24" y2="30" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="36" y1="10" x2="36" y2="30" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="36" y1="20" x2="60" y2="20" stroke={strokeColor} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'inductor':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full">
          <path d="M0 20 L10 20 Q15 5 20 20 Q25 5 30 20 Q35 5 40 20 Q45 5 50 20 L60 20" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </svg>
      );
    case 'voltage_source':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full">
          <line x1="0" y1="20" x2="15" y2="20" stroke={strokeColor} strokeWidth={strokeWidth} />
          <circle cx="30" cy="20" r="14" fill="white" stroke={strokeColor} strokeWidth={strokeWidth} />
          <path d="M24 20 Q30 10 36 20 Q30 30 24 20" fill="none" stroke={strokeColor} strokeWidth={1.5} /> {/* Sine wave */}
          <line x1="45" y1="20" x2="60" y2="20" stroke={strokeColor} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'current_source':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full">
          <line x1="0" y1="20" x2="15" y2="20" stroke={strokeColor} strokeWidth={strokeWidth} />
          <circle cx="30" cy="20" r="14" fill="white" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="22" y1="20" x2="38" y2="20" stroke={strokeColor} strokeWidth={1.5} markerEnd="url(#arrow)" />
          <line x1="45" y1="20" x2="60" y2="20" stroke={strokeColor} strokeWidth={strokeWidth} />
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill={strokeColor} />
            </marker>
          </defs>
        </svg>
      );
    case 'ground':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full">
          <line x1="30" y1="0" x2="30" y2="20" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="15" y1="20" x2="45" y2="20" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="20" y1="25" x2="40" y2="25" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="25" y1="30" x2="35" y2="30" stroke={strokeColor} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'op_amp':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full">
          <path d="M15 5 L15 35 L50 20 Z" fill="white" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <text x="18" y="15" fontSize="10" fill={strokeColor}>-</text>
          <text x="18" y="32" fontSize="10" fill={strokeColor}>+</text>
          <line x1="0" y1="12" x2="15" y2="12" stroke={strokeColor} strokeWidth={1} />
          <line x1="0" y1="28" x2="15" y2="28" stroke={strokeColor} strokeWidth={1} />
          <line x1="50" y1="20" x2="60" y2="20" stroke={strokeColor} strokeWidth={1} />
        </svg>
      );
    case 'junction':
      return (
        <div className="w-3 h-3 bg-slate-900 rounded-full" />
      );
    default:
      return <span className="text-xs">?</span>;
  }
};

const CircuitNode = ({ id, data, selected }: NodeProps<CircuitNodeData>) => {
  const isJunction = data.type === 'junction';
  const isGround = data.type === 'ground';

  if (isJunction) {
    return (
      <div className={`relative flex items-center justify-center ${selected ? 'ring-2 ring-blue-500 rounded-full' : ''}`}>
        <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-transparent opacity-0" />
        {renderSymbol('junction')}
        <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-transparent opacity-0" />
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* 
         The Node Container 
         - Small fixed size (w-16 = 64px, h-10 = 40px)
         - No Border by default (Transparent), only shows border on Selection
      */}
      <div 
        className={`w-16 h-10 flex items-center justify-center bg-transparent transition-all rounded 
        ${selected ? 'ring-1 ring-blue-500 bg-blue-50/20' : ''}`}
      >
        {/* Render the SVG Symbol */}
        {renderSymbol(data.type)}
        
        {/* Handles (Invisible but functional) */}
        {!isGround && (
           <Handle 
             type="target" 
             position={Position.Left} 
             className="w-2 h-2 !bg-transparent !border-none" 
             style={{ left: -2 }}
           />
        )}
        
        {/* Ground typically connects from top, but for left-to-right flow we usually keep input left. 
            Adjust based on your preference. Keeping source right for consistency. */}
        <Handle 
           type="source" 
           position={Position.Right} 
           className="w-2 h-2 !bg-transparent !border-none" 
           style={{ right: -2 }}
        />
      </div>

      {/* Tiny Label Below (e.g., "R1") so user knows what they selected */}
      <div className="absolute -bottom-4 left-0 right-0 text-center">
        <span className="text-[10px] font-medium text-slate-500 select-none">
            {data.label ? data.label.split(' ')[0] : ''}
        </span>
      </div>
    </div>
  );
};

const MemoizedNode = memo(CircuitNode);

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
