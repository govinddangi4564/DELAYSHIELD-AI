import React, { useState } from 'react';
import ShipmentCard from '../components/ShipmentCard';
import RiskMeter from '../components/RiskMeter';
import DecisionPanel from '../components/DecisionPanel';
import CostAnalysis from '../components/CostAnalysis';
import SimulationPanel from '../components/SimulationPanel';
import MapView from '../components/MapView';
import AIExplanation from '../components/AIExplanation';
import AlertBanner from '../components/AlertBanner';
import { MOCK_SHIPMENTS, MOCK_AI_INSIGHTS } from '../services/mockData';
import { LayoutDashboard, RefreshCw, Layers } from 'lucide-react';

const DashboardPage = () => {
  const [selectedShipment, setSelectedShipment] = useState(MOCK_SHIPMENTS[0]);
  const insights = MOCK_AI_INSIGHTS[selectedShipment.id];

  const getAlertMessage = () => {
    if (selectedShipment.riskScore === 'High') {
      return `⚠️ High Risk! Immediate rerouting required for ${selectedShipment.id}`;
    }
    if (selectedShipment.riskScore === 'Medium') {
      return `🔔 Moderate Risk detected for ${selectedShipment.id}. Monitoring advised.`;
    }
    return `✅ Shipment ${selectedShipment.id} is on schedule with low risk.`;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AlertBanner 
        severity={selectedShipment.riskScore} 
        message={getAlertMessage()} 
      />
      
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 w-full">
      
      {/* ── Page Header ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <img 
            src="/ai_logo.png" 
            alt="DelayShield AI Logo" 
            className="w-14 h-14 object-contain rounded-2xl shadow-xl shadow-blue-500/20 bg-[#151c2c] ring-2 ring-blue-500/30" 
          />
          <div>
            <h1 className="text-3xl font-black text-blue-950 tracking-tight">
              Intelligence <span className="text-blue-600">Dashboard</span>
            </h1>
            <p className="text-xs font-bold text-blue-500/80 uppercase tracking-widest mt-1">
              Supply Chain Monitoring & AI Decision Support
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-blue-200 hover:border-blue-400 text-blue-700 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all hover:shadow-md active:scale-95">
            <RefreshCw size={14} className="animate-spin-slow" /> Sync Data
          </button>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-5 py-2.5 rounded-xl shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-emerald-700 uppercase tracking-tighter">Live Monitor</span>
          </div>
        </div>
      </header>

      {/* ── Tier 1: Live Overview (Perfectly flushed height) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
        
        {/* LEFT COLUMN: Shipments (3/12) */}
        <div className="lg:col-span-3 flex flex-col h-[350px] lg:h-[550px]">
          <h2 className="text-xs font-black text-blue-900/40 uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0">
            <span className="w-4 h-px bg-blue-200"></span> Active Shipments
          </h2>
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
            {MOCK_SHIPMENTS.map(shipment => (
              <ShipmentCard
                key={shipment.id}
                shipment={shipment}
                isSelected={selectedShipment.id === shipment.id}
                onClick={setSelectedShipment}
              />
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Visualization Map (9/12) */}
        <div className="lg:col-span-9 h-[350px] lg:h-[550px] rounded-3xl overflow-hidden border border-blue-200 shadow-2xl shadow-blue-500/5 relative">
            <MapView shipment={selectedShipment} />
        </div>
      </div>

      {/* ── Tier 2: Deep Analytics & Simulation ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
        
        {/* Simulation Panel (8/12) - Gets room to breathe horizontally */}
        <div className="lg:col-span-8 w-full">
           <SimulationPanel />
        </div>
        
        {/* Live Metrics (4/12) - Stacked vertically nicely next to the sim */}
        <div className="lg:col-span-4 flex flex-col gap-6">
           <RiskMeter
             riskScore={selectedShipment.riskScore}
             factors={selectedShipment.riskFactors}
           />
           <CostAnalysis
             currentCost={selectedShipment.currentCost}
             potentialLoss={selectedShipment.potentialLoss}
           />
        </div>

      </div>

      {/* ── Tier 3: AI Insights (Horizontal Layout) ── */}
      <div className="mt-8">
        <h2 className="text-xs font-black text-blue-900/40 uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0">
          <span className="w-4 h-px bg-blue-200"></span> AI Insights (Decision Engine)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <DecisionPanel insights={insights} />
          {insights && (
            <AIExplanation
              summary={insights.summary}
              explanation={insights.explanation}
              keyFactors={insights.keyFactors}
            />
          )}
        </div>
      </div>

      </div>
    </div>
  );
};

export default DashboardPage;
