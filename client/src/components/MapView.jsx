import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, PolylineF, InfoWindowF } from '@react-google-maps/api';
import { MapPin, Route, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

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

const MapView = ({ shipment }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
  });

  const [map, setMap] = useState(null);
  const [activePopup, setActivePopup] = useState(null);
  
  // Layer Toggles
  const [showMain, setShowMain] = useState(true);
  const [showAlt, setShowAlt] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

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
      progress += 0.002; // Update speed
      if (progress > 1) progress = 0; // Loop tracking gracefully
      
      const newLat = startLoc.lat + (endLoc.lat - startLoc.lat) * progress;
      const newLng = startLoc.lng + (endLoc.lng - startLoc.lng) * progress;
      
      setAnimatedPos({ lat: newLat, lng: newLng });
      animId = requestAnimationFrame(tick);
    };
    
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [shipment]);

  const altRoutes = useMemo(() => {
    if (!shipment) return null;
    return generateAltRoutes(shipment.origin, shipment.destination);
  }, [shipment]);

  if (!shipment) {
    return (
      <div className="w-full h-full glass-panel flex flex-col items-center justify-center min-h-[400px]">
        <MapPin size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-bold">Select a shipment to begin live tracking.</p>
      </div>
    );
  }

  const positionsMainCompleted = [
    { lat: shipment.origin.lat, lng: shipment.origin.lng },
    { lat: shipment.currentLocation.lat, lng: shipment.currentLocation.lng }
  ];
  
  const positionsMainRemaining = [
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
          
          {/* Destination Marker */}
          <MarkerF 
            position={{ lat: shipment.destination.lat, lng: shipment.destination.lng }}
            onClick={() => setActivePopup('destination')}
          >
             {activePopup === 'destination' && (
              <InfoWindowF onCloseClick={() => setActivePopup(null)}>
                <div className="text-slate-800 p-1">
                  <strong>Destination: {shipment.destination.name}</strong><br/>
                  <span className="text-xs text-slate-500 font-normal">ETA: {shipment.etas.updated}</span>
                </div>
              </InfoWindowF>
            )}
          </MarkerF>

          {/* Animated Tracker Marker */}
          {animatedPos && (
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
                      <span className="text-xs text-slate-600 font-normal">Status: {shipment.status}</span>
                    </div>
                  </InfoWindowF>
                )}
             </MarkerF>
          )}

          {/* Route Vectors */}
          {showMain && (
            <>
              {/* Completed Line */}
              <PolylineF 
                path={positionsMainCompleted}
                options={{ strokeColor: '#10b981', strokeWeight: 4, strokeOpacity: 0.9 }}
                onClick={() => setActivePopup('mainC')}
              />
              {activePopup === 'mainC' && (
                <InfoWindowF position={positionsMainCompleted[1]} onCloseClick={() => setActivePopup(null)}>
                   <div className="text-slate-800"><strong className="text-emerald-700">Completed Route</strong><br/>Successfully traveled.</div>
                </InfoWindowF>
              )}

              {/* Remaining Line (Dashed via icons workaround for Google Maps, or simple solid) */}
              <PolylineF 
                path={positionsMainRemaining}
                options={{ 
                  strokeOpacity: 0, 
                  icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 }, offset: '0', repeat: '15px' }],
                  strokeColor: '#3b82f6', 
                  strokeWeight: 4 
                }}
                onClick={() => setActivePopup('mainR')}
              />
              {activePopup === 'mainR' && (
                <InfoWindowF position={positionsMainRemaining[0]} onCloseClick={() => setActivePopup(null)}>
                   <div className="text-slate-800"><strong className="text-blue-700">AI Primary Path</strong><br/>Optimal trajectory.</div>
                </InfoWindowF>
              )}
            </>
          )}

          {/* Alternate Routes Layer */}
          {showAlt && altRoutes && (
            <>
              <PolylineF 
                path={altRoutes.alt1}
                options={{ strokeColor: '#eab308', strokeWeight: 3, strokeOpacity: 0.8 }}
                onClick={() => setActivePopup('alt1')}
              />
              {activePopup === 'alt1' && (
                 <InfoWindowF position={altRoutes.alt1[1]} onCloseClick={() => setActivePopup(null)}>
                   <div className="text-slate-800"><strong>Alternate Route 1</strong><br/>Traffic bypass.</div>
                 </InfoWindowF>
              )}

              <PolylineF 
                path={altRoutes.alt2}
                options={{ strokeColor: '#f97316', strokeWeight: 3, strokeOpacity: 0.8 }}
                onClick={() => setActivePopup('alt2')}
              />
               {activePopup === 'alt2' && (
                 <InfoWindowF position={altRoutes.alt2[1]} onCloseClick={() => setActivePopup(null)}>
                   <div className="text-slate-800"><strong>Alternate Route 2</strong><br/>Weather storm bypass.</div>
                 </InfoWindowF>
              )}
            </>
          )}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(MapView);
