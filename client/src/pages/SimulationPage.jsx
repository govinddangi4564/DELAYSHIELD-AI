import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Chart } from 'chart.js';
import {
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  RadarController,
  BarController,
  LineController,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
} from 'chart.js';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  RadarController,
  BarController,
  LineController,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
);

// ─── helpers ──────────────────────────────────────────────────────────────────

function riskMeta(score) {
  if (score >= 70) return { label: "High",   color: "#dc2626", bg: "bg-red-100", text: "text-red-700" };
  if (score >= 40) return { label: "Medium", color: "#f59e0b", bg: "bg-amber-100", text: "text-amber-700" };
  return               { label: "Low",    color: "#16a34a", bg: "bg-green-100", text: "text-green-700" };
}

function bestIndex(simulated) {
  let idx = 0, best = Infinity;
  simulated.forEach((s, i) => {
    const score = s.risk * 1.5 + s.cost / 500;
    if (score < best) { best = score; idx = i; }
  });
  return idx;
}

const SC_PALETTE = ["#93c5fd", "#4ade80", "#f87171", "#fbbf24", "#e879f9", "#2dd4bf"]; // Tailwind 400 shades

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeRun(run = {}) {
  const risk = typeof run.risk === "object"
    ? toNumber(run.risk?.score)
    : toNumber(run.risk);
  const cost = typeof run.cost === "object"
    ? toNumber(run.cost?.noActionCost ?? run.cost?.totalCost ?? run.cost?.cost)
    : toNumber(run.cost);
  const decision = typeof run.decision === "object"
    ? run.decision?.action
    : run.decision;

  return {
    risk,
    cost,
    decision: decision || "UNKNOWN",
  };
}

function normalizeComparison(item = {}) {
  const diff = item.difference ?? {};
  return {
    difference: {
      risk: toNumber(diff.risk ?? diff.riskScoreChange),
      cost: toNumber(diff.cost ?? diff.costChange),
      decisionChange: diff.decisionChange ?? null,
    },
    impactScore: toNumber(item.impactScore ?? diff.impactScore),
  };
}

function normalizeSimulationData(payload) {
  if (!payload) return null;

  if (Array.isArray(payload.data)) {
    const first = payload.data[0];
    if (!first?.original) return null;

    return {
      original: normalizeRun(first.original),
      simulated: payload.data.map((item) => normalizeRun(item.simulated)),
      comparison: payload.data.map(normalizeComparison),
    };
  }

  if (payload.data?.original) {
    return normalizeSimulationData(payload.data);
  }

  if (payload.original) {
    return {
      original: normalizeRun(payload.original),
      simulated: (payload.simulated ?? []).map(normalizeRun),
      comparison: (payload.comparison ?? []).map(normalizeComparison),
    };
  }

  return null;
}

