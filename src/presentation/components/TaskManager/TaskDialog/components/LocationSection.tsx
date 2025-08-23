// src/presentation/components/TaskManager/TaskDialog/components/LocationSection.tsx
import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  MapPin,
  Search,
  Navigation,
  X,
  Loader2,
  Maximize2,
} from "lucide-react";
import type { Location } from "../../../../types/task";

interface LocationSectionProps {
  editedTask: {
    location?: Location;
    [key: string]: any;
  };
  handleChange: (field: string, value: any) => void;
}

// Nominatim API configuration
const NOMINATIM_CONFIG = {
  BASE_URL: "https://nominatim.openstreetmap.org",
  SEARCH_ENDPOINT: "/search",
  REVERSE_ENDPOINT: "/reverse",
  DEFAULT_PARAMS: {
    format: "json",
    limit: 10,
    addressdetails: 1,
    extratags: 1,
    namedetails: 1,
    dedupe: 1,
  },
  USER_AGENT: "TaskFlow/1.0 (Location Feature)",
  RATE_LIMIT_DELAY: 1000, // 1 second between requests
};

// Geolocation configuration
const GEOLOCATION_CONFIG = {
  enableHighAccuracy: true,
  timeout: 30000,
  maximumAge: 300000, // 5 minutes
};

// Types for Nominatim API response
interface NominatimPlace {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  category?: string;
  importance?: number;
  icon?: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox?: [string, string, string, string];
  extratags?: Record<string, string>;
  namedetails?: Record<string, string>;
}

// Error class for location operations
class LocationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "LocationError";
  }
}

// Rate limiting utility
class RateLimiter {
  private lastRequestTime = 0;
  private delay: number;

  constructor(delay: number = NOMINATIM_CONFIG.RATE_LIMIT_DELAY) {
    this.delay = delay;
  }

