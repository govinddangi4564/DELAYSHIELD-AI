import React from 'react';
import { DollarSign, TrendingDown, AlertTriangle } from 'lucide-react';

const CostAnalysis = ({ currentCost, potentialLoss, lossImpact }) => {
  const fuelLoss = lossImpact?.fuelLoss || 0;
  const penaltyRisk = lossImpact?.penaltyRisk || 0;
  const totalLoss = lossImpact?.totalLoss || potentialLoss || 0;

  return (
    <div className="glass-panel p-6 border-2 border-blue-200 h-full flex flex-col">
      {/* Title */}
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-blue-600 rounded-lg text-white shadow-sm shadow-blue-300">
          <DollarSign size={20} />
        </div>
        <h2 className="text-xl font-black text-blue-950">Cost Impact</h2>
      </div>

      <div className="space-y-4 mb-4">
        {/* Base cost */}
        <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Base Cost</p>
            <p className="text-sm font-bold text-blue-400 italic">Operational fuel & driver</p>
          </div>
          <p className="text-xl font-black text-blue-950">₹{currentCost.toLocaleString()}</p>
        </div>

        {/* Detailed Loss Breakdown */}
        <div className="p-4 bg-red-50 rounded-xl border-2 border-red-200">
          <div className="flex items-center justify-between mb-3">
             <p className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1">
              <AlertTriangle size={12} /> Real-time Loss
            </p>
            <span className="text-xs font-black text-red-600">+₹{totalLoss.toLocaleString()}</span>
          </div>
          
          <div className="space-y-2 border-t border-red-100 pt-2">
            <div className="flex justify-between text-[11px] font-bold text-red-800/70">
              <span>Fuel Waste (Idling)</span>
              <span>₹{fuelLoss.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-red-800/70">
              <span>SLA Penalty Risk</span>
              <span>₹{penaltyRisk.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="pt-4 mt-auto border-t-2 border-blue-100 flex justify-between items-center bg-blue-950 rounded-xl px-4 py-3 shadow-md shadow-blue-300">
        <span className="text-sm font-bold text-blue-200 flex items-center gap-1">
          <TrendingDown size={16} /> Projected Total
        </span>
        <span className="text-xl font-black text-emerald-400">₹{(currentCost + totalLoss).toLocaleString()}</span>
      </div>
    </div>
  );
};

export default CostAnalysis;
