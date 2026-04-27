import {
  createShipmentForUser,
  getShipmentByIdForUser,
  getShipmentsByUserId,
  getShipmentByIdPublic
} from '../repositories/shipment.repository.js'

function transformStoredShipment(shipment) {
  const payload = shipment.shipmentPayload?.shipment || null

  if (payload) {
    return {
      id: shipment.id,
      userId: shipment.userId,
      origin: { name: payload.origin.name, lat: payload.origin.lat, lon: payload.origin.lng },
      destination: { name: payload.destination.name, lat: payload.destination.lat, lon: payload.destination.lng },
      traffic: payload.riskFactors?.traffic ?? shipment.traffic,
      weather: payload.riskFactors?.weather ?? shipment.weather,
      delay: payload.riskFactors?.delay ?? shipment.delay,
      priority: shipment.priority,
      status: payload.status || shipment.status,
      riskScore: shipment.riskScore,
      shipmentPayload: shipment.shipmentPayload
    }
  }

  return {
    id: shipment.id,
    userId: shipment.userId,
    origin: shipment.origin,
    destination: shipment.destination,
    traffic: shipment.traffic,
    weather: shipment.weather,
    delay: shipment.delay,
    priority: shipment.priority,
    status: shipment.status,
    riskScore: shipment.riskScore
  }
}

export const getShipments = async (req, res) => {
  try {
    const shipments = await getShipmentsByUserId(req.user.id)

    return res.status(200).json({
      success: true,
      data: shipments.map(transformStoredShipment)
    })
  } catch (error) {
    console.error('Shipment error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch shipments'
    })
  }
}

export const getShipmentById = async (req, res) => {
  try {
    const { id } = req.params
    const shipment = await getShipmentByIdForUser(id, req.user.id)

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      })
    }

    return res.status(200).json({
      success: true,
      data: transformStoredShipment(shipment)
    })
  } catch (error) {
    console.error('Shipment error:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

export const getPublicShipment = async (req, res) => {
  try {
    const { id } = req.params
    const shipment = await getShipmentByIdPublic(id)

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      })
    }

    return res.status(200).json({
      success: true,
      data: transformStoredShipment(shipment)
    })
  } catch (error) {
    console.error('Public shipment error:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

export const createShipment = async (req, res) => {
  try {
    const {
      id,
      origin,
      destination,
      traffic = 0,
      weather = 0,
      delay = 0,
      priority = 'Medium',
      status = 'In Transit',
      riskScore = 0
    } = req.body

    if (!id || !origin?.name || !destination?.name) {
      return res.status(400).json({
        success: false,
        message: 'Shipment id, origin, and destination are required'
      })
    }

    const shipment = await createShipmentForUser(req.user.id, {
      id,
      origin: {
        name: origin.name,
        lat: Number(origin.lat),
        lon: Number(origin.lon ?? origin.lng)
      },
      destination: {
        name: destination.name,
        lat: Number(destination.lat),
        lon: Number(destination.lon ?? destination.lng)
      },
      traffic: Number(traffic),
      weather: Number(weather),
      delay: Number(delay),
      priority,
      status,
      riskScore: Number(riskScore)
    })

    return res.status(201).json({
      success: true,
      data: transformStoredShipment(shipment)
    })
  } catch (error) {
    console.error('Create shipment error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to create shipment'
    })
  }
}
