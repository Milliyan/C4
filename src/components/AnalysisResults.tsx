import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { SolverStep } from '@/lib/solver';

// Internal helper for rendering a single latex string
const LatexBlock = ({ latex }: { latex: string }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containerRef.current) {
        // Remove $$ wrappers if present (just in case logic elsewhere adds them),
        // but the prompt asked to add them. Since we use katex.render directly,
        // we pass the raw math content.
        // If the string comes in as "$$ ... $$", strip it.
        const cleanLatex = latex.trim().replace(/^\$\$|\$\$S/g, ''); 
        
        try {
            katex.render(cleanLatex, containerRef.current, {
                throwOnError: false,
                displayMode: true
            });
        } catch (err) {
            console.warn("KaTeX Error:", err);
            containerRef.current.innerText = latex;
        }
    }
  }, [latex]);

  return <div ref={containerRef} className="overflow-x-auto my-2 py-1" />;
};

interface AnalysisResultsProps {
    steps: SolverStep[];
}

export const AnalysisResults = ({ steps }: AnalysisResultsProps) => {
    if (!steps || steps.length === 0) {
        return <div className="p-4 text-center text-slate-500 italic">No analysis steps available.</div>;
    }

    return (
        <div className="space-y-6">
            {steps.map((step, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-slate-200">
                        <h3 className="font-semibold text-blue-800 text-lg">{step.title}</h3>
                        {step.description && (
                            <p className="text-slate-600 text-sm mt-1 whitespace-pre-line">{step.description}</p>
                        )}
                    </div>
                    <div className="p-4 bg-white">
                        {step.latex_lines && step.latex_lines.length > 0 ? (
                            <div className="space-y-1">
                                {step.latex_lines.map((line, lIdx) => (
                                    // The prompt says "Crucial: Wrap each line in $$ delimiters".
                                    // Since I am manually rendering, I will respect the intent (Block Mode).
                                    // But I won't literally add $$ to the string passed to katex.render 
                                    // unless I was using a parser that needed it.
                                    <LatexBlock key={lIdx} latex={line} />
                                ))}
                            </div>
                        ) : step.latex ? (
                            <div className="space-y-1">
                                {step.latex.split('<br/>').map((line, lIdx) => (
                                    <LatexBlock key={lIdx} latex={line} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-slate-400 italic text-sm">No details provided.</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
