import { CircuitNodeData } from '@/types';
import { X, Settings, RotateCw, Trash2 } from 'lucide-react';

interface PropertiesPanelProps {
  selectedNode: { id: string; data: CircuitNodeData } | null;
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
  setGlobalFrequency,
}: PropertiesPanelProps) => {
  if (!selectedNode) {
    return (
      <div className="w-80 bg-white border-l border-slate-200 p-6 flex flex-col gap-6 shadow-sm z-10 h-full overflow-y-auto">
        <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-4">
          <Settings size={20} />
          <h2 className="font-semibold">Global Settings</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              System Frequency (Hz)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={globalFrequency}
                onChange={(e) => setGlobalFrequency(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
              />
              <span className="absolute right-3 top-2 text-slate-400 text-sm">Hz</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              This frequency applies to all Capacitors and Inductors.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { data } = selectedNode;
  const isSource = data.type === 'voltage_source' || data.type === 'current_source';

  const handleChange = (field: keyof CircuitNodeData, value: string | number) => {
    onUpdateNode(selectedNode.id, { [field]: value });
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 p-6 flex flex-col h-full shadow-sm z-10 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2 capitalize">
          {data.label || 'Component'}
        </h2>
        <button 
          onClick={() => onDeleteNode(selectedNode.id)}
          className="text-slate-400 hover:text-red-500 transition-colors p-1"
          title="Delete Component"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="space-y-6 flex-1">
        {/* Label Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
          <input
            type="text"
            value={data.label}
            onChange={(e) => handleChange('label', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Magnitude / Main Value Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {isSource ? 'Magnitude (RMS)' : 'Value'}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={data.value}
              onChange={(e) => handleChange('value', Number(e.target.value))}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {/* Unit Display */}
            <div className="w-16 flex items-center justify-center bg-slate-100 border border-slate-200 rounded-md text-sm font-medium text-slate-600">
                {data.type === 'resistor' ? 'Ω' :
                 data.type === 'capacitor' ? 'µF' :
                 data.type === 'inductor' ? 'mH' :
                 data.type === 'voltage_source' ? 'V' :
                 data.type === 'current_source' ? 'A' : ''}
            </div>
          </div>
        </div>

        {/* NEW: Phase Angle Input (Only shows for Sources) */}
        {isSource && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <label className="block text-sm font-medium text-blue-800 mb-1 flex items-center gap-2">
                    <RotateCw size={14} />
                    Phase Angle (θ)
                </label>
                <div className="relative">
                    <input
                        type="number"
                        value={data.phase || 0}
                        onChange={(e) => handleChange('phase', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-blue-900"
                    />
                    <span className="absolute right-3 top-2 text-blue-400 font-bold">°</span>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                    Enter the phase shift in degrees (e.g. 0, 90, -120).
                </p>
            </div>
        )}
      </div>

      <div className="pt-6 border-t border-slate-100 mt-auto">
        <p className="text-xs text-slate-400 text-center">
          ID: <span className="font-mono">{selectedNode.id}</span>
        </p>
      </div>
    </div>
  );
};
