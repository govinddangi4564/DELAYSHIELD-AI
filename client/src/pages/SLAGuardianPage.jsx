import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Shield, AlertTriangle, CheckCircle2, TrendingUp, 
  Clock, ArrowRight, X, Zap, Target, Activity, Loader2
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { useShipments } from '../context/ShipmentContext';

const KPICard = ({ title, value, trend, trendUp, icon: Icon, colorClass, borderClass, bgClass }) => (
  <div className={`bg-white rounded-2xl border border-blue-100 shadow-lg shadow-blue-100/50 p-6 border-l-4 ${borderClass} transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgClass}`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
      <div className={`flex items-center gap-1 text-sm font-bold ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
        {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
        {trend}
      </div>
    </div>
    <div>
      <h3 className="text-3xl font-black text-slate-800 mb-1">{value}</h3>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</p>
    </div>
  </div>
);

const getRiskColor = (level) => {
  if (level === 'Critical') return 'red';
  if (level === 'High') return 'amber';
  return 'emerald';
};

const AIAnalysisModal = ({ isOpen, onClose, analysis, shipment }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" /> AI Deep Analysis
            </h2>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{shipment?.id} • Origin to Destination</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {!analysis ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
              <p className="font-bold">Generating Guardian AI Assessment...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Banner */}
              <div className={`p-4 rounded-xl border ${analysis.slaRisk?.level === 'Critical' ? 'bg-red-50 border-red-200 text-red-900' : analysis.slaRisk?.level === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-lg">{analysis.explanation?.summary || 'SLA Status Analyzed'}</h3>
                    <p className="text-sm opacity-80 mt-1">{analysis.explanation?.explanation}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Risk & Cause */}
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Core Telemetry & Risk</h4>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl border-4 ${analysis.slaRisk?.level === 'Critical' ? 'border-red-500 text-red-600 bg-red-50' : 'border-amber-500 text-amber-600 bg-amber-50'}`}>
                        {analysis.slaRisk?.score || 0}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">Risk Score</div>
                        <div className="text-xs text-slate-500">Breach Probability: {analysis.slaRisk?.breachProbability * 100}%</div>
                        <div className="text-xs font-bold text-blue-600 mt-1">Confidence: {analysis.explanation?.confidence}%</div>
                      </div>
                    </div>
                    
                    <h5 className="text-[10px] font-bold uppercase text-slate-400 mb-2 mt-4">Risk Breakdown</h5>
                    <div className="space-y-2">
                      {analysis.slaRisk?.breakdown && Object.entries(analysis.slaRisk.breakdown).map(([k, v]) => (
                        <div key={k} className="flex justify-between items-center text-xs">
                          <span className="capitalize text-slate-600">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-bold text-slate-800">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Primary Catalyst</h4>
                    <p className="text-sm font-bold text-slate-800 leading-relaxed border-l-4 border-indigo-500 pl-3 py-1">
                      {analysis.recovery?.primaryCause || 'Unknown'}
                    </p>
                    
                    <h5 className="text-[10px] font-bold uppercase text-slate-400 mb-2 mt-4">Key Factors</h5>
                    <div className="flex flex-wrap gap-2">
                      {analysis.explanation?.keyFactors?.map(f => (
                        <span key={f} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md border border-slate-200">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Recovery & Financials */}
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">AI Recovery Blueprint</h4>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowRight className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-blue-900 text-sm">Suggested Route</span>
                      </div>
                      <p className="text-xs font-bold text-blue-700 ml-6">{analysis.recovery?.suggestedRoute || 'Maintain Current Route'}</p>
                    </div>

                    <h5 className="text-[10px] font-bold uppercase text-slate-400 mb-2">Recommended Actions</h5>
                    <ul className="space-y-2 mb-6 flex-1">
                      {analysis.recovery?.recommendedActions?.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="font-medium">{action}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                        <div className="text-[10px] font-bold uppercase text-emerald-600 mb-1">Time Saved</div>
                        <div className="text-xl font-black text-emerald-700">{analysis.recovery?.estimatedTimeSaved || 0}m</div>
                      </div>
                      <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-center">
                        <div className="text-[10px] font-bold uppercase text-indigo-600 mb-1">Savings Impact</div>
                        <div className="text-xl font-black text-indigo-700">₹{(analysis.recovery?.savings || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SLAGuardianPage = () => {
  const { shipments, slaAnalyses, fetchShipmentSLA } = useShipments();
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHighRiskOnly, setShowHighRiskOnly] = useState(true);
  const location = useLocation();

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedShipment(null);
  };

  const handleViewAnalysis = async (shipment) => {
    setSelectedShipment(shipment);
    setIsModalOpen(true);
    // Fetch live analysis
    if (!slaAnalyses[shipment.id]) {
      await fetchShipmentSLA(shipment.id);
    }
  };

  useEffect(() => {
    if (location.state?.openShipmentId && shipments.length > 0) {
      const target = shipments.find(s => s.id === location.state.openShipmentId);
      if (target) {
        handleViewAnalysis(target);
      }
      // Clear the state so it doesn't re-trigger on unmount/remount unless clicked again
      window.history.replaceState({}, document.title);
    }
  }, [location.state, shipments]);

  // Filter high risk from live shipments
  const highRiskShipments = useMemo(() => {
    return shipments.filter(s => s.riskScore === 'Medium' || s.riskScore === 'High' || s.riskScore === 'Critical');
  }, [shipments]);

  const displayedShipments = useMemo(() => {
    return showHighRiskOnly ? highRiskShipments : shipments;
  }, [shipments, highRiskShipments, showHighRiskOnly]);

  // Aggregate KPIs
  const kpis = useMemo(() => {
    const totalMonitored = shipments.length;
    const predictedBreaches = highRiskShipments.length;
    
    let totalSavings = 0;
    let recoveryCount = 0;
    
    Object.values(slaAnalyses).forEach(analysis => {
      totalSavings += (analysis.recovery?.savings || 0);
      recoveryCount += (analysis.recovery?.recommendedActions?.length || 0);
    });

    return {
      totalMonitored,
      predictedBreaches,
      recoveryCount,
      totalSavings
    };
  }, [shipments, highRiskShipments, slaAnalyses]);


  // Static mock data for charts since we are only replacing shipment workflow data
  const riskDistributionData = [
    { name: 'Critical', value: shipments.filter(s => s.riskScore === 'Critical').length || 1, color: '#ef4444' },
    { name: 'High', value: shipments.filter(s => s.riskScore === 'High').length || 1, color: '#f59e0b' },
    { name: 'Medium', value: shipments.filter(s => s.riskScore === 'Medium').length || 1, color: '#eab308' },
    { name: 'Low', value: shipments.filter(s => s.riskScore === 'Low' || !s.riskScore).length || 1, color: '#10b981' },
  ];
  
  const slaSuccessData = [
    { day: 'Mon', rate: 94 }, { day: 'Tue', rate: 92 }, { day: 'Wed', rate: 96 },
    { day: 'Thu', rate: 95 }, { day: 'Fri', rate: 98 }, { day: 'Sat', rate: 97 }, { day: 'Sun', rate: 95 }
  ];
  
  const breachesData = [
    { day: 'Mon', count: 4 }, { day: 'Tue', count: 6 }, { day: 'Wed', count: 2 },
    { day: 'Thu', count: 3 }, { day: 'Fri', count: 1 }, { day: 'Sat', count: 2 }, { day: 'Sun', count: 5 }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full animate-fade-in pb-24">
      <AIAnalysisModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        shipment={selectedShipment}
        analysis={selectedShipment ? slaAnalyses[selectedShipment.id] : null}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30 text-white">
            <Shield size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-blue-950 tracking-tight font-display">SLA Guardian AI</h1>
            <p className="text-xs font-bold text-blue-500/80 uppercase tracking-widest mt-1">Predict, Prevent and Protect Deliveries</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title="Total Monitored" value={kpis.totalMonitored} trend="Live" trendUp={true} icon={Target} colorClass="text-blue-600" borderClass="border-l-blue-500" bgClass="bg-blue-50" />
        <KPICard title="Predicted Breaches" value={kpis.predictedBreaches} trend="Live" trendUp={false} icon={AlertTriangle} colorClass="text-red-600" borderClass="border-l-red-500" bgClass="bg-red-50" />
        <KPICard title="Recovery Actions" value={kpis.recoveryCount} trend="Live" trendUp={true} icon={Zap} colorClass="text-amber-600" borderClass="border-l-amber-500" bgClass="bg-amber-50" />
        <KPICard title="Potential Savings" value={`₹${(kpis.totalSavings / 1000).toFixed(1)}k`} trend="Live" trendUp={true} icon={TrendingUp} colorClass="text-emerald-600" borderClass="border-l-emerald-500" bgClass="bg-emerald-50" />
      </div>

      {/* Main Content */}
      <div className="mb-8 bg-white rounded-2xl border border-blue-100 shadow-lg shadow-blue-50/50 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">SLA Inspection Queue</h2>
            <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
              {highRiskShipments.length} At Risk
            </span>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setShowHighRiskOnly(true)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${showHighRiskOnly ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              High Risk Only
            </button>
            <button
              onClick={() => setShowHighRiskOnly(false)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${!showHighRiskOnly ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All Shipments
            </button>
          </div>
        </div>
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4 border-b border-slate-100">Shipment ID</th>
                <th className="p-4 border-b border-slate-100">Current ETA</th>
                <th className="p-4 border-b border-slate-100">SLA Deadline</th>
                <th className="p-4 border-b border-slate-100">Status</th>
                <th className="p-4 border-b border-slate-100">Risk Level</th>
                <th className="p-4 border-b border-slate-100">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {displayedShipments.map((row, i) => {
                const color = getRiskColor(row.riskScore);
                // Try to format current ETA cleanly
                const currentEta = row.etas?.updated || row.eta || 'Unknown';
                // Use SLA deadline from raw payload if exists, otherwise fallback
                const deadline = row._raw?.slaDeadline ? new Date(row._raw.slaDeadline).toLocaleString() : 'N/A';
                
                return (
                  <tr key={i} className="hover:bg-blue-50/50 transition-colors border-b border-slate-50 last:border-0 group">
                    <td className="p-4 font-bold text-slate-700">{row.id}</td>
                    <td className="p-4 text-slate-600">{currentEta}</td>
                    <td className="p-4 text-slate-600">{deadline}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {row.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold bg-${color}-50 text-${color}-700 border border-${color}-200`}>
                        {row.riskScore}
                      </span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleViewAnalysis(row)}
                        className="text-blue-600 font-bold text-xs hover:text-blue-800 hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center gap-1 transition-all"
                      >
                        <Zap className="w-3 h-3" /> View AI Analysis
                      </button>
                    </td>
                  </tr>
                );
              })}
              {displayedShipments.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500 font-medium">
                    No shipments found for the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-blue-100 shadow-lg shadow-blue-50/50 p-6">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Live Risk Distribution</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDistributionData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-blue-100 shadow-lg shadow-blue-50/50 p-6">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Historical SLA Success Rate</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={slaSuccessData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Area type="monotone" dataKey="rate" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-blue-100 shadow-lg shadow-blue-50/50 p-6">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Predicted Breaches</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breachesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SLAGuardianPage;
