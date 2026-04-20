export const shipments = [
  {
    id: "SHP001",
    name: "Electronics Delivery",
    source: {
      city: "Bhopal",
      lat: 23.2599,
      lon: 77.4126,
    },
    destination: {
      city: "Indore",
      lat: 22.7196,
      lon: 75.8577,
    },
    traffic: 80,
    delay: 40,
    priority: "High",
    cargoType: "Electronics",
    vehicleType: "Truck",
    status: "In Transit",
  },

  {
    id: "SHP002",
    name: "Pharmaceutical Supply",
    source: {
      city: "Delhi",
      lat: 28.6139,
      lon: 77.2090,
    },
    destination: {
      city: "Jaipur",
      lat: 26.9124,
      lon: 75.7873,
    },
    traffic: 60,
    delay: 20,
    priority: "Medium",
    cargoType: "Medicines",
    vehicleType: "Van",
    status: "Dispatched",
  },

  {
    id: "SHP003",
    name: "Automobile Parts",
    source: {
      city: "Mumbai",
      lat: 19.0760,
      lon: 72.8777,
    },
    destination: {
      city: "Pune",
      lat: 18.5204,
      lon: 73.8567,
    },
    traffic: 90,
    delay: 70,
    priority: "High",
    cargoType: "Auto Parts",
    vehicleType: "Truck",
    status: "Delayed",
  },

  {
    id: "SHP004",
    name: "Retail Goods",
    source: {
      city: "Bangalore",
      lat: 12.9716,
      lon: 77.5946,
    },
    destination: {
      city: "Chennai",
      lat: 13.0827,
      lon: 80.2707,
    },
    traffic: 50,
    delay: 15,
    priority: "Low",
    cargoType: "Clothing",
    vehicleType: "Mini Truck",
    status: "In Transit",
  },

  {
    id: "SHP005",
    name: "Food Supply Chain",
    source: {
      city: "Ahmedabad",
      lat: 23.0225,
      lon: 72.5714,
    },
    destination: {
      city: "Surat",
      lat: 21.1702,
      lon: 72.8311,
    },
    traffic: 70,
    delay: 30,
    priority: "Medium",
    cargoType: "Perishables",
    vehicleType: "Refrigerated Truck",
    status: "In Transit",
  },
];