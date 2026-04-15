import axios from "axios";

export const getRoute = async (start, end) => {
  try {
    const response = await axios.post(
      "https://api.openrouteservice.org/v2/directions/driving-car",
      {
        coordinates: [start, end],
      },
      {
        headers: {
          Authorization: process.env.ROUTE_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const route = response.data.routes[0];

    return {
      distance: route.summary.distance, // meters
      duration: route.summary.duration, // seconds
      geometry: route.geometry, // for map
    };
  } catch (error) {
    console.error("Route API Error:", error.message);
    return null;
  }
};