"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, Search } from "lucide-react";

interface LiveMapProps {
  address: string;
  onAddressChange: (address: string) => void;
}

export default function LiveMap({ address, onAddressChange }: LiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState(address);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync internal query state when parent address changes from outside
  useEffect(() => {
    setQuery(address);
  }, [address]);

  // Load Leaflet dynamically from CDN
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    // Load Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.id = "leaflet-css";
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.id = "leaflet-js";
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      // Keep Leaflet in DOM to avoid reloading it on fast navigation
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Default coordinates: Lagos, Nigeria
    const defaultLat = 6.5244;
    const defaultLng = 3.3792;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([defaultLat, defaultLng], 12);
    mapRef.current = map;

    // Premium OpenStreetMap Tile style
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Custom Lucide-styled Marker Icon to avoid Webpack broken image links
    const customIcon = L.divIcon({
      html: `<div style="background-color: #1a5c38; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.25); transform: translate(-2px, -2px);">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
             </div>`,
      className: "custom-leaflet-marker",
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    const marker = L.marker([defaultLat, defaultLng], {
      draggable: true,
      icon: customIcon
    }).addTo(map);
    markerRef.current = marker;

    // Map click -> Move marker & Reverse Geocode
    map.on("click", (e: any) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      reverseGeocode(lat, lng);
    });

    // Marker drag -> Move marker & Reverse Geocode
    marker.on("dragend", () => {
      const position = marker.getLatLng();
      reverseGeocode(position.lat, position.lng);
    });

    // If there's an initial address, try to geocode it to center the map
    if (address && address.trim().length > 3) {
      triggerGeocode(address);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // Click outside to close suggestions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reverse Geocoding: coordinates -> address name
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        const streetAddress = data.display_name;
        setQuery(streetAddress);
        onAddressChange(streetAddress);
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
  };

  // Search Address (Geocoding) Nominatim API
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onAddressChange(val); // Sync instantly

    if (val.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    setShowSuggestions(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          val + ", Nigeria"
        )}&limit=5&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (err) {
      console.error("Geocoding search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const selectSuggestion = (sug: any) => {
    const lat = parseFloat(sug.lat);
    const lon = parseFloat(sug.lon);
    const displayName = sug.display_name;

    setQuery(displayName);
    onAddressChange(displayName);
    setShowSuggestions(false);

    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([lat, lon], 16);
      markerRef.current.setLatLng([lat, lon]);
    }
  };

  // Run on map load if address exists
  const triggerGeocode = async (addr: string) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          addr
        )}&limit=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          if (mapRef.current && markerRef.current) {
            mapRef.current.setView([lat, lon], 15);
            markerRef.current.setLatLng([lat, lon]);
          }
        }
      }
    } catch {}
  };

  return (
    <div className="space-y-4">
      {/* Autocomplete Input Field */}
      <div className="relative" ref={dropdownRef}>
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 z-10" />
        <input
          type="text"
          required
          value={query}
          onChange={handleSearchChange}
          onFocus={() => query.trim().length >= 3 && setShowSuggestions(true)}
          placeholder="Type to search address (e.g. 12 Adeola St, Lagos)..."
          className="w-full rounded-xl border border-slate-200 py-3.5 pl-10 pr-10 text-xs font-semibold outline-none focus:border-primary bg-white shadow-sm transition-all"
        />
        {searching && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4.5 w-4.5 text-slate-400 animate-spin" />
          </span>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-50 animate-scale-up">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectSuggestion(sug)}
                className="w-full text-left px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors flex gap-2 items-start"
              >
                <Search className="h-3.5 w-3.5 text-slate-450 shrink-0 mt-0.5" />
                <span>{sug.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Live Map Panel */}
      <div className="rounded-[2rem] overflow-hidden border border-slate-100 bg-slate-50 shadow-inner relative">
        <div 
          ref={mapContainerRef} 
          className="h-[250px] w-full z-10 relative" 
          style={{ minHeight: "250px" }}
        />
        {!leafletLoaded && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-100/80 backdrop-blur-sm gap-2">
            <Loader2 className="h-7 w-7 text-primary animate-spin" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Initializing Live Map...
            </span>
          </div>
        )}
        {leafletLoaded && (
          <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-md border border-slate-100 rounded-full px-3 py-1.5 shadow-md flex items-center gap-1.5 pointer-events-none">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[8px] font-black text-slate-550 uppercase tracking-wider">
              Interactive Map Active
            </span>
          </div>
        )}
      </div>
      <span className="text-[9px] font-bold text-slate-400 leading-none block uppercase">
        📍 You can drag the map marker or click anywhere to pinpoint your exact address
      </span>
    </div>
  );
}