  async throttle<T>(requestFn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.delay) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.delay - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
    return requestFn();
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

// Convert Nominatim place to Location object
const convertNominatimToLocation = (place: NominatimPlace): Location => {
  return {
    id: place.place_id?.toString() || Date.now().toString(),
    name: place.name || place.display_name.split(",")[0] || "Unknown Place",
    address: place.display_name,
    latitude: parseFloat(place.lat),
    longitude: parseFloat(place.lon),
    placeId: place.place_id?.toString(),
    type: place.type || place.category,
    timestamp: new Date(),
  };
};

// Search places using Nominatim API
const searchPlaces = async (
  query: string,
  limit: number = 8
): Promise<Location[]> => {
  if (!query.trim()) {
    return [];
  }

  try {
    return await rateLimiter.throttle(async () => {
      const params = new URLSearchParams({
        ...NOMINATIM_CONFIG.DEFAULT_PARAMS,
        q: query.trim(),
        limit: limit.toString(),
        "accept-language": "en",
      });

      const response = await fetch(
        `${NOMINATIM_CONFIG.BASE_URL}${NOMINATIM_CONFIG.SEARCH_ENDPOINT}?${params}`,
        {
          headers: {
            "User-Agent": NOMINATIM_CONFIG.USER_AGENT,
            Accept: "application/json",
            "Accept-Language": "en",
          },
        }
      );

      if (!response.ok) {
        throw new LocationError(
          `Search failed: ${response.statusText}`,
          "SEARCH_FAILED",
          response.status
        );
      }

      const data: NominatimPlace[] = await response.json();
      return data.map((place) => convertNominatimToLocation(place));
    });
  } catch (error) {
    if (error instanceof LocationError) {
      throw error;
    }
    throw new LocationError(
      `Search error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      "SEARCH_ERROR"
    );
  }
};

// Reverse geocoding using Nominatim
const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<Location> => {
  try {
    return await rateLimiter.throttle(async () => {
      const params = new URLSearchParams({
        ...NOMINATIM_CONFIG.DEFAULT_PARAMS,
        lat: latitude.toString(),
        lon: longitude.toString(),
        zoom: "18",
        "accept-language": "en",
      });

      const response = await fetch(
        `${NOMINATIM_CONFIG.BASE_URL}${NOMINATIM_CONFIG.REVERSE_ENDPOINT}?${params}`,
        {
          headers: {
            "User-Agent": NOMINATIM_CONFIG.USER_AGENT,
            Accept: "application/json",
            "Accept-Language": "en",
          },
        }
      );

      if (!response.ok) {
        throw new LocationError(
          `Reverse geocoding failed: ${response.statusText}`,
          "REVERSE_GEOCODE_FAILED",
          response.status
        );
      }

      const data: NominatimPlace = await response.json();

      if (!data || !data.display_name) {
        return {
          id: Date.now().toString(),
          name: "Unknown Location",
          address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          latitude,
          longitude,
          timestamp: new Date(),
        };
      }

      return convertNominatimToLocation(data);
    });
  } catch (error) {
    // Return fallback location on error
    return {
      id: Date.now().toString(),
      name: "Selected Location",
      address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      latitude,
      longitude,
      timestamp: new Date(),
    };
  }
};

// Get current location using browser geolocation
const getCurrentLocationFromBrowser = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new LocationError(
          "Geolocation is not supported by this browser",
          "GEOLOCATION_NOT_SUPPORTED"
        )
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const location = await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude
          );

          // Add accuracy and timestamp to location
          const enhancedLocation: Location = {
            ...location,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp),
          };

          resolve(enhancedLocation);
        } catch (error) {
          // Fallback if reverse geocoding fails
          const fallbackLocation: Location = {
            id: Date.now().toString(),
            name: "Current Location",
            address: `${position.coords.latitude.toFixed(
              6
            )}, ${position.coords.longitude.toFixed(6)}`,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp),
          };

          resolve(fallbackLocation);
        }
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location.";
        let errorCode = "GEOLOCATION_ERROR";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location access denied. Please enable location permissions.";
            errorCode = "GEOLOCATION_PERMISSION_DENIED";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            errorCode = "GEOLOCATION_POSITION_UNAVAILABLE";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            errorCode = "GEOLOCATION_TIMEOUT";
            break;
        }

        reject(new LocationError(errorMessage, errorCode));
      },
      GEOLOCATION_CONFIG
    );
  });
};

// Utility functions for map calculations
const getTileCoordinates = (lat: number, lon: number, zoom: number) => {
  const latRad = (lat * Math.PI) / 180;
  const x = Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
  return { x, y };
};

const latLonToPixel = (lat: number, lon: number, zoom: number) => {
  const latRad = (lat * Math.PI) / 180;
  const x = ((lon + 180) / 360) * Math.pow(2, zoom) * 256;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    Math.pow(2, zoom) *
    256;
  return { x, y };
};

const pixelToLatLon = (pixelX: number, pixelY: number, zoom: number) => {
  const lon = (pixelX / (Math.pow(2, zoom) * 256)) * 360 - 180;
  const latRad = Math.atan(
    Math.sinh(Math.PI * (1 - (2 * pixelY) / (Math.pow(2, zoom) * 256)))
  );
  const lat = (latRad * 180) / Math.PI;
  return { lat, lon };
};

// Static Mini Map Component (non-interactive)
const StaticMiniMap: React.FC<{
  location: Location;
  onClick?: () => void;
  className?: string;
}> = ({ location, onClick, className = "w-full h-48" }) => {
  const zoom = 13;
  const tilesGridSize = 3; // Smaller grid for mini map

  const viewCenter = {
    lat: location.latitude,
    lon: location.longitude,
  };

  const getTilesToRender = useCallback(() => {
    const centerTile = getTileCoordinates(viewCenter.lat, viewCenter.lon, zoom);
    const tiles = [];
    const halfGrid = Math.floor(tilesGridSize / 2);

    for (let dx = -halfGrid; dx <= halfGrid; dx++) {
      for (let dy = -halfGrid; dy <= halfGrid; dy++) {
        const tileX = centerTile.x + dx;
        const tileY = centerTile.y + dy;

        if (
          tileX >= 0 &&
          tileY >= 0 &&
          tileX < Math.pow(2, zoom) &&
          tileY < Math.pow(2, zoom)
        ) {
          tiles.push({
            x: dx,
            y: dy,
            tileX,
            tileY,
            url: `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`,
            key: `${tileX}-${tileY}-${zoom}`,
          });
        }
      }
    }
    return tiles;
  }, [viewCenter.lat, viewCenter.lon, zoom, tilesGridSize]);

  const tiles = useMemo(() => getTilesToRender(), [getTilesToRender]);

  const getMarkerPosition = useCallback(() => {
    const viewPixel = latLonToPixel(viewCenter.lat, viewCenter.lon, zoom);
    const markerPixel = latLonToPixel(
      location.latitude,
      location.longitude,
      zoom
    );

    return {
      x: markerPixel.x - viewPixel.x,
      y: markerPixel.y - viewPixel.y,
    };
  }, [
    viewCenter.lat,
    viewCenter.lon,
    location.latitude,
    location.longitude,
    zoom,
  ]);

  const markerPos = getMarkerPosition();

  return (
    <div
      className={`${className} relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 ${
        onClick
          ? "cursor-pointer hover:border-blue-400 hover:shadow-lg transition-all"
          : ""
      }`}
      onClick={onClick}
    >
      {/* Tiles Container */}
      <div
        className="absolute"
        style={{
          width: `${256 * tilesGridSize}px`,
          height: `${256 * tilesGridSize}px`,
          left: "50%",
          top: "50%",
          transform: `translate(-${(256 * tilesGridSize) / 2}px, -${
            (256 * tilesGridSize) / 2
          }px)`,
        }}
      >
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.url}
            alt=""
            className="absolute object-cover"
            style={{
              width: "256px",
              height: "256px",
              left: `${(tile.x + Math.floor(tilesGridSize / 2)) * 256}px`,
              top: `${(tile.y + Math.floor(tilesGridSize / 2)) * 256}px`,
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.background = "#f3f4f6";
              target.style.opacity = "0.3";
            }}
            draggable={false}
          />
        ))}
      </div>

      {/* Location Marker */}
      <div
        className="absolute z-10 pointer-events-none"
        style={{
          left: "50%",
          top: "50%",
          transform: `translate(${markerPos.x - 12}px, ${markerPos.y - 24}px)`,
        }}
      >
        <div className="relative">
          <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-l-transparent border-r-transparent border-t-blue-500"></div>
        </div>
      </div>

      {/* Click to expand indicator */}
      {onClick && (
        <div className="absolute top-2 right-2 z-20">
          <div className="bg-black bg-opacity-60 text-white p-1.5 rounded-md">
            <Maximize2 size={14} />
          </div>
        </div>
      )}

      {/* Location name overlay */}
      <div className="absolute bottom-2 left-2 right-2 z-20">
        <div className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          {location.name}
        </div>
      </div>
    </div>
  );
};

// Full Interactive Map Component for Dialog
const InteractiveMapDialog: React.FC<{
  location: Location;
  onLocationChange: (location: Location) => void;
  onClose: () => void;
}> = ({ location, onLocationChange, onClose }) => {
  const [viewCenter, setViewCenter] = useState({
    lat: location.latitude,
    lon: location.longitude,
  });
  const [zoom, setZoom] = useState(15);
  const [targetZoom, setTargetZoom] = useState(15);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const tilesGridSize = 5;
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Smooth zoom animation
  useEffect(() => {
    let animationId: number | null = null;

    const animateZoom = () => {
      setZoom((prevZoom) => {
        const diff = targetZoom - prevZoom;
        if (Math.abs(diff) < 0.01) {
          setIsZooming(false);
          return targetZoom;
        }

        const easeOut = 1 - Math.pow(1 - 0.15, 1);
        const newZoom = prevZoom + diff * easeOut;
        animationId = requestAnimationFrame(animateZoom);
        return newZoom;
      });
    };

    if (Math.abs(targetZoom - zoom) > 0.01) {
      setIsZooming(true);
      animationId = requestAnimationFrame(animateZoom);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [targetZoom]);

  const getTilesToRender = useCallback(() => {
    const currentZoom = Math.floor(zoom);
    const centerTile = getTileCoordinates(
      viewCenter.lat,
      viewCenter.lon,
      currentZoom
    );
    const tiles = [];
    const halfGrid = Math.floor(tilesGridSize / 2);

    for (let dx = -halfGrid; dx <= halfGrid; dx++) {
      for (let dy = -halfGrid; dy <= halfGrid; dy++) {
        const tileX = centerTile.x + dx;
        const tileY = centerTile.y + dy;

        if (
          tileX >= 0 &&
          tileY >= 0 &&
          tileX < Math.pow(2, currentZoom) &&
          tileY < Math.pow(2, currentZoom)
        ) {
          tiles.push({
            x: dx,
            y: dy,
            tileX,
            tileY,
            url: `https://tile.openstreetmap.org/${currentZoom}/${tileX}/${tileY}.png`,
            key: `${tileX}-${tileY}-${currentZoom}`,
          });
        }
      }
    }
    return tiles;
  }, [viewCenter.lat, viewCenter.lon, zoom, tilesGridSize]);

  const tiles = useMemo(() => getTilesToRender(), [getTilesToRender]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  }, []);

  // Smooth pan with throttling to reduce jitter
  const panTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPanTime = useRef(0);
  const THROTTLE_DELAY = 16; // ~60fps

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        const now = Date.now();

        // Throttle pan updates to reduce jitter
        if (now - lastPanTime.current < THROTTLE_DELAY) {
          return;
        }
        lastPanTime.current = now;

        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        // Use smaller multiplier for smoother movement
        const pixelsPerDegree = (Math.pow(2, zoom) * 256) / 360;
        const latChange =
          (deltaY / pixelsPerDegree) *
          Math.cos((viewCenter.lat * Math.PI) / 180) *
          0.8; // Damping factor
        const lonChange = -(deltaX / pixelsPerDegree) * 0.8; // Damping factor

        setViewCenter({
          lat: Math.max(-85, Math.min(85, viewCenter.lat + latChange)),
          lon: viewCenter.lon + lonChange,
        });

        setDragStart({ x: e.clientX, y: e.clientY });
      }
    },
    [isDragging, dragStart.x, dragStart.y, zoom, viewCenter.lat, viewCenter.lon]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = async (e: React.MouseEvent) => {
    if (isDragging) return;

    e.preventDefault();
    e.stopPropagation();

    try {
      const newLocation = await reverseGeocode(viewCenter.lat, viewCenter.lon);
      onLocationChange(newLocation);
    } catch (error) {
      const fallbackLocation: Location = {
        id: Date.now().toString(),
        name: "Selected Location",
        address: `${viewCenter.lat.toFixed(6)}, ${viewCenter.lon.toFixed(6)}`,
        latitude: viewCenter.lat,
        longitude: viewCenter.lon,
        timestamp: new Date(),
      };
      onLocationChange(fallbackLocation);
    }
  };

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }

      const zoomDelta = e.deltaY > 0 ? -0.5 : 0.5;
      const newTargetZoom = Math.max(1, Math.min(19, targetZoom + zoomDelta));
      setTargetZoom(newTargetZoom);

      zoomTimeoutRef.current = setTimeout(() => {
        setIsZooming(false);
      }, 150);
    },
    [targetZoom]
  );

  const getMarkerPosition = useCallback(
    (markerLat: number, markerLon: number) => {
      const viewPixel = latLonToPixel(viewCenter.lat, viewCenter.lon, zoom);
      const markerPixel = latLonToPixel(markerLat, markerLon, zoom);

      return {
        x: markerPixel.x - viewPixel.x,
        y: markerPixel.y - viewPixel.y,
      };
    },
    [viewCenter.lat, viewCenter.lon, zoom]
  );

  const markerPos = getMarkerPosition(location.latitude, location.longitude);
  const tileScale = zoom / Math.floor(zoom);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Select Location
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={containerRef}
            className="w-full h-full relative select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsDragging(false)}
            onWheel={handleWheel}
            onClick={handleClick}
            style={{
              cursor: isDragging ? "grabbing" : "grab",
            }}
          >
            {/* Tiles Container */}
            <div
              className={`absolute transition-transform ${
                isZooming ? "duration-100 ease-out" : "duration-0"
              }`}
              style={{
                width: `${256 * tilesGridSize}px`,
                height: `${256 * tilesGridSize}px`,
                left: "50%",
                top: "50%",
                transform: `translate(-${(256 * tilesGridSize) / 2}px, -${
                  (256 * tilesGridSize) / 2
                }px) scale(${tileScale})`,
                transformOrigin: "center center",
              }}
            >
              {tiles.map((tile) => (
                <img
                  key={tile.key}
                  src={tile.url}
                  alt=""
                  className="absolute object-cover will-change-transform"
                  style={{
                    width: "256px",
                    height: "256px",
                    left: `${(tile.x + Math.floor(tilesGridSize / 2)) * 256}px`,
                    top: `${(tile.y + Math.floor(tilesGridSize / 2)) * 256}px`,
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.background = "#f3f4f6";
                    target.style.opacity = "0.3";
                  }}
                  draggable={false}
                />
              ))}
            </div>

            {/* Location Marker */}
            <div
              className="absolute z-20 pointer-events-none"
              style={{
                left: "50%",
                top: "50%",
                transform: `translate(${markerPos.x - 12}px, ${
                  markerPos.y - 24
                }px)`,
              }}
            >
              <div className="relative">
                <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-l-transparent border-r-transparent border-t-blue-500"></div>
              </div>
            </div>

            {/* Center Crosshair */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
              <div className="w-4 h-4">
                <div className="absolute left-1/2 top-1/2 w-0.5 h-4 bg-red-500 transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute left-1/2 top-1/2 w-4 h-0.5 bg-red-500 transform -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 z-30 flex flex-col gap-1">
              <button
                className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded flex items-center justify-center text-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-700 shadow-md transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setTargetZoom((prev) => Math.min(19, prev + 1));
                }}
              >
                +
              </button>
              <button
                className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded flex items-center justify-center text-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-700 shadow-md transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setTargetZoom((prev) => Math.max(1, prev - 1));
                }}
              >
                −
              </button>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 right-4 z-30">
              <div className="bg-black bg-opacity-70 text-white text-sm px-3 py-2 rounded-lg">
                🖱️ Drag to pan • 🔄 Scroll to zoom • 🎯 Click to set location
              </div>
            </div>

            {/* Location Info */}
            <div className="absolute top-4 left-4 z-30">
              <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-lg border border-gray-200 dark:border-gray-600">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {location.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                  Z{zoom.toFixed(1)} • {viewCenter.lat.toFixed(4)},{" "}
                  {viewCenter.lon.toFixed(4)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};

