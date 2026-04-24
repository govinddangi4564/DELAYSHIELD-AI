import React from 'react';
import { 
  Plane, 
  Ship, 
  Truck, 
  Clock, 
  DollarSign, 
  Zap, 
  AlertTriangle, 
  Leaf, 
  CheckCircle2, 
  TrendingUp,
  ShieldCheck,
  Info,
  ChevronRight
} from 'lucide-react';

const ModeComparison = ({ data }) => {
  if (!data) return null;

  const { air, ocean, road, recommendation } = data;
  const modes = [air, ocean, road].filter(m => m.available);

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'medium': return 'text-amber-500 bg-amber-50 border-amber-100';
      case 'high': return 'text-orange-500 bg-orange-50 border-orange-100';
      case 'critical': return 'text-red-500 bg-red-50 border-red-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  const getBadgeColor = (badge) => {
    switch (badge?.toLowerCase()) {
      case 'fastest': return 'bg-blue-600 text-white';
      case 'cheapest': return 'bg-emerald-600 text-white';
      case 'most reliable': return 'bg-indigo-600 text-white';
      case 'eco friendly': return 'bg-teal-600 text-white';
      default: return 'bg-slate-600 text-white';
    }
  };

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
          <TrendingUp size={20} />
        </div>
        <div>
          <h2 className="text-xl font-black text-blue-950 tracking-tight">Shipment Mode Comparison</h2>
          <p className="text-xs font-bold text-blue-500/80 uppercase tracking-widest mt-0.5">Multi-Modal Logistics Intelligence</p>
        </div>
      </div>

      {/* Mode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {modes.map((m) => (
          <div key={m.mode} className="glass-panel p-6 border-2 border-transparent hover:border-blue-200/60 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-6">
              <div className={`text-4xl p-3 rounded-2xl bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-300`}>
                {m.icon}
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${getBadgeColor(m.bestForBadge)}`}>
                {m.bestForBadge}
              </span>
            </div>

            <h3 className="text-2xl font-black text-blue-950 mb-1">{m.mode} Freight</h3>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-6">{m.recommendedFor}</p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock size={16} />
                  <span className="text-xs font-bold uppercase tracking-tight">Transit Time</span>
                </div>
                <span className="text-sm font-black text-blue-900">{m.transitTime}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <DollarSign size={16} />
                  <span className="text-xs font-bold uppercase tracking-tight">Total Cost</span>
                </div>
                <span className="text-sm font-black text-blue-900">${m.totalCost.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <Leaf size={16} />
                  <span className="text-xs font-bold uppercase tracking-tight">CO2 Footprint</span>
                </div>
                <span className="text-sm font-black text-emerald-600">{m.co2Emissions} kg</span>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reliability</span>
                  <span className="text-xs font-black text-blue-600">{m.reliabilityScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${m.reliabilityScore}%` }}
                  />
                </div>
              </div>

              <div className="pt-1">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">On-Time Probability</span>
                  <span className="text-xs font-black text-emerald-600">{m.onTimePercent}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${m.onTimePercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between mb-6 ${getRiskColor(m.riskLevel)}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Mode Risk</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{m.riskLevel} ({m.riskScore})</span>
            </div>

            <div className="space-y-3">
              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Advantages
                </h4>
                <ul className="space-y-1">
                  {m.pros.map((p, i) => (
                    <li key={i} className="text-[11px] font-bold text-emerald-800 flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
                <h4 className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> Disadvantages
                </h4>
                <ul className="space-y-1">
                  {m.cons.map((c, i) => (
                    <li key={i} className="text-[11px] font-bold text-red-800 flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Table */}
      <div className="glass-panel overflow-hidden border-2 border-blue-100/50 mb-8">
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/60 flex items-center gap-2">
          <Info size={16} className="text-blue-500" />
          <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest">Technical Metrics Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/30">Metric</th>
                {modes.map(m => (
                  <th key={m.mode} className="px-6 py-4 text-[11px] font-black text-blue-900 uppercase tracking-widest bg-slate-50/30">
                    <span className="mr-2">{m.icon}</span>{m.mode}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-tight">Transit Time</td>
                {modes.map(m => <td key={m.mode} className="px-6 py-4 font-black text-blue-950">{m.transitTime}</td>)}
              </tr>
              <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-tight">Total Cost</td>
                {modes.map(m => <td key={m.mode} className="px-6 py-4 font-black text-blue-950">${m.totalCost.toLocaleString()}</td>)}
              </tr>
              <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-tight">Risk Score</td>
                {modes.map(m => (
                  <td key={m.mode} className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase ${getRiskColor(m.riskLevel).split(' ').slice(0, 2).join(' ')}`}>
                      {m.riskScore}
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-tight">CO2 Emissions</td>
                {modes.map(m => <td key={m.mode} className="px-6 py-4 font-black text-emerald-600">{m.co2Emissions} kg</td>)}
              </tr>
              <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-tight">Reliability</td>
                {modes.map(m => <td key={m.mode} className="px-6 py-4 font-black text-blue-600">{m.reliabilityScore}%</td>)}
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-tight">On-Time %</td>
                {modes.map(m => <td key={m.mode} className="px-6 py-4 font-black text-emerald-600">{m.onTimePercent}%</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Recommendation Banner */}
      <div className="glass-panel p-8 border-2 border-blue-600/20 bg-gradient-to-br from-blue-600/[0.03] to-indigo-600/[0.03] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
          <Zap size={120} className="text-blue-600" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 text-white">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-blue-950 tracking-tight">AI Strategic Recommendation</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Optimized for Current Conditions</span>
                  </div>
                </div>
              </div>
              <p className="text-blue-900/80 font-semibold leading-relaxed text-sm max-w-2xl mb-6">
                {recommendation.reasoning}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
                  <DollarSign size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cost:</span>
                  <span className="text-xs font-black text-blue-900">{recommendation.bestForCost}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
                  <Zap size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Speed:</span>
                  <span className="text-xs font-black text-blue-900">{recommendation.bestForSpeed}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
                  <Leaf size={14} className="text-teal-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eco:</span>
                  <span className="text-xs font-black text-blue-900">{recommendation.bestForSustainability}</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto">
              <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-2xl shadow-blue-500/40 flex flex-col items-center text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-80">Best Overall Mode</span>
                <div className="text-5xl mb-4 transform group-hover:scale-125 transition-transform duration-500 drop-shadow-lg">
                  {modes.find(m => m.mode === recommendation.bestOverall)?.icon}
                </div>
                <h4 className="text-2xl font-black mb-6">{recommendation.bestOverall} Freight</h4>
                <button className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-lg active:scale-95">
                  Select Mode <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeComparison;
