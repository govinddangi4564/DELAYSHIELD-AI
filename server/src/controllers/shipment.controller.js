import { shipments } from "../data/shipment.js";

// Get all shipments
export const getShipments = (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: shipments,
    });
  } catch (error) {
    console.error("Shipment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch shipments",
    });
  }
};

// Get single shipment
export const getShipmentById = (req, res) => {
  try {
    const { id } = req.params;

    const shipment = shipments.find((s) => s.id === id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: shipment,
    });

  } catch (error) {
    console.error("Shipment error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};