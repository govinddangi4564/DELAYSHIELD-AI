import React, { useEffect, useMemo, useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Fuel, 
  Gavel, 
  Wallet, 
  ArrowRight, 
  Filter,
  RefreshCw,
  Truck,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Search
} from 'lucide-react';
import { getShipments } from '../services/api';
import LoadingState from '../components/LoadingState';
import { useNavigationLoading } from '../components/NavigationLoadingContext';

const LossImpactPage = () => {
  const { finishNavigation } = useNavigationLoading();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const data = await getShipments();
      setShipments(data);
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  useEffect(() => {
    if (!loading) {
      finishNavigation('/loss-engine');
    }
  }, [loading, finishNavigation]);

  const stats = useMemo(() => {
    const totalLoss = shipments.reduce((sum, s) => sum + (s.lossImpact?.totalLoss || 0), 0);
    const totalFuel = shipments.reduce((sum, s) => sum + (s.lossImpact?.fuelLoss || 0), 0);
    const totalPenalty = shipments.reduce((sum, s) => sum + (s.lossImpact?.penaltyRisk || 0), 0);
    const atRiskCount = shipments.filter(s => s.deliveryStatus !== 'On Time').length;

    return {
      totalLoss,
      totalFuel,
      totalPenalty,
      atRiskCount,
      avgLoss: shipments.length > 0 ? Math.round(totalLoss / shipments.length) : 0
    };
  }, [shipments]);

  const filteredShipments = useMemo(() => {
    return shipments
      .filter(s => {
        if (filter === 'All') return true;
        if (filter === 'Delayed') return s.deliveryStatus === 'Delayed' || s.deliveryStatus === 'Delivered (Delayed)';
        return s.deliveryStatus === filter;
      })
      .filter(s => 
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.origin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.destination.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [shipments, filter, searchTerm]);

  if (loading) {
    return (
      <LoadingState 
        fullScreen 
        title="Synchronizing Loss Impact Engine" 
        subtitle="Calibrating fuel burn rates and penalty algorithms for real-time financial tracking."
        steps={['Fetching live fleet telemetry', 'Calculating variable delay costs', 'Generating impact report']}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-8 pb-24">
      {/* Header Section */}
      <header className="mb-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
              <BarChart3 size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Loss Impact Engine</h1>
          </div>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] ml-12">
            Real-time Financial Leakage Tracking & Prediction
          </p>
        </div>

        <button 
          onClick={fetchShipments}
          className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black uppercase tracking-widest text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> 
          Sync Engine
        </button>
      </header>

      {/* Global Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <div className="glass-panel p-6 border-l-8 border-l-red-500 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <TrendingUp size={80} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Estimated Loss</p>
          <h3 className="text-3xl font-black text-slate-900 mb-2">₹{stats.totalLoss.toLocaleString()}</h3>
          <div className="flex items-center gap-2 text-xs font-bold text-red-500">
            <AlertTriangle size={14} /> Critical Leakage Detected
          </div>
        </div>

        <div className="glass-panel p-6 border-l-8 border-l-amber-500 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Fuel size={80} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Fuel Waste</p>
          <h3 className="text-3xl font-black text-slate-900 mb-2">₹{stats.totalFuel.toLocaleString()}</h3>
          <p className="text-xs font-bold text-amber-600">Based on idling & congestion</p>
        </div>

        <div className="glass-panel p-6 border-l-8 border-l-indigo-500 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Gavel size={80} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Penalty Risk</p>
          <h3 className="text-3xl font-black text-slate-900 mb-2">₹{stats.totalPenalty.toLocaleString()}</h3>
          <p className="text-xs font-bold text-indigo-600">Active SLA Breach Exposure</p>
        </div>

        <div className="glass-panel p-6 border-l-8 border-l-slate-800 relative overflow-hidden group bg-slate-900">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Impact Per Shipment</p>
          <h3 className="text-3xl font-black text-white mb-2">₹{stats.avgLoss.toLocaleString()}</h3>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <CheckCircle2 size={14} /> Optimized Target: ₹2,500
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setFilter('All')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'All' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            All Fleet
          </button>
          <button 
            onClick={() => setFilter('Delayed')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'Delayed' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Delayed
          </button>
          <button 
            onClick={() => setFilter('At Risk')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'At Risk' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            At Risk
          </button>
          <button 
            onClick={() => setFilter('On Time')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'On Time' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            On Time
          </button>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Shipment ID or Route..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-700 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Shipment Loss Table */}
      <div className="glass-panel overflow-hidden border border-slate-200 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Shipment / Status</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Route Analysis</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Delay Time</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Loss Breakdown</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Total Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShipments.map((shipment) => {
                const loss = shipment.lossImpact || { fuelLoss: 0, penaltyRisk: 0, totalLoss: 0 };
                const isHigh = loss.totalLoss > 15000;
                const isMed = loss.totalLoss > 5000;
                
                return (
                  <tr key={shipment.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{shipment.id}</span>
                        <div className="flex items-center gap-1.5">
                          <div className={`h-1.5 w-1.5 rounded-full ${
                            shipment.deliveryStatus === 'On Time' ? 'bg-emerald-500' : 
                            shipment.deliveryStatus === 'Delayed' ? 'bg-amber-500' : 'bg-red-500'
                          }`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${
                            shipment.deliveryStatus === 'On Time' ? 'text-emerald-600' : 
                            shipment.deliveryStatus === 'Delayed' ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {shipment.deliveryStatus}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <span className="truncate max-w-[120px]">{shipment.origin.name}</span>
                          <ArrowRight size={12} className="text-slate-300" />
                          <span className="truncate max-w-[120px]">{shipment.destination.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          Priority: <span className={shipment.priority === 'Critical' ? 'text-red-500' : 'text-slate-600'}>{shipment.priority}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className={shipment.riskFactors?.delay > 30 ? 'text-red-500' : 'text-slate-400'} />
                        <span className={`text-sm font-black ${shipment.riskFactors?.delay > 30 ? 'text-red-600' : 'text-slate-700'}`}>
                          {shipment.riskFactors?.delay || 0}m
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                          <Fuel size={12} className="text-amber-500" />
                          <span>Fuel: ₹{loss.fuelLoss.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                          <Gavel size={12} className="text-indigo-500" />
                          <span>Penalty: ₹{loss.penaltyRisk.toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-lg font-black ${
                          isHigh ? 'text-red-600' : isMed ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          ₹{loss.totalLoss.toLocaleString()}
                        </span>
                        <div className="mt-1 h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              isHigh ? 'bg-red-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, (loss.totalLoss / 30000) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredShipments.length === 0 && (
          <div className="p-20 text-center">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Truck size={40} className="text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No Leakage Found</h3>
            <p className="text-slate-500 font-medium">There are no active shipments matching the current filter critera.</p>
          </div>
        )}
      </div>

      {/* Predictive Logic Card */}
      <div className="mt-10 p-8 rounded-[2rem] bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 mb-4">
              <AlertCircle size={20} />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Engine Logic v2.4</span>
            </div>
            <h2 className="text-3xl font-black mb-4">How Loss is Calculated</h2>
            <p className="text-slate-400 font-medium leading-relaxed mb-6">
              Our AI engine cross-references live delay telemetry with industrial fuel burn rates and SLA penalty structures to calculate immediate financial leakage.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-[9px] font-black uppercase text-slate-500 mb-1">Fuel Variable</p>
                <p className="text-sm font-black">₹25 / min delay</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-[9px] font-black uppercase text-slate-500 mb-1">Penalty Trigger</p>
                <p className="text-sm font-black">₹8,000 / hour (&gt;30m)</p>
              </div>
            </div>
          </div>
          <div className="hidden lg:block h-48 bg-white/5 rounded-[2rem] border border-white/10 p-6">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Fleet Efficiency Trend</span>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-black">
                <TrendingUp size={14} /> -12.4% Leakage
              </div>
            </div>
            <div className="flex items-end gap-3 h-20">
              {[40, 70, 45, 90, 65, 80, 55, 95, 40, 60, 85].map((h, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-indigo-500/30 rounded-t-sm hover:bg-indigo-400 transition-colors" 
                  style={{ height: `${h}%` }} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LossImpactPage;
