import { Node } from 'reactflow';
import { CircuitNodeData } from '@/types';
import { Trash2 } from 'lucide-react';

interface PropertiesPanelProps {
  selectedNode: Node<CircuitNodeData> | null;
  onUpdateNode: (id: string, data: Partial<CircuitNodeData>) => void;
  onDeleteNode: (id: string) => void;
  globalFrequency: number;
  setGlobalFrequency: (f: number) => void;
}

export const PropertiesPanel = ({ 
  selectedNode, 
  onUpdateNode,
  onDeleteNode,
  globalFrequency,
  setGlobalFrequency
}: PropertiesPanelProps) => {
  if (!selectedNode) {
    return (
      <div className="w-72 bg-white border-l border-slate-200 shadow-sm p-4 h-full z-10">
        <h2 className="font-semibold text-slate-800 mb-4">Properties</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Global Frequency (Hz)</label>
            <input
              type="number"
              value={globalFrequency}
              onChange={(e) => setGlobalFrequency(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-sm text-slate-400 italic mt-8 text-center">
            Select a component to edit its properties.
          </p>
        </div>
      </div>
    );
  }

  const { data, id } = selectedNode;

  const handleChange = (field: keyof CircuitNodeData, value: string | number) => {
    onUpdateNode(id, { [field]: value });
  };

  return (
    <div className="w-72 bg-white border-l border-slate-200 shadow-sm p-4 h-full flex flex-col z-10">
      <h2 className="font-semibold text-slate-800 mb-1">Properties</h2>
      <p className="text-xs text-slate-500 mb-6">ID: {id}</p>

      <div className="space-y-4 flex-1">
        {/* Common: Label */}
        {/* <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Label</label>
          <input
            type="text"
            value={data.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div> */}

        {/* Value Input */}
        {data.type !== 'ground' && (
            <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
                {data.type === 'resistor' ? 'Resistance (Ω)' :
                 data.type === 'capacitor' ? 'Capacitance (F)' :
                 data.type === 'inductor' ? 'Inductance (H)' :
                 data.type === 'voltage_source' ? 'Voltage (V)' :
                 data.type === 'current_source' ? 'Current (A)' : 'Value'}
            </label>
            <input
                type="number"
                value={data.value}
                onChange={(e) => handleChange('value', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            </div>
        )}

        {/* Phase Input for Sources */}
        {(data.type === 'voltage_source' || data.type === 'current_source') && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Phase Angle (°)</label>
            <input
              type="number"
              value={data.phase || 0}
              onChange={(e) => handleChange('phase', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>
      
      <div className="pt-4 border-t border-slate-100">
        <label className="block text-xs font-medium text-slate-500 mb-1">Global Frequency (Hz)</label>
        <input
            type="number"
            value={globalFrequency}
            onChange={(e) => setGlobalFrequency(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {selectedNode && (
        <div className="pt-4 mt-auto">
          <button
            onClick={() => onDeleteNode(selectedNode.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            <Trash2 size={16} />
            Delete Component
          </button>
        </div>
      )}
    </div>
  );
};
