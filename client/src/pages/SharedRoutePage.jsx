import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Truck, AlertTriangle, Map as MapIcon } from 'lucide-react';
import MapView from '../components/MapView';
import LoadingState from '../components/LoadingState';
import { getPublicShipment, analyzeShipment, transformAnalysis, getCityTraffic } from '../services/api';

const SharedRoutePage = () => {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [cityTraffic, setCityTraffic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getPublicShipment(id);
        if (!data) throw new Error("Shipment not found");
        setShipment(data);

        // Fetch city traffic for map
        getCityTraffic().then(setCityTraffic).catch(console.error);

        // Fetch analysis (route details)
        const raw = data._raw || data;
        const payload = {
          traffic: raw.traffic ?? 50,
          delay: raw.delay ?? 20,
          lat: data.origin?.lat || 0,
          lon: data.origin?.lng || 0,
          endLat: data.destination?.lat || 0,
          endLon: data.destination?.lng || 0,
          priority: data.priority || 'Medium',
          shipmentId: data.id,
          origin: data.origin?.name || 'Origin',
          destination: data.destination?.name || 'Destination',
        };

        const analysisData = await analyzeShipment(payload);
        setAnalysis(transformAnalysis(analysisData));
      } catch (err) {
        console.error("Error loading shared route:", err);
        setError("This shipment link is invalid or has expired.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return <LoadingState fullScreen title="Accessing Shared Map" steps={['Verifying secure link', 'Loading live tracking data']} />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-slate-950 text-white">
        <div className="glass-panel p-8 text-center max-w-md border-red-500/30 bg-red-500/5">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-red-500 mb-4">Link Error</h2>
          <p className="text-slate-400 mb-8 font-medium">{error}</p>
          <a href="/" className="inline-block px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all">
            Return Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Minimal Header */}
      <header className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Truck size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none mb-1">{shipment.id}</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                Live Delivery Route
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Tracking Active</span>
          </div>
        </div>
      </header>

      {/* Full Screen Map */}
      <main className="flex-1 relative">
        <MapView 
          shipment={shipment} 
          route={analysis?.route} 
          cityTrafficData={cityTraffic} 
          hideControls={true}
        />
        
        {/* Floating Info Overlay */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-5 rounded-3xl shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
                <MapIcon size={20} className="text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Destination</p>
                <p className="text-sm font-bold text-white truncate max-w-[180px]">
                  {shipment.destination.name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Status</p>
              <p className={`text-sm font-black ${
                shipment.status === 'Delayed' ? 'text-red-400' : 'text-blue-400'
              }`}>
                {shipment.status}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SharedRoutePage;
