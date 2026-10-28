import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { MapPin, ExternalLink, Compass } from 'lucide-react';

export interface GoogleMapViewerProps {
  lat?: number;
  lng?: number;
  zoom?: number;
  title?: string;
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  height?: string;
  className?: string;
  isRtl?: boolean;
}

export const GoogleMapViewer: React.FC<GoogleMapViewerProps> = ({
  lat,
  lng,
  zoom = 14,
  title,
  interactive = false,
  onLocationSelect,
  height = '240px',
  className = '',
  isRtl = true
}) => {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || 'AIzaSyDNcm34D5ZGfCoPwFd_-x5mXnpo6lwBMyk';

  // Default coordinate fallback: Jerusalem / Palestine central coordinates (31.7683, 35.2137)
  const defaultLat = typeof lat === 'number' && !isNaN(lat) ? lat : 31.7683;
  const defaultLng = typeof lng === 'number' && !isNaN(lng) ? lng : 35.2137;

  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: defaultLat,
    lng: defaultLng
  });

  useEffect(() => {
    if (typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng)) {
      setPosition({ lat, lng });
    }
  }, [lat, lng]);

  const handleMapClick = (e: any) => {
    if (!interactive || !onLocationSelect) return;
    if (e.detail?.latLng) {
      const newLat = e.detail.latLng.lat;
      const newLng = e.detail.latLng.lng;
      setPosition({ lat: newLat, lng: newLng });
      onLocationSelect(newLat, newLng);
    }
  };

  const handleMarkerDragEnd = (e: any) => {
    if (!interactive || !onLocationSelect) return;
    if (e.latLng) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      setPosition({ lat: newLat, lng: newLng });
      onLocationSelect(newLat, newLng);
    }
  };

  if (!apiKey) {
    return (
      <div
        style={{ height }}
        className={`w-full rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-main)] flex flex-col items-center justify-center p-4 text-center ${className}`}
      >
        <MapPin className="w-8 h-8 text-[var(--fg-accent)] mb-2 opacity-80" />
        <p className="text-xs font-semibold text-[var(--text-secondary)]">
          {title || (isRtl ? 'الموقع الجغرافي المحدد' : 'Selected Location Coordinates')}
        </p>
        <p className="text-[11px] font-mono text-[var(--text-muted)] mt-1">
          {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{ height }}
      className={`relative w-full rounded-shape-md overflow-hidden border border-[var(--border-main)] shadow-xs ${className}`}
    >
      <APIProvider apiKey={apiKey}>
        <Map
          style={{ width: '100%', height: '100%' }}
          defaultCenter={position}
          center={position}
          defaultZoom={zoom}
          mapId="DEMO_MAP_ID"
          gestureHandling={interactive ? 'greedy' : 'cooperative'}
          disableDefaultUI={!interactive}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          onClick={handleMapClick}
        >
          <AdvancedMarker
            position={position}
            title={title || 'Location Pin'}
            gmpDraggable={interactive}
            onDragEnd={handleMarkerDragEnd}
          >
            <div className="flex flex-col items-center group cursor-pointer">
              <div className="px-2 py-0.5 rounded-shape-xs bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-main)] shadow-md text-[10px] font-bold mb-1 opacity-90 group-hover:opacity-100 transition-opacity">
                {title || (isRtl ? 'الموقع المحدد' : 'Location')}
              </div>
              <div className="w-8 h-8 rounded-full bg-[var(--fg-accent)] text-white flex items-center justify-center shadow-lg border-2 border-white transform transition-transform group-hover:scale-110">
                <MapPin className="w-4 h-4 fill-current" />
              </div>
            </div>
          </AdvancedMarker>
        </Map>
      </APIProvider>

      {/* Interactive Helper Overlay & Direct External Directions Link */}
      <div className="absolute bottom-2 start-2 end-2 flex items-center justify-between pointer-events-none z-10">
        {interactive ? (
          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1 shadow-xs pointer-events-auto">
            <Compass className="w-3 h-3 text-[var(--fg-accent)]" />
            {isRtl ? 'انقر على الخريطة أو اسحب الدبوس لتغيير الموقع' : 'Click map or drag pin to adjust location'}
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono shadow-xs pointer-events-auto">
            {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
          </span>
        )}

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${position.lat},${position.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          title={isRtl ? 'فتح في خرائط Google' : 'Open in Google Maps'}
          className="p-1.5 rounded-full bg-white text-gray-800 hover:text-blue-600 shadow-md border border-gray-200 transition-all pointer-events-auto"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