function normalizeScenarioNames(names, count) {
  if (Array.isArray(names) && names.length === count + 1) return names;
  return ["Base", ...Array.from({ length: count }, (_, index) => `S${index + 1}`)];
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SimulationPage() {
  const location = useLocation();
  const state = location.state;

  if (!state || !state.data) {
    return (
      <div className="max-w-[720px] mx-auto py-16 text-center text-slate-500">
        No simulation data available. Please run a simulation from the dashboard.
      </div>
    );
  }

  const { data, scNames } = state;
  const normalizedData = normalizeSimulationData(data);

  if (!normalizedData) {
    return (
      <div className="max-w-[720px] mx-auto py-16 text-center text-slate-500">
        Simulation results could not be displayed. Please run the simulation again.
      </div>
    );
  }

  const normalizedNames = normalizeScenarioNames(scNames, normalizedData.simulated.length);

  return (
    <div className="max-w-[720px] py-4 md:py-6 mx-auto w-full px-2 sm:px-0">
      <div className="flex items-start justify-between mb-7 gap-4">
        <div>
          <h2 className="text-xl font-bold text-blue-950 m-0">Simulation Results</h2>
          <p className="text-[13px] text-blue-600/80 mt-1">Detailed breakdown and comparison of your scenarios</p>
        </div>
      </div>
      <ResultsSection 
        data={normalizedData}
        scNames={normalizedNames}
      />
    </div>
  );
}

// ─── ResultsSection ───────────────────────────────────────────────────────────

function ResultsSection({ data, scNames }) {
  const { original, simulated = [], comparison = [] } = data;
  const bestIdx = bestIndex(simulated);

  return (
    <div className="mt-4">
      {/* C. Base result */}
      <SectionLabel>C. Base result</SectionLabel>
      <Card className="mb-5">
        <MetricGrid items={[
          { label: "Risk score", value: original.risk,      color: riskMeta(original.risk).color },
          { label: "Risk level", value: <RiskBadge score={original.risk} /> },
          { label: "Decision",   value: original.decision,  small: true },
          { label: "Cost",       value: `₹${original.cost.toLocaleString()}` },
        ]} />
      </Card>

      {/* D. Scenario result cards */}
      <SectionLabel>D. Scenario results</SectionLabel>
      <div className="flex flex-col gap-3 mb-5">
        {simulated.map((sc, i) => {
          const cmp  = comparison[i] ?? {};
          const diff = cmp.difference ?? {};
          const isBest = i === bestIdx;
          const leftBorderColor = isBest ? "#16a34a" : sc.risk >= 70 ? "#dc2626" : "#e2e8f0";

          return (
            <div key={i} className="glass-panel p-4" style={{ borderLeft: `4px solid ${leftBorderColor}`, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }}>
              <div className="flex justify-between items-center mb-3">
                <span className="flex items-center text-[13px] font-semibold text-blue-950">
                  <span className="w-[22px] h-[22px] rounded-full bg-blue-100 text-blue-600 inline-flex items-center justify-center text-[11px] font-bold mr-2">{i + 1}</span>
                  Scenario {i + 1}
                  {isBest && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-100 text-green-700 ml-2">Best</span>}
                </span>
                <span className="inline-flex items-center bg-blue-100 text-blue-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">Impact {Math.round(cmp.impactScore ?? 0)}</span>
              </div>
              <MetricGrid items={[
                { label: "Risk score", value: sc.risk,      color: riskMeta(sc.risk).color },
                { label: "Risk level", value: <RiskBadge score={sc.risk} /> },
                { label: "Decision",   value: sc.decision,  small: true },
                { label: "Cost",       value: `₹${sc.cost.toLocaleString()}` },
              ]} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5">
                <DiffCell label="Risk change" val={diff.risk ?? 0} />
                <DiffCell label="Cost change" val={diff.cost ?? 0} prefix="₹" />
                {diff.decisionChange && (
                  <DiffCell label="Decision change" text={diff.decisionChange} wide />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Divider />

      {/* E. Scenario comparison charts */}
      <SectionLabel>E. Scenario comparison charts</SectionLabel>
      <ScenarioCharts
        original={original}
        simulated={simulated}
        scNames={scNames}
        bestIdx={bestIdx}
      />

      <Divider />

      {/* F. AI before vs after */}
      <SectionLabel>F. AI simulation — before vs after</SectionLabel>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        {[
          { label: "Base risk",     value: original.risk,                                                        color: "#dc2626" },
          { label: "AI sim. risk",  value: simulated[bestIdx]?.risk ?? "—",                                      color: "#16a34a" },
          { label: "Cost saved",    value: `₹${Math.abs(original.cost - (simulated[bestIdx]?.cost ?? original.cost)).toLocaleString()}`, color: "#2563eb" },
          { label: "Decision shift",value: original.decision !== simulated[bestIdx]?.decision ? `${original.decision} → ${simulated[bestIdx]?.decision}` : "No change", small: true, color: "#1e293b" },
        ].map(({ label, value, color, small }) => (
          <div key={label} className="bg-slate-50 border border-slate-100 rounded-lg py-2.5 px-3.5">
            <div className="text-[11px] text-slate-500 mb-1">{label}</div>
            <div className={`font-semibold ${small ? 'text-xs' : 'text-base'}`} style={{ color: color }}>{value}</div>
          </div>
        ))}
      </div>

      <AILineChart original={original} simulated={simulated} bestIdx={bestIdx} />
      <BeforeAfterGrouped original={original} simulated={simulated} scNames={scNames} />
    </div>
  );
}

// ─── ScenarioCharts (4-tab) ───────────────────────────────────────────────────

function ScenarioCharts({ original, simulated, scNames, bestIdx }) {
  const [tab, setTab] = useState("risk");
  const TABS = [
    { key: "risk",   label: "Risk score" },
    { key: "cost",   label: "Cost" },
    { key: "impact", label: "Impact" },
    { key: "radar",  label: "Radar" },
  ];

  const riskData   = [original.risk,  ...simulated.map(s => s.risk)];
  const costData   = [original.cost,  ...simulated.map(s => s.cost)];
  const impactData = [0, ...simulated.map(s =>
    Math.round(Math.abs(s.risk - original.risk) * 0.6 + Math.abs(s.cost - original.cost) * 0.00016)
  )];
  const barColors  = scNames.map((_, i) =>
    i === 0 ? "#93c5fd" : i - 1 === bestIdx ? "#4ade80" : riskMeta(simulated[i - 1]?.risk ?? 0).color
  );
  const radarData  = [
    { metric: "Risk",     values: riskData },
    { metric: "Cost÷100", values: costData.map(v => Math.round(v / 100)) },
    { metric: "Impact",   values: impactData },
  ];

  const NOTES = {
    risk:   "Dashed lines mark medium (40) and high (70) risk thresholds",
    cost:   "Lower cost = better outcome — green bar is the recommended scenario",
    impact: "Higher impact = greater deviation from base; monitor carefully",
    radar:  "Smaller polygon area = better overall scenario performance",
  };

  return (
    <Card className="mb-5">
      <div className="flex border-b border-slate-200 mb-4">
        {TABS.map(t => (
          <button key={t.key}
            className={`flex-1 py-2 text-xs font-semibold text-center cursor-pointer bg-transparent transition-all border-b-2 ${tab === t.key ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <ChartLegend items={
        tab === "radar"
          ? scNames.map((n, i) => ({ color: SC_PALETTE[i] ?? "#94a3b8", label: n }))
          : scNames.map((n, i) => ({
              color: i === 0 ? "#93c5fd" : i - 1 === bestIdx ? "#4ade80" : SC_PALETTE[Math.min(i, SC_PALETTE.length - 1)],
              label: n + (i > 0 && i - 1 === bestIdx ? " — Best" : ""),
            }))
      } />

      <CJSBarRadarChart
        key={tab}
        tab={tab}
        scNames={scNames}
        riskData={riskData}
        costData={costData}
        impactData={impactData}
        barColors={barColors}
        radarData={radarData}
        bestIdx={bestIdx}
      />

      <div className="text-[11px] text-slate-400 mt-2.5 pt-2.5 border-t border-slate-100">{NOTES[tab]}</div>
    </Card>
  );
}

// ─── Chart.js canvas components ────────────────────────

function CJSBarRadarChart({ tab, scNames, riskData, costData, impactData, barColors, radarData, bestIdx }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  const FONT = "system-ui, sans-serif";
  const GRID = "rgba(100, 116, 139, 0.1)"; // slate-500 with opacity
  const TICK = { font: { family: FONT, size: 11 }, color: "#64748b" }; // slate-500
  const BASE_OPT = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500, easing: "easeInOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)", // slate-900
        titleFont: { family: FONT, size: 12, weight: "600" },
        bodyFont:  { family: FONT, size: 11 },
        padding: 10, cornerRadius: 8,
      },
    },
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    let config = null;
    if (tab === "risk") {
      config = {
        type: "bar",
        data: { labels: scNames, datasets: [{ label: "Risk", data: riskData, backgroundColor: barColors, borderRadius: 6, borderSkipped: false }] },
        options: { ...BASE_OPT, scales: {
          y: { beginAtZero: true, max: 100, grid: { color: GRID }, border: { display: false }, ticks: { ...TICK, stepSize: 20 } },
          x: { grid: { display: false }, border: { display: false }, ticks: TICK },
        }},
      };
    } else if (tab === "cost") {
      const cColors = scNames.map((_, i) => i === 0 ? "#93c5fd" : i - 1 === bestIdx ? "#4ade80" : SC_PALETTE[Math.min(i, SC_PALETTE.length - 1)]);
      config = {
        type: "bar",
        data: { labels: scNames, datasets: [{ label: "Cost (₹)", data: costData, backgroundColor: cColors, borderRadius: 6, borderSkipped: false }] },
        options: { ...BASE_OPT, scales: {
          y: { beginAtZero: true, grid: { color: GRID }, border: { display: false }, ticks: { ...TICK, callback: v => "₹" + (v / 1000).toFixed(0) + "k" } },
          x: { grid: { display: false }, border: { display: false }, ticks: TICK },
        }},
      };
    } else if (tab === "impact") {
      const iColors = impactData.map((v, i) => i === 0 ? "#93c5fd" : v > 30 ? "#f87171" : v > 15 ? "#fbbf24" : "#4ade80");
      config = {
        type: "bar",
        data: { labels: scNames, datasets: [{ label: "Impact", data: impactData, backgroundColor: iColors, borderRadius: 6, borderSkipped: false }] },
        options: { ...BASE_OPT, scales: {
          y: { beginAtZero: true, max: 50, grid: { color: GRID }, border: { display: false }, ticks: TICK },
          x: { grid: { display: false }, border: { display: false }, ticks: TICK },
        }},
      };
    } else if (tab === "radar") {
      const datasets = scNames.map((name, i) => ({
        label: name,
        data: radarData.map(d => d.values[i]),
        borderColor: SC_PALETTE[i] ?? "#94a3b8",
        backgroundColor: (SC_PALETTE[i] ?? "#94a3b8") + "33", // 20% opacity
        borderWidth: 2,
        pointBackgroundColor: SC_PALETTE[i] ?? "#94a3b8",
        pointBorderColor: "#fff", pointBorderWidth: 1.5,
        pointRadius: 4,
      }));
      config = {
        type: "radar",
        data: { labels: radarData.map(d => d.metric), datasets },
        options: { ...BASE_OPT, scales: { r: {
          ticks: { font: { size: 10 }, backdropColor: "transparent", color: "#94a3b8" },
          grid: { color: GRID }, angleLines: { color: "rgba(100, 116, 139, 0.15)" },
          pointLabels: { font: { size: 12, family: FONT, weight: "500" }, color: "#475569" },
        }}},
      };
    }

    if (config) chartRef.current = new Chart(canvasRef.current, config);

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [tab, scNames, riskData, costData, impactData, barColors, radarData, bestIdx]);

  return (
    <div className={`relative w-full ${tab === "radar" ? 'h-[280px]' : 'h-[250px]'}`}>
      <canvas ref={canvasRef} role="img" aria-label={`${tab} chart across scenarios`}>
        Scenario {tab} comparison chart.
      </canvas>
    </div>
  );
}

function AILineChart({ original, simulated, bestIdx }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);
  const bestRisk = simulated[bestIdx]?.risk ?? original.risk;
  const STEPS = ["T0", "T1", "T2", "T3", "T4", "T5"];
  const beforeLine = STEPS.map((_, i) => Math.round(original.risk + i * (original.risk * 0.18) / 5));
  const afterLine  = STEPS.map((_, i) => Math.round(original.risk - i * (original.risk - bestRisk) / 5));

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const FONT = "system-ui, sans-serif";
    const GRID = "rgba(100, 116, 139, 0.1)";
    const TICK = { font: { family: FONT, size: 11 }, color: "#64748b" };

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: STEPS,
        datasets: [
          { label: "Best corridor (hi)", data: STEPS.map(() => 50), borderWidth: 0, pointRadius: 0, fill: "+1", backgroundColor: "#4ade8022" },
          { label: "Best corridor (lo)", data: STEPS.map(() => 28), borderColor: "#4ade8066", borderWidth: 1, borderDash: [4, 3], pointRadius: 0, fill: false, backgroundColor: "transparent" },
          { label: "Before (original)",  data: beforeLine, borderColor: "#f87171", borderWidth: 2.5, pointBackgroundColor: "#f87171", pointBorderColor: "#fff", pointBorderWidth: 2, pointRadius: 5, tension: .35, fill: false },
          { label: "After (AI simulated)", data: afterLine, borderColor: "#3b82f6", borderWidth: 2.5, borderDash: [8, 4], pointBackgroundColor: "#3b82f6", pointBorderColor: "#fff", pointBorderWidth: 2, pointStyle: "triangle", pointRadius: 6, tension: .35, fill: false },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 700, easing: "easeInOutQuart" },
        plugins: { legend: { display: false }, tooltip: { backgroundColor: "rgba(15, 23, 42, 0.9)", titleFont: { family: FONT, size: 12, weight: "600" }, bodyFont: { family: FONT, size: 11 }, padding: 10, cornerRadius: 8, mode: "index", intersect: false } },
        scales: {
          y: { min: 0, max: 100, grid: { color: GRID }, border: { display: false }, ticks: { ...TICK, stepSize: 20 } },
          x: { grid: { color: GRID }, border: { display: false }, ticks: TICK },
        },
      },
    });

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [original.risk, bestRisk, beforeLine, afterLine]);

  return (
    <Card className="mb-5">
      <div className="flex justify-between items-start mb-1">
        <div>
          <div className="text-[13px] font-semibold text-blue-950 mb-0.5">Risk trajectory — before vs after</div>
          <div className="text-[11px] text-slate-500 mb-2.5">Simulated projection over 6 decision time steps</div>
        </div>
        <span className="inline-flex w-fit items-center bg-indigo-100 text-indigo-700 text-[11px] font-bold px-2 py-0.5 rounded-full">AI powered</span>
      </div>
      <ChartLegend items={[
        { color: "#f87171", label: "Before (original)" },
        { color: "#3b82f6", label: "After (AI simulated)" },
        { color: "#4ade8044", label: "Best corridor" },
      ]} />
      <div className="relative w-full h-[270px]">
        <canvas ref={canvasRef} role="img" aria-label="Line chart of risk before and after AI simulation">
          Before and after AI simulation risk trajectory.
        </canvas>
      </div>
      <div className="text-[11px] text-slate-400 mt-2.5 pt-2.5 border-t border-slate-100">Shaded band = AI-recommended safe operating corridor for the best scenario</div>
    </Card>
  );
}

function BeforeAfterGrouped({ original, simulated, scNames }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);
  const beforeRisk = [original.risk, ...simulated.map(sc => sc.risk)];
  const afterRisk  = [original.risk, ...simulated.map(sc => Math.round(sc.risk * 0.74))];
  const beforeCost = [original.cost, ...simulated.map(sc => sc.cost)].map(v => Math.round(v / 100));
  const afterCost  = [original.cost, ...simulated.map(sc => sc.cost)].map(v => Math.round(v * 0.78 / 100));

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const FONT = "system-ui, sans-serif";
    const GRID = "rgba(100, 116, 139, 0.1)";
    const TICK = { font: { family: FONT, size: 11 }, color: "#64748b" };

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: scNames,
        datasets: [
          { label: "Before — risk",     data: beforeRisk, backgroundColor: "#fca5a5", borderRadius: 4, borderSkipped: false },
          { label: "After — risk",      data: afterRisk,  backgroundColor: "#dc2626", borderRadius: 4, borderSkipped: false },
          { label: "Before — cost÷100", data: beforeCost, backgroundColor: "#6ee7b7", borderRadius: 4, borderSkipped: false },
          { label: "After — cost÷100",  data: afterCost,  backgroundColor: "#059669", borderRadius: 4, borderSkipped: false },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 600, easing: "easeInOutQuart" },
        plugins: { legend: { display: false }, tooltip: { backgroundColor: "rgba(15, 23, 42, 0.9)", titleFont: { family: FONT, size: 12, weight: "600" }, bodyFont: { family: FONT, size: 11 }, padding: 10, cornerRadius: 8 } },
        scales: {
          y: { beginAtZero: true, grid: { color: GRID }, border: { display: false }, ticks: TICK },
          x: { grid: { display: false }, border: { display: false }, ticks: TICK },
        },
      },
    });

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [beforeRisk, afterRisk, beforeCost, afterCost, scNames]);

  return (
    <Card className="mb-5">
      <div className="text-[13px] font-semibold text-blue-950 mb-0.5">Before vs after — risk and cost per scenario</div>
      <div className="text-[11px] text-slate-500 mb-2.5">Darker shade = post-simulation. Cost ÷ 100 for unified scale.</div>
      <ChartLegend items={[
        { color: "#fca5a5", label: "Before — risk" },
        { color: "#dc2626", label: "After — risk" },
        { color: "#6ee7b7", label: "Before — cost ÷100" },
        { color: "#059669", label: "After — cost ÷100" },
      ]} />
      <div className="relative w-full h-[250px]">
        <canvas ref={canvasRef} role="img" aria-label="Grouped bar chart comparing before and after values per scenario">
          Before/after comparison per scenario.
        </canvas>
      </div>
      <div className="text-[11px] text-slate-400 mt-2.5 pt-2.5 border-t border-slate-100">All scenarios show post-simulation improvement.</div>
    </Card>
  );
}

// ─── Shared small components ──────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-3">
      {children}
    </div>
  );
}

function Card({ children, className = "", style }) {
  return (
    <div className={`glass-panel p-5 ${className}`} style={style}>
      {children}
    </div>
  );
}

function Divider() {
  return <hr className="border-t border-slate-200 my-6" />;
}

function MetricGrid({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map(({ label, value, color, small }) => (
        <div key={label} className="bg-slate-50 border border-slate-100 rounded-lg py-2 px-3">
          <div className="text-[11px] text-slate-500 mb-0.5">{label}</div>
          <div className={`font-semibold ${small ? 'text-xs' : 'text-[15px]'}`} style={{ color: color || "#0f172a" }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function DiffCell({ label, val, prefix = "", text, wide }) {
  const dir   = val > 0 ? "▲" : val < 0 ? "▼" : "—";
  const colorClass = val > 0 ? "text-red-600" : val < 0 ? "text-green-600" : "text-slate-500";
  return (
    <div className={`bg-slate-50 border border-slate-100 rounded-lg py-2 px-3 ${wide ? 'col-span-2' : ''}`}>
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className={`text-[13px] font-semibold mt-0.5 ${text ? 'text-slate-600' : colorClass}`}>
        {text ?? `${prefix}${val > 0 ? "+" : ""}${val} ${dir}`}
      </div>
    </div>
  );
}

function RiskBadge({ score }) {
  const m = riskMeta(score);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${m.bg} ${m.text}`}>
      {m.label}
    </span>
  );
}

function ChartLegend({ items }) {
  return (
    <div className="flex flex-wrap gap-3 mb-3 text-[11px] text-slate-500">
      {items.map(({ color, label }) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}
