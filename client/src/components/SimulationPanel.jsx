import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ─── helpers ──────────────────────────────────────────────────────────────────

function simulateLocally(traffic, delay, priority) {
  const pMul = { HIGH: 1.3, MEDIUM: 1.0, LOW: 0.75 }[priority] ?? 1;
  const risk  = Math.min(99, Math.round((traffic * 0.4 + delay * 0.6) * pMul * 0.5));
  const cost  = Math.round(traffic * 12 + delay * 8 + risk * 15);
  const decision = risk >= 70 ? "REROUTE" : risk >= 40 ? "MONITOR" : "PROCEED";
  return { risk, cost, decision };
}

let _nextId = 3;

// ─── Main component ───────────────────────────────────────────────────────────

export default function SimulationPanel() {
  const navigate = useNavigate();
  const [baseInput,  setBaseInput]  = useState({ traffic: 60, delay: 30, priority: "MEDIUM" });
  const [scenarios,  setScenarios]  = useState([
    { id: 1, traffic: 100, delay: "" },
    { id: 2, traffic: "",  delay: 80 },
  ]);
  const [stressMode, setStressMode] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [apiNote,    setApiNote]    = useState("");

  function addScenario() {
    setScenarios(prev => [...prev, { id: _nextId++, traffic: "", delay: "" }]);
  }
  function removeScenario(id) {
    setScenarios(prev => prev.length > 1 ? prev.filter(s => s.id !== id) : prev);
  }
  function updateScenario(id, field, raw) {
    const val = raw === "" ? "" : parseFloat(raw);
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  }

  async function runSimulation() {
    setLoading(true);
    setApiNote("");

    const builtScenarios = scenarios.map(s => ({
      traffic: s.traffic !== "" ? (stressMode ? Math.round(s.traffic * 1.5) : s.traffic) : (stressMode ? Math.round(baseInput.traffic * 1.5) : baseInput.traffic),
      delay:   s.delay   !== "" ? s.delay   : baseInput.delay,
    }));

    let data;
    try {
      const res = await fetch("/api/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseInput, scenarios: builtScenarios }),
      });
      if (!res.ok) throw new Error("non-2xx");
      data = await res.json();
    } catch {
      const original  = simulateLocally(baseInput.traffic, baseInput.delay, baseInput.priority);
      const simulated = builtScenarios.map(s => simulateLocally(s.traffic, s.delay, baseInput.priority));
      const comparison = simulated.map(s => ({
        difference: {
          risk:           s.risk - original.risk,
          cost:           s.cost - original.cost,
          decisionChange: s.decision !== original.decision ? `${original.decision} → ${s.decision}` : null,
        },
        impactScore: Math.round(Math.abs(s.risk - original.risk) * 0.6 + Math.abs(s.cost - original.cost) * 0.0004 * 40),
      }));
      data = { original, simulated, comparison };
      setApiNote("Demo mode — /api/simulation unreachable");
    }

    setLoading(false);
    
    const scNames = ["Base", ...scenarios.map((_, i) => `S${i + 1}`)];
    navigate('/simulation', { state: { data, builtScenarios, scenarios, scNames } });
  }

  return (
    <div className="max-w-[720px] py-4 md:py-6 mx-auto w-full px-2 sm:px-0">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-7 gap-4">
        <div>
          <h2 className="text-xl font-bold text-blue-950 m-0">Neural Simulation</h2>
          <p className="text-[13px] text-blue-600/80 mt-1">Configure scenarios and compare risk, cost and decisions</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer shrink-0">
          <div onClick={() => setStressMode(v => !v)}
            className={`w-9 h-5 rounded-full relative cursor-pointer border border-black/10 transition-colors ${stressMode ? 'bg-green-600' : 'bg-slate-300'}`}>
            <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[1px] transition-all border border-black/10 ${stressMode ? 'left-[18px]' : 'left-[3px]'}`} />
          </div>
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Stress test (×1.5)</span>
        </label>
      </div>

      {/* ── A. Base input ── */}
      <SectionLabel>A. Base input</SectionLabel>
      <div className="glass-panel p-4 sm:p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Traffic">
            <input className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm text-blue-950 focus:outline-none focus:border-blue-400" type="number" value={baseInput.traffic} min={0} max={300}
              onChange={e => setBaseInput(p => ({ ...p, traffic: parseFloat(e.target.value) || 0 }))} />
          </Field>
          <Field label="Delay (ms)">
            <input className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm text-blue-950 focus:outline-none focus:border-blue-400" type="number" value={baseInput.delay} min={0} max={500}
              onChange={e => setBaseInput(p => ({ ...p, delay: parseFloat(e.target.value) || 0 }))} />
          </Field>
          <Field label="Priority">
            <select className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm text-blue-950 focus:outline-none focus:border-blue-400" value={baseInput.priority}
              onChange={e => setBaseInput(p => ({ ...p, priority: e.target.value }))}>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </Field>
        </div>
      </div>

      {/* ── B. Scenarios ── */}
      <div className="flex items-center justify-between mb-3">
        <SectionLabel style={{ marginBottom: 0 }}>B. Scenarios</SectionLabel>
        <button className="text-xs px-3 py-1.5 cursor-pointer rounded-lg border border-slate-300 bg-white text-blue-950 hover:bg-slate-50 transition-colors" onClick={addScenario}>+ Add scenario</button>
      </div>

      <div className="flex flex-col gap-3 mb-5">
        {scenarios.map((sc, i) => (
          <div key={sc.id} className="glass-panel p-4 pb-5 !border-l-4 !border-l-blue-400 !border-y-0 !border-r-0 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="flex items-center gap-2 text-[13px] font-semibold text-blue-950">
                <span className="w-[22px] h-[22px] rounded-full bg-blue-100 text-blue-600 inline-flex items-center justify-center text-[11px] font-bold">{i + 1}</span>
                Scenario {i + 1}
              </span>
              {scenarios.length > 1 && (
                <button className="text-[11px] text-slate-400 hover:text-red-500 bg-transparent border-none cursor-pointer" onClick={() => removeScenario(sc.id)}>✕ Remove</button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Traffic override">
                <input className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm text-blue-950 focus:outline-none focus:border-blue-400" type="number" placeholder={`inherit (${baseInput.traffic})`} value={sc.traffic}
                  onChange={e => updateScenario(sc.id, "traffic", e.target.value)} min={0} max={300} />
              </Field>
              <Field label="Delay override (ms)">
                <input className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm text-blue-950 focus:outline-none focus:border-blue-400" type="number" placeholder={`inherit (${baseInput.delay}ms)`} value={sc.delay}
                  onChange={e => updateScenario(sc.id, "delay", e.target.value)} min={0} max={500} />
              </Field>
            </div>
          </div>
        ))}
      </div>

      {/* ── Run ── */}
      <div className="flex items-center gap-4 pt-5 border-t border-slate-200">
        <button className="btn-primary"
          style={{ opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          onClick={runSimulation} disabled={loading}>
          {loading ? "Running…" : "Run simulation →"}
        </button>
        {apiNote && <span className="text-xs text-amber-700">{apiNote}</span>}
      </div>
    </div>
  );
}

// ─── Shared small components ──────────────────────────────────────────────────

function SectionLabel({ children, style }) {
  return (
    <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-3" style={style}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-slate-500">{label}</label>
      {children}
    </div>
  );
}
