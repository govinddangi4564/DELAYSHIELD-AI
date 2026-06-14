import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Navigation, Eye, Package, Clock, Truck, MapPin, 
  CheckCircle2, QrCode, Copy, ExternalLink, ShieldAlert,
  Search
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { useShipments } from '../context/ShipmentContext';
import MapView from '../components/MapView';

const KPICard = ({ title, value, icon: Icon, colorClass, borderClass, bgClass }) => (
  <div className={`bg-white rounded-2xl border border-blue-100 shadow-lg shadow-blue-100/50 p-6 border-l-4 ${borderClass} transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgClass}`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
    </div>
    <div>
      <h3 className="text-3xl font-black text-slate-800 mb-1">{value}</h3>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</p>
    </div>
  </div>
);

const ExtensibleTimeline = ({ shipment }) => {
  // Extensible event architecture
  // In Phase 2, this array would be fetched from the backend (e.g. shipment.events)
  // For Phase 1, we derive standard events based on the shipment status
  const events = useMemo(() => {
    if (!shipment) return [];
    
    const s = shipment.status;
    const history = [];
    
    // Helper to determine status flags based on current milestone
    const getStatusState = (stepIndex, currentStepIndex) => {
      if (stepIndex < currentStepIndex) return 'completed';
      if (stepIndex === currentStepIndex) return 'active';
      return 'pending';
    };

    let currentStepIndex = 0;
    if (s === 'Dispatched') currentStepIndex = 1;
    if (s === 'In Transit' || s === 'At Risk' || s === 'Delayed') currentStepIndex = 2;
    if (s === 'Delivered') currentStepIndex = 4; // Skip Destination Arrival for now or set it implicitly

    // If Delayed, maybe we show an alert on the active step? We'll handle visually.

    return [
      {
        id: 1,
        title: 'Order Created',
        state: getStatusState(0, currentStepIndex),
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString(),
        location: shipment.origin?.name || shipment.origin
      },
      {
        id: 2,
        title: 'Dispatched from Origin',
        state: getStatusState(1, currentStepIndex),
        timestamp: currentStepIndex >= 1 ? new Date(Date.now() - 12 * 60 * 60 * 1000).toLocaleString() : 'Pending',
        location: shipment.origin?.name || shipment.origin
      },
      {
        id: 3,
        title: 'In Transit',
        state: getStatusState(2, currentStepIndex),
        timestamp: currentStepIndex >= 2 ? new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString() : 'Pending',
        location: 'En Route',
        isDelayed: s === 'Delayed',
        isAtRisk: s === 'At Risk'
      },
      {
        id: 4,
        title: 'Destination Arrival',
        state: getStatusState(3, currentStepIndex),
        timestamp: `Exp: ${shipment.etas?.updated || shipment.eta || 'Unknown'}`,
        location: shipment.destination?.name || shipment.destination
      },
      {
        id: 5,
        title: 'Delivered',
        state: getStatusState(4, currentStepIndex),
        timestamp: currentStepIndex >= 4 ? new Date().toLocaleString() : 'Pending',
        location: shipment.destination?.name || shipment.destination
      }
    ];
  }, [shipment]);

  return (
    <div className="relative ml-3 space-y-6 pb-6">
      {events.map((evt, index) => {
        const isLast = index === events.length - 1;
        const lineClass = isLast ? '' : (evt.state === 'completed' ? 'border-l-2 border-emerald-500' : 'border-l-2 border-slate-200');
        
        return (
          <div key={evt.id} className={`relative ${lineClass} pb-6 last:pb-0 ${evt.state === 'pending' ? 'opacity-60' : ''}`}>
            <div className={`relative pl-6 ${index > 0 ? '-mt-6' : ''}`}>
              {/* Icon / Node */}
              {evt.state === 'completed' && (
                <div className="absolute -left-[11px] top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-white">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
              )}
              {evt.state === 'active' && (
                <div className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full ring-4 ring-white shadow-[0_0_0_4px_rgba(59,130,246,0.2)] animate-pulse-slow ${evt.isDelayed ? 'bg-red-500' : evt.isAtRisk ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
              )}
              {evt.state === 'pending' && (
                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-300 ring-4 ring-white"></div>
              )}

              {/* Content */}
              <div className="flex justify-between items-start mb-0.5 pt-0.5">
                <span className={`font-bold text-sm ${evt.state === 'active' ? (evt.isDelayed ? 'text-red-600' : evt.isAtRisk ? 'text-amber-600' : 'text-blue-700') : 'text-slate-800'}`}>
                  {evt.title}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${evt.state === 'active' ? 'text-blue-500 bg-blue-50 border-blue-100' : 'text-slate-400 bg-slate-50 border-slate-100'}`}>
                  {evt.timestamp}
                </span>
              </div>
              
              <p className={`text-xs font-medium ${evt.state === 'completed' ? 'text-emerald-600' : evt.state === 'active' ? 'text-blue-600 font-bold mb-2' : 'text-slate-500'}`}>
                {evt.state === 'completed' ? 'Completed' : evt.state === 'active' ? 'Active' : 'Pending'} ({evt.location})
              </p>
              
              {/* Extra details for active state */}
              {evt.state === 'active' && (
                <div className={`rounded-lg p-3 border text-xs ${evt.isDelayed ? 'bg-red-50 border-red-100 text-red-700' : evt.isAtRisk ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                  <p className="font-bold mb-1 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" /> En route to {evt.location}
                  </p>
                  <p>
                    {evt.isDelayed ? 'Shipment is currently experiencing delays.' : evt.isAtRisk ? 'Shipment is at risk of missing SLA deadline.' : 'Shipment is progressing normally.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TrackingCenterPage = () => {
  const navigate = useNavigate();
  const { shipments } = useShipments();
  const [activeShipmentId, setActiveShipmentId] = useState(shipments[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');

  const activeShipment = useMemo(() => {
    return shipments.find(s => s.id === activeShipmentId) || shipments[0];
  }, [shipments, activeShipmentId]);

  const kpis = useMemo(() => {
    return {
      tracked: shipments.length,
      live: shipments.filter(s => s.status === 'In Transit' || s.status === 'At Risk' || s.status === 'Delayed').length,
      activeSessions: Math.max(1, Math.floor(shipments.length * 0.4))
    };
  }, [shipments]);

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'Low': return 'emerald';
      case 'Medium': return 'amber';
      case 'High': return 'orange';
      case 'Critical': return 'red';
      default: return 'slate';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'In Transit': return 'blue';
      case 'Delivered': return 'emerald';
      case 'Delayed': return 'red';
      case 'At Risk': return 'amber';
      default: return 'slate';
    }
  };

  const handleSearch = () => {
    const found = shipments.find(s => s.id.toLowerCase() === searchQuery.toLowerCase());
    if (found) {
      setActiveShipmentId(found.id);
    } else {
      alert("Shipment not found.");
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-cyan-600 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/30 text-white">
            <Navigation size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-blue-950 tracking-tight font-display">Tracking Center</h1>
            <p className="text-xs font-bold text-blue-500/80 uppercase tracking-widest mt-1">Real-Time Shipment Visibility</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title="Active Sessions" value={kpis.activeSessions} icon={Eye} colorClass="text-cyan-600" borderClass="border-l-cyan-500" bgClass="bg-cyan-50" />
        <KPICard title="Tracked Shipments" value={kpis.tracked} icon={Package} colorClass="text-blue-600" borderClass="border-l-blue-500" bgClass="bg-blue-50" />
        <KPICard title="Avg ETA Accuracy" value="96.3%" icon={Clock} colorClass="text-emerald-600" borderClass="border-l-emerald-500" bgClass="bg-emerald-50" />
        <KPICard title="Live Vehicles" value={kpis.live} icon={Truck} colorClass="text-amber-600" borderClass="border-l-amber-500" bgClass="bg-amber-50" />
      </div>

      {/* Map Section */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-lg shadow-blue-50/50 overflow-hidden mb-8 flex flex-col md:flex-row h-auto md:h-[600px]">
        
        {/* Left Side: Shipment Queue */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col bg-slate-50 h-full max-h-[400px] md:max-h-full overflow-y-auto">
          <div className="p-4 border-b border-slate-200 sticky top-0 bg-slate-50 z-10 flex justify-between items-center">
             <h2 className="text-sm font-bold text-slate-800">Tracked Shipments</h2>
             <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">{shipments.length}</span>
          </div>
          
          <div className="flex flex-col">
            {shipments.map((s) => {
              const isActive = s.id === activeShipmentId;
              const sColor = getStatusColor(s.status);
              const rColor = getRiskColor(s.riskScore || 'Low');
              
              // Mock progress calculation based on status
              const progressPct = s.status === 'Delivered' ? 100 : (s.status === 'In Transit' ? 65 : (s.status === 'At Risk' ? 50 : 30));

              return (
                <div 
                  key={s.id} 
                  onClick={() => setActiveShipmentId(s.id)}
                  className={`p-4 border-b border-slate-200 cursor-pointer transition-colors ${isActive ? 'bg-white border-l-4 border-l-blue-500' : 'hover:bg-slate-100 border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-800 text-sm">{s.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-${sColor}-50 text-${sColor}-600 border border-${sColor}-100`}>{s.status}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 mb-2 truncate">
                    {s.origin?.name || s.origin} → {s.destination?.name || s.destination}
                  </p>
                  
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                    <div className={`h-full bg-blue-500`} style={{ width: `${progressPct}%` }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-${rColor}-50 text-${rColor}-600`}>
                      SLA: {s.riskScore || 'Low'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{progressPct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Live Map */}
        <div className="flex-1 relative flex flex-col h-[400px] md:h-full">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Live Shipment Map
            </h2>
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Tracking Active
            </div>
          </div>
          
          <div className="flex-1 relative bg-slate-100">
             {activeShipment && (
               <MapView shipment={activeShipment} hideControls={false} />
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Tracking */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-lg shadow-blue-50/50 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-slate-400" /> Quick Track
          </h2>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
            <div className="w-40 h-40 bg-white p-2.5 rounded-xl flex flex-col items-center justify-center border border-slate-200 shadow-sm shrink-0">
              <QRCode 
                value={`${window.location.origin}/share/${activeShipment?.id || ''}`} 
                size={140}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 140 140`}
              />
            </div>
            
            <div className="flex-1 w-full space-y-4">
              
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                 <input 
                   type="text" 
                   placeholder="Enter Shipment ID" 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   className="flex-1 bg-transparent text-sm font-bold text-slate-700 focus:outline-none px-2"
                 />
                 <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors">
                    <Search className="w-4 h-4" />
                 </button>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Public Tracking Link</label>
                <div className="flex">
                  <input 
                    type="text" 
                    readOnly 
                    value={`${window.location.origin}/share/${activeShipment?.id || ''}`} 
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-l-xl px-3 py-2 text-sm text-slate-600 focus:outline-none"
                  />
                  <button className="bg-white border border-l-0 border-slate-200 rounded-r-xl px-3 py-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Session ID</p>
                  <p className="text-xs font-bold text-slate-700">TRK-{Math.floor(Math.random() * 90000)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Origin</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{activeShipment?.origin?.name || 'Unknown'}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Destination</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{activeShipment?.destination?.name || 'Unknown'}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Current ETA</p>
                  <p className="text-xs font-bold text-slate-700">{activeShipment?.etas?.updated || activeShipment?.eta || 'Pending'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <button 
             onClick={() => navigate('/sla-guardian', { state: { openShipmentId: activeShipment?.id } })}
             className="mt-auto w-full py-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <ShieldAlert className="w-4 h-4" /> Open SLA Guardian Analysis
          </button>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-lg shadow-blue-50/50 p-6 flex flex-col max-h-[600px] overflow-y-auto">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Shipment Journey — {activeShipment?.id}</h2>
          <ExtensibleTimeline shipment={activeShipment} />
        </div>

      </div>
    </div>
  );
};

export default TrackingCenterPage;
