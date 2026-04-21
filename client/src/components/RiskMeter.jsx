import React from 'react';

const RiskMeter = ({ riskScore, factors }) => {
  const getRiskStyle = (score) => {
    switch(score) {
      case 'High':   return { text: 'text-red-600',     ring: 'border-red-400',    bg: 'bg-red-50'     };
      case 'Medium': return { text: 'text-amber-600',   ring: 'border-amber-400',  bg: 'bg-amber-50'   };
      default:       return { text: 'text-emerald-600', ring: 'border-emerald-400', bg: 'bg-emerald-50' };
    }
  };

  const barColors = {
    traffic: 'bg-orange-500',
    weather: 'bg-blue-600',
    delay:   'bg-purple-600',
  };

  const style = getRiskStyle(riskScore);

  return (
    <div className="glass-panel p-4 border-2 border-blue-200">
      {/* Title */}
      <h2 className="text-base font-black text-blue-950 flex items-center gap-2 mb-4">
        <span className="w-1 h-5 bg-blue-600 rounded-full" />
        Risk Analysis
      </h2>

      {/* Risk badge - scaled down */}
      <div className="flex flex-col items-center mb-6">
        <div className={`relative w-24 h-24 flex items-center justify-center rounded-full border-[4px] ${style.ring} ${style.bg} mb-2 shadow-md`}>
          <div className="absolute inset-0 rounded-full animate-pulse-slow opacity-20" />
          <span className={`text-2xl font-black ${style.text}`}>
            {riskScore}
          </span>
        </div>
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Level</p>
      </div>

      {/* Factor bars - tighter */}
      <div className="space-y-3">
        {Object.entries(factors).map(([key, value]) => (
          <div key={key}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-blue-700 font-bold capitalize">{key}</span>
              <span className="text-blue-950 font-black">{value}%</span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full ${barColors[key] || 'bg-blue-500'} transition-all duration-1000`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RiskMeter;
