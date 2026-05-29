"use client";

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Car, MapPin, RefreshCw, Radio, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Driver {
  id: number;
  name: string;
  phone: string;
  vehiclePlate: string;
  latitude: string | null;
  longitude: string | null;
  locationUpdatedAt: string | null;
  isTracking: boolean;
  currentOrderAddress: string | null;
}

export default function DriverMapInner({ lang, dict }: { lang: string; dict: any }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});
  
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Custom marker icon creator
  const createDriverIcon = (isTracking: boolean, driverName: string) => {
    const color = isTracking ? '#10b981' : '#64748b'; // Emerald for active tracking, slate for offline/idle
    
    return L.divIcon({
      className: 'custom-driver-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          ${isTracking ? `
            <span style="
              position: absolute;
              display: inline-flex;
              height: 36px;
              width: 36px;
              border-radius: 9999px;
              background-color: #34d399;
              opacity: 0.4;
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></span>
          ` : ''}
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 28px;
            width: 28px;
            border-radius: 9999px;
            background-color: ${color};
            border: 2px solid white;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            color: white;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path>
              <path d="M19 18h2a1 1 0 0 0 1-1v-5.05a1.001 1.001 0 0 0-.293-.707l-4.07-4.04a1 1 0 0 0-.693-.293h-2.02"></path>
              <circle cx="7" cy="18" r="2"></circle>
              <circle cx="17" cy="18" r="2"></circle>
            </svg>
          </div>
          <div style="
            position: absolute;
            bottom: -22px;
            white-space: nowrap;
            background-color: rgba(15, 23, 42, 0.85);
            color: white;
            font-size: 9px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid rgba(51, 65, 85, 0.5);
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          ">
            ${driverName}
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });
  };

  const fetchDriverLocations = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch('/api/driver/locations');
      if (!res.ok) throw new Error('Failed to fetch locations');
      const data = await res.json();
      setDrivers(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching driver locations:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSimulateGps = async () => {
    setIsRefreshing(true);
    const simulatedCoordinates: Record<string, { lat: number; lng: number }> = {
      'Polat': { lat: 41.3032, lng: 69.2612 },
      'Aziz': { lat: 41.2825, lng: 69.2086 },
      'Sardor': { lat: 41.3211, lng: 69.2482 },
      'Farrux': { lat: 41.3122, lng: 69.2785 },
      'Jasur': { lat: 41.2678, lng: 69.2234 }
    };

    try {
      await Promise.all(
        drivers.map(async (d) => {
          const coords = simulatedCoordinates[d.name] || {
            lat: 41.3 + (Math.random() - 0.5) * 0.05,
            lng: 69.24 + (Math.random() - 0.5) * 0.05
          };
          return fetch('/api/driver/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              driverId: d.id,
              latitude: coords.lat,
              longitude: coords.lng
            })
          });
        })
      );
      await fetchDriverLocations(true);
    } catch (err) {
      console.error('Error simulating GPS:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Default center: Tashkent, Uzbekistan
      const map = L.map(mapContainerRef.current, {
        center: [41.2995, 69.2401],
        zoom: 12,
        zoomControl: false,
      });

      // Elegant, clean CartoDB Voyager tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      // Add Zoom control at top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapRef.current = map;
      fetchDriverLocations();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers when drivers data changes
  useEffect(() => {
    if (!mapRef.current || drivers.length === 0) return;

    const map = mapRef.current;
    const currentMarkers = markersRef.current;
    const activeDriverIds = new Set<number>();

    drivers.forEach((driver) => {
      if (driver.latitude && driver.longitude) {
        const lat = parseFloat(driver.latitude);
        const lng = parseFloat(driver.longitude);
        activeDriverIds.add(driver.id);

        const popupContent = `
          <div style="font-family: inherit; padding: 4px; min-width: 180px;">
            <h4 style="font-weight: 700; color: #0f172a; margin: 0 0 6px 0; font-size: 14px; display: flex; align-items: center; gap: 6px;">
              <span style="height: 8px; width: 8px; border-radius: 50%; background-color: ${driver.isTracking ? '#10b981' : '#64748b'}; display: inline-block;"></span>
              ${driver.name}
            </h4>
            <div style="font-size: 12px; color: #475569; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #64748b;"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
              <span>${driver.vehiclePlate}</span>
            </div>
            <div style="font-size: 12px; color: #475569; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #64748b;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <span>${driver.phone}</span>
            </div>
            ${driver.isTracking && driver.currentOrderAddress ? `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #047857;">
                <strong>${dict.destination || 'Belgilangan manzil'}:</strong><br/>
                <span style="color: #0f172a;">${driver.currentOrderAddress}</span>
              </div>
            ` : ''}
          </div>
        `;

        if (currentMarkers[driver.id]) {
          // Update existing marker
          const marker = currentMarkers[driver.id];
          marker.setLatLng([lat, lng]);
          marker.setIcon(createDriverIcon(driver.isTracking, driver.name));
          marker.getPopup()?.setContent(popupContent);
        } else {
          // Create new marker
          const marker = L.marker([lat, lng], {
            icon: createDriverIcon(driver.isTracking, driver.name)
          })
            .addTo(map)
            .bindPopup(popupContent);
          
          currentMarkers[driver.id] = marker;
        }
      }
    });

    // Remove stale markers (drivers no longer sending location or removed)
    Object.keys(currentMarkers).forEach((idStr) => {
      const id = parseInt(idStr);
      if (!activeDriverIds.has(id)) {
        currentMarkers[id].remove();
        delete currentMarkers[id];
      }
    });
  }, [drivers, dict]);

  // Polling hook (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDriverLocations(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleFlyToDriver = (driver: Driver) => {
    if (!mapRef.current || !driver.latitude || !driver.longitude) return;
    
    setSelectedDriverId(driver.id);
    const lat = parseFloat(driver.latitude);
    const lng = parseFloat(driver.longitude);

    mapRef.current.flyTo([lat, lng], 16, {
      animate: true,
      duration: 1.5,
    });

    // Open popup
    setTimeout(() => {
      markersRef.current[driver.id]?.openPopup();
    }, 1500);
  };

  const formatUpdateAge = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return formatDistanceToNow(d, { 
        addSuffix: true, 
        locale: ru 
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
      
      {/* Sidebar - Drivers List */}
      <Card className="lg:col-span-1 border border-slate-200/60 shadow-lg rounded-3xl overflow-hidden flex flex-col h-full bg-white">
        <CardHeader className="border-b border-slate-100 flex-shrink-0 py-4 px-5">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Radio className="h-5 w-5 text-emerald-500 animate-pulse" />
              {dict.driver_location || 'Haydovchilar joylashuvi'}
            </CardTitle>
            <button 
              onClick={() => fetchDriverLocations()}
              disabled={isRefreshing}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {dict.last_updated || 'Yangilandi'}: {lastRefreshed.toLocaleTimeString()}
          </p>
          {drivers.length > 0 && process.env.NODE_ENV === 'development' && (
            <div className="mt-3">
              <button
                onClick={handleSimulateGps}
                disabled={isRefreshing}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-all shadow-sm active:scale-95 duration-100"
              >
                <Radio className="h-3.5 w-3.5" />
                {'[DEV] Симулировать GPS'}
              </button>
            </div>
          )}
        </CardHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : drivers.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <Car className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500 font-medium">{dict.no_active_gps || 'Faol haydovchilar yo\'q'}</p>
            </div>
          ) : (
            drivers.map((driver) => {
              const hasGps = !!(driver.latitude && driver.longitude);
              const isSelected = selectedDriverId === driver.id;

              return (
                <div
                  key={driver.id}
                  onClick={() => hasGps && handleFlyToDriver(driver)}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col gap-2 ${
                    hasGps ? 'cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/20' : 'opacity-65 cursor-not-allowed'
                  } ${isSelected ? 'border-primary bg-indigo-50/40 ring-1 ring-primary' : 'border-slate-100 bg-white'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-snug">{driver.name}</h4>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400 font-medium">
                        <Car className="h-3 w-3" />
                        <span className="font-mono bg-slate-50 border border-slate-100 rounded px-1">{driver.vehiclePlate}</span>
                      </div>
                    </div>

                    <Badge variant={driver.isTracking ? 'success' : 'secondary'} className="text-[10px] px-1.5 py-0.5 leading-none">
                      {driver.isTracking 
                        ? ('В пути') 
                        : ('В базе')
                      }
                    </Badge>
                  </div>

                  {hasGps && driver.locationUpdatedAt && (
                    <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-1 border-t border-dashed border-slate-100 pt-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                      <span>{dict.last_updated}: {formatUpdateAge(driver.locationUpdatedAt)}</span>
                    </div>
                  )}

                  {driver.isTracking && driver.currentOrderAddress && (
                    <div className="text-[10px] text-emerald-700 bg-emerald-50/50 rounded-lg p-2 border border-emerald-100/50 mt-1 font-medium flex items-start gap-1">
                      <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0 text-emerald-600" />
                      <div>
                        <span className="font-bold">{dict.destination || 'Manzil'}:</span>{' '}
                        <span className="text-slate-700">{driver.currentOrderAddress}</span>
                      </div>
                    </div>
                  )}

                  {!hasGps && (
                    <div className="text-[10px] text-slate-400 italic mt-1 border-t border-dashed border-slate-100 pt-2 flex items-center gap-1">
                      <Radio className="h-3 w-3 text-slate-300" />
                      <span>{dict.no_gps_yet || 'GPS signal yo\'q'}</span>
                    </div>
                  )}

                  {hasGps && (
                    <button 
                      className="text-xs font-bold text-primary flex items-center gap-1 mt-1 align-self-end hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFlyToDriver(driver);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {dict.view_on_map || 'Kartada ko\'rish'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Map Container */}
      <Card className="lg:col-span-3 border border-slate-200/60 shadow-lg rounded-3xl overflow-hidden relative h-full bg-slate-50">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* CSS Keyframe Animation inject */}
        <style jsx global>{`
          @keyframes ping {
            0% {
              transform: scale(1);
              opacity: 0.8;
            }
            70%, 100% {
              transform: scale(2);
              opacity: 0;
            }
          }
          
          /* Leaflet custom map improvements */
          .leaflet-container {
            font-family: inherit;
          }
          .leaflet-popup-content-wrapper {
            border-radius: 16px;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
            border: 1px solid #e2e8f0;
          }
          .leaflet-popup-close-button {
            top: 8px !important;
            right: 8px !important;
            color: #64748b !important;
          }
        `}</style>
      </Card>
      
    </div>
  );
}
