import React, { useState, useMemo } from 'react';
import { 
  Package, Search, Filter, ChevronLeft, ChevronRight, 
  Truck, Ship, Plane, Train, ArrowUpDown, Plus, X, Loader2
} from 'lucide-react';
import { useShipments } from '../context/ShipmentContext';
import { createShipment } from '../services/api';

const getStatusColor = (status) => {
  switch(status) {
    case 'In Transit': return 'blue';
    case 'Delivered': return 'emerald';
    case 'Delayed': return 'red';
    case 'At Risk': return 'amber';
    default: return 'slate';
  }
};

const getRiskColor = (risk) => {
  switch(risk) {
    case 'Low': return 'emerald';
    case 'Medium': return 'amber';
    case 'High': return 'orange';
    case 'Critical': return 'red';
    default: return 'slate';
  }
};

const CreateShipmentModal = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    shipmentId: `SHP-${Math.floor(10000 + Math.random() * 90000)}`,
    origin: '',
    destination: '',
    currentETA: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    slaDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16),
    priority: 'High',
    traffic: 50,
    weather: 20,
    warehouse: 50,
    historicalDelay: 30
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const cityCoordinates = {
        mumbai: { lat: 19.0760, lon: 72.8777 },
        delhi: { lat: 28.7041, lon: 77.1025 },
        indore: { lat: 22.7196, lon: 75.8577 },
        ahmedabad: { lat: 23.0225, lon: 72.5714 },
        chennai: { lat: 13.0827, lon: 80.2707 },
        bangalore: { lat: 12.9716, lon: 77.5946 },
        kolkata: { lat: 22.5726, lon: 88.3639 },
        hyderabad: { lat: 17.3850, lon: 78.4867 },
        pune: { lat: 18.5204, lon: 73.8567 },
        jaipur: { lat: 26.9124, lon: 75.7873 },
        surat: { lat: 21.1702, lon: 72.8311 },
        moscow: { lat: 55.7558, lon: 37.6173 }
      };

      const getCoords = (cityStr, fallback) => {
        const norm = cityStr.toLowerCase().trim();
        for (const [key, coords] of Object.entries(cityCoordinates)) {
          if (norm.includes(key)) return coords;
        }
        return fallback;
      };

      // Convert dates to proper ISO
      const payload = {
        ...formData,
        id: formData.shipmentId,
        origin: { name: formData.origin, ...getCoords(formData.origin, { lat: 19.0760, lon: 72.8777 }) },
        destination: { name: formData.destination, ...getCoords(formData.destination, { lat: 28.7041, lon: 77.1025 }) },
        traffic: Number(formData.traffic),
        weather: Number(formData.weather),
        warehouse: Number(formData.warehouse),
        historicalDelay: Number(formData.historicalDelay),
        currentETA: new Date(formData.currentETA).toISOString(),
        slaDeadline: new Date(formData.slaDeadline).toISOString(),
      };
      await onCreate(payload);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-black text-slate-800">Create New Shipment</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Shipment ID</label>
              <input name="shipmentId" value={formData.shipmentId} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Origin</label>
              <input name="origin" value={formData.origin} onChange={handleChange} placeholder="e.g. Mumbai" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Destination</label>
              <input name="destination" value={formData.destination} onChange={handleChange} placeholder="e.g. Delhi" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Current ETA</label>
              <input type="datetime-local" name="currentETA" value={formData.currentETA} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">SLA Deadline</label>
              <input type="datetime-local" name="slaDeadline" value={formData.slaDeadline} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            
            <div className="md:col-span-2 mt-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-100 pb-2">Live Telemetry Injection</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Traffic Congestion (%)</label>
              <input type="number" name="traffic" value={formData.traffic} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Weather Impact (%)</label>
              <input type="number" name="weather" value={formData.weather} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Warehouse Utilization (%)</label>
              <input type="number" name="warehouse" value={formData.warehouse} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Historical Delay Score (%)</label>
              <input type="number" name="historicalDelay" value={formData.historicalDelay} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-md shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Shipment
          </button>
        </div>
      </div>
    </div>
  );
};

const ShipmentsPage = () => {
  const { shipments, isLoading, addShipment, analyzeShipmentSLA } = useShipments();
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 15;

  const handleCreateShipment = async (payload) => {
    try {
      const created = await createShipment(payload);
      addShipment(created.data || created);
      // Automatically analyze the SLA behind the scenes
      await analyzeShipmentSLA(payload);
      alert("Shipment created successfully. SLA Analysis has been generated.");
    } catch (error) {
      alert("Error creating shipment.");
      console.error(error);
    }
  };

  const filteredData = useMemo(() => {
    return shipments.filter(s => {
      const matchFilter = activeFilter === 'All' || s.status === activeFilter;
      const matchSearch = String(s.id).toLowerCase().includes(searchQuery.toLowerCase()) || 
                          String(s.origin?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          String(s.destination?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [shipments, activeFilter, searchQuery]);

  const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Derive counts dynamically
  const filters = useMemo(() => {
    return [
      { name: 'All', count: shipments.length },
      { name: 'In Transit', count: shipments.filter(s => s.status === 'In Transit').length },
      { name: 'Delivered', count: shipments.filter(s => s.status === 'Delivered').length },
      { name: 'Delayed', count: shipments.filter(s => s.status === 'Delayed').length },
      { name: 'At Risk', count: shipments.filter(s => s.status === 'At Risk').length }
    ];
  }, [shipments]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full animate-fade-in pb-24 relative">
      <CreateShipmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreate={handleCreateShipment} 
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 text-white">
            <Package size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-blue-950 tracking-tight font-display">Shipment Management</h1>
            <p className="text-xs font-bold text-blue-500/80 uppercase tracking-widest mt-1">Track and Manage All Shipments</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search ID, city..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm w-64"
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-xl text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/30">
            <Plus className="w-4 h-4" /> Create Shipment
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map(f => (
          <button 
            key={f.name}
            onClick={() => { setActiveFilter(f.name); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              activeFilter === f.name 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.name} <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${activeFilter === f.name ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-lg shadow-blue-50/50 overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                    <div className="flex items-center gap-1">Shipment ID <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" /></div>
                  </th>
                  <th className="p-4">Origin</th>
                  <th className="p-4">Destination</th>
                  <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                    <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" /></div>
                  </th>
                  <th className="p-4">ETA</th>
                  <th className="p-4">Risk Level</th>
                  <th className="p-4">Mode</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {paginatedData.map((row) => {
                  const sColor = getStatusColor(row.status);
                  const rColor = getRiskColor(row.riskScore || 'Low');
                  
                  return (
                    <tr key={row.id} className="hover:bg-blue-50/50 transition-colors border-b border-slate-50 last:border-0 group">
                      <td className="p-4 font-bold text-slate-700">{row.id}</td>
                      <td className="p-4 text-slate-600">{row.origin?.name || row.origin}</td>
                      <td className="p-4 text-slate-600">{row.destination?.name || row.destination}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-${sColor}-50 text-${sColor}-700 border border-${sColor}-200`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{row.etas?.updated || row.eta || 'On Time'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-${rColor}-50 text-${rColor}-700 border border-${rColor}-200`}>
                          {row.riskScore || 'Low'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 w-max">
                          <Truck className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold">{row.cargoType || 'General'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500 font-medium">
                      No shipments found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 0 && !isLoading && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="text-sm text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-700">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-700">{Math.min(page * itemsPerPage, filteredData.length)}</span> of <span className="font-bold text-slate-700">{filteredData.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-sm font-bold text-slate-700 px-2">
                Page {page} of {totalPages}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentsPage;
