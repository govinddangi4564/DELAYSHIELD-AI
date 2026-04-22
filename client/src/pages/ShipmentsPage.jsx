import React, { useState, useEffect } from 'react';
import { PackageSearch, MapPin, Truck, AlertTriangle, ArrowRight, Loader2, RefreshCw, Activity } from 'lucide-react';
import { getShipments, analyzeShipment, transformAnalysis } from '../services/api';

const ShipmentsPage = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null);

  const fetchShipments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getShipments();
      setShipments(data);
    } catch (err) {
      console.error('Error loading shipments:', err);
      setError('Failed to load shipments. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleAnalyze = async (shipment) => {
    if (selectedId === shipment.id && analysisData) {
      setSelectedId(null);
      setAnalysisData(null);
      return;
    }

    setSelectedId(shipment.id);
    setAnalyzingId(shipment.id);
    setAnalysisData(null);

    try {
      const raw = shipment._raw || shipment;
      const payload = {
        traffic: raw.traffic ?? shipment.riskFactors?.traffic ?? 50,
        delay: raw.delay ?? shipment.riskFactors?.delay ?? 20,
        lat: raw.source?.lat ?? shipment.origin?.lat,
        lon: raw.source?.lon ?? shipment.origin?.lng,
        endLat: raw.destination?.lat ?? shipment.destination?.lat,
        endLon: raw.destination?.lon ?? shipment.destination?.lng,
        priority: raw.priority ?? 'Medium',
        shipmentId: shipment.id,
      };
      const result = await analyzeShipment(payload);
      const transformed = transformAnalysis(result);
      setAnalysisData(transformed);
    } catch (err) {
      console.error('Analysis failed:', err);
      setAnalysisData({ error: 'Analysis failed. Please try again.' });
    } finally {
      setAnalyzingId(null);
    }
  };

  const statusColors = {
    'In Transit': 'bg-blue-100 text-blue-700 border-blue-300',
    'Dispatched': 'bg-purple-100 text-purple-700 border-purple-300',
    'Delayed': 'bg-red-100 text-red-700 border-red-300',
    'Delivered': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  };

  const priorityColors = {
    High: 'bg-red-50 text-red-700 border-red-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-blue-500 animate-spin" />
          <p className="text-blue-600 font-bold text-sm">Loading shipments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="glass-panel p-10 border-2 border-red-200 text-center max-w-md">
          <RefreshCw size={32} className="text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-black text-red-800 mb-2">Connection Error</h2>
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button onClick={fetchShipments} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 pt-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-300">
            <PackageSearch size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-blue-950">All Shipments</h1>
            <p className="text-sm font-bold text-blue-500 uppercase tracking-widest">
              {shipments.length} Active Shipments
            </p>
          </div>
        </div>
        <button
          onClick={fetchShipments}
          className="flex items-center gap-2 bg-white border border-blue-200 hover:border-blue-400 text-blue-700 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all hover:shadow-md active:scale-95"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </header>

      {/* Shipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {shipments.map((shipment) => (
          <div key={shipment.id} className="flex flex-col">
            {/* Card */}
            <div
              onClick={() => handleAnalyze(shipment)}
              className={`glass-panel p-5 cursor-pointer transition-all duration-300 border-2 ${
                selectedId === shipment.id
                  ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-xl shadow-blue-200'
                  : 'border-blue-200 hover:border-blue-400 hover:shadow-lg'
              }`}
            >
              {/* Top row */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg text-white shadow-sm shadow-blue-300">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-blue-950">{shipment.id}</h3>
                    <p className="text-xs text-blue-600 font-medium">{shipment.name}</p>
                  </div>
                </div>
                <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${statusColors[shipment.status] || statusColors['In Transit']}`}>
                  {shipment.status}
                </span>
              </div>

              {/* Route */}
              <div className="flex items-center gap-2 text-sm text-blue-800 mb-3">
                <MapPin size={14} className="text-blue-500 shrink-0" />
                <span className="font-medium truncate">
                  {shipment.origin.name}
                  <ArrowRight size={12} className="inline mx-1 text-blue-400" />
                  {shipment.destination.name}
                </span>
              </div>

              {/* Meta tags */}
              <div className="flex flex-wrap gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${priorityColors[shipment.priority] || priorityColors.Medium}`}>
                  {shipment.priority} Priority
                </span>
                {shipment.cargoType && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-slate-50 text-slate-600 border-slate-200">
                    {shipment.cargoType}
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  shipment.riskScore === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
                  shipment.riskScore === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {shipment.riskScore} Risk
                </span>
              </div>

              {/* Analyze prompt */}
              <div className="mt-4 pt-3 border-t border-blue-100 flex items-center justify-between">
                <span className="text-[11px] text-blue-500 font-bold">
                  {selectedId === shipment.id ? 'Click to collapse' : 'Click to analyze'}
                </span>
                {analyzingId === shipment.id && (
                  <Loader2 size={14} className="text-blue-500 animate-spin" />
                )}
                {selectedId === shipment.id && !analyzingId && (
                  <Activity size={14} className="text-blue-500" />
                )}
              </div>
            </div>

            {/* Expanded Analysis Panel */}
            {selectedId === shipment.id && analysisData && !analysisData.error && (
              <div className="glass-panel p-5 border-2 border-blue-300 border-t-0 rounded-t-none animate-in slide-in-from-top duration-300">
                <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Activity size={14} /> AI Analysis Results
                </h4>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200">
                    <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Risk</p>
                    <p className={`text-lg font-black ${
                      analysisData.riskScore === 'High' ? 'text-red-600' :
                      analysisData.riskScore === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {analysisData.riskScore}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200">
                    <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Cost</p>
                    <p className="text-lg font-black text-blue-950">${analysisData.currentCost}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200">
                    <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Loss</p>
                    <p className="text-lg font-black text-red-600">+${analysisData.potentialLoss}</p>
                  </div>
                </div>

                {/* AI Decision */}
                {analysisData.insights && (
                  <div className="bg-blue-600 rounded-xl p-4 text-white">
                    <p className="text-xs font-bold text-blue-200 uppercase mb-1">AI Decision</p>
                    <p className="text-sm font-bold">{analysisData.insights.summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* Error for this analysis */}
            {selectedId === shipment.id && analysisData?.error && (
              <div className="glass-panel p-4 border-2 border-red-200 border-t-0 rounded-t-none text-center">
                <p className="text-red-600 font-bold text-sm flex items-center justify-center gap-2">
                  <AlertTriangle size={14} /> {analysisData.error}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShipmentsPage;