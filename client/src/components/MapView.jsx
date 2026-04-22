import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, PolylineF, InfoWindowF, CircleF } from '@react-google-maps/api';
import { MapPin, Route, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { getCityTraffic } from '../services/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// Sleek dark mode map styling
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
];

const generateAltRoutes = (start, end) => {
  const dLat = end.lat - start.lat;
  const dLng = end.lng - start.lng;
  
  const midLat = start.lat + dLat / 2;
  const midLng = start.lng + dLng / 2;

  const norm = Math.sqrt(dLat * dLat + dLng * dLng);
  if (norm === 0) return { alt1: [], alt2: [] };

  const uLat = -dLng / norm;
  const uLng = dLat / norm;
  const offset = 0.8; 

  const p1 = { lat: start.lat, lng: start.lng };
  const p3 = { lat: end.lat, lng: end.lng };

  const p2_alt1 = { lat: midLat + uLat * offset, lng: midLng + uLng * offset };
  const p2_alt2 = { lat: midLat - uLat * (offset * 1.5), lng: midLng - uLng * (offset * 1.5) };
  
  return {
    alt1: [p1, p2_alt1, p3],
    alt2: [p1, p2_alt2, p3]
  };
};

const decodePolyline = (encoded) => {
  if (!encoded) return [];
  
  // Handle GeoJSON format (array of [lon, lat])
  if (typeof encoded === 'object' && encoded.coordinates) {
    return encoded.coordinates.map(coord => ({
      lat: coord[1],
      lng: coord[0]
    }));
  }
  
  // Handle raw array format
  if (Array.isArray(encoded)) {
    return encoded.map(coord => ({
      lat: coord[1],
      lng: coord[0]
    }));
  }

  if (typeof encoded !== 'string') return [];

  let poly = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return poly;
};

