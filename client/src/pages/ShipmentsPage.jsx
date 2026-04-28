/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Loader2,
  MapPin,
  PackagePlus,
  PackageSearch,
  RefreshCw,
  Truck,
} from 'lucide-react'
import { analyzeShipment, createShipment, getShipments, getCachedShipments, transformAnalysis } from '../services/api'
import LoadingState from '../components/LoadingState'
import { useNavigationLoading } from '../components/NavigationLoadingContext'

const emptyForm = {
  id: '',
  originName: '',
  originLat: '',
  originLon: '',
  destinationName: '',
  destinationLat: '',
  destinationLon: '',
  traffic: 35,
  weather: 20,
  delay: 10,
  priority: 'Medium',
  status: 'In Transit',
}

const ShipmentsPage = () => {
  const { finishNavigation } = useNavigationLoading()
  const [shipments, setShipments] = useState(() => getCachedShipments() || [])
  const [loading, setLoading] = useState(() => !getCachedShipments())
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)
  const [analyzingId, setAnalyzingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)

  const fetchShipments = async () => {
    if (shipments.length === 0) setLoading(true)
    setError(null)
    try {
      const data = await getShipments()
      setShipments(data)
    } catch (err) {
      console.error('Error loading shipments:', err)
      setError(err?.response?.data?.message || 'Failed to load shipments. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShipments()
  }, [])

  useEffect(() => {
    if (!loading) {
      finishNavigation('/shipments')
    }
  }, [loading, finishNavigation])

  const handleAnalyze = async (shipment) => {
    if (selectedId === shipment.id && analysisData) {
      setSelectedId(null)
      setAnalysisData(null)
      return
    }

    setSelectedId(shipment.id)
    setAnalyzingId(shipment.id)
    setAnalysisData(null)

    try {
      const raw = shipment._raw || shipment
      const payload = {
        traffic: raw.traffic ?? shipment.riskFactors?.traffic ?? 50,
        delay: raw.delay ?? shipment.riskFactors?.delay ?? 20,
        lat: raw.source?.lat ?? shipment.origin?.lat,
        lon: raw.source?.lon ?? shipment.origin?.lng,
        endLat: raw.destination?.lat ?? shipment.destination?.lat,
        endLon: raw.destination?.lon ?? shipment.destination?.lng,
        priority: raw.priority ?? 'Medium',
        shipmentId: shipment.id,
        origin: shipment.origin?.name,
        destination: shipment.destination?.name,
      }
      const result = await analyzeShipment(payload)
      const transformed = transformAnalysis(result)
      setAnalysisData(transformed)
    } catch (err) {
      console.error('Analysis failed:', err)
      setAnalysisData({ error: err?.response?.data?.message || 'Analysis failed. Please try again.' })
    } finally {
      setAnalyzingId(null)
    }
  }

  const handleCreateShipment = async (event) => {
    event.preventDefault()
    setCreating(true)
    setError(null)

    try {
      await createShipment({
        id: form.id.trim(),
        origin: {
          name: form.originName.trim(),
          lat: Number(form.originLat),
          lon: Number(form.originLon),
        },
        destination: {
          name: form.destinationName.trim(),
          lat: Number(form.destinationLat),
          lon: Number(form.destinationLon),
        },
        traffic: Number(form.traffic),
        weather: Number(form.weather),
        delay: Number(form.delay),
        priority: form.priority,
        status: form.status,
        riskScore: Number(form.traffic) * 0.5 + Number(form.weather) * 0.3 + Number(form.delay) * 0.2,
      })

      setForm(emptyForm)
      await fetchShipments()
    } catch (err) {
      console.error('Shipment creation failed:', err)
      setError(err?.response?.data?.message || 'Failed to create shipment.')
    } finally {
      setCreating(false)
    }
  }

  const statusColors = {
    'In Transit': 'bg-blue-100 text-blue-700 border-blue-300',
    'Dispatched': 'bg-purple-100 text-purple-700 border-purple-300',
    'Delayed': 'bg-red-100 text-red-700 border-red-300',
    'Delivered': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  }

  const priorityColors = {
    High: 'bg-red-50 text-red-700 border-red-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }

  if (loading) {
    return (
      <LoadingState
        fullScreen
        title="Loading shipments"
        subtitle="We are preparing the shipment board and live AI drill-downs so the cards arrive ready to inspect."
        steps={[
          'Fetching active shipments',
          'Matching routes and priorities',
          'Preparing interactive analysis cards',
        ]}
      />
    )
  }

  if (error && shipments.length === 0) {
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
    )
  }

  return (
    <div className="min-h-screen p-8 pt-8">
      <header className="mb-8 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-300">
            <PackageSearch size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-blue-950">My Shipments</h1>
            <p className="text-sm font-bold text-blue-500 uppercase tracking-widest">
              {shipments.length} Active Shipments
            </p>
          </div>
        </div>

        <button
          onClick={fetchShipments}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      <section className="glass-panel mb-8 border-2 border-blue-200 p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-2 text-white shadow-sm shadow-blue-300">
            <PackagePlus size={18} />
          </div>
          <div>
            <h2 className="text-lg font-black text-blue-950">Add Shipment</h2>
            <p className="text-sm font-medium text-blue-600">Create a shipment owned by your authenticated admin account.</p>
          </div>
        </div>

        <form onSubmit={handleCreateShipment} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Shipment ID', 'id'],
            ['Origin Name', 'originName'],
            ['Origin Lat', 'originLat'],
            ['Origin Lon', 'originLon'],
            ['Destination Name', 'destinationName'],
            ['Destination Lat', 'destinationLat'],
            ['Destination Lon', 'destinationLon'],
          ].map(([label, key]) => (
            <label key={key} className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-blue-600">{label}</span>
              <input
                required
                value={form[key]}
                onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500"
              />
            </label>
          ))}

          <label className="flex flex-col gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600">Traffic</span>
            <input
              type="number"
              min="0"
              max="100"
              value={form.traffic}
              onChange={(event) => setForm((prev) => ({ ...prev, traffic: event.target.value }))}
              className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600">Weather</span>
            <input
              type="number"
              min="0"
              max="100"
              value={form.weather}
              onChange={(event) => setForm((prev) => ({ ...prev, weather: event.target.value }))}
              className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600">Delay</span>
            <input
              type="number"
              min="0"
              max="100"
              value={form.delay}
              onChange={(event) => setForm((prev) => ({ ...prev, delay: event.target.value }))}
              className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600">Priority</span>
            <select
              value={form.priority}
              onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
              className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600">Status</span>
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
              className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500"
            >
              <option>In Transit</option>
              <option>Delayed</option>
              <option>On Time</option>
              <option>Monitoring</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-400/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {creating ? 'Saving...' : 'Create Shipment'}
            </button>
          </div>
        </form>

        {error && shipments.length > 0 && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {shipments.map((shipment) => (
          <div key={shipment.id} className="flex flex-col">
            <div
              onClick={() => handleAnalyze(shipment)}
              className={`glass-panel p-5 cursor-pointer transition-all duration-300 border-2 ${
                selectedId === shipment.id
                  ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-xl shadow-blue-200'
                  : 'border-blue-200 hover:border-blue-400 hover:shadow-lg'
              }`}
            >
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

              <div className="flex items-center gap-2 text-sm text-blue-800 mb-3">
                <MapPin size={14} className="text-blue-500 shrink-0" />
                <span className="font-medium truncate">
                  {shipment.origin.name}
                  <ArrowRight size={12} className="inline mx-1 text-blue-400" />
                  {shipment.destination.name}
                </span>
              </div>

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

                {analysisData.insights && (
                  <div className="bg-blue-600 rounded-xl p-4 text-white">
                    <p className="text-xs font-bold text-blue-200 uppercase mb-1">AI Decision</p>
                    <p className="text-sm font-bold">{analysisData.insights.summary}</p>
                  </div>
                )}
              </div>
            )}

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
  )
}

export default ShipmentsPage
