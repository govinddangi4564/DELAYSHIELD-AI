import React from 'react';
import { History, ArrowRight, RotateCcw, Pause, Eye, TrendingUp } from 'lucide-react';

const HistoryPanel = ({ historyData }) => {

  const decisionConfig = {
    Reroute:  { color: 'bg-blue-100 text-blue-700 border-blue-300',    icon: <RotateCcw size={12} /> },
    Delay:    { color: 'bg-amber-100 text-amber-700 border-amber-300', icon: <Pause size={12} /> },
    Monitor:  { color: 'bg-purple-100 text-purple-700 border-purple-300', icon: <Eye size={12} /> },
    Continue: { color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: <TrendingUp size={12} /> },
  };

  const riskColors = {
    High:   'text-red-600 bg-red-50 border-red-200',
    Medium: 'text-amber-600 bg-amber-50 border-amber-200',
    Low:    'text-emerald-600 bg-emerald-50 border-emerald-200',
  };

  const formatTimestamp = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
      ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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
    <div className="glass-panel border-2 border-blue-200 overflow-hidden">
      {/* Panel Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 flex items-center gap-3">
        <History size={20} className="text-white" />
        <div>
          <h2 className="text-base font-black text-white tracking-tight">Decision History</h2>
          <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">
            {historyData.length} past decisions logged
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-blue-50 border-b-2 border-blue-200">
              <th className="text-left px-5 py-3 text-[11px] font-black text-blue-900/60 uppercase tracking-widest">Shipment</th>
              <th className="text-left px-5 py-3 text-[11px] font-black text-blue-900/60 uppercase tracking-widest">Route</th>
              <th className="text-left px-5 py-3 text-[11px] font-black text-blue-900/60 uppercase tracking-widest">Decision</th>
              <th className="text-left px-5 py-3 text-[11px] font-black text-blue-900/60 uppercase tracking-widest">Risk</th>
              <th className="text-left px-5 py-3 text-[11px] font-black text-blue-900/60 uppercase tracking-widest">Cost</th>
              <th className="text-left px-5 py-3 text-[11px] font-black text-blue-900/60 uppercase tracking-widest">When</th>
            </tr>
          </thead>
          <tbody>
            {historyData.map((entry, index) => {
              const dc = decisionConfig[entry.decision] || decisionConfig.Continue;
              const rc = riskColors[entry.riskLevel] || riskColors.Low;

              return (
                <tr
                  key={index}
                  className="border-b border-blue-100 hover:bg-blue-50/50 transition-colors"
                >
                  {/* Shipment ID */}
                  <td className="px-5 py-4">
                    <span className="font-black text-blue-950 text-xs bg-blue-100 px-2 py-1 rounded-lg border border-blue-200">
                      {entry.id}
                    </span>
                  </td>

                  {/* Route */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-blue-800 font-medium max-w-[250px]">
                      <ArrowRight size={12} className="text-blue-400 flex-shrink-0" />
                      <span className="truncate">{entry.route}</span>
                    </div>
                  </td>

                  {/* Decision Badge */}
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full border ${dc.color}`}>
                      {dc.icon} {entry.decision}
                    </span>
                  </td>

                  {/* Risk Level */}
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-black px-2 py-1 rounded-lg border ${rc}`}>
                      {entry.riskLevel}
                    </span>
                  </td>

                  {/* Cost Impact */}
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold ${entry.costImpact.startsWith('+') ? 'text-red-600' : entry.costImpact.startsWith('-') ? 'text-emerald-600' : 'text-blue-500'}`}>
                      {entry.costImpact}
                    </span>
                  </td>

                  {/* Timestamp */}
                  <td className="px-5 py-4">
                    <span className="text-[11px] text-blue-500 font-medium">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryPanel;
