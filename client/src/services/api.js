import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
const TOKEN_STORAGE_KEY = 'delayshield_token'
const USER_STORAGE_KEY = 'delayshield_user'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 35000,
  headers: { 'Content-Type': 'application/json' },
})

export const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY)

export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const persistSession = ({ token, user }) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

export const clearStoredSession = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
  window.dispatchEvent(new Event('delayshield:session-cleared'))
}

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearStoredSession()
    }
    return Promise.reject(error)
  }
)

export const loginWithGoogleCredential = async (credential) => {
  const response = await api.post('/auth/google', { credential })
  return response.data
}

export const signupWithPassword = async ({ name, email, password }) => {
  const response = await api.post('/auth/signup', { name, email, password })
  return response.data
}

export const loginWithPassword = async ({ email, password }) => {
  const response = await api.post('/auth/login', { email, password })
  return response.data
}

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me')
  return response.data
}

export const transformShipment = (s) => {
  if (!s) return null

  const traffic = s.traffic ?? 50
  const delay = s.delay ?? 0
  const weather = s.weather ?? 20

  const rawRisk = (traffic * 0.4) + (delay * 0.6)
  let riskScore = 'Low'
  if (rawRisk > 60) riskScore = 'High'
  else if (rawRisk > 35) riskScore = 'Medium'

  const origin = s.origin || s.source || { name: 'Unknown', lat: 0, lon: 0 }
  const destination = s.destination || { name: 'Unknown', lat: 0, lon: 0 }

  const progress = 0.4
  const currentLat = (origin.lat || 0) + ((destination.lat || 0) - (origin.lat || 0)) * progress
  const currentLng = (origin.lon || origin.lng || 0) + ((destination.lon || destination.lng || 0) - (origin.lon || origin.lng || 0)) * progress

  return {
    id: s.id,
    name: s.name || `Shipment ${s.id}`,
    origin: { name: origin.name || origin.city, lat: origin.lat, lng: origin.lon ?? origin.lng },
    destination: { name: destination.name || destination.city, lat: destination.lat, lng: destination.lon ?? destination.lng },
    currentLocation: { lat: currentLat, lng: currentLng },
    status: s.status || 'In Transit',
    etas: {
      original: 'Scheduled',
      updated: delay > 30 ? `+${delay} min delay` : 'On Time',
    },
    riskFactors: { traffic, weather, delay },
    riskScore,
    currentCost: Math.round(800 + traffic * 2.5 + delay * 5),
    potentialLoss: Math.round(delay * 12 + traffic * 3),
    priority: s.priority || 'Medium',
    cargoType: s.cargoType || 'General Cargo',
    vehicleType: s.vehicleType || 'Semi-Trailer',
    deliveryStatus: delay > 60 ? 'Delivered (Delayed)' : delay > 0 ? 'Delayed' : 'On Time',
    lossImpact: {
      fuelLoss: Math.round(delay * 25),
      penaltyRisk: delay > 30 ? Math.round((delay / 60) * 8000) : 0,
      totalLoss: Math.round(delay * 25) + (delay > 30 ? Math.round((delay / 60) * 8000) : 0)
    },
    carbonImpact: {
      totalCO2: s.carbonImpact?.totalCO2 ?? Math.round(80 + (delay * 0.15)),
      ecoBadge: s.carbonImpact?.ecoBadge ?? (delay > 40 ? 'High Emission' : delay > 15 ? 'Moderate' : 'Eco Friendly'),
      emissionSaved: s.carbonImpact?.emissionSaved ?? Math.round(delay * 0.2)
    },
    _raw: s,
  }
}

const titleCase = (value) => {
  if (!value) return ''
  return String(value)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const formatCurrencyImpact = (value, fallback = 'INR 0') => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallback
  const numeric = Number(value)
  const sign = numeric > 0 ? '+' : numeric < 0 ? '-' : ''
  return `${sign}INR ${Math.abs(Math.round(numeric)).toLocaleString()}`
}

const getDominantFactor = (riskFactors) => {
  const entries = Object.entries(riskFactors || {})
  if (entries.length === 0) return 'Traffic'

  return titleCase(entries.sort((a, b) => Number(b[1]) - Number(a[1]))[0][0])
}

const normalizeKeyFactors = (factors, riskFactors, decisionAction) => {
  const normalized = (Array.isArray(factors) ? factors : [])
    .map(titleCase)
    .filter(Boolean)

  const required = [
    getDominantFactor(riskFactors),
    'Delay',
    decisionAction === 'REROUTE' ? 'Reroute' : 'SLA',
    'Cost',
  ]

  return [...new Set([...normalized, ...required])].slice(0, 4)
}

