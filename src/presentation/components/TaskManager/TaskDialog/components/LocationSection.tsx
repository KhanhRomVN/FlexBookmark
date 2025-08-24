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
  Map,
} from "lucide-react";
import { Task } from "../../../../types/task"; // Add this import

interface LocationSectionProps {
  editedTask: {
    locationName?: string;
    locationAddress?: string;
    locationCoordinates?: string;
    [key: string]: any;
  };
  handleChange: (field: keyof Task, value: any) => void; // Change from (field: string, value: any) to (field: keyof Task, value: any)
}

// Temporary Location type for internal operations
interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}

// Nominatim API configuration
const NOMINATIM_CONFIG = {
  BASE_URL: "https://nominatim.openstreetmap.org",
  SEARCH_ENDPOINT: "/search",
  REVERSE_ENDPOINT: "/reverse",
  DEFAULT_PARAMS: {
    format: "json",
    limit: "10", // Changed from number to string
    addressdetails: "1", // Changed from number to string
    extratags: "1", // Changed from number to string
    namedetails: "1", // Changed from number to string
    dedupe: "1", // Changed from number to string
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

          resolve(location);
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

// Helper functions to parse coordinates from string
const parseCoordinates = (
  coordStr: string
): { lat: number; lon: number } | null => {
  if (!coordStr) return null;
  const parts = coordStr.split(",").map((p) => p.trim());
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0]);
  const lon = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lon)) return null;
  return { lat, lon };
};

// Helper functions to convert task fields to/from Location object
const taskToLocation = (
  task: LocationSectionProps["editedTask"]
): Location | null => {
  if (!task.locationName) return null;

  const coords = parseCoordinates(task.locationCoordinates || "");

  // Only return location if we have coordinates (map mode)
  if (!coords) return null;

  return {
    id: Date.now().toString(),
    name: task.locationName,
    address: task.locationAddress || "",
    latitude: coords.lat,
    longitude: coords.lon,
  };
};

const locationToTaskFields = (
  location: Location
): {
  locationName: string;
  locationAddress: string;
  locationCoordinates: string;
} => {
  return {
    locationName: location.name,
    locationAddress: location.address,
    locationCoordinates: `${location.latitude.toFixed(
      6
    )},${location.longitude.toFixed(6)}`,
  };
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

// Static Mini Map Component (non-interactive)
const StaticMiniMap: React.FC<{
  location: Location;
  onClick?: () => void;
  className?: string;
}> = ({ location, onClick, className = "w-full h-32" }) => {
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
            <Maximize2 size={12} />
          </div>
        </div>
      )}

      {/* Location name overlay */}
      <div className="absolute bottom-2 left-2 right-2 z-20">
        <div className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded truncate">
          {location.name}
        </div>
      </div>
    </div>
  );
};

