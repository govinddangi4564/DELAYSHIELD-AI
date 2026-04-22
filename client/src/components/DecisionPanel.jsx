import React from 'react';
import { BrainCircuit, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const DecisionPanel = ({ insights, onExecute }) => {
  const [executing, setExecuting] = React.useState(false);
  const [executed, setExecuted] = React.useState(false);

  if (!insights) {
    return (
      <div className="glass-panel p-6 h-full flex flex-col border-2 border-blue-100 opacity-60">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-200 rounded-lg text-slate-400">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-300">AI Intelligence</h2>
            <p className="text-sm text-slate-300">Analyzing route data...</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl p-8">
           <div className="animate-pulse bg-slate-100 h-4 w-3/4 rounded-full mb-3" />
           <div className="animate-pulse bg-slate-100 h-4 w-1/2 rounded-full mb-3" />
           <div className="animate-pulse bg-slate-100 h-10 w-full rounded-xl mt-4" />
        </div>
      </div>
    );
  }

  const handleExecute = (type) => {
    setExecuting(true);
    // Simulate API transmission
    setTimeout(() => {
      setExecuting(false);
      setExecuted(true);
      if (onExecute) onExecute(type);
      setTimeout(() => setExecuted(false), 3000);
    }, 1200);
  };

  return (
    <div className="glass-panel p-6 h-full flex flex-col border-2 border-blue-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-blue-100">
        <div className="p-2 bg-blue-600 rounded-lg text-white shadow-sm shadow-blue-300">
          <BrainCircuit size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-blue-950">Gemini AI Intelligence</h2>
          <p className="text-sm text-blue-500 font-semibold">Strategic Decision Engine</p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 rounded-xl p-4 mb-6 border-l-4 border-blue-500">
        <p className="text-sm text-blue-900 italic font-medium mb-2">"{insights.summary}"</p>
        <p className="text-xs text-blue-600 flex items-center gap-2 font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
          {insights.dominantFactor}
        </p>
      </div>

      <h3 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-4">
        ⚡ Recommended Actions
      </h3>

      <div className="space-y-4 flex-1">
        {insights.actions.map((action, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              action.recommended
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-300'
                : 'bg-white border-blue-200 hover:border-blue-400'
            }`}
          >
            <div className="flex justify-between items-start mb-2 gap-2">
              <div className="flex items-center gap-2 break-words">
                {action.recommended ? (
                  <CheckCircle2 size={18} className="text-white shrink-0" />
                ) : (
                  <XCircle size={18} className="text-blue-400 shrink-0" />
                )}
                <span className={`font-black text-sm ${action.recommended ? 'text-white' : 'text-blue-900'}`}>
                  {action.type}
                </span>
              </div>
              <span className={`text-xs font-black px-2 py-1 rounded-lg whitespace-nowrap shrink-0 ${
                action.costImpact?.includes('+')
                  ? action.recommended ? 'bg-red-400/30 text-red-100' : 'bg-red-100 text-red-700'
                  : action.recommended ? 'bg-emerald-400/30 text-emerald-100' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {action.costImpact || 'TBD'}
              </span>
            </div>

            <p className={`text-sm font-medium mb-1 ${action.recommended ? 'text-blue-100' : 'text-blue-900'}`}>
              {action.description}
            </p>
            <p className={`text-xs pb-3 mb-3 border-b ${
              action.recommended ? 'text-blue-200 border-blue-500' : 'text-blue-500 border-blue-100'
            }`}>
              Trade-off: {action.tradeOff}
            </p>

            {action.recommended && (
              <button 
                onClick={() => handleExecute(action.type)}
                disabled={executing || executed}
                className={`w-full font-black text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow active:scale-95 ${
                  executed 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-white hover:bg-blue-50 text-blue-700'
                }`}
              >
                {executing ? (
                   <>
                    <span className="w-4 h-4 border-2 border-blue-600 border-b-transparent rounded-full animate-spin" />
                    Transmitting...
                  </>
                ) : executed ? (
                  <>
                    <CheckCircle2 size={16} /> Plan Activated
                  </>
                ) : (
                  <>
                    Execute Action <ArrowRight size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DecisionPanel;
