import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ShipmentCard from '../components/ShipmentCard';
import AlertBanner from '../components/AlertBanner';
import HistoryPanel from '../components/HistoryPanel';
import LoadingState from '../components/LoadingState';
import QuickAnalysisForm from '../components/QuickAnalysisForm';
import { useNavigationLoading } from '../components/NavigationLoadingContext';
import { 
  getShipments, 
  getHistory, 
  createDynamicShipment,
  transformGeneratedShipment
} from '../services/api';
import { RefreshCw, List, LayoutDashboard } from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { finishNavigation } = useNavigationLoading();
  
  const [shipments, setShipments] = useState([]);
  const [history, setHistory] = useState([]);
  
  const [loadingShipments, setLoadingShipments] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [error, setError] = useState(null);

  // ── Fetch shipments and history on mount ──
  const fetchGlobalData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoadingShipments(true);
    setLoadingHistory(true);
    setError(null);
    try {
      const [shipmentData, historyData] = await Promise.all([
        getShipments(),
        getHistory()
      ]);
      
      setShipments(shipmentData);
      setHistory(historyData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load system data. Is the backend running?');
    } finally {
      setLoadingShipments(false);
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchGlobalData(true);
  }, [fetchGlobalData]);

  useEffect(() => {
    if (!loadingShipments) {
      finishNavigation('/dashboard');
    }
  }, [loadingShipments, finishNavigation]);

  // ── Handle AI Shipment Generation ──
  const handleGenerateShipment = async (origin, destination) => {
    setLoadingGenerate(true);
    setError(null);
    try {
      const response = await createDynamicShipment(origin, destination);
      if (!response.success) throw new Error(response.message || 'Generation failed');

      const result = transformGeneratedShipment(response.data);
      if (!result) throw new Error('Failed to parse AI response');

      const { transformed, insights: generatedInsights, modeComparison: mc } = result;

      // Build a full analysis object to pass to the detail page
      const fullAnalysis = {
        riskScore: transformed.riskScore,
        riskFactors: transformed.riskFactors,
        currentCost: transformed.currentCost,
        potentialLoss: transformed.potentialLoss,
        insights: generatedInsights,
        modeComparison: mc,
        alert: {
          severity: transformed.riskScore,
          message: `🧠 AI Generated: ${transformed.id} — ${transformed.origin.name} → ${transformed.destination.name}`
        },
        route: null,
      };

      // Navigate straight to the detail page
      navigate(`/shipment/${transformed.id}`, { 
        state: { 
          shipment: transformed, 
          analysis: fullAnalysis 
        } 
      });

    } catch (err) {
      console.error('Shipment generation failed:', err);
      setError(err.message || 'Failed to generate shipment. Please try again.');
    } finally {
      setLoadingGenerate(false);
    }
  };

  const globalRiskCount = shipments.filter(s => s.riskScore === 'High').length;
  const alertSeverity = globalRiskCount > 0 ? 'High' : 'Low';
  const alertMessage = globalRiskCount > 0 
    ? `⚠️ High Risk! ${globalRiskCount} active shipments require attention.` 
    : '✅ System ready. All active shipments are stable.';

  if (loadingShipments) {
    return (
      <LoadingState
        fullScreen
        title="DelayShield intelligence booting"
        subtitle="We are pulling in active shipments and history overlays so the dashboard opens with live data."
        steps={[
          'Connecting to logistics services',
          'Collecting shipment and history feeds',
          'Preparing overview interface',
        ]}
      />
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
            onClick={() => fetchGlobalData(true)}
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
        severity={alertSeverity} 
        message={alertMessage} 
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
              onClick={() => fetchGlobalData()}
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

        {/* ── Quick AI Shipment Generator ── */}
        <QuickAnalysisForm onAnalyze={handleGenerateShipment} isLoading={loadingGenerate} />

        {/* ── Main Layout Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
          
          {/* Left Column: Active Shipments (8/12) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <h2 className="text-xs font-black text-blue-900/40 uppercase tracking-widest flex items-center gap-2">
              <List size={14} /> Active Shipments ({shipments.length})
            </h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {shipments.map(shipment => (
                <div key={shipment.id} className="cursor-pointer hover:scale-[1.02] transition-transform duration-200">
                  <ShipmentCard
                    shipment={shipment}
                    isSelected={false}
                    onClick={() => navigate(`/shipment/${shipment.id}`)}
                  />
                  <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-center text-blue-500 bg-blue-50 rounded-lg py-1 border border-blue-100 shadow-sm">
                    Click to Open Intelligence Hub
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: History Panel (4/12) */}
          <div className="lg:col-span-4 flex flex-col h-[600px]">
            <h2 className="text-xs font-black text-blue-900/40 uppercase tracking-widest mb-4 flex items-center gap-2">
              <RefreshCw size={14} /> Recent Decisions
            </h2>
            <div className="h-full">
              <HistoryPanel historyData={history} loading={loadingHistory} />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
