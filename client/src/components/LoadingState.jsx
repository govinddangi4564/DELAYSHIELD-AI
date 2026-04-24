import React, { useEffect, useState } from 'react';
import { ShieldCheck, Sparkles, Radar } from 'lucide-react';

const DEFAULT_STEPS = [
  'Syncing live shipment nodes',
  'Reading traffic and route signals',
  'Preparing AI recommendations',
];

export default function LoadingState({
  title = 'Loading intelligence',
  subtitle = 'Hang tight while DelayShield prepares the latest view.',
  steps = DEFAULT_STEPS,
  fullScreen = false,
  compact = false,
}) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length);
    }, 1400);

    return () => window.clearInterval(timer);
  }, [steps.length]);

  const wrapperClass = fullScreen
    ? 'min-h-screen flex items-center justify-center p-8'
    : compact
      ? 'min-h-[220px] flex items-center justify-center p-6'
      : 'min-h-[420px] flex items-center justify-center p-8';

  return (
    <div className={wrapperClass}>
      <div className="loading-shell relative overflow-hidden w-full max-w-xl rounded-[28px] border border-blue-200/80 bg-white/90 p-6 sm:p-8 shadow-2xl shadow-blue-200/40">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_35%)]" />

        <div className="relative z-10 flex items-start gap-4">
          <div className="loading-emblem shrink-0 rounded-2xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-500/30">
            <ShieldCheck size={compact ? 20 : 26} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.28em] text-blue-500/80">
              <Sparkles size={12} className="text-blue-500" />
              DelayShield AI
            </div>
            <h2 className={`${compact ? 'text-xl' : 'text-2xl'} font-black text-blue-950 mt-2 tracking-tight`}>
              {title}
            </h2>
            <p className="text-sm text-blue-700/75 mt-2 leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="hidden sm:flex items-center justify-center shrink-0">
            <div className="loading-radar">
              <Radar size={compact ? 38 : 44} className="text-blue-500" />
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-6 space-y-3">
          {steps.map((step, index) => {
            const isActive = index === activeStep;
            const isDone = index < activeStep;

            return (
              <div
                key={step}
                className={`rounded-2xl border px-4 py-3 transition-all duration-500 ${
                  isActive
                    ? 'border-blue-300 bg-blue-50 shadow-md shadow-blue-100'
                    : isDone
                      ? 'border-emerald-200 bg-emerald-50/70'
                      : 'border-slate-200 bg-white/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isDone
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-bold ${isActive ? 'text-blue-950' : 'text-slate-600'}`}>
                      {step}
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isActive
                            ? 'loading-progress bg-blue-600'
                            : isDone
                              ? 'w-full bg-emerald-500'
                              : 'w-0 bg-slate-300'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
