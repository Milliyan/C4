import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CircuitNodeData } from '@/types';
import { cn } from '@/utils/cn';

// Wrapper for common node behavior (handles, hover effects)
const BaseNode = ({ 
  children, 
  selected 
}: { 
  children: React.ReactNode; 
  selected?: boolean;
}) => {
  return (
    <div className={cn(
      "relative group flex items-center justify-center bg-white",
      "w-[80px] h-[60px]", // Slightly larger to accommodate handles comfortably
      selected ? "ring-2 ring-blue-500 rounded-sm" : ""
    )}>
      {/* Handles - Invisible by default, visible on group hover */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="w-3 h-3 !bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ top: -4 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-3 h-3 !bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ right: -4 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 !bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ bottom: -4 }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="w-3 h-3 !bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ left: -4 }}
      />
      
      {/* Component SVG */}
      <div className="w-full h-full flex items-center justify-center p-1">
        {children}
      </div>
    </div>
  );
};

// --- Component Implementations ---

export const ResistorNode = memo(({ data, selected }: NodeProps<CircuitNodeData>) => {
  return (
    <BaseNode selected={selected}>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 60 30" className="w-[50px] h-[25px] stroke-slate-900 stroke-2 fill-none">
          <path d="M0 15 L10 15 L15 5 L25 25 L35 5 L45 25 L50 15 L60 15" />
        </svg>
        <span className="text-[10px] font-medium text-slate-600 mt-1">
          {data.value}Ω
        </span>
      </div>
    </BaseNode>
  );
});

export const CapacitorNode = memo(({ data, selected }: NodeProps<CircuitNodeData>) => {
  return (
    <BaseNode selected={selected}>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 60 30" className="w-[50px] h-[25px] stroke-slate-900 stroke-2 fill-none">
          <path d="M0 15 L25 15 M25 5 L25 25 M35 5 L35 25 M35 15 L60 15" />
        </svg>
        <span className="text-[10px] font-medium text-slate-600 mt-1">
          {data.value}F
        </span>
      </div>
    </BaseNode>
  );
});

export const InductorNode = memo(({ data, selected }: NodeProps<CircuitNodeData>) => {
  return (
    <BaseNode selected={selected}>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 60 30" className="w-[50px] h-[25px] stroke-slate-900 stroke-2 fill-none">
          <path d="M0 15 L10 15 Q15 5 20 15 Q25 5 30 15 Q35 5 40 15 Q45 5 50 15 L60 15" />
        </svg>
        <span className="text-[10px] font-medium text-slate-600 mt-1">
          {data.value}H
        </span>
      </div>
    </BaseNode>
  );
});

export const VoltageSourceNode = memo(({ data, selected }: NodeProps<CircuitNodeData>) => {
  return (
    <BaseNode selected={selected}>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 60 40" className="w-[50px] h-[34px] stroke-slate-900 stroke-2 fill-none">
          <circle cx="30" cy="20" r="15" />
          <path d="M30 5 L30 0 M30 35 L30 40 M0 20 L15 20 M45 20 L60 20" className="stroke-transparent" /> {/* Invisible lines to maintain box size feeling if needed, but here we just need the circle and signs/wave */}
          <path d="M22 20 Q26 12 30 20 T38 20" strokeWidth="1.5" />
          <text x="18" y="14" fontSize="10" stroke="none" fill="black">+</text>
          <text x="18" y="32" fontSize="10" stroke="none" fill="black">-</text>
        </svg>
        <span className="text-[10px] font-medium text-slate-600 mt-1">
          {data.value}V ∠{data.phase}°
        </span>
      </div>
    </BaseNode>
  );
});

export const CurrentSourceNode = memo(({ data, selected }: NodeProps<CircuitNodeData>) => {
  return (
    <BaseNode selected={selected}>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 60 40" className="w-[50px] h-[34px] stroke-slate-900 stroke-2 fill-none">
          <circle cx="30" cy="20" r="15" />
          <path d="M30 10 L30 30 M25 18 L30 10 L35 18" />
        </svg>
        <span className="text-[10px] font-medium text-slate-600 mt-1">
          {data.value}A ∠{data.phase}°
        </span>
      </div>
    </BaseNode>
  );
});

export const GroundNode = memo(({ selected }: NodeProps) => {
  return (
    <BaseNode selected={selected}>
      <div className="flex flex-col items-center justify-center h-full">
        <svg viewBox="0 0 40 40" className="w-[30px] h-[30px] stroke-slate-900 stroke-2 fill-none">
          <path d="M20 0 L20 15" />
          <path d="M5 15 L35 15" />
          <path d="M10 22 L30 22" />
          <path d="M15 29 L25 29" />
        </svg>
      </div>
    </BaseNode>
  );
});

export const OpAmpNode = memo(({ selected }: NodeProps) => {
    return (
        <BaseNode selected={selected}>
            <div className="flex flex-col items-center">
                <svg viewBox="0 0 60 50" className="w-[50px] h-[40px] stroke-slate-900 stroke-2 fill-none">
                    <path d="M10 10 L10 40 L50 25 Z" />
                    <path d="M0 15 L10 15" />
                    <path d="M0 35 L10 35" />
                    <path d="M50 25 L60 25" />
                    <text x="12" y="19" fontSize="10" stroke="none" fill="black">-</text>
                    <text x="12" y="39" fontSize="10" stroke="none" fill="black">+</text>
                </svg>
            </div>
        </BaseNode>
    );
});

export const JunctionNode = memo(({ selected }: NodeProps) => {
  return (
    <div className={cn(
      "relative group flex items-center justify-center",
      "w-[20px] h-[20px]", 
      selected ? "ring-2 ring-blue-500 rounded-full" : ""
    )}>
      {/* Handles - Visible on hover, connected to center */}
      <Handle type="source" position={Position.Top} id="top" className="w-2 h-2 !bg-blue-500 opacity-0 group-hover:opacity-100" style={{ top: -2 }} />
      <Handle type="source" position={Position.Right} id="right" className="w-2 h-2 !bg-blue-500 opacity-0 group-hover:opacity-100" style={{ right: -2 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" className="w-2 h-2 !bg-blue-500 opacity-0 group-hover:opacity-100" style={{ bottom: -2 }} />
      <Handle type="source" position={Position.Left} id="left" className="w-2 h-2 !bg-blue-500 opacity-0 group-hover:opacity-100" style={{ left: -2 }} />
      
      {/* Visual Dot */}
      <div className="w-2 h-2 bg-black rounded-full" />
    </div>
  );
});

export const nodeTypes = {
  resistor: ResistorNode,
  capacitor: CapacitorNode,
  inductor: InductorNode,
  voltage_source: VoltageSourceNode,
  current_source: CurrentSourceNode,
  ground: GroundNode,
  op_amp: OpAmpNode,
  junction: JunctionNode
};
