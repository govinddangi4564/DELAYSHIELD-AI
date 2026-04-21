import React, { useState, useMemo } from 'react';
import { Sliders, Car, Clock, Plus, Trash2, Zap, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { simulateScenarios } from '../services/mockData';

const SimulationPanel = () => {
  const [scenarios, setScenarios] = useState([
    { id: 1, traffic: 50, delay: 20 }
  ]);
  const [results, setResults] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const addScenario = () => {
    if (scenarios.length >= 4) return;
    const nextId = scenarios.length > 0 ? Math.max(...scenarios.map(s => s.id)) + 1 : 1;
    setScenarios([...scenarios, { id: nextId, traffic: 50, delay: 20 }]);
  };

  const removeScenario = (id) => {
    setScenarios(scenarios.filter(s => s.id !== id));
    // Optionally remove result for this scenario to keep UI matched, but let's just clear results requiring a new run
    setResults([]);
  };

  const updateScenario = (id, field, value) => {
    setScenarios(scenarios.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
    setResults([]); // Clear results on edit to prompt re-run
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      // API call to backend route POST /api/simulation
      // const response = await fetch('/api/simulation', { method: 'POST', body: JSON.stringify({ scenarios }) });
      // const data = await response.json();
      
      // Fallback to local simulation model
      const res = await simulateScenarios(scenarios);
      setResults(res);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const bestScenario = useMemo(() => {
    if (!results || results.length === 0) return null;
    return results.reduce((prev, current) => {
      // Best scenario = lowest risk, then lowest cost
      if (current.risk < prev.risk) return current;
      if (current.risk === prev.risk && current.cost < prev.cost) return current;
      return prev;
    });
  }, [results]);

  return (
    <div className="glass-panel p-5 border-2 border-slate-200/60 dark:border-slate-700 col-span-full xl:col-span-12 w-full mt-4">
      {/* Title */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
            <Sliders size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Scenario Simulation</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Test what-if combinations before making decisions.</p>
          </div>
        </div>
        {scenarios.length < 4 && (
          <button 
            onClick={addScenario}
            className="flex items-center gap-1.5 text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            <Plus size={16} strokeWidth={3} /> Add Scenario
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Scenarios Form Column */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {scenarios.map((scen) => (
              <div key={scen.id} className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative group overflow-hidden transition-all hover:border-indigo-200 dark:hover:border-indigo-500/30">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-400 to-purple-500 rounded-l-2xl opacity-50 block" />
                
                <div className="flex justify-between items-center mb-4 pl-2">
                  <span className="font-black text-slate-700 dark:text-slate-200 text-sm tracking-tight">Scenario {scen.id}</span>
                  {scenarios.length > 1 && (
                    <button 
                      onClick={() => removeScenario(scen.id)}
                      className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Remove Scenario"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                <div className="space-y-5 pl-2">
                  {/* Traffic Control */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-slate-600 dark:text-slate-400 font-bold text-xs flex items-center gap-1.5">
                        <Car size={14} className="text-indigo-500 dark:text-indigo-400" /> Traffic Index
                      </span>
                      <span className="font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded text-xs">{scen.traffic}</span>
                    </div>
                    <input
                      type="range" min="0" max="100"
                      value={scen.traffic}
                      onChange={(e) => updateScenario(scen.id, 'traffic', e.target.value)}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 outline-none"
                    />
                  </div>

                  {/* Delay Control */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-slate-600 dark:text-slate-400 font-bold text-xs flex items-center gap-1.5">
                        <Clock size={14} className="text-orange-500 dark:text-orange-400" /> Delay Risk
                      </span>
                      <span className="font-bold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/40 px-2 py-0.5 rounded text-xs">{scen.delay}</span>
                    </div>
                    <input
                      type="range" min="0" max="100"
                      value={scen.delay}
                      onChange={(e) => updateScenario(scen.id, 'delay', e.target.value)}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={runSimulation}
            disabled={isSimulating}
            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-sm py-3 cursor-pointer rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-70 transform active:scale-[0.98]"
          >
            {isSimulating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Zap size={18} className="animate-pulse" />
            )}
            {isSimulating ? 'Analyzing Models...' : 'Run Neural Simulation'}
          </button>
        </div>

        {/* Results Graph Column */}
        <div className="lg:col-span-7 flex flex-col">
          {results.length > 0 ? (
            <div className="bg-white/40 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex-1 flex flex-col h-full min-h-[400px]">
              
              {/* Best Scenario Callout */}
              {bestScenario && (
                <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                  <div className="bg-emerald-100 dark:bg-emerald-900/50 p-1.5 rounded-lg shrink-0 text-emerald-600 dark:text-emerald-400">
                    <AlertCircle size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-emerald-800 dark:text-emerald-300 font-bold text-sm">Optimal Path: {bestScenario.name}</h4>
                    <p className="text-emerald-700/80 dark:text-emerald-400/80 text-xs mt-1 leading-relaxed">
                      AI identified this scenario as having the lowest combined impact. 
                      Risk: <span className="font-bold text-emerald-700 dark:text-emerald-300">{bestScenario.risk}%</span>, 
                      Cost: <span className="font-bold text-emerald-700 dark:text-emerald-300">${bestScenario.cost}</span>. 
                      System recommends to <strong className="uppercase bg-emerald-200/50 dark:bg-emerald-800/50 px-1 py-0.5 rounded ml-1">{bestScenario.decision}</strong>.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                    
                    <YAxis yAxisId="left" orientation="left" stroke="#F97316" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
                    <YAxis yAxisId="right" orientation="right" stroke="#6366F1" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} dx={10} />
                    
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)', fontSize: '12px', fontWeight: 500 }}
                      itemStyle={{ color: '#E2E8F0' }}
                      cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
                    
                    <Bar yAxisId="left" dataKey="risk" name="Risk Profile (%)" fill="#F97316" radius={[6, 6, 0, 0]} maxBarSize={50}>
                      {results.map((entry, index) => (
                        <Cell key={`risk-${index}`} fill={entry.id === bestScenario?.id ? '#ea580c' : '#fdba74'} className="transition-all duration-300" />
                      ))}
                    </Bar>
                    <Bar yAxisId="right" dataKey="cost" name="Est. Cost Impact ($)" fill="#6366F1" radius={[6, 6, 0, 0]} maxBarSize={50}>
                      {results.map((entry, index) => (
                        <Cell key={`cost-${index}`} fill={entry.id === bestScenario?.id ? '#4f46e5' : '#a5b4fc'} className="transition-all duration-300" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 h-full min-h-[400px]">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4 ring-8 ring-slate-50 dark:ring-slate-900">
                <Zap size={32} className="text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
              </div>
              <h3 className="font-black tracking-tight text-slate-700 dark:text-slate-300 mb-2">Simulate Variables</h3>
              <p className="text-sm max-w-xs leading-relaxed text-slate-500 dark:text-slate-400">Add multiple scenario models, adjust traffic and delay thresholds, and execute to compare the impact vectors side-by-side.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SimulationPanel;
