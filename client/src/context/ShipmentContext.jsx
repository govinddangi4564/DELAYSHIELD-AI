import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getShipments, analyzeSLA, getShipmentSLA } from '../services/api';

const ShipmentContext = createContext();

export const useShipments = () => useContext(ShipmentContext);

export const ShipmentProvider = ({ children }) => {
  const [shipments, setShipments] = useState([]);
  const [slaAnalyses, setSlaAnalyses] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchShipments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getShipments(true); // force fetch
      setShipments(data || []);
    } catch (error) {
      console.error("Failed to fetch shipments:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const addShipment = (shipment) => {
    setShipments(prev => [shipment, ...prev]);
  };

  const analyzeShipmentSLA = async (payload) => {
    try {
      const result = await analyzeSLA(payload);
      if (result && result.shipmentId) {
        setSlaAnalyses(prev => ({
          ...prev,
          [result.shipmentId]: result
        }));
      }
      return result;
    } catch (error) {
      console.error("Failed to analyze SLA:", error);
      return null;
    }
  };

  const fetchShipmentSLA = async (shipmentId) => {
    try {
      const result = await getShipmentSLA(shipmentId);
      if (result && result.shipmentId) {
        setSlaAnalyses(prev => ({
          ...prev,
          [result.shipmentId]: result
        }));
      }
      return result;
    } catch (error) {
      console.error("Failed to fetch shipment SLA:", error);
      return null;
    }
  };

  return (
    <ShipmentContext.Provider value={{
      shipments,
      isLoading,
      fetchShipments,
      addShipment,
      slaAnalyses,
      analyzeShipmentSLA,
      fetchShipmentSLA
    }}>
      {children}
    </ShipmentContext.Provider>
  );
};
