import React from 'react';
import { Lightbulb, Info, Tag, Sparkles, ArrowRight } from 'lucide-react';

const TAG_COLORS = {
  Traffic: 'bg-orange-100 text-orange-700 border-orange-300',
  Weather: 'bg-sky-100 text-sky-700 border-sky-300',
  Delay: 'bg-purple-100 text-purple-700 border-purple-300',
  Cost: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  Risk: 'bg-red-100 text-red-700 border-red-300',
  Reroute: 'bg-blue-100 text-blue-700 border-blue-300',
  SLA: 'bg-amber-100 text-amber-700 border-amber-300',
};

const getTagColor = (tag) =>
  TAG_COLORS[tag] ?? 'bg-blue-100 text-blue-700 border-blue-300';

const AIExplanation = ({ summary, explanation, keyFactors = [] }) => {
  if (!summary && !explanation) return null;

  return (
    <div className="glass-panel border-2 border-blue-200 overflow-hidden h-full flex flex-col">
      <div className="flex items-center gap-3 px-6 py-4 bg-blue-600 border-b-2 border-blue-500">
        <div className="p-1.5 bg-white/20 rounded-lg">
          <Lightbulb size={18} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">
            AI Explanation
          </h3>
          <p className="text-[11px] text-blue-200 font-medium">
            Why this decision was recommended
          </p>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-5">
        {summary && (
          <div className="flex gap-3 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-xl">
            <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-blue-950 leading-relaxed break-words">
              {summary}
            </p>
          </div>
        )}

        {explanation && (
          <div className="rounded-2xl border border-blue-100 bg-white/80 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-blue-500 shrink-0" />
              <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">
                Reasoning
              </span>
            </div>
            <p className="text-sm text-blue-800 leading-relaxed font-medium break-words">
              {explanation}
            </p>
          </div>
        )}

        {keyFactors.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Tag size={13} className="text-blue-500" />
              <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">
                Key Factors
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {keyFactors.map((factor) => (
                <span
                  key={factor}
                  className={`text-xs font-black px-3 py-1.5 rounded-full border-2 ${getTagColor(factor)}`}
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto rounded-2xl bg-blue-950 px-5 py-4 text-blue-50 flex items-start gap-3">
          <ArrowRight size={16} className="mt-0.5 shrink-0 text-blue-300" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-blue-300 mb-1">
              What This Means
            </p>
            <p className="text-sm leading-relaxed">
              This explanation turns raw route signals into a decision-ready summary, so the recommendation and its reasoning stay visually connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIExplanation;
