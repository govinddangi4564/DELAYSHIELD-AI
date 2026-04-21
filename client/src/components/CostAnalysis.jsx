import React from 'react';
import { DollarSign, TrendingDown, AlertTriangle } from 'lucide-react';

const CostAnalysis = ({ currentCost, potentialLoss }) => {
  return (
    <div className="glass-panel p-6 border-2 border-blue-200">
      {/* Title */}
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-blue-600 rounded-lg text-white shadow-sm shadow-blue-300">
          <DollarSign size={20} />
        </div>
        <h2 className="text-xl font-black text-blue-950">Cost Impact</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Base cost */}
        <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200 text-center">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Base Cost</p>
          <p className="text-2xl font-black text-blue-950">${currentCost.toLocaleString()}</p>
        </div>

        {/* Potential loss */}
        <div className="p-4 bg-red-50 rounded-xl border-2 border-red-300 text-center">
          <p className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center justify-center gap-1 mb-1">
            <AlertTriangle size={12} /> Loss
          </p>
          <p className="text-2xl font-black text-red-600">+${potentialLoss.toLocaleString()}</p>
        </div>
      </div>

      {/* Total */}
      <div className="pt-4 border-t-2 border-blue-100 flex justify-between items-center bg-blue-600 rounded-xl px-4 py-3 shadow-md shadow-blue-300">
        <span className="text-sm font-bold text-blue-100 flex items-center gap-1">
          <TrendingDown size={16} /> Projected Total
        </span>
        <span className="text-xl font-black text-white">${(currentCost + potentialLoss).toLocaleString()}</span>
      </div>
    </div>
  );
};

export default CostAnalysis;
