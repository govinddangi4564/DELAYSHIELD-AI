import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Map as MapIcon, BrainCircuit, Activity, RefreshCw } from 'lucide-react';

import MapView from '../components/MapView';
import RiskMeter from '../components/RiskMeter';
import CostAnalysis from '../components/CostAnalysis';
import DecisionPanel from '../components/DecisionPanel';
import AIExplanation from '../components/AIExplanation';
import ModeComparison from '../components/ModeComparison';
import SimulationPanel from '../components/SimulationPanel';
import LoadingState from '../components/LoadingState';

import { 
  getShipments, 
  analyzeShipment, 
  transformAnalysis, 
  getCityTraffic 
} from '../services/api';
import { useNavigationLoading } from '../components/NavigationLoadingContext';

const ShipmentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { finishNavigation } = useNavigationLoading();

  const [shipment, setShipment] = useState(location.state?.shipment || null);
  const [analysis, setAnalysis] = useState(location.state?.analysis || null);
  const [cityTraffic, setCityTraffic] = useState([]);
  const [activeTab, setActiveTab] = useState('tracking'); // 'tracking', 'strategy', 'simulation'
  
  const [loading, setLoading] = useState(!shipment);
  const [analyzing, setAnalyzing] = useState(!analysis && shipment);
  const [error, setError] = useState(null);

  useEffect(() => {
    finishNavigation(`/shipment/${id}`);
  }, [id, finishNavigation]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let currentShipment = shipment;
        
        // Fetch shipment if not provided in state
        if (!currentShipment) {
          const allShipments = await getShipments();
          currentShipment = allShipments.find(s => s.id === id);
          if (!currentShipment) throw new Error("Shipment not found");
          setShipment(currentShipment);
        }

        // Fetch city traffic for map
        getCityTraffic().then(setCityTraffic).catch(console.error);

        // Analyze shipment if not already analyzed in state
        if (!analysis) {
          setAnalyzing(true);
          const raw = currentShipment._raw || currentShipment;
          const payload = {
            traffic: raw.traffic ?? currentShipment.riskFactors?.traffic ?? 50,
            delay: raw.delay ?? currentShipment.riskFactors?.delay ?? 20,
            lat: currentShipment.origin?.lat || 0,
            lon: currentShipment.origin?.lng || 0,
            endLat: currentShipment.destination?.lat || 0,
            endLon: currentShipment.destination?.lng || 0,
            priority: currentShipment.priority || 'Medium',
            shipmentId: currentShipment.id,
            origin: currentShipment.origin?.name || 'Origin',
            destination: currentShipment.destination?.name || 'Destination',
          };

          const data = await analyzeShipment(payload);
          const transformed = transformAnalysis(data);
          setAnalysis(transformed);
        }
      } catch (err) {
        console.error("Error loading shipment details:", err);
        setError(err.message || "Failed to load shipment data.");
      } finally {
        setLoading(false);
        setAnalyzing(false);
      }
    };

    fetchData();
  }, [id, shipment, analysis]);

  const handleActionExecution = (actionType, costImpact) => {
    if (analysis) {
      setAnalysis({
        ...analysis,
        riskScore: 'Low',
        alert: {
          severity: 'Low',
          message: `✅ Plan Executed: ${actionType} successful. Impact: ${costImpact}`
        }
      });
    }
  };

  const handleSimulate = (results) => {
    navigate('/simulation', { state: { data: results, scNames: ["Base", "Route Alt 1", "Delay"] } });
  };

  if (loading) {
    return <LoadingState fullScreen title="Loading Shipment Details" steps={['Locating shipment data']} />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-blue-50">
        <div className="glass-panel p-8 text-center max-w-md border-red-200">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-red-500 mb-6">{error}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  // Derived Values
  const riskScore = analysis?.riskScore ?? shipment?.riskScore ?? 'Low';
  const riskFactors = analysis?.riskFactors ?? shipment?.riskFactors ?? { traffic: 0, weather: 0, delay: 0 };
  const currentCost = analysis?.currentCost ?? shipment?.currentCost ?? 0;
  const potentialLoss = analysis?.potentialLoss ?? shipment?.potentialLoss ?? 0;
  const insights = analysis?.insights ?? null;
  const modeComparison = analysis?.modeComparison ?? null;

  return (
    <div className="min-h-screen bg-blue-50 p-4 md:p-8 pt-8 pb-24 md:pb-8">
      
      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm font-bold text-blue-500 hover:text-blue-700 transition-colors mb-3"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-blue-950 tracking-tight">{shipment.id}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
              shipment.status === 'Delayed' ? 'bg-red-100 text-red-700' :
              shipment.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
              'bg-emerald-100 text-emerald-700'
            }`}>
              {shipment.status}
            </span>
          </div>
          <p className="text-blue-800/60 font-semibold mt-1">
            {shipment.origin.name} → {shipment.destination.name}
          </p>
        </div>
        
        {/* Analyzing Status */}
        {analyzing && (
          <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold animate-pulse">
            <RefreshCw size={16} className="animate-spin" /> AI Analyzing Route...
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-6 pb-2">
        <button
          onClick={() => setActiveTab('tracking')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'tracking' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-blue-600 hover:bg-blue-50'
          }`}
        >
          <MapIcon size={16} /> Live Tracking & Metrics
        </button>
        <button
          onClick={() => setActiveTab('strategy')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'strategy' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          <BrainCircuit size={16} /> AI Strategy
        </button>
        <button
          onClick={() => setActiveTab('simulation')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'simulation' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-white text-purple-600 hover:bg-purple-50'
          }`}
        >
          <Activity size={16} /> Simulation Workspace
        </button>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Tracking Tab */}
        {activeTab === 'tracking' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8">
              <div className="h-[550px] rounded-3xl overflow-hidden border border-blue-200 shadow-2xl shadow-blue-500/5 relative bg-white">
                <MapView
                  shipment={shipment}
                  route={analysis?.route}
                  cityTrafficData={cityTraffic}
                />
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-6">
              <RiskMeter riskScore={riskScore} factors={riskFactors} />
              <CostAnalysis currentCost={currentCost} potentialLoss={potentialLoss} />
            </div>
          </div>
        )}

        {/* Strategy Tab */}
        {activeTab === 'strategy' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">
              <DecisionPanel insights={insights} onExecute={handleActionExecution} />
              {insights ? (
                <AIExplanation
                  summary={insights.summary}
                  explanation={insights.explanation}
                  keyFactors={insights.keyFactors}
                />
              ) : (
                <div className="glass-panel border-2 border-blue-100 p-8 text-blue-400 font-bold flex items-center justify-center">
                  {analyzing ? 'AI explanation generating...' : 'AI explanation unavailable.'}
                </div>
              )}
            </div>
            
            {modeComparison && (
              <ModeComparison data={modeComparison} />
            )}
          </div>
        )}

        {/* Simulation Tab */}
        {activeTab === 'simulation' && (
          <div className="space-y-8">
            <SimulationPanel 
              shipment={shipment} 
              onSimulate={handleSimulate}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default ShipmentDetailsPage;
