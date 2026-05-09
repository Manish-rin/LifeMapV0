import { useEffect, useState, useRef } from 'react';
import { MapPin, Filter, Search, Loader2, Navigation, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BLOOD_GROUPS } from '../lib/database.types';
import type { Profile, Hospital } from '../lib/database.types';
import { useAuth } from '../context/AuthContext';

// Leaflet is loaded via CDN script tag in index.html
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const L = (window as any).L;

function createDonorIcon(bloodGroup: string, isOwn = false) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background: ${isOwn ? '#16a34a' : '#dc2626'};
        color: white;
        border: 2px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        width: 36px; height: 36px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        font-size: 9px;
        font-weight: 700;
        letter-spacing: -0.3px;
      ">
        <span style="transform: rotate(45deg)">${bloodGroup}</span>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

function createHospitalIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background: #2563eb;
        color: white;
        border: 2px solid white;
        border-radius: 8px;
        width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        font-size: 14px;
        font-weight: 700;
      ">H</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface DonorMarker {
  id: string;
  blood_group: string;
  latitude: number;
  longitude: number;
  is_available: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletMap = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletLayerGroup = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletMarker = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletCircle = any;

export default function LifeMap() {
  const { user, profile } = useAuth();
  const [donors, setDonors] = useState<DonorMarker[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showHospitals, setShowHospitals] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const mapRef = useRef<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<LeafletLayerGroup | null>(null);
  const hospitalsLayerRef = useRef<LeafletLayerGroup | null>(null);
  const userMarkerRef = useRef<LeafletMarker | null>(null);
  const userCircleRef = useRef<LeafletCircle | null>(null);

  const defaultCenter = { lat: 40.7128, lng: -74.006 };

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView(
      [defaultCenter.lat, defaultCenter.lng],
      12
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    hospitalsLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Load data
  useEffect(() => {
    async function load() {
      setLoading(true);
      const [{ data: profileRows }, { data: hospitalRows }] = await Promise.all([
        supabase.from('profiles').select('id, blood_group, latitude, longitude, is_available').eq('is_available', true),
        supabase.from('hospitals').select('*'),
      ]);
      setDonors(
        (profileRows ?? []).filter((p) => p.latitude != null && p.longitude != null) as DonorMarker[]
      );
      setHospitals(hospitalRows ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // Update donor markers
  useEffect(() => {
    if (!markersLayerRef.current || !mapRef.current) return;
    markersLayerRef.current.clearLayers();

    const filteredDonors = filter
      ? donors.filter((d) => d.blood_group === filter)
      : donors;

    filteredDonors.forEach((donor) => {
      if (donor.id === user?.id) return;
      const marker = L.marker([donor.latitude, donor.longitude], {
        icon: createDonorIcon(donor.blood_group),
      }).bindPopup(`
        <div style="padding:4px;min-width:120px">
          <div style="display:inline-flex;align-items:center;background:#fef2f2;color:#b91c1c;padding:2px 8px;border-radius:6px;font-weight:700;font-size:13px;margin-bottom:4px">${donor.blood_group}</div>
          <div style="font-size:12px;color:#666">Available donor nearby</div>
          ${userLocation ? `<div style="font-size:11px;color:#999;margin-top:2px">~${Math.round(distance(userLocation.lat, userLocation.lng, donor.latitude, donor.longitude))} km away</div>` : ''}
        </div>
      `);
      markersLayerRef.current!.addLayer(marker);
    });
  }, [donors, filter, user, userLocation]);

  // Update hospital markers
  useEffect(() => {
    if (!hospitalsLayerRef.current) return;
    hospitalsLayerRef.current.clearLayers();

    if (!showHospitals) return;

    hospitals.forEach((h) => {
      const marker = L.marker([h.latitude, h.longitude], {
        icon: createHospitalIcon(),
      }).bindPopup(`
        <div style="padding:4px;min-width:160px">
          <div style="font-weight:600;font-size:13px;color:#1d4ed8;margin-bottom:4px">${h.name}</div>
          <div style="font-size:11px;color:#666;margin-bottom:4px">${h.address}</div>
          ${h.phone ? `<div style="font-size:12px;color:#333;font-weight:500">${h.phone}</div>` : ''}
          ${h.has_blood_bank ? `
            <div style="margin-top:4px">
              <div style="font-size:11px;color:#666;margin-bottom:2px">Available groups:</div>
              <div style="display:flex;flex-wrap:wrap;gap:3px">
                ${h.blood_groups_available.map((g) => `<span style="font-size:10px;background:#dbeafe;color:#1d4ed8;padding:1px 5px;border-radius:3px">${g}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `);
      hospitalsLayerRef.current!.addLayer(marker);
    });
  }, [hospitals, showHospitals]);

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (userMarkerRef.current) { mapRef.current.removeLayer(userMarkerRef.current); userMarkerRef.current = null; }
    if (userCircleRef.current) { mapRef.current.removeLayer(userCircleRef.current); userCircleRef.current = null; }

    if (!userLocation) return;

    userCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
      radius: 1000,
      color: '#16a34a',
      fillColor: '#16a34a',
      fillOpacity: 0.08,
      weight: 1,
    }).addTo(mapRef.current);

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
      icon: createDonorIcon(profile?.blood_group || '?', true),
    }).bindPopup(`
      <div style="padding:4px">
        <div style="font-size:13px;font-weight:600;color:#15803d">You are here</div>
        ${profile?.blood_group ? `<div style="font-size:11px;color:#666;margin-top:2px">Blood group: ${profile.blood_group}</div>` : ''}
      </div>
    `).addTo(mapRef.current);

    mapRef.current.setView([userLocation.lat, userLocation.lng], 13);
  }, [userLocation, profile?.blood_group]);

  function locateMe() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false)
    );
  }

  const filteredDonors = filter
    ? donors.filter((d) => d.blood_group === filter)
    : donors;

  return (
    <div className="pt-16 h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 z-10 flex-wrap">
        <div className="flex items-center gap-2 text-red-600 font-semibold">
          <MapPin size={16} />
          <span className="text-sm">Life Map</span>
        </div>
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-3 py-1.5">
          <Filter size={13} className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-transparent text-sm text-gray-700 focus:outline-none"
          >
            <option value="">All Blood Groups</option>
            {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <button
          onClick={() => setShowHospitals(!showHospitals)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            showHospitals ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          <Building2 size={13} /> Hospitals
        </button>
        <button
          onClick={locateMe}
          disabled={locating}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors ml-auto"
        >
          {locating ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}
          My Location
        </button>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-gray-500 border-l border-gray-200 pl-3">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-600 rounded-full inline-block" /> Donor</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-600 rounded-full inline-block" /> You</span>
          {showHospitals && <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-600 rounded-full inline-block" /> Hospital</span>}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70">
            <Loader2 size={32} className="animate-spin text-red-600" />
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Bottom count bar */}
      <div className="bg-white border-t border-gray-100 px-4 py-2 flex items-center gap-4 text-sm text-gray-500">
        <Search size={14} />
        <span><strong className="text-gray-900">{filteredDonors.length}</strong> available donors</span>
        {filter && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">{filter}</span>}
      </div>
    </div>
  );
}
