import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function simulateLocally(traffic, delay, priority) {
  const priorityMultiplier = { HIGH: 1.3, MEDIUM: 1.0, LOW: 0.75 }[priority] ?? 1;
  const risk = Math.min(99, Math.round((traffic * 0.4 + delay * 0.6) * priorityMultiplier * 0.5));
  const cost = Math.round(traffic * 12 + delay * 8 + risk * 15);
  const decision = risk >= 70 ? 'REROUTE' : risk >= 40 ? 'MONITOR' : 'PROCEED';

  return { risk, cost, decision };
}

let nextScenarioId = 3;

export default function SimulationPanel() {
  const navigate = useNavigate();
  const [baseInput, setBaseInput] = useState({ traffic: 60, delay: 30, priority: 'MEDIUM' });
  const [scenarios, setScenarios] = useState([
    { id: 1, traffic: 100, delay: '' },
    { id: 2, traffic: '', delay: 80 },
  ]);
  const [stressMode, setStressMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiNote, setApiNote] = useState('');

  const addScenario = () => {
    setScenarios((prev) => [...prev, { id: nextScenarioId++, traffic: '', delay: '' }]);
  };

  const removeScenario = (id) => {
    setScenarios((prev) => (prev.length > 1 ? prev.filter((scenario) => scenario.id !== id) : prev));
  };

  const updateScenario = (id, field, rawValue) => {
    const value = rawValue === '' ? '' : parseFloat(rawValue);
    setScenarios((prev) => prev.map((scenario) => (
      scenario.id === id ? { ...scenario, [field]: value } : scenario
    )));
  };

  const runSimulation = async () => {
    setLoading(true);
    setApiNote('');

    const builtScenarios = scenarios.map((scenario) => ({
      traffic: scenario.traffic !== ''
        ? (stressMode ? Math.round(scenario.traffic * 1.5) : scenario.traffic)
        : (stressMode ? Math.round(baseInput.traffic * 1.5) : baseInput.traffic),
      delay: scenario.delay !== '' ? scenario.delay : baseInput.delay,
    }));

    let data;

    try {
      const response = await fetch('http://localhost:5000/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseInput, scenarios: builtScenarios }),
      });

      if (!response.ok) throw new Error('Simulation API returned a non-2xx response');
      data = await response.json();
    } catch {
      const original = simulateLocally(baseInput.traffic, baseInput.delay, baseInput.priority);
      const simulated = builtScenarios.map((scenario) => (
        simulateLocally(scenario.traffic, scenario.delay, baseInput.priority)
      ));
      const comparison = simulated.map((scenario) => ({
        difference: {
          risk: scenario.risk - original.risk,
          cost: scenario.cost - original.cost,
          decisionChange: scenario.decision !== original.decision
            ? `${original.decision} -> ${scenario.decision}`
            : null,
        },
        impactScore: Math.round(
          Math.abs(scenario.risk - original.risk) * 0.6
          + Math.abs(scenario.cost - original.cost) * 0.0004 * 40,
        ),
      }));

      data = { original, simulated, comparison };
      setApiNote('Demo mode: /api/simulation unreachable');
    } finally {
      setLoading(false);
    }

    const scNames = ['Base', ...scenarios.map((_, index) => `S${index + 1}`)];
    navigate('/simulation', { state: { data, builtScenarios, scenarios, scNames } });
  };

  return (
    <section className="w-full">
      <div className="flex items-start justify-between mb-7 gap-4">
        <div>
          <h2 className="text-2xl font-black text-blue-950 tracking-tight">Neural Simulation</h2>
          <p className="text-sm text-blue-600/80 mt-1">
            Configure scenarios and compare risk, cost and decisions
          </p>
        </div>

        <button
          type="button"
          onClick={() => setStressMode((value) => !value)}
          className="flex items-center gap-2 shrink-0 text-xs font-semibold text-slate-500"
        >
          <span className={`w-10 h-5 rounded-full relative border border-black/10 transition-colors ${stressMode ? 'bg-blue-600' : 'bg-slate-300'}`}>
            <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[2px] transition-all border border-black/10 ${stressMode ? 'left-[21px]' : 'left-[3px]'}`} />
          </span>
          Stress test (x1.5)
        </button>
      </div>

      <SectionLabel>A. Base input</SectionLabel>
      <div className="glass-panel p-4 sm:p-5 mb-7">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Traffic">
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-blue-950 focus:outline-none focus:border-blue-400"
              type="number"
              value={baseInput.traffic}
              min={0}
              max={300}
              onChange={(event) => setBaseInput((prev) => ({ ...prev, traffic: parseFloat(event.target.value) || 0 }))}
            />
          </Field>
          <Field label="Delay (ms)">
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-blue-950 focus:outline-none focus:border-blue-400"
              type="number"
              value={baseInput.delay}
              min={0}
              max={500}
              onChange={(event) => setBaseInput((prev) => ({ ...prev, delay: parseFloat(event.target.value) || 0 }))}
            />
          </Field>
          <Field label="Priority">
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-blue-950 focus:outline-none focus:border-blue-400"
              value={baseInput.priority}
              onChange={(event) => setBaseInput((prev) => ({ ...prev, priority: event.target.value }))}
            >
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <SectionLabel className="mb-0">B. Scenarios</SectionLabel>
        <button
          type="button"
          className="text-xs px-3 py-2 cursor-pointer rounded-lg border border-slate-300 bg-white text-blue-950 hover:bg-slate-50 transition-colors"
          onClick={addScenario}
        >
          + Add scenario
        </button>
      </div>

      <div className="flex flex-col gap-4 mb-7">
        {scenarios.map((scenario, index) => (
          <div key={scenario.id} className="glass-panel p-4 pb-5 border-l-4 border-l-blue-400 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="flex items-center gap-2 text-sm font-bold text-blue-950">
                <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 inline-flex items-center justify-center text-xs font-black">
                  {index + 1}
                </span>
                Scenario {index + 1}
              </span>
              {scenarios.length > 1 && (
                <button
                  type="button"
                  className="text-xs text-slate-400 hover:text-red-500 bg-transparent border-none cursor-pointer"
                  onClick={() => removeScenario(scenario.id)}
                >
                  x Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Traffic override">
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-blue-950 focus:outline-none focus:border-blue-400"
                  type="number"
                  placeholder={`inherit (${baseInput.traffic})`}
                  value={scenario.traffic}
                  onChange={(event) => updateScenario(scenario.id, 'traffic', event.target.value)}
                  min={0}
                  max={300}
                />
              </Field>
              <Field label="Delay override (ms)">
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-blue-950 focus:outline-none focus:border-blue-400"
                  type="number"
                  placeholder={`inherit (${baseInput.delay}ms)`}
                  value={scenario.delay}
                  onChange={(event) => updateScenario(scenario.id, 'delay', event.target.value)}
                  min={0}
                  max={500}
                />
              </Field>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-5 border-t border-slate-200">
        <button
          type="button"
          className="btn-primary"
          style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          onClick={runSimulation}
          disabled={loading}
        >
          {loading ? 'Running...' : 'Run simulation ->'}
        </button>
        {apiNote && <span className="text-xs font-semibold text-amber-700">{apiNote}</span>}
      </div>
    </section>
  );
}

function SectionLabel({ children, className = '' }) {
  return (
    <div className={`text-[10px] font-black tracking-widest uppercase text-slate-500 mb-3 ${className}`}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-slate-500">{label}</label>
      {children}
    </div>
  );
}