const buildDeterministicInsights = ({
  ai,
  decision,
  cost,
  riskScore,
  riskFactors,
  route,
  shipmentId,
}) => {
  const action = decision.action || (riskScore === 'High' ? 'REROUTE' : riskScore === 'Medium' ? 'MONITOR' : 'CONTINUE')
  const dominantFactor = getDominantFactor(riskFactors)
  const dominantValue = riskFactors[dominantFactor.toLowerCase()] ?? 0
  const routeName = route?.suggestedAltRoads?.[0] || route?.majorRoads?.[0] || 'optimized alternate corridor'
  const potentialLoss = cost.noActionCost ?? cost.totalImpact ?? cost.breakdown?.baseCost ?? 0
  const rerouteCost = cost.rerouteCost ?? Math.round(Math.max(0, potentialLoss * 0.35))
  const savings = cost.savings ?? Math.max(0, potentialLoss - rerouteCost)

  const shouldReroute = action === 'REROUTE' || riskScore === 'High'
  const primaryAction = shouldReroute ? 'Reroute' : action === 'MONITOR' ? 'Monitor' : 'Continue'

  return {
    summary: shouldReroute
      ? `A ${Math.round(dominantValue)}% ${dominantFactor.toLowerCase()} load is pushing ${shipmentId} toward a high-risk zone.`
      : `${shipmentId} is stable, but ${dominantFactor.toLowerCase()} remains the main operating constraint.`,
    dominantFactor: `${dominantFactor} contributes most to total risk and drives the current recommendation.`,
    explanation: shouldReroute
      ? `The decision engine compared live ${dominantFactor.toLowerCase()}, delay exposure, route alternatives, and cost impact. Rerouting via ${routeName} offers the best balance between schedule protection and operating cost.`
      : `The decision engine reviewed live ${dominantFactor.toLowerCase()}, delay exposure, and current route cost. Conditions do not justify a costly reroute yet, so active monitoring is the preferred control.`,
    keyFactors: normalizeKeyFactors(ai.keyFactors, riskFactors, action),
    actions: [
      {
        type: primaryAction,
        description: shouldReroute
          ? `Reroute via ${routeName}`
          : 'Maintain current route with active telemetry monitoring.',
        tradeOff: shouldReroute
          ? 'Reduces delay exposure but adds route operating cost.'
          : 'Avoids extra route cost but requires close watch for escalation.',
        costImpact: formatCurrencyImpact(shouldReroute ? rerouteCost : 0),
        recommended: true,
      },
      {
        type: shouldReroute ? 'Delay' : 'Reroute',
        description: shouldReroute
          ? 'Delay shipment until congestion clears.'
          : `Switch to ${routeName} if risk rises above threshold.`,
        tradeOff: shouldReroute
          ? 'May reduce fuel cost, but increases SLA breach probability.'
          : 'Improves schedule certainty but increases operating cost.',
        costImpact: formatCurrencyImpact(shouldReroute ? -savings : rerouteCost),
        recommended: false,
      },
    ],
  }
}

export const transformAnalysis = (data) => {
  if (!data) return null

  const risk = data.risk || {}
  const decision = data.decision || {}
  const cost = data.cost || {}
  const ai = data.ai || data.explanation || {}
  const weather = data.weather || {}
  const input = data.input || data.raw?.input || {}

  const riskFactors = {
    traffic: input.traffic ?? risk.breakdown?.traffic ?? 50,
    weather: weather.weatherScore ?? risk.breakdown?.weather ?? 20,
    delay: input.delay ?? risk.breakdown?.delay ?? 10,
  }

  const sid = input.shipmentId || data.shipmentId || 'SHP-0'
  const isAiFallback = ai.success === false
    || ai.explanation?.includes('Neural link unavailable')
    || ai.dominantFactor === 'Connectivity Gap'
  const route = data.route || null
  const fallbackInsights = buildDeterministicInsights({
    ai,
    decision,
    cost,
    riskScore: risk.level || 'Low',
    riskFactors,
    route,
    shipmentId: sid,
  })

  const insights = isAiFallback ? fallbackInsights : {
    ...fallbackInsights,
    summary: ai.summary || fallbackInsights.summary,
    dominantFactor: ai.dominantFactor || fallbackInsights.dominantFactor,
    explanation: ai.explanation || fallbackInsights.explanation,
    keyFactors: normalizeKeyFactors(ai.keyFactors, riskFactors, decision.action),
    actions: Array.isArray(ai.actions) && ai.actions.length > 0
      ? ai.actions.map((action, index) => ({
          type: titleCase(action.type || fallbackInsights.actions[index]?.type),
          description: action.description || fallbackInsights.actions[index]?.description,
          tradeOff: action.tradeOff || fallbackInsights.actions[index]?.tradeOff,
          costImpact: action.costImpact || fallbackInsights.actions[index]?.costImpact || 'INR 0',
          recommended: Boolean(action.recommended),
        }))
      : fallbackInsights.actions,
  }

  return {
    riskScore: risk.level || 'Low',
    riskFactors,
    currentCost: cost.noActionCost ?? cost.breakdown?.baseCost ?? 800,
    potentialLoss: cost.rerouteCost ?? cost.savings ?? cost.totalImpact ?? 0,
    insights,
    modeComparison: ai.modeComparison || null,
    alert: {
      severity: risk.level || 'Low',
      message: data.alert?.message || `Tactical ${decision.action || 'Monitoring'} protocol active.`,
    },
    route,
    raw: data,
  }
}