// Full Interactive Map Component for Dialog (simplified for now)
const InteractiveMapDialog: React.FC<{
  location: Location;
  onLocationChange: (location: Location) => void;
  onClose: () => void;
}> = ({ location, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Interactive Map (Simplified)
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Simplified Map Content */}
        <div className="flex-1 p-4 text-center flex items-center justify-center">
          <div className="text-gray-600 dark:text-gray-400">
            <div className="text-lg font-medium mb-2">
              Interactive Map Coming Soon
            </div>
            <div className="text-sm">
              Current Location: {location.name}
              <br />
              Coordinates: {location.latitude.toFixed(6)},{" "}
              {location.longitude.toFixed(6)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Close
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
  const [inputMode, setInputMode] = useState<"simple" | "map">("simple");

  // Store previous map data when switching to simple mode
  const [previousMapData, setPreviousMapData] = useState<{
    locationAddress: string;
    locationCoordinates: string;
  } | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current location from task fields (only if has coordinates - map mode)
  const currentLocation = taskToLocation(editedTask);

  // Check if current location has map data (coordinates)
  const hasMapData =
    editedTask.locationCoordinates &&
    parseCoordinates(editedTask.locationCoordinates) !== null;

  // Auto-detect mode based on current data
  useEffect(() => {
    if (editedTask.locationName && !hasMapData) {
      setInputMode("simple");
    } else if (editedTask.locationName && hasMapData) {
      setInputMode("map");
    }
  }, [editedTask.locationName, hasMapData]);

  // Search function for map mode
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

    if (inputMode === "map" && searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (inputMode === "map") {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(value);
      }, 500);
    }
  };

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    setIsGettingLocation(true);
    try {
      const location = await getCurrentLocationFromBrowser();
      const fields = locationToTaskFields(location);

      // Update all location fields at once
      handleChange("locationName", fields.locationName);
      handleChange("locationAddress", fields.locationAddress);
      handleChange("locationCoordinates", fields.locationCoordinates);

      setInputMode("map"); // Switch to map mode when using current location
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

  // Select location from search results (map mode)
  const selectLocation = (location: Location) => {
    const fields = locationToTaskFields(location);

    // Update all location fields at once
    handleChange("locationName", fields.locationName);
    handleChange("locationAddress", fields.locationAddress);
    handleChange("locationCoordinates", fields.locationCoordinates);

    setSearchQuery("");
    setSearchResults([]);
    setShowSearchDropdown(false);
  };

  // Handle simple text input (simple mode)
  const handleSimpleLocationChange = (value: string) => {
    if (value.trim()) {
      handleChange("locationName", value.trim());
      // Keep address and coordinates null/empty for simple mode
      if (editedTask.locationAddress) {
        handleChange("locationAddress", "");
      }
      if (editedTask.locationCoordinates) {
        handleChange("locationCoordinates", "");
      }
    } else {
      // Clear all location fields
      handleChange("locationName", "");
      handleChange("locationAddress", "");
      handleChange("locationCoordinates", "");
    }
  };

  // Clear location
  const clearLocation = () => {
    handleChange("locationName", "");
    handleChange("locationAddress", "");
    handleChange("locationCoordinates", "");
    setSearchQuery("");
    setInputMode("simple"); // Reset to simple mode
    setPreviousMapData(null);
  };

  // Handle location change from map dialog
  const handleLocationChangeFromMap = (newLocation: Location) => {
    const fields = locationToTaskFields(newLocation);

    // Update all location fields at once
    handleChange("locationName", fields.locationName);
    handleChange("locationAddress", fields.locationAddress);
    handleChange("locationCoordinates", fields.locationCoordinates);

    setShowMapDialog(false);
  };

  // Switch input mode
  const switchToMapMode = () => {
    setInputMode("map");

    // If switching from simple to map and we have previous map data, restore it
    if (previousMapData && editedTask.locationName && !hasMapData) {
      handleChange("locationAddress", previousMapData.locationAddress);
      handleChange("locationCoordinates", previousMapData.locationCoordinates);
      setPreviousMapData(null);
    }

    if (editedTask.locationName) {
      setSearchQuery(editedTask.locationName);
    }
  };

  const switchToSimpleMode = () => {
    // Store current map data before switching to simple mode
    if (hasMapData) {
      setPreviousMapData({
        locationAddress: editedTask.locationAddress || "",
        locationCoordinates: editedTask.locationCoordinates || "",
      });
    }

    setInputMode("simple");
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchDropdown(false);

    // Clear address and coordinates for simple mode but keep locationName
    if (editedTask.locationAddress) {
      handleChange("locationAddress", "");
    }
    if (editedTask.locationCoordinates) {
      handleChange("locationCoordinates", "");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <MapPin size={18} className="text-gray-600 dark:text-gray-400" />
        <h4 className="font-medium text-gray-800 dark:text-gray-200">
          Location
        </h4>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>

        {/* Clear button - only show if has location */}
        {editedTask.locationName && (
          <button
            onClick={clearLocation}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Clear location"
          >
            <X size={14} />
          </button>
        )}

        {/* Mode Toggle Buttons */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={switchToSimpleMode}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              inputMode === "simple"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Simple
          </button>
          <button
            onClick={switchToMapMode}
            className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
              inputMode === "map"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <Map size={12} />
            Map
          </button>
        </div>
      </div>

      {/* Static Mini Map - Only show if in MAP mode and has map data */}
      {inputMode === "map" && currentLocation && hasMapData && (
        <div className="w-full">
          <StaticMiniMap
            location={currentLocation}
            onClick={() => setShowMapDialog(true)}
            className="w-full h-32"
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
            Click map to open full map editor
          </div>
        </div>
      )}

      {/* Input Section */}
      {inputMode === "simple" ? (
        /* Simple Text Input Mode */
        <div className="space-y-3">
          <div className="relative">
            <MapPin
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Enter location name..."
              value={editedTask.locationName || ""}
              onChange={(e) => handleSimpleLocationChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            💡 Simple mode: Enter just the location name. Switch to Map mode for
            precise coordinates and address.
          </div>
        </div>
      ) : (
        /* Map Search Mode */
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
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

            {/* Current Location Button */}
            <button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="flex items-center justify-center w-11 h-11 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-50 rounded-lg transition-colors"
              title="Get current location"
            >
              {isGettingLocation ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Navigation size={18} />
              )}
            </button>
          </div>

          {/* Search Results Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="relative z-50">
              <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
            </div>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400">
            🗺️ Map mode: Search for places with precise coordinates and address,
            or use current location.
          </div>
        </div>
      )}

      {/* Location Details - Only show in map mode if location exists */}
      {inputMode === "map" && editedTask.locationName && hasMapData && (
        <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location Name (editable)
            </label>
            <input
              type="text"
              value={editedTask.locationName || ""}
              onChange={(e) => handleChange("locationName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter custom location name..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Address (from map service)
            </label>
            <input
              type="text"
              value={editedTask.locationAddress || ""}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm cursor-not-allowed"
              placeholder="Address will be filled from map"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Coordinates (from map service)
            </label>
            <input
              type="text"
              value={editedTask.locationCoordinates || ""}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-mono cursor-not-allowed"
              placeholder="Coordinates will be filled from map"
            />
          </div>
        </div>
      )}
      {/* Map Dialog */}
      {showMapDialog && currentLocation && (
        <InteractiveMapDialog
          location={currentLocation}
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
