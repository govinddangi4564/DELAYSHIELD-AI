import React, { useState, useEffect, useCallback } from 'react';
import ShipmentCard from '../components/ShipmentCard';
import RiskMeter from '../components/RiskMeter';
import DecisionPanel from '../components/DecisionPanel';
import CostAnalysis from '../components/CostAnalysis';
import SimulationPanel from '../components/SimulationPanel';
import MapView from '../components/MapView';
import AIExplanation from '../components/AIExplanation';
import AlertBanner from '../components/AlertBanner';
import HistoryPanel from '../components/HistoryPanel';
import { 
  getShipments, 
  analyzeShipment, 
  transformAnalysis, 
  getHistory, 
  getCityTraffic,
  saveDecision
} from '../services/api';
import { RefreshCw, Loader2, List, LayoutDashboard } from 'lucide-react';

const DashboardPage = () => {
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [cityTraffic, setCityTraffic] = useState([]);
  
  const [loadingShipments, setLoadingShipments] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState(null);

  // ── Cache for Analysis ──
  const [analysisCache, setAnalysisCache] = useState({});

  // ── Fetch shipments, history, and traffic on mount ──
  const fetchGlobalData = useCallback(async (isInitial = false) => {
    // Only show full loader if we have no data or it's the first load
    if (isInitial) setLoadingShipments(true);
    setError(null);
    try {
      const [shipmentData, historyData, trafficData] = await Promise.all([
        getShipments(),
        getHistory(),
        getCityTraffic()
      ]);
      
      setShipments(shipmentData);
      setHistory(historyData);
      setCityTraffic(trafficData);
      
      if (shipmentData.length > 0 && !selectedShipment) {
        setSelectedShipment(shipmentData[0]);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load system data. Is the backend running?');
    } finally {
      setLoadingShipments(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed selectedShipment to stop infinite loop

  useEffect(() => {
    fetchGlobalData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-analyze when selected shipment changes ──
  useEffect(() => {
    if (!selectedShipment) return;

    // Check Cache first for performance
    if (analysisCache[selectedShipment.id]) {
      setAnalysis(analysisCache[selectedShipment.id]);
      return;
    }

    const analyze = async () => {
      setLoadingAnalysis(true);
      try {
        const raw = selectedShipment._raw || selectedShipment;
        const payload = {
          traffic: raw.traffic ?? selectedShipment.riskFactors?.traffic ?? 50,
          delay: raw.delay ?? selectedShipment.riskFactors?.delay ?? 20,
          lat: raw.source?.lat ?? selectedShipment.origin?.lat,
          lon: raw.source?.lon ?? selectedShipment.origin?.lng,
          endLat: raw.destination?.lat ?? selectedShipment.destination?.lat,
          endLon: raw.destination?.lon ?? selectedShipment.destination?.lng,
          priority: raw.priority ?? 'Medium',
          shipmentId: selectedShipment.id,
        };
        const result = await analyzeShipment(payload);
        const transformed = transformAnalysis(result);
        
        setAnalysis(transformed);
        setAnalysisCache(prev => ({ ...prev, [selectedShipment.id]: transformed }));
      } catch (err) {
        console.error('Analysis failed:', err);
        setAnalysis(null);
      } finally {
        setLoadingAnalysis(false);
      }
    };

    analyze();
  }, [selectedShipment?.id]);

  const handleActionExecution = async (actionType) => {
    if (!selectedShipment) return;
    
    // Calculate cost based on current analysis
    const costValue = analysis?.potentialLoss || analysis?.currentCost || 500;
    const costImpact = actionType === 'Reroute' ? `+$${costValue}` : `-$${Math.round(costValue * 0.3)}`;

    // 1. Save to History API
    try {
      await saveDecision({
        shipmentId: selectedShipment.id,
        route: analysis?.route?.majorRoads?.join(', ') || 'Optimized Highway',
        decision: actionType,
        riskScore: analysis?.riskScore === 'High' ? 85 : 45,
        costImpact: costImpact
      });
    } catch (err) {
      console.warn('Failed to save decision to backend, updating UI only');
    }

    // 2. Update UI locally for instant feedback
    const updatedShipment = {
      ...selectedShipment,
      status: actionType === 'Reroute' ? 'Rerouted' : 'Optimized',
      riskScore: 'Low',
    };
    setSelectedShipment(updatedShipment);

    if (analysis) {
      const newAnalysis = {
        ...analysis,
        riskScore: 'Low',
        alert: {
          severity: 'Low',
          message: `✅ Plan Executed: ${actionType} successful. Impact: ${costImpact}`
        }
      };
      setAnalysis(newAnalysis);
      setAnalysisCache(prev => ({ ...prev, [selectedShipment.id]: newAnalysis }));
    }

    setShipments(prev => prev.map(s => s.id === selectedShipment.id ? updatedShipment : s));
    
    // 3. Refresh history after a short delay
    setTimeout(() => {
      getHistory().then(setHistory).catch(console.error);
    }, 1000);
  };

  // Derived values
  const riskScore = analysis?.riskScore ?? selectedShipment?.riskScore ?? 'Low';
  const riskFactors = analysis?.riskFactors ?? selectedShipment?.riskFactors ?? { traffic: 0, weather: 0, delay: 0 };
  const currentCost = analysis?.currentCost ?? selectedShipment?.currentCost ?? 0;
  const potentialLoss = analysis?.potentialLoss ?? selectedShipment?.potentialLoss ?? 0;
  const insights = analysis?.insights ?? null;

  const getAlertMessage = () => {
    if (analysis?.alert?.message) return analysis.alert.message;
    if (!selectedShipment) return '✅ System ready. Select a shipment to begin.';
    if (riskScore === 'High') return `⚠️ High Risk! Immediate action required for ${selectedShipment.id}`;
    if (riskScore === 'Medium') return `🔔 Moderate Risk detected for ${selectedShipment.id}. Monitoring advised.`;
    return `✅ Shipment ${selectedShipment.id} is on schedule with low risk.`;
  };

  const getAlertSeverity = () => analysis?.alert?.severity ?? riskScore;

  if (loadingShipments) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-blue-500 animate-spin" />
          <p className="text-blue-600 font-bold text-sm">DelayShield Intelligence Booting...</p>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error && shipments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass-panel p-10 border-2 border-red-200 text-center max-w-md">
          <h2 className="text-xl font-black text-red-800 mb-2">Connection Error</h2>
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={fetchGlobalData}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <AlertBanner 
        severity={getAlertSeverity()} 
        message={getAlertMessage()} 
      />
      
      <div className="p-8 max-w-[1700px] mx-auto w-full animate-in fade-in duration-700">
      
      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 text-white">
            <LayoutDashboard size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-blue-950 tracking-tight flex items-center gap-2">
              DelayShield <span className="text-blue-600">AI</span>
            </h1>
            <p className="text-xs font-bold text-blue-500/80 uppercase tracking-widest mt-1">
              Global Supply Chain Intelligence Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchGlobalData}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw size={14} className={loadingShipments ? 'animate-spin' : ''} /> Sync All Node Data
          </button>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-5 py-2.5 rounded-xl shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-emerald-700 uppercase tracking-tighter">API Live</span>
          </div>
        </div>
      </header>

      {/* ── Main Layout Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
        
        {/* Left Column: Shipment Selector & History (4/12) */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Active Shipments */}
          <div className="flex flex-col h-[400px]">
             <h2 className="text-xs font-black text-blue-900/40 uppercase tracking-widest mb-4 flex items-center gap-2">
              <List size={14} /> Active Shipments ({shipments.length})
            </h2>
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-2">
              {shipments.map(shipment => (
                <ShipmentCard
                  key={shipment.id}
                  shipment={shipment}
                  isSelected={selectedShipment?.id === shipment.id}
                  onClick={setSelectedShipment}
                />
              ))}
            </div>
          </div>

          {/* History Panel */}
          <div className="flex flex-col">
            <HistoryPanel historyData={history} />
          </div>
        </div>

        {/* Right Column: Visualization & AI Analytics (8/12) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Visualization Layer */}
          <div>
            <h2 className="text-xs font-black text-blue-900/40 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-4 h-px bg-blue-200" /> AI Intelligent Routing
            </h2>
            <div className="h-[550px] rounded-3xl overflow-hidden border border-blue-200 shadow-2xl shadow-blue-500/5 relative bg-white">
              <MapView
                shipment={selectedShipment}
                route={analysis?.route}
                cityTrafficData={cityTraffic}
              />
            </div>
          </div>

        </div>
      </div>

      {/* AI Insights */}
      <section className="mb-8 animate-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-xs font-black text-blue-900/40 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-4 h-px bg-blue-200" /> AI Insights (Decision Engine)
        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">
          <DecisionPanel insights={insights} onExecute={handleActionExecution} />
          {insights ? (
            <AIExplanation
              summary={insights.summary}
              explanation={insights.explanation}
              keyFactors={insights.keyFactors}
            />
          ) : (
            <div className="glass-panel border-2 border-blue-100 p-8 text-blue-400 font-bold">
              AI explanation will appear after route analysis completes.
            </div>
          )}
        </div>
      </section>

      {/* Simulation Workspace */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <SimulationPanel />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-6">
          {loadingAnalysis ? (
            <div className="glass-panel p-10 flex flex-col items-center justify-center min-h-[260px]">
              <Loader2 size={28} className="text-blue-500 animate-spin mb-4" />
              <p className="text-blue-500 font-bold text-xs uppercase tracking-widest">
                Running AI diagnostics...
              </p>
            </div>
          ) : (
            <>
              <RiskMeter riskScore={riskScore} factors={riskFactors} />
              <CostAnalysis currentCost={currentCost} potentialLoss={potentialLoss} />
            </>
          )}
        </div>
      </section>

      </div>
    </div>
  );
};

export default DashboardPage;
