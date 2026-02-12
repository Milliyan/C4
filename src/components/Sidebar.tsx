import React from 'react';
import { CircuitNodeData } from '@/types';

const COMPONENT_TYPES: { type: CircuitNodeData['type']; label: string; icon: string }[] = [
  { type: 'resistor', label: 'Resistor', icon: 'R' },
  { type: 'capacitor', label: 'Capacitor', icon: 'C' },
  { type: 'inductor', label: 'Inductor', icon: 'L' },
  { type: 'voltage_source', label: 'AC Voltage', icon: 'V' },
  { type: 'current_source', label: 'AC Current', icon: 'I' },
  { type: 'ground', label: 'Ground', icon: 'GND' },
  { type: 'op_amp', label: 'Op-Amp', icon: 'OP' },
  { type: 'junction', label: 'Junction', icon: '•' },
];

export const Sidebar = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    // CHANGE IS HERE: I added "tour-sidebar" to the end of the className string
    <div className="w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col h-full z-10 tour-sidebar">
      <div className="p-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800">Toolbox</h2>
        <p className="text-xs text-slate-500">Drag components to canvas</p>
      </div>
      <div className="p-4 space-y-3 overflow-y-auto flex-1">
        {COMPONENT_TYPES.map((component) => (
          <div
            key={component.type}
            onDragStart={(event) => onDragStart(event, component.type)}
            draggable
            className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-grab hover:bg-slate-100 hover:border-blue-300 hover:shadow-sm transition-all active:cursor-grabbing"
          >
            <div className="w-8 h-8 flex items-center justify-center bg-white rounded border border-slate-200 font-bold text-slate-600 text-sm">
              {component.icon}
            </div>
            <span className="text-sm font-medium text-slate-700">{component.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
