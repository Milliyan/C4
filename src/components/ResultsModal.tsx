import { X, Copy, Check } from 'lucide-react';
import { SolverResult } from '@/lib/solver';
import { useState } from 'react';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: SolverResult | null;
}

export const ResultsModal = ({ isOpen, onClose, results }: ResultsModalProps) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !results) return null;

  // Helper: Convert Complex Number (Real, Imaginary) to Polar Form
  const toPolar = (real: number, imag: number, unit: string) => {
    // Calculate Magnitude: sqrt(a^2 + b^2)
    const magnitude = Math.sqrt(real * real + imag * imag);
    
    // Calculate Angle in Degrees: atan2(b, a) * (180/pi)
    const angleRad = Math.atan2(imag, real);
    const angleDeg = angleRad * (180 / Math.PI);

    return (
      <span className="font-mono">
        {magnitude.toFixed(3)} {unit} <span className="text-blue-600 font-bold">∠ {angleDeg.toFixed(2)}°</span>
      </span>
    );
  };

  const handleCopy = () => {
    if (!results) return;
    const text = JSON.stringify(results, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Analysis Results</h2>
            <p className="text-sm text-slate-500 mt-1">Steady-state AC analysis (Phasor Domain)</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-0 overflow-y-auto flex-1">
          {Object.keys(results).length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No results to display. Check your circuit connections.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Node / Component</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Result (Polar Form)</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 hidden sm:table-cell">Rectangular (Complex)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(results).map(([id, val]) => (
                  <tr key={id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-700">{id}</td>
                    
                    {/* Polar Output */}
                    <td className="p-4 text-sm text-slate-800">
                        {toPolar(val.real, val.imag, id.includes('I') ? 'A' : 'V')}
                    </td>

                    {/* Rectangular Output (Hidden on small screens) */}
                    <td className="p-4 text-xs text-slate-400 font-mono hidden sm:table-cell">
                      {val.real.toFixed(3)} {val.imag >= 0 ? '+' : '-'} j{Math.abs(val.imag).toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3">
            <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg transition-all"
            >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            {copied ? 'Copied JSON' : 'Copy Raw Data'}
            </button>
            <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors"
            >
            Done
            </button>
        </div>
      </div>
    </div>
  );
};
