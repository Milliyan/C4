import { Play, RotateCcw, RotateCw } from 'lucide-react';
import { AnalysisMethod } from '@/types';

interface TopToolbarProps {
  onAnalyze: () => void;
  method: AnalysisMethod;
  setMethod: (method: AnalysisMethod) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const TopToolbar = ({ 
    onAnalyze, 
    method, 
    setMethod,
    onUndo,
    onRedo,
    canUndo,
    canRedo
}: TopToolbarProps) => {
  return (
    <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-20">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            AC
        </div>
        <h1 className="text-lg font-semibold text-slate-800">Circuit Studio</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-1 gap-1">
            <button
                onClick={onUndo}
                disabled={!canUndo}
                className="p-2 rounded hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600"
                title="Undo"
            >
                <RotateCcw size={18} />
            </button>
            <button
                onClick={onRedo}
                disabled={!canRedo}
                className="p-2 rounded hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600"
                title="Redo"
            >
                <RotateCw size={18} />
            </button>
        </div>

        <div className="h-8 w-[1px] bg-slate-200 mx-2" />

        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as AnalysisMethod)}
          className="h-10 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="nodal">Nodal Analysis</option>
          <option value="mesh">Mesh Analysis</option>
          <option value="superposition">Superposition Theorem</option>
          <option value="source_transformation">Source Transformation</option>
          <option value="thevenin">Thevenin/Norton Equivalent</option>
          <option value="op_amp">Op Amp AC Circuits</option>
          <option value="spice">SPICE-like AC Analysis</option>
        </select>

        <button
          onClick={onAnalyze}
          // CHANGE IS HERE: Added "tour-calculate" to the end of the className
          className="h-10 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm shadow-blue-200 tour-calculate"
        >
          <Play size={16} fill="currentColor" />
          CALCULATE
        </button>
      </div>
    </div>
  );
};