export const transformSimulationResult = (result, index) => {
  const simulated = result.simulated || {}
  const diff = result.difference || {}

  return {
    label: result.label || `Scenario ${index + 1}`,
    id: index + 1,
    riskScore: simulated.risk?.score || 0,
    riskLevel: simulated.risk?.level || 'Low',
    decision: simulated.decision?.action || 'Continue',
    cost: simulated.cost?.noActionCost || 0,
    difference: {
      riskChange: diff.riskScoreFormatted || 'No change',
      costChange: diff.costChangeFormatted || 'No change',
      decisionChange: diff.decisionChange || 'No change',
      impactScore: diff.impactScore || 0,
      isRiskIncreased: diff.riskScoreChange > 0,
      isCostIncreased: diff.costChange > 0,
    },
    raw: result
  }
}

let cachedShipments = null;
let cachedShipmentsTime = 0;

export const getCachedShipments = () => {
  if (cachedShipments && Date.now() - cachedShipmentsTime < 30000) {
    return cachedShipments;
  }
  return null;
}

export const getShipments = async (force = false) => {
  if (!force && cachedShipments && Date.now() - cachedShipmentsTime < 30000) {
    return cachedShipments;
  }
  const response = await api.get('/shipment')
  const shipments = response.data?.data || response.data || []
  cachedShipments = shipments.map(transformShipment)
  cachedShipmentsTime = Date.now()
  return cachedShipments
}

export const createShipment = async (payload) => {
  const response = await api.post('/shipment', payload)
  return response.data
}

export const getPublicShipment = async (id) => {
  const response = await api.get(`/shipment/shared/${id}`)
  const s = response.data?.data || response.data
  return transformShipment(s)
}

export const analyzeShipment = async (payload) => {
  const response = await api.post('/analyze', payload)
  return response.data
}

let cachedCityTraffic = null;
let cachedCityTrafficTime = 0;

export const getCachedCityTraffic = () => {
  if (cachedCityTraffic && Date.now() - cachedCityTrafficTime < 30000) {
    return cachedCityTraffic;
  }
  return null;
}

export const getCityTraffic = async (force = false) => {
  if (!force && cachedCityTraffic && Date.now() - cachedCityTrafficTime < 30000) {
    return cachedCityTraffic;
  }
  const response = await api.get('/city/traffic')
  cachedCityTraffic = response.data?.data || response.data || []
  cachedCityTrafficTime = Date.now()
  return cachedCityTraffic
}

export const runSimulation = async (baseInput, scenarios) => {
  const response = await api.post('/simulation', {
    baseInput,
    scenarios,
  })
  return response.data
}

let cachedHistory = null;
let cachedHistoryTime = 0;

export const getCachedHistory = () => {
  if (cachedHistory && Date.now() - cachedHistoryTime < 30000) {
    return cachedHistory;
  }
  return null;
}

export const getHistory = async (force = false) => {
  if (!force && cachedHistory && Date.now() - cachedHistoryTime < 30000) {
    return cachedHistory;
  }
  const response = await api.get('/history')
  const history = response.data?.history || response.data?.data || []
  cachedHistory = history.map((h) => ({
    ...h,
    riskLevel: h.riskScore > 70 ? 'High' : h.riskScore > 40 ? 'Medium' : 'Low'
  }))
  cachedHistoryTime = Date.now()
  return cachedHistory
}

export const saveDecision = async (decision) => {
  const response = await api.post('/history', decision)
  return response.data
}

export const createDynamicShipment = async (origin, destination) => {
  const response = await api.post('/analyze-shipment', { origin, destination })
  return response.data
}

export const transformGeneratedShipment = (data) => {
  if (!data?.shipment) return null

  const s = data.shipment
  const i = data.insights
  const mc = data.modeComparison

  const transformed = {
    id: s.id,
    name: `Shipment ${s.id}`,
    origin: { name: s.origin.name, lat: s.origin.lat, lng: s.origin.lng },
    destination: { name: s.destination.name, lat: s.destination.lat, lng: s.destination.lng },
    currentLocation: { lat: s.currentLocation.lat, lng: s.currentLocation.lng },
    status: s.status,
    etas: s.etas,
    riskFactors: s.riskFactors,
    riskScore: s.riskScore,
    currentCost: s.currentCost,
    potentialLoss: s.potentialLoss,
    priority: s.riskScore === 'Critical' ? 'Critical' : s.riskScore === 'High' ? 'High' : 'Medium',
    cargoType: 'General Cargo',
    vehicleType: 'Semi-Trailer',
    _generated: true,
  }

  const insights = {
    summary: i?.summary || '',
    dominantFactor: i?.dominantFactor || '',
    explanation: i?.explanation || '',
    keyFactors: i?.keyFactors || ['Traffic', 'Delay', 'Cost', 'SLA'],
    actions: (i?.actions || []).map((a) => ({
      type: a.type,
      description: a.description,
      tradeOff: a.tradeOff,
      costImpact: a.costImpact,
      recommended: Boolean(a.recommended),
    })),
  }

  return { transformed, insights, modeComparison: mc }
}

export default api
