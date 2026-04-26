/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  ZoomControl,
  ScaleControl,
  useMap
} from 'react-leaflet'
import L from 'leaflet'
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Filter,
  Fuel,
  Gavel,
  Info,
  Layers,
  LayoutDashboard,
  Loader2,
  Locate,
  Map as MapIcon,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  TrendingUp,
  Truck,
  Wallet
} from 'lucide-react'
import { getShipments, getCityTraffic } from '../services/api'
import LoadingState from '../components/LoadingState'
import { useNavigationLoading } from '../components/NavigationLoadingContext'

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const CLEAN_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
const TILE_ATTRIBUTION = "&copy; OpenStreetMap contributors &copy; CARTO"

// Custom marker icon creator
const createMarkerIcon = (status, isSelected, anySelected) => {
  const color = status === 'Critical' ? '#ef4444' : status === 'At Risk' ? '#f59e0b' : '#10b981'
  const glyph = status === 'Critical' ? '!' : status === 'At Risk' ? '?' : '✓'
  const opacity = anySelected ? (isSelected ? 1 : 0.4) : 1
  const scale = isSelected ? 1.2 : 1
  
  const pulseHtml = status === 'Critical' ? `
    <div style="position:absolute;width:48px;height:48px;background:${color};border-radius:9999px;opacity:0.4;animation:priority-pulse 2s infinite ease-out;top:-8px;left:-8px;pointer-events:none;"></div>
  ` : ''

  return L.divIcon({
    className: 'custom-priority-marker',
    html: `
      <div style="position:relative;width:32px;height:44px;display:flex;align-items:flex-start;justify-content:center;transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);transform:scale(${scale});opacity:${opacity};">
        ${pulseHtml}
        <div style="position:relative;z-index:10;width:32px;height:32px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 10px 20px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:900;">
          ${glyph}
        </div>
        <div style="position:absolute;bottom:0px;width:3px;height:14px;background:${color};border-radius:9999px;opacity:${opacity};"></div>
      </div>
      <style>
        @keyframes priority-pulse {
          0% { transform: scale(0.5); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      </style>
    `,
    iconSize: [32, 44],
    iconAnchor: [16, 42],
    popupAnchor: [0, -35],
  })
}

// Auto-zoom component
function FitBounds({ shipments, selectedShipment }) {
  const map = useMap()

  useEffect(() => {
    if (selectedShipment && selectedShipment.mapPos) {
      // Zoom to the specific route
      const destPos = [selectedShipment.destination.lat, selectedShipment.destination.lng || selectedShipment.destination.lon]
      const bounds = L.latLngBounds([selectedShipment.mapPos, destPos])
      map.fitBounds(bounds, { padding: [100, 100], maxZoom: 10, animate: true })
    } else if (shipments.length > 0) {
      const validPoints = shipments.filter(s => s.mapPos).map(s => s.mapPos)
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints)
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8, animate: true })
      }
    }
  }, [map, shipments, selectedShipment])

  return null
}