const MapView = ({ shipment, route }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
  });

  const [map, setMap] = useState(null);
  const [activePopup, setActivePopup] = useState(null);
  
  // Layer Toggles
  const [showMain, setShowMain] = useState(true);
  const [showAlt, setShowAlt] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // City traffic data from API
  const [cityTrafficData, setCityTrafficData] = useState([]);

  // Fetch city traffic on mount
  useEffect(() => {
    const fetchTraffic = async () => {
      try {
        const data = await getCityTraffic();
        setCityTrafficData(data);
      } catch (err) {
        console.error('Failed to fetch city traffic:', err);
      }
    };
    fetchTraffic();
  }, []);

  // Get traffic circle color based on traffic score
  const getTrafficColor = (traffic) => {
    if (traffic >= 80) return { fill: '#ef4444', stroke: '#dc2626' }; // red
    if (traffic >= 60) return { fill: '#f59e0b', stroke: '#d97706' }; // amber
    if (traffic >= 40) return { fill: '#3b82f6', stroke: '#2563eb' }; // blue
    return { fill: '#10b981', stroke: '#059669' }; // green
  };

  // Animated Position State
  const [animatedPos, setAnimatedPos] = useState(null);

  const onLoad = useCallback(function callback(mapInstance) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback(mapInstance) {
    setMap(null);
  }, []);

  // Fit bounds when map or shipment changes
  useEffect(() => {
    if (map && shipment) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: shipment.origin.lat, lng: shipment.origin.lng });
      bounds.extend({ lat: shipment.destination.lat, lng: shipment.destination.lng });
      map.fitBounds(bounds, 50); // padding
    }
  }, [map, shipment]);

  // Decode actual highway path from geometry
  const decodedMainPath = useMemo(() => {
    if (route?.geometry) {
      return decodePolyline(route.geometry);
    }
    return null;
  }, [route]);

  // Handle Live Tracker Animation Loop
  useEffect(() => {
    if (!shipment) {
      setAnimatedPos(null);
      return;
    }
    
    let animId;
    let progress = 0;
    
    const startLoc = shipment.currentLocation;
    const endLoc = shipment.destination;

    const tick = () => {
      progress += 0.0015; // Speed adjustment
      if (progress > 1) progress = 0; 
      
      if (decodedMainPath && decodedMainPath.length > 0) {
        // Follow the actual road path
        const totalPoints = decodedMainPath.length;
        const index = Math.floor(progress * (totalPoints - 1));
        const nextIndex = Math.min(index + 1, totalPoints - 1);
        
        // Sub-segment interpolation for smooth movement
        const segmentProgress = (progress * (totalPoints - 1)) - index;
        const p1 = decodedMainPath[index];
        const p2 = decodedMainPath[nextIndex];
        
        if (p1 && p2) {
          const newLat = p1.lat + (p2.lat - p1.lat) * segmentProgress;
          const newLng = p1.lng + (p2.lng - p1.lng) * segmentProgress;
          setAnimatedPos({ lat: newLat, lng: newLng });
        }
      } else if (startLoc && endLoc) {
        // Fallback to straight line
        const newLat = startLoc.lat + (endLoc.lat - startLoc.lat) * progress;
        const newLng = startLoc.lng + (endLoc.lng - startLoc.lng) * progress;
        setAnimatedPos({ lat: newLat, lng: newLng });
      }
      
      animId = requestAnimationFrame(tick);
    };
    
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [shipment, decodedMainPath]);

  const altRoutes = useMemo(() => {
    if (!shipment) return null;
    
    let alt1 = [];
    let alt2 = [];
    let generated = null;

    if (route?.alt1Geometry) {
      alt1 = decodePolyline(route.alt1Geometry);
    } else {
      generated = generated || generateAltRoutes(shipment.origin, shipment.destination);
      alt1 = generated.alt1;
    }

    if (route?.alt2Geometry) {
      alt2 = decodePolyline(route.alt2Geometry);
    } else {
      generated = generated || generateAltRoutes(shipment.origin, shipment.destination);
      alt2 = generated.alt2;
    }

    return { alt1, alt2 };
  }, [shipment, route]);


  if (!shipment) {
    return (
      <div className="w-full h-full glass-panel flex flex-col items-center justify-center min-h-[400px]">
        <MapPin size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-bold">Select a shipment to begin live tracking.</p>
      </div>
    );
  }

  // Fallback to straight line if no route geometry
  const positionsMainCompleted = decodedMainPath 
    ? decodedMainPath.slice(0, Math.floor(decodedMainPath.length * 0.4)) // approximation
    : [
        { lat: shipment.origin.lat, lng: shipment.origin.lng },
        { lat: shipment.currentLocation.lat, lng: shipment.currentLocation.lng }
      ];
  
  const positionsMainRemaining = decodedMainPath
    ? decodedMainPath.slice(Math.floor(decodedMainPath.length * 0.4))
    : [
        { lat: shipment.currentLocation.lat, lng: shipment.currentLocation.lng },
        { lat: shipment.destination.lat, lng: shipment.destination.lng }
      ];

  return (
    <div className="w-full h-full glass-panel overflow-hidden min-h-[500px] relative rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-lg">
      
      {/* Map Rendering strictly if loaded */}
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={{ lat: shipment.currentLocation.lat, lng: shipment.currentLocation.lng }}
          zoom={6}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            styles: darkMapStyle,
            disableDefaultUI: true, // hide bulky UI elements
            zoomControl: true, // allow user to zoom with buttons
            scrollwheel: true, // allow zooming via mouse scroll
            gestureHandling: 'greedy', // immediate zooming on touch devices
          }}
        >
          {/* Origin Marker */}
          {shipment?.origin && (
            <MarkerF 
              position={{ lat: shipment.origin.lat, lng: shipment.origin.lng }}
              onClick={() => setActivePopup('origin')}
            >
              {activePopup === 'origin' && (
                <InfoWindowF onCloseClick={() => setActivePopup(null)}>
                  <div className="text-slate-800 p-1">
                    <strong>Origin: {shipment.origin.name}</strong><br/>
                    <span className="text-xs text-slate-500 font-normal">Departed</span>
                  </div>
                </InfoWindowF>
              )}
            </MarkerF>
          )}
          
          {/* Destination Marker */}
          {shipment?.destination && (
            <MarkerF 
              position={{ lat: shipment.destination.lat, lng: shipment.destination.lng }}
              onClick={() => setActivePopup('destination')}
            >
               {activePopup === 'destination' && (
                <InfoWindowF onCloseClick={() => setActivePopup(null)}>
                  <div className="text-slate-800 p-1">
                    <strong>Destination: {shipment.destination.name}</strong><br/>
                    <span className="text-xs text-slate-500 font-normal">ETA: {shipment.etas?.updated}</span>
                  </div>
                </InfoWindowF>
              )}
            </MarkerF>
          )}

          {/* Animated Tracker Marker */}
          {animatedPos?.lat != null && animatedPos?.lng != null && window.google?.maps && (
             <MarkerF 
                position={animatedPos} 
                onClick={() => setActivePopup('tracker')}
                icon={{
                  url: 'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233b82f6" width="32" height="32"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
                  scaledSize: new window.google.maps.Size(32, 32),
                  anchor: new window.google.maps.Point(16, 32)
                }}
             >
                {activePopup === 'tracker' && (
                  <InfoWindowF onCloseClick={() => setActivePopup(null)}>
                    <div className="text-slate-800 p-1 font-bold">
                      <span className="text-blue-600">Live Tracker</span><br/>
                      <span className="text-xs text-slate-600 font-normal">Status: {shipment?.status}</span>
                    </div>
                  </InfoWindowF>
                )}
             </MarkerF>
          )}

          {/* Route Vectors */}
          {showMain && (
            <>
              {/* Completed Line */}
              {positionsMainCompleted?.length > 0 && (
                <PolylineF 
                  path={positionsMainCompleted}
                  options={{ strokeColor: '#10b981', strokeWeight: 4, strokeOpacity: 0.9 }}
                  onClick={() => setActivePopup('mainC')}
                />
              )}
              {activePopup === 'mainC' && positionsMainCompleted?.length > 0 && (
                <InfoWindowF position={positionsMainCompleted[Math.floor(positionsMainCompleted.length / 2)]} onCloseClick={() => setActivePopup(null)}>
                   <div className="text-slate-800">
                     <strong className="text-emerald-700">Completed Route</strong><br/>
                     Successfully traveled.<br/>
                     {route?.majorRoads?.length > 0 && <span className="text-xs text-slate-500">Via {route.majorRoads.join(', ')}</span>}
                   </div>
                </InfoWindowF>
              )}

              {/* Remaining Line Highlight Glow */}
              {positionsMainRemaining?.length > 0 && (
                <PolylineF 
                  path={positionsMainRemaining}
                  options={{ 
                    strokeOpacity: 0.4, 
                    strokeColor: '#60a5fa', 
                    strokeWeight: 12,
                    clickable: false
                  }}
                />
              )}
              {/* Remaining Line Core */}
              {positionsMainRemaining?.length > 0 && (
                <PolylineF 
                  path={positionsMainRemaining}
                  options={{ 
                    strokeOpacity: 1, 
                    strokeColor: '#1d4ed8', 
                    strokeWeight: 5 
                  }}
                  onClick={() => setActivePopup('mainR')}
                />
              )}
              
              {/* NH Label for Main Route */}
              {route?.majorRoads?.length > 0 && positionsMainRemaining?.length > 0 && window.google?.maps && (
                <MarkerF
                  position={positionsMainRemaining[Math.floor(positionsMainRemaining.length / 2)]}
                  label={{
                    text: route.majorRoads[0]?.split(',')[0] || 'Route',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 'bold',
                  }}
                  icon={{
                    url: 'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="54" height="20" viewBox="0 0 54 20"><rect width="54" height="20" rx="10" fill="%231d4ed8" stroke="white" stroke-width="1.5"/></svg>',
                    scaledSize: new window.google.maps.Size(54, 20),
                    anchor: new window.google.maps.Point(27, 10)
                  }}
                />
              )}

              {activePopup === 'mainR' && positionsMainRemaining?.length > 0 && (
                <InfoWindowF position={positionsMainRemaining[0]} onCloseClick={() => setActivePopup(null)}>
                   <div className="text-slate-800">
                     <strong className="text-blue-700">AI Primary Path</strong><br/>
                     Optimal trajectory.<br/>
                     {route?.majorRoads?.length > 0 && <span className="text-xs font-semibold text-slate-600">Route: {route.majorRoads.join(', ')}</span>}
                   </div>
                </InfoWindowF>
              )}
            </>
          )}

          {/* Alternate Routes Layer */}
          {showAlt && altRoutes && (
            <>
              {/* Alt 1 */}
              <PolylineF 
                path={altRoutes.alt1}
                options={{ strokeColor: '#fbbf24', strokeWeight: 5, strokeOpacity: 0.9 }}
                onClick={() => setActivePopup('alt1')}
              />
              {altRoutes.alt1?.length > 1 && window.google?.maps && (
                <MarkerF
                  position={altRoutes.alt1[1]}
                  label={{
                    text: route?.suggestedAltRoads?.[0] || 'NH46',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                  icon={{
                    url: 'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="46" height="18" viewBox="0 0 46 18"><rect width="46" height="18" rx="9" fill="%23b45309" stroke="white" stroke-width="1.5"/></svg>',
                    scaledSize: new window.google.maps.Size(46, 18),
                    anchor: new window.google.maps.Point(23, 9)
                  }}
                />
              )}
              {activePopup === 'alt1' && altRoutes.alt1?.length > 1 && (
                 <InfoWindowF position={altRoutes.alt1[1]} onCloseClick={() => setActivePopup(null)}>
                   <div className="text-slate-800">
                     <strong>Alternate Route 1</strong><br/>
                     Traffic bypass.<br/>
                     <span className="text-xs text-slate-500">Via {route?.suggestedAltRoads?.[0] || 'NH46'}</span>
                   </div>
                 </InfoWindowF>
              )}

              {/* Alt 2 */}
              <PolylineF 
                path={altRoutes.alt2}
                options={{ strokeColor: '#f97316', strokeWeight: 4, strokeOpacity: 0.8 }}
                onClick={() => setActivePopup('alt2')}
              />
              {altRoutes.alt2?.length > 1 && window.google?.maps && (
                <MarkerF
                  position={altRoutes.alt2[1]}
                  label={{
                    text: route?.suggestedAltRoads?.[1] || 'NH52',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                  icon={{
                    url: 'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="46" height="18" viewBox="0 0 46 18"><rect width="46" height="18" rx="9" fill="%23c2410c" stroke="white" stroke-width="1.5"/></svg>',
                    scaledSize: new window.google.maps.Size(46, 18),
                    anchor: new window.google.maps.Point(23, 9)
                  }}
                />
              )}
               {activePopup === 'alt2' && altRoutes.alt2?.length > 1 && (
                 <InfoWindowF position={altRoutes.alt2[1]} onCloseClick={() => setActivePopup(null)}>
                   <div className="text-slate-800">
                     <strong>Alternate Route 2</strong><br/>
                     Weather storm bypass.<br/>
                     <span className="text-xs text-slate-500">Via {route?.suggestedAltRoads?.[1] || 'NH52'}</span>
                   </div>
                 </InfoWindowF>
              )}
            </>
          )}

          {/* City Traffic Overlay */}
          {showTraffic && cityTrafficData?.map((city, idx) => {
            const colors = getTrafficColor(city.traffic);
            if (!city.lat || !city.lon) return null;
            return (
              <CircleF
                key={`traffic-${idx}`}
                center={{ lat: city.lat, lng: city.lon }}
                radius={30000}
                options={{
                  fillColor: colors.fill,
                  fillOpacity: 0.35,
                  strokeColor: colors.stroke,
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  clickable: true,
                }}
                onClick={() => setActivePopup(`traffic-${idx}`)}
              />
            );
          })}
          {showTraffic && cityTrafficData?.map((city, idx) => (
            activePopup === `traffic-${idx}` && city.lat && city.lon && (
              <InfoWindowF
                key={`info-traffic-${idx}`}
                position={{ lat: city.lat, lng: city.lon }}
                onCloseClick={() => setActivePopup(null)}
              >
                <div className="text-slate-800 p-1">
                  <strong>{city.name}</strong><br/>
                  <span className="text-xs text-slate-500">Traffic: <strong>{city.traffic}</strong></span><br/>
                  <span className="text-xs text-slate-400">{city.state}</span>
                </div>
              </InfoWindowF>
            )
          ))}
        </GoogleMap>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Floating UI Overlay: Controls & Legend */}
      <div className="absolute top-4 right-4 z-[999] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-3 lg:p-4 rounded-xl shadow-xl flex flex-col max-w-xs transition-all duration-300">
        
        {/* Header (Clickable) */}
        <div 
          className={`flex items-center justify-between cursor-pointer gap-4 ${isPanelOpen ? 'border-b border-slate-200 dark:border-slate-700 pb-2 mb-4' : ''}`}
          onClick={() => setIsPanelOpen(!isPanelOpen)}
        >
          <div className="flex items-center gap-2">
            <Route size={18} className="text-indigo-500" />
            <h3 className="font-black text-slate-800 dark:text-slate-200 text-sm tracking-tight">AI Routing Intelligence</h3>
          </div>
          {isPanelOpen ? <ChevronUp size={16} className="text-slate-500 shrink-0" /> : <ChevronDown size={16} className="text-slate-500 shrink-0" />}
        </div>

        {/* Content */}
        {isPanelOpen && (
          <div className="flex flex-col gap-4">
            {/* Toggles */}
            <div className="space-y-2">
              <button 
                onClick={() => setShowMain(!showMain)}
                className="flex items-center justify-between w-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" /> Main Route</span>
                {showMain ? <Eye size={14} /> : <EyeOff size={14} className="opacity-50" />}
              </button>
              
              <button 
                onClick={() => setShowAlt(!showAlt)}
                className="flex items-center justify-between w-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-orange-400 shadow-sm shadow-orange-500/50" /> Alternatives</span>
                {showAlt ? <Eye size={14} /> : <EyeOff size={14} className="opacity-50" />}
              </button>

              <button 
                onClick={() => setShowTraffic(!showTraffic)}
                className="flex items-center justify-between w-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400 shadow-sm shadow-red-500/50" /> City Traffic</span>
                {showTraffic ? <Eye size={14} /> : <EyeOff size={14} className="opacity-50" />}
              </button>
            </div>

            {/* Legend */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex items-start gap-2 text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                 <div className="w-6 h-1 mt-1 shrink-0 bg-blue-500 rounded" style={{ borderStyle: 'dashed' }} />
                 <p><strong className="text-slate-700 dark:text-slate-300">AI Primary Path:</strong> Fastest, lowest cost trajectory.</p>
              </div>
              <div className="flex items-start gap-2 text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                 <div className="w-6 h-1 mt-1 shrink-0 bg-yellow-500 rounded" />
                 <p><strong className="text-slate-700 dark:text-slate-300">Alt 1:</strong> Traffic bypass.</p>
              </div>
              <div className="flex items-start gap-2 text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                 <div className="w-6 h-1 mt-1 shrink-0 bg-orange-500 rounded" />
                 <p><strong className="text-slate-700 dark:text-slate-300">Alt 2:</strong> Weather/Storm bypass.</p>
              </div>
              <div className="flex items-start gap-2 text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                 <div className="w-3 h-3 mt-0.5 shrink-0 bg-red-400/40 rounded-full border border-red-500" />
                 <p><strong className="text-slate-700 dark:text-slate-300">Traffic:</strong> City congestion zones (live API).</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(MapView);
