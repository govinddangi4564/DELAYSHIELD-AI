import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Loader2, RefreshCw, TrendingUp, PieChart as PieIcon, IndianRupee } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';
import HistoryPanel from '../components/HistoryPanel';
import { getHistory } from '../services/api';

const AnalyticsPage = () => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHistory();
      setHistoryData(data);
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Failed to load decision history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // ── Data Processing for Charts ──
  const chartData = useMemo(() => {
    if (!historyData.length) return { distribution: [], trends: [] };

    // 1. Distribution
    const distMap = historyData.reduce((acc, curr) => {
      acc[curr.decision] = (acc[curr.decision] || 0) + 1;
      return acc;
    }, {});
    const distribution = Object.entries(distMap).map(([name, value]) => ({ name, value }));

    // 2. Cost Trends
    let cumulativeCost = 0;
    const trends = [...historyData].reverse().map((entry, idx) => {
      const costValue = parseInt(entry.costImpact.replace(/[^0-9-]/g, '')) || 0;
      cumulativeCost += costValue;
      return {
        name: `Dec ${idx + 1}`,
        impact: costValue,
        cumulative: cumulativeCost,
        id: entry.id
      };
    });

    return { distribution, trends };
  }, [historyData]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

  return (
    <div className="min-h-screen p-8 bg-slate-50/50">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-500/20 ring-4 ring-blue-500/10">
            <BarChart3 size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-blue-950 tracking-tight">Advanced Analytics</h1>
            <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mt-1">Performance & Optimization Insights</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button
            onClick={fetchHistory}
            className="flex items-center gap-2 bg-white border border-blue-200 hover:border-blue-400 text-blue-700 px-6 py-3 rounded-2xl font-bold shadow-sm transition-all hover:shadow-md active:scale-95"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Intelligence
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
          <p className="text-blue-600 font-black text-sm uppercase tracking-widest">Aggregating Global Node Data...</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-12 border-2 border-red-200 text-center max-w-lg mx-auto">
          <p className="text-red-600 font-black text-lg mb-4">{error}</p>
          <button onClick={fetchHistory} className="bg-red-600 hover:bg-red-700 text-white font-black px-8 py-3 rounded-2xl transition-all shadow-lg shadow-red-200">
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          
          {/* ── Key Performance Metrics ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Chart 1: Decision Distribution */}
            <div className="glass-panel p-8 border-2 border-blue-200 flex flex-col h-[450px]">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><PieIcon size={20} /></div>
                <h3 className="text-lg font-black text-blue-950 uppercase tracking-tighter">Strategic Decision Mix</h3>
              </div>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={8}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Cost Savings Trend */}
            <div className="glass-panel p-8 border-2 border-blue-200 flex flex-col h-[450px]">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><TrendingUp size={20} /></div>
                <h3 className="text-lg font-black text-blue-950 uppercase tracking-tighter">Cumulative Optimization Value</h3>
              </div>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.trends}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      labelStyle={{ fontWeight: 'black', color: '#1e293b', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="#10b981" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      name="Total Value ($)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── Detailed History Feed ── */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-4 ml-2">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              <h3 className="text-xs font-black text-blue-900/40 uppercase tracking-[0.2em]">Live Intelligence Feed</h3>
            </div>
            <HistoryPanel historyData={historyData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