const PriorityMapPage = () => {
  const { finishNavigation } = useNavigationLoading()
  const [shipments, setShipments] = useState([])
  const [cityTraffic, setCityTraffic] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [showTraffic, setShowTraffic] = useState(true)
  const [showRoutes, setShowRoutes] = useState(true)
  const [mapStyle, setMapStyle] = useState('clean'); // 'clean' or 'classic'
  const [optimizeFor, setOptimizeFor] = useState('time'); // 'time' or 'eco'

  const fetchShipments = async () => {
    setLoading(true)
    setError(null)
    try {
      const [data, trafficData] = await Promise.all([
        getShipments(),
        getCityTraffic()
      ])
      
      console.log('Fetched shipments for priority map:', data)
      setCityTraffic(trafficData)
      const normalizedData = data
        .filter(s => s.origin && s.origin.lat !== undefined && (s.origin.lng !== undefined || s.origin.lon !== undefined))
        .map(s => {
          let pStatus = 'On Track'
          const risk = s.riskScore || 'Low'
          const status = s.status || ''
          const priority = s.priority || 'Medium'
          
          if (priority === 'Critical' || risk === 'High' || status === 'Delayed') pStatus = 'Critical'
          else if (priority === 'High' || risk === 'Medium' || status === 'Monitoring') pStatus = 'At Risk'
          
          return { 
            ...s, 
            priorityStatus: pStatus,
            mapPos: [s.origin.lat, s.origin.lng || s.origin.lon]
          }
        })
      setShipments(normalizedData)
    } catch (err) {
      console.error('Error loading shipments:', err)
      setError(err?.response?.data?.message || 'Failed to connect to AI logistics engine.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShipments()
  }, [])

  useEffect(() => {
    if (!loading) {
      finishNavigation('/priority-map')
    }
  }, [loading, finishNavigation])

  const stats = useMemo(() => {
    const totalLoss = shipments.reduce((sum, s) => sum + (s.potentialLoss || 0), 0)
    const totalDelay = shipments.reduce((sum, s) => sum + (s.riskFactors?.delay || 0), 0)
    const avgDelay = shipments.length > 0 ? Math.round(totalDelay / shipments.length) : 0

    return {
      total: shipments.length,
      critical: shipments.filter(s => s.priorityStatus === 'Critical').length,
      atRisk: shipments.filter(s => s.priorityStatus === 'At Risk').length,
      safe: shipments.filter(s => s.priorityStatus === 'On Track').length,
      totalLoss,
      avgDelay
    }
  }, [shipments])

  const filteredShipments = useMemo(() => {
    if (filter === 'All') return shipments
    return shipments.filter(s => s.priorityStatus === filter)
  }, [shipments, filter])

  if (loading) {
    return (
      <LoadingState
        fullScreen
        title="Initializing Priority Map"
        subtitle="We are scanning all active routes and cross-referencing real-time risk scores for priority visualization."
        steps={[
          'Synchronizing shipment database',
          'Calculating priority heatmaps',
          'Rendering interactive logistics map',
        ]}
      />
    )
  }

  if (error && shipments.length === 0) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-slate-50">
        <div className="glass-panel p-10 border-2 border-red-200 text-center max-w-md bg-white">
          <AlertTriangle size={32} className="text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-black text-red-800 mb-2">Connection Error</h2>
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button onClick={fetchShipments} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors shadow-lg shadow-red-200">
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
      {/* Header & Stats Section */}
      <header className="z-20 bg-white px-6 py-4 shadow-sm border-b border-slate-200">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <MapIcon size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">Priority Intelligence Map</h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Real-time shipment risk visualization for faster decision making</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:flex xl:items-center">
            <div className="flex flex-col rounded-2xl bg-slate-50 px-4 py-2 border border-slate-200 shadow-sm min-w-[100px]">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total</span>
              <span className="text-lg font-black text-slate-900">{stats.total}</span>
            </div>
            <div className="flex flex-col rounded-2xl bg-red-50 px-4 py-2 border border-red-100 shadow-sm min-w-[100px]">
              <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Critical</span>
              <span className="text-lg font-black text-red-700">{stats.critical}</span>
            </div>
            <div className="flex flex-col rounded-2xl bg-amber-50 px-4 py-2 border border-amber-100 shadow-sm min-w-[100px]">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">At Risk</span>
              <span className="text-lg font-black text-amber-700">{stats.atRisk}</span>
            </div>
            <div className="flex flex-col rounded-2xl bg-emerald-50 px-4 py-2 border border-emerald-100 shadow-sm min-w-[100px]">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Safe</span>
              <span className="text-lg font-black text-emerald-700">{stats.safe}</span>
            </div>
            <div className="flex flex-col rounded-2xl bg-blue-50 px-4 py-2 border border-blue-100 shadow-sm min-w-[120px]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Wallet size={10} className="text-blue-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Est. Loss</span>
              </div>
              <span className="text-lg font-black text-blue-900">₹{stats.totalLoss.toLocaleString()}</span>
            </div>
            <div className="flex flex-col rounded-2xl bg-indigo-50 px-4 py-2 border border-indigo-100 shadow-sm min-w-[120px]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock size={10} className="text-indigo-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Avg Delay</span>
              </div>
              <span className="text-lg font-black text-indigo-900">{stats.avgDelay}m</span>
            </div>
          </div>
        </div>

        {/* Filters and Refresh */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            <div className="mr-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Filter size={14} /> Filter:
            </div>
            <button
              onClick={() => setFilter('All')}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-black tracking-widest uppercase transition-all ${
                filter === 'All'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('Critical')}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-black tracking-widest uppercase transition-all ${
                filter === 'Critical'
                  ? 'bg-red-600 text-white shadow-md shadow-red-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-red-300 hover:text-red-600'
              }`}
            >
              Critical ({stats.critical})
            </button>
            <button
              onClick={() => setFilter('At Risk')}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-black tracking-widest uppercase transition-all ${
                filter === 'At Risk'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-amber-300 hover:text-amber-600'
              }`}
            >
              At Risk ({stats.atRisk})
            </button>
            <button
              onClick={() => setFilter('On Track')}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-black tracking-widest uppercase transition-all ${
                filter === 'On Track'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:text-emerald-600'
              }`}
            >
              Safe ({stats.safe})
            </button>
          </div>

          <button 
            onClick={fetchShipments}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Data
          </button>
        </div>
      </header>

      {/* Main Map Area */}
      <main className="relative flex-1 bg-slate-100">
        <MapContainer
          center={[20.5937, 78.9629]} 
          zoom={5}
          zoomControl={false}
          className="h-full w-full outline-none"
        >
          <TileLayer attribution={TILE_ATTRIBUTION} url={CLEAN_TILE_URL} />
          <ZoomControl position="bottomright" />
          <ScaleControl position="bottomleft" imperial={false} />
          <FitBounds shipments={filteredShipments} selectedShipment={selectedShipment} />

          {/* Traffic Layer - UPGRADED UI */}
          {showTraffic && cityTraffic
            .filter(city => {
              if (!selectedShipment) return true // Show all if none selected
              // Only show traffic near the destination of the selected shipment
              const dest = selectedShipment.destination
              const dist = Math.sqrt(Math.pow(city.lat - dest.lat, 2) + Math.pow((city.lon || city.lng) - (dest.lng || dest.lon), 2))
              return dist < 1.5 // roughly 150km radius
            })
            .map((city, idx) => {
              const severity = city.traffic >= 80 ? 'Critical' : city.traffic >= 50 ? 'High' : 'Moderate'
              const color = city.traffic >= 80 ? '#ef4444' : city.traffic >= 50 ? '#f59e0b' : '#3b82f6'
              
              return (
                <React.Fragment key={`${city.name}-${idx}`}>
                  <Circle
                    center={[city.lat, city.lon || city.lng]}
                    radius={12000 + (city.traffic * 100)}
                    pathOptions={{
                      fillColor: color,
                      color: color,
                      weight: 2,
                      fillOpacity: 0.2,
                      className: 'traffic-pulse'
                    }}
                  >
                    <Popup>
                      <div className="p-2 text-center">
                        <p className="text-[10px] font-black uppercase text-slate-400">Congestion Zone</p>
                        <h4 className="font-black text-slate-900">{city.name}</h4>
                        <div className="mt-2 rounded-lg bg-slate-50 p-2 border border-slate-100">
                          <p className="text-lg font-black" style={{ color }}>{city.traffic}%</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{severity} Density</p>
                        </div>
                      </div>
                    </Popup>
                  </Circle>
                  <Marker 
                    position={[city.lat, city.lon || city.lng]} 
                    icon={L.divIcon({
                      className: 'traffic-label',
                      html: `<div style="background:${color};color:white;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:900;box-shadow:0 4px 10px rgba(0,0,0,0.1);white-space:nowrap;border:1.5px solid white;">${city.name}: ${city.traffic}%</div>`,
                      iconSize: [80, 20],
                      iconAnchor: [40, 30]
                    })}
                  />
                </React.Fragment>
              )
            })
          }

          {filteredShipments.map((shipment) => (
            <Marker
              key={shipment.id}
              position={shipment.mapPos}
              icon={createMarkerIcon(shipment.priorityStatus, selectedShipment?.id === shipment.id, !!selectedShipment)}
              eventHandlers={{
                click: () => setSelectedShipment(shipment),
              }}
            >
              <Popup className="priority-popup" maxWidth={300}>
                <div className="w-64 overflow-hidden rounded-xl border-0 p-0">
                  <div className={`p-3 text-white ${
                    shipment.priorityStatus === 'Critical' ? 'bg-red-600' : 
                    shipment.priorityStatus === 'At Risk' ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Intelligence Hub</span>
                      <Truck size={14} />
                    </div>
                    <h3 className="text-base font-black">{shipment.id}</h3>
                  </div>
                  <div className="bg-white p-4">
                    <div className="mb-4 space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Route</p>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <span className="truncate">{shipment.origin.name}</span>
                        <ArrowRight size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{shipment.destination.name}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                        <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Risk & Delay</p>
                        <p className={`text-sm font-black ${
                          shipment.riskScore === 'High' ? 'text-red-600' : 
                          shipment.riskScore === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {shipment.riskScore} • {shipment.riskFactors?.delay || 0}m
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                        <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400">AI Decision</p>
                        <p className="text-[11px] font-black text-slate-700 leading-tight">
                          {shipment.priorityStatus === 'Critical' ? '⚡ REROUTE' : '👁️ MONITOR'}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add timestamp to force FitBounds to re-run even if already selected
                        setSelectedShipment({ ...shipment, _focusAt: Date.now() });
                      }}
                      className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-transform active:scale-95 shadow-lg shadow-slate-200"
                    >
                      Focus View
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {selectedShipment && showRoutes && (
            <>
              {/* Fastest Route (Blue) */}
              <Polyline
                positions={[
                  selectedShipment.mapPos,
                  [selectedShipment.destination.lat, selectedShipment.destination.lng || selectedShipment.destination.lon]
                ]}
                pathOptions={{
                  color: '#3b82f6',
                  weight: optimizeFor === 'time' ? 6 : 3,
                  dashArray: '12, 12',
                  lineCap: 'round',
                  opacity: optimizeFor === 'time' ? 0.9 : 0.4,
                  className: optimizeFor === 'time' ? 'route-line-animation' : ''
                }}
              />
              
              {/* Eco Route (Green) - Slightly offset for visualization */}
              <Polyline
                positions={[
                  selectedShipment.mapPos,
                  [selectedShipment.destination.lat + 0.05, (selectedShipment.destination.lng || selectedShipment.destination.lon) + 0.05]
                ]}
                pathOptions={{
                  color: '#10b981',
                  weight: optimizeFor === 'eco' ? 6 : 3,
                  dashArray: '12, 12',
                  lineCap: 'round',
                  opacity: optimizeFor === 'eco' ? 0.9 : 0.4,
                  className: optimizeFor === 'eco' ? 'route-line-animation' : ''
                }}
              />
            </>
          )}
          
          <style>
            {`
              .route-line-animation {
                stroke-dashoffset: 24;
                animation: dash 3s linear infinite;
              }
              @keyframes dash {
                to { stroke-dashoffset: 0; }
              }
              .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `}
          </style>

          {filteredShipments.length === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center z-[1000] pointer-events-none">
              <div className="glass-panel p-8 text-center max-w-sm border-blue-200 pointer-events-auto bg-white/80 backdrop-blur-md shadow-2xl">
                <Truck size={48} className="text-blue-300 mx-auto mb-4" />
                <h3 className="text-xl font-black text-blue-950 mb-2">No Shipments Found</h3>
                <p className="text-sm font-medium text-blue-600 mb-6">
                  There are no active shipments matching your current filter. Create a shipment in the dashboard to see it on the map.
                </p>
                <button 
                  onClick={() => window.location.href = '/shipments'}
                  className="btn-primary w-full"
                >
                  Create Shipment
                </button>
              </div>
            </div>
          )}
        </MapContainer>

        {/* Floating Layer Control Panel */}
        <div className="absolute top-24 left-6 z-[1000] w-64 glass-panel border border-slate-200 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-left duration-500">
          <div className="bg-white p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-600">
              <TrendingUp size={18} />
              <span className="text-xs font-black uppercase tracking-widest">AI Routing Intelligence</span>
            </div>
            <button className="text-slate-400"><RefreshCw size={14} /></button>
          </div>
          <div className="p-4 space-y-4 bg-white/50 backdrop-blur-sm">
            <div className="flex items-center justify-between group cursor-pointer" onClick={() => setShowRoutes(!showRoutes)}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${showRoutes ? 'bg-blue-500' : 'bg-slate-300'}`} />
                <span className="text-xs font-black text-slate-700 group-hover:text-blue-600 transition-colors">Main Route</span>
              </div>
              <Info size={12} className="text-slate-300" />
            </div>
            <div className="flex items-center justify-between group cursor-pointer" onClick={() => setShowTraffic(!showTraffic)}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${showTraffic ? 'bg-red-500' : 'bg-slate-300'}`} />
                <span className="text-xs font-black text-slate-700 group-hover:text-red-600 transition-colors">City Traffic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${showTraffic ? 'bg-red-500 animate-pulse' : 'bg-transparent'}`} />
                <span className="text-[10px] font-bold text-slate-400">LIVE</span>
              </div>
            </div>
            <div className="flex items-center justify-between group cursor-pointer" onClick={() => setMapStyle(mapStyle === 'clean' ? 'classic' : 'clean')}>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-xs font-black text-slate-700 group-hover:text-indigo-600 transition-colors">Basemap</span>
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase">{mapStyle}</span>
            </div>

            <div className="pt-2 mt-2 border-t border-slate-100">
               <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <button 
                    onClick={() => setOptimizeFor('time')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${optimizeFor === 'time' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
                  >
                    <Clock size={12} /> Time
                  </button>
                  <button 
                    onClick={() => setOptimizeFor('eco')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${optimizeFor === 'eco' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}
                  >
                    <TrendingUp size={12} className="rotate-45" /> Eco 🌱
                  </button>
               </div>
            </div>
            
            <div className="pt-2 mt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-2 opacity-60">
                <div className="h-1 flex-1 bg-blue-500 rounded-full" />
                <span className="text-[9px] font-black text-slate-400 uppercase">AI Primary Path</span>
              </div>
              <div className="flex items-center gap-2 opacity-60">
                <div className="h-2 w-2 rounded-full border-2 border-red-400 bg-red-100" />
                <span className="text-[9px] font-black text-slate-400 uppercase">Traffic: Congestion zones</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-10 left-6 z-[1000] glass-panel p-4 border border-slate-200 shadow-xl rounded-2xl pointer-events-none select-none">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
            <Layers size={12} /> Map Legend
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-3 w-3 rounded-full bg-red-500 shadow-sm shadow-red-200" />
                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40 scale-150" />
              </div>
              <span className="text-xs font-bold text-slate-700">Critical (Immediate Action Required)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-amber-500 shadow-sm shadow-amber-200" />
              <span className="text-xs font-bold text-slate-700">At Risk (Monitor Closely)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
              <span className="text-xs font-bold text-slate-700">Safe (On Track)</span>
            </div>
          </div>
        </div>

        {/* Selected Shipment Sidebar / Drawer */}
        {selectedShipment && (
          <div className="absolute right-6 top-6 z-[1000] w-full max-w-md glass-panel border border-slate-200 shadow-2xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-right duration-300">
            <div className={`p-6 text-white ${
              selectedShipment.priorityStatus === 'Critical' ? 'bg-red-600' : 
              selectedShipment.priorityStatus === 'At Risk' ? 'bg-amber-600' : 'bg-emerald-600'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
                  <ShieldAlert size={20} />
                </div>
                <button 
                  onClick={() => setSelectedShipment(null)}
                  className="rounded-full bg-black/20 p-1.5 transition hover:bg-black/40"
                >
                  <RefreshCw size={14} className="rotate-45" />
                </button>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-80">Intelligence Profile</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">{selectedShipment.id}</h2>
            </div>
            <div className="p-5 space-y-5 max-h-[85vh] overflow-y-auto custom-scrollbar">
              {/* Origin-Destination Header */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Origin</span>
                  <span className="text-sm font-bold text-slate-900 truncate max-w-[160px]">{selectedShipment.origin.name}</span>
                </div>
                <div className="h-px flex-1 bg-slate-100 mx-3" />
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Destination</span>
                  <span className="text-sm font-bold text-slate-900 truncate max-w-[160px]">{selectedShipment.destination.name}</span>
                </div>
              </div>
              
              {/* Priority Badge Area */}
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  selectedShipment.priorityStatus === 'Critical' ? 'bg-red-100 text-red-600' : 
                  selectedShipment.priorityStatus === 'At Risk' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {selectedShipment.priorityStatus === 'Critical' ? <ShieldAlert size={20} /> : 
                    selectedShipment.priorityStatus === 'At Risk' ? <ShieldQuestion size={20} /> : <ShieldCheck size={20} />}
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Priority Assessment</h4>
                  <p className="text-sm font-medium text-slate-600">Shipment classified as <span className="font-bold underline decoration-2">{selectedShipment.priorityStatus}</span> priority.</p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white p-3 border border-slate-200 text-center shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Traffic</p>
                  <p className="text-sm font-black text-slate-900">{selectedShipment.riskFactors?.traffic || 0}%</p>
                </div>
                <div className="rounded-2xl bg-white p-3 border border-slate-200 text-center shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Weather</p>
                  <p className="text-sm font-black text-slate-900">{selectedShipment.riskFactors?.weather || 0}%</p>
                </div>
                <div className="rounded-2xl bg-white p-3 border border-slate-200 text-center shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Delay</p>
                  <p className="text-sm font-black text-slate-900">{selectedShipment.riskFactors?.delay || 0}m</p>
                </div>
              </div>

              {/* Loss Impact Breakdown */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Financial Leakage</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${
                      selectedShipment.deliveryStatus === 'On Time' ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />
                    <span className="text-[10px] font-black text-slate-500">{selectedShipment.deliveryStatus}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-amber-50/50 p-3 border border-amber-100 flex items-center gap-3">
                    <Fuel size={16} className="text-amber-500" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-amber-600/60">Fuel Waste</p>
                      <p className="text-sm font-black text-slate-900">₹{(selectedShipment.lossImpact?.fuelLoss || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-indigo-50/50 p-3 border border-indigo-100 flex items-center gap-3">
                    <Gavel size={16} className="text-indigo-500" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600/60">Penalty</p>
                      <p className="text-sm font-black text-slate-900">₹{(selectedShipment.lossImpact?.penaltyRisk || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-900 p-4 flex items-center justify-between text-white shadow-lg shadow-slate-200">
                  <div className="flex items-center gap-3">
                    <Wallet size={18} className="text-emerald-400" />
                    <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">Total Loss Impact</span>
                  </div>
                  <span className="text-lg font-black text-emerald-400 whitespace-nowrap">₹{(selectedShipment.lossImpact?.totalLoss || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Carbon Emission Insights */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sustainability Profile</span>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
                    selectedShipment.carbonImpact?.ecoBadge === 'Eco Friendly' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                    selectedShipment.carbonImpact?.ecoBadge === 'Moderate' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                    'bg-red-50 border-red-100 text-red-600'
                  }`}>
                    <span className="text-[9px] font-black uppercase tracking-widest">{selectedShipment.carbonImpact?.ecoBadge}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-emerald-50/50 p-3 border border-emerald-100 flex items-center gap-3">
                    <div className="text-emerald-500">🌱</div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600/60">CO₂ Emission</p>
                      <p className="text-sm font-black text-slate-900">{selectedShipment.carbonImpact?.totalCO2 || 0} kg</p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-blue-50/50 p-3 border border-blue-100 flex items-center gap-3">
                    <div className="text-blue-500">♻️</div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-600/60">CO₂ Saved</p>
                      <p className="text-sm font-black text-slate-900">{selectedShipment.carbonImpact?.emissionSaved || 0} kg</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Insight Area */}
              {selectedShipment.shipmentPayload?.insights && (
                <div className="rounded-2xl bg-blue-50 p-4 border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <TrendingUp size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">AI Strategic Decision</span>
                  </div>
                  <p className="text-sm font-bold text-blue-900 leading-relaxed italic">
                    "{selectedShipment.shipmentPayload.insights.summary}"
                  </p>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button 
                  onClick={() => window.location.href = `/shipment/${selectedShipment.id}`}
                  className="group flex w-full items-center justify-between rounded-2xl bg-slate-900 px-6 py-4 text-sm font-black uppercase tracking-widest text-white transition hover:bg-slate-800 shadow-xl shadow-slate-200"
                >
                  Full Analysis Profile
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default PriorityMapPage
