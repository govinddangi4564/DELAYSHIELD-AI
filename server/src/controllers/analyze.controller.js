import { calculateRisk } from '../engine/risk/riskengine.js'
import { makeDecision } from '../engine/decision/decisionengine.js'
import { getWeatherData } from '../integrations/weather.api.js'
import { getRoute } from '../integrations/route.api.js'
import { calculateCostImpact, calculateLossImpact, calculateCarbonImpact } from '../engine/cost/costengine.js'
import { generateAIPlan } from '../engine/decision/aiplanner.js'
import { explainDecision } from '../engine/decision/aiExplainer.js'
import { generateAlert } from '../engine/alerts/alertEngine.js'
import { addHistory } from '../engine/history/historyEngine.js'
import { simulateTraffic } from '../utils/simulatetraffic.js'
import { generateShipment } from '../engine/decision/shipmentGenerator.js'
import { createShipmentForUser, getShipmentByIdForUser } from '../repositories/shipment.repository.js'

export const analyzeShipment = async (req, res) => {
  try {
    const { traffic, delay, lat, lon, endLat, endLon, priority, shipmentId, origin, destination } = req.body
    const safeShipmentId = String(shipmentId || 'SHP-0')

    if (shipmentId) {
      const ownedShipment = await getShipmentByIdForUser(safeShipmentId, req.user.id)
      if (!ownedShipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found for current user'
        })
      }
    }

    const nLat = Number(lat)
    const nLon = Number(lon)
    const nEndLat = Number(endLat)
    const nEndLon = Number(endLon)

    let weatherData = { weatherScore: 25 }
    let routeData = {
      distance: 210000,
      duration: 14400,
      majorRoads: ['Main Highway'],
      suggestedAltRoads: ['NH-Alt-A', 'NH-Alt-B'],
      path: [[nLat, nLon], [nEndLat, nEndLon]]
    }

    try {
      const [w, r] = await Promise.all([
        getWeatherData(nLat, nLon).catch(() => weatherData),
        getRoute([nLon, nLat], [nEndLon, nEndLat]).catch(() => routeData)
      ])
      weatherData = w
      routeData = r
    } catch {}

    const finalTraffic = traffic ?? simulateTraffic('medium', weatherData.weatherScore, 'Bhopal')

    const riskResult = calculateRisk({
      traffic: finalTraffic,
      weather: weatherData.weatherScore || 25,
      delay: delay || 0
    })
    const decisionResult = makeDecision(riskResult)
    const costResult = calculateCostImpact({
      delay: delay || 0,
      priority: priority || 'Medium',
      riskLevel: riskResult.level,
      routeData
    })
    const lossImpact = calculateLossImpact(delay || 0)
    const carbonImpact = calculateCarbonImpact({ 
      distanceMeters: routeData.distance || 0, 
      delayMinutes: delay || 0 
    })

    const aiResult = await generateAIPlan({
      risk: { ...riskResult, traffic: finalTraffic, delay },
      decision: decisionResult,
      route: routeData,
      cost: costResult,
      shipmentId: safeShipmentId,
      origin: origin?.name || origin || 'Origin',
      destination: destination?.name || destination || 'Destination'
    })

    const alertResult = generateAlert({ risk: riskResult, decision: decisionResult, aiInsights: aiResult.data })
    const explainerResult = explainDecision({ risk: riskResult, decision: decisionResult, cost: costResult, shipmentId: safeShipmentId })

    const unifiedInsights = {
      ...explainerResult,
      ...aiResult.data,
      success: aiResult.success
    }

    const aiHighways = aiResult.data?.identifiedHighways || []

    try {
      const formattedImpact = costResult.savings !== null 
        ? `${costResult.savings >= 0 ? '+' : ''}INR ${Math.abs(costResult.savings).toLocaleString()}`
        : 'INR 0'

      addHistory({
        shipmentId: safeShipmentId,
        userId: req.user.id,
        route: aiHighways[0] || routeData.majorRoads[0],
        decision: decisionResult.action,
        riskScore: riskResult.score,
        costImpact: formattedImpact
      })
    } catch {}

    return res.status(200).json({
      success: true,
      input: { traffic: finalTraffic, delay, shipmentId: safeShipmentId },
      risk: riskResult,
      decision: decisionResult,
      cost: costResult,
      lossImpact: lossImpact,
      carbonImpact: carbonImpact,
      weather: weatherData,
      route: {
        ...routeData,
        majorRoads: aiHighways.length > 0 ? [aiHighways[0]] : routeData.majorRoads,
        suggestedAltRoads: aiHighways.length > 2
          ? [aiHighways[1], aiHighways[2]]
          : (routeData.suggestedAltRoads || ['NH-Alt-A', 'NH-Alt-B'])
      },
      ai: unifiedInsights,
      alert: alertResult
    })
  } catch (error) {
    console.error('[analyzeController] Critical Failure:', error.message)
    return res.status(500).json({ success: false, message: 'System failure in analysis pipeline' })
  }
}

export const generateDynamicShipment = async (req, res) => {
  try {
    const { origin, destination } = req.body

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: "Both 'origin' and 'destination' are required."
      })
    }

    console.log(`[analyze-shipment] Generating shipment: ${origin} -> ${destination}`)

    const result = await generateShipment(origin, destination)
    const newShipment = result.data.shipment

    await createShipmentForUser(req.user.id, {
      id: newShipment.id,
      origin: { name: newShipment.origin.name, lat: newShipment.origin.lat, lon: newShipment.origin.lng },
      destination: { name: newShipment.destination.name, lat: newShipment.destination.lat, lon: newShipment.destination.lng },
      traffic: newShipment.riskFactors.traffic,
      weather: newShipment.riskFactors.weather,
      delay: newShipment.riskFactors.delay,
      priority: newShipment.riskScore === 'Critical' ? 'Critical' : newShipment.riskScore === 'High' ? 'High' : 'Medium',
      status: newShipment.status,
      riskScore: newShipment.riskFactors.traffic * 0.5 + newShipment.riskFactors.weather * 0.3 + newShipment.riskFactors.delay * 0.2,
      fullPayload: result.data
    })

    try {
      const rh = result.data.routeHistory
      let impact = rh?.costImpact || 'INR 0'
      if (typeof impact === 'number') {
        impact = `${impact >= 0 ? '+' : ''}INR ${Math.abs(impact).toLocaleString()}`
      }

      addHistory({
        shipmentId: newShipment.id,
        userId: req.user.id,
        route: rh?.route || `${origin} -> ${destination}`,
        decision: rh?.decision || 'Monitor',
        riskScore: newShipment.riskFactors.traffic * 0.5 + newShipment.riskFactors.weather * 0.3 + newShipment.riskFactors.delay * 0.2,
        costImpact: impact
      })
    } catch (e) {
      console.warn('[analyze-shipment] History save skipped:', e.message)
    }

    return res.status(200).json({
      success: true,
      data: result.data
    })
  } catch (error) {
    console.error('[analyze-shipment] Failure:', error.message)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate shipment analysis'
    })
  }
}
