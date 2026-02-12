import { SolverResult } from '@/lib/solver';
import { X } from 'lucide-react';
import { AnalysisResults } from './AnalysisResults';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: SolverResult | null;
}

export const ResultsModal = ({ isOpen, onClose, results }: ResultsModalProps) => {
  if (!isOpen || !results) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Analysis Results</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <AnalysisResults steps={results.steps} />
        </div>

        <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
