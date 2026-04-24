import React from 'react';
import { History, ArrowRight, RotateCcw, Pause, Eye, TrendingUp, Clock3, RefreshCw } from 'lucide-react';

const HistoryPanel = ({ historyData, loading = false }) => {
  const decisionConfig = {
    Reroute: { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: <RotateCcw size={12} /> },
    Delay: { color: 'bg-amber-100 text-amber-700 border-amber-300', icon: <Pause size={12} /> },
    Monitor: { color: 'bg-purple-100 text-purple-700 border-purple-300', icon: <Eye size={12} /> },
    Continue: { color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: <TrendingUp size={12} /> },
  };

  const riskColors = {
    High: 'text-red-600 bg-red-50 border-red-200',
    Medium: 'text-amber-600 bg-amber-50 border-amber-200',
    Low: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  };

  const formatTimestamp = (ts) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  if (!historyData || historyData.length === 0) {
    return (
      <div className="glass-panel p-8 border-2 border-blue-200 text-center">
        <History size={32} className="text-blue-300 mx-auto mb-3" />
        <p className="text-blue-400 font-bold text-sm">No route decisions yet.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel border-2 border-blue-200 overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 flex items-center gap-3">
        <History size={20} className="text-white" />
        <div>
          <h2 className="text-base font-black text-white tracking-tight">Decision History</h2>
          <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">
            {historyData.length} past decisions logged
          </p>
        </div>
        {loading && (
          <div className="ml-auto inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-100">
            <RefreshCw size={12} className="animate-spin" />
            Syncing
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-gradient-to-b from-blue-50/70 to-white">
        {historyData.map((entry, index) => {
          const dc = decisionConfig[entry.decision] || decisionConfig.Continue;
          const rc = riskColors[entry.riskLevel] || riskColors.Low;
          const costImpact = entry.costImpact || 'TBD';
          const costColor = costImpact.startsWith('+')
            ? 'text-red-600 bg-red-50 border-red-200'
            : costImpact.startsWith('-')
              ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
              : 'text-blue-600 bg-blue-50 border-blue-200';

          return (
            <div
              key={index}
              className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm shadow-blue-100/40"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-950">
                    {entry.id}
                  </div>
                  <div className="mt-2 flex items-start gap-2 text-sm text-blue-900">
                    <ArrowRight size={14} className="mt-0.5 shrink-0 text-blue-400" />
                    <span className="font-semibold leading-relaxed break-words">{entry.route}</span>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full border whitespace-nowrap ${dc.color}`}>
                  {dc.icon} {entry.decision}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg border ${rc}`}>
                  Risk: {entry.riskLevel}
                </span>
                <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg border ${costColor}`}>
                  Cost: {costImpact}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-blue-500 font-medium">
                <Clock3 size={12} className="shrink-0" />
                <span>{formatTimestamp(entry.timestamp)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryPanel;