const LocationSection: React.FC<LocationSectionProps> = ({
  editedTask,
  handleChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showMapDialog, setShowMapDialog] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search function
  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowSearchDropdown(true);

    try {
      const results = await searchPlaces(query, 8);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const onSearchInputChange = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 500);
  };

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    setIsGettingLocation(true);
    try {
      const location = await getCurrentLocationFromBrowser();
      handleChange("location", location);
    } catch (error) {
      console.error("Error getting location:", error);
      alert(
        error instanceof LocationError
          ? error.message
          : "Unable to get location"
      );
    } finally {
      setIsGettingLocation(false);
    }
  }, [handleChange]);

  // Select location from search results
  const selectLocation = (location: Location) => {
    handleChange("location", location);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchDropdown(false);
  };

  // Clear location
  const clearLocation = () => {
    handleChange("location", undefined);
    setSearchQuery("");
  };

  // Handle location change from map dialog
  const handleLocationChangeFromMap = (newLocation: Location) => {
    handleChange("location", newLocation);
    setShowMapDialog(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MapPin size={18} className="text-gray-600 dark:text-gray-400" />
        <label className="font-medium text-gray-700 dark:text-gray-300">
          Location
        </label>
      </div>

      {/* Current Location Display */}
      {editedTask.location && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-start justify-between">
          <div className="flex-1">
            <div className="font-medium text-blue-900 dark:text-blue-100">
              {editedTask.location.name}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300 font-mono">
              {editedTask.location.latitude.toFixed(6)},{" "}
              {editedTask.location.longitude.toFixed(6)}
            </div>
            {editedTask.location.address &&
              editedTask.location.address !== editedTask.location.name && (
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {editedTask.location.address}
                </div>
              )}
          </div>
          <button
            onClick={clearLocation}
            className="text-blue-600 dark:text-blue-400 hover:text-red-500 p-1"
            title="Remove location"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Static Mini Map - Click to open dialog */}
      {editedTask.location && (
        <div className="w-full">
          <StaticMiniMap
            location={editedTask.location}
            onClick={() => setShowMapDialog(true)}
            className="w-full h-48"
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
            Click map to open full map editor
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onFocus={() =>
              searchResults.length > 0 && setShowSearchDropdown(true)
            }
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {searchResults.map((location) => (
              <div
                key={location.id}
                onClick={() => selectLocation(location)}
                className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <MapPin
                  size={16}
                  className="text-gray-400 mt-0.5 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {location.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {location.address}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-50 rounded-lg transition-colors text-sm"
        >
          {isGettingLocation ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation size={16} />
          )}
          {isGettingLocation ? "Getting..." : "Current Location"}
        </button>

        {!editedTask.location && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900/20 text-gray-500 dark:text-gray-400 rounded-lg text-sm">
            <MapPin size={16} />
            Search or get current location to add to map
          </div>
        )}
      </div>

      {/* Location Fields */}
      {editedTask.location && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location Name
            </label>
            <input
              type="text"
              value={editedTask.location.name}
              onChange={(e) =>
                handleChange("location", {
                  ...editedTask.location,
                  name: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Coordinates
            </label>
            <input
              type="text"
              value={`${editedTask.location.latitude.toFixed(
                6
              )}, ${editedTask.location.longitude.toFixed(6)}`}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm font-mono"
            />
          </div>
        </div>
      )}

      {/* Map Dialog */}
      {showMapDialog && editedTask.location && (
        <InteractiveMapDialog
          location={editedTask.location}
          onLocationChange={handleLocationChangeFromMap}
          onClose={() => setShowMapDialog(false)}
        />
      )}

      {/* Click outside handler for search dropdown */}
      {showSearchDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSearchDropdown(false)}
        />
      )}
    </div>
  );
};

export default LocationSection;
