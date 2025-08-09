import React, { useEffect, useState, useCallback } from "react";
import { getBookmarks } from "../../utils/api";
import Clock from "../components/Dashboard/Clock";
import WeatherWidget from "../components/Dashboard/WeatherWidget";
import SearchBar from "../components/common/SearchBar";
import BookmarkGrid from "../components/Dashboard/BookmarkGrid";

export interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
}

const Dashboard: React.FC = () => {
  const [weather, setWeather] = useState<{
    temperature: number;
    weathercode: number;
    description: string;
  } | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentFolder, setCurrentFolder] = useState<BookmarkNode | null>(null);
  const [folderHistory, setFolderHistory] = useState<BookmarkNode[]>([]);

  // Weather code mapping
  const getWeatherDescription = useCallback((code: number): string => {
    const weatherCodes: Record<number, string> = {
      0: "Clear sky",
      1: "Mostly sunny",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Foggy",
      48: "Rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Heavy drizzle",
      56: "Light freezing drizzle",
      57: "Heavy freezing drizzle",
      61: "Light rain",
      63: "Moderate rain",
      65: "Heavy rain",
      66: "Light freezing rain",
      67: "Heavy freezing rain",
      71: "Light snow",
      73: "Moderate snow",
      75: "Heavy snow",
      77: "Snow grains",
      80: "Light showers",
      81: "Moderate showers",
      82: "Violent showers",
      85: "Light snow showers",
      86: "Heavy snow showers",
      95: "Thunderstorm",
      96: "Thunderstorm with hail",
      99: "Severe thunderstorm",
    };

    return weatherCodes[code] || `Weather code: ${code}`;
  }, []);

  // Fetch weather
  const fetchWeather = useCallback(async () => {
    if (!navigator.geolocation) return;

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
          });
        }
      );

      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
      );

      const data = await response.json();
      if (data.current_weather) {
        const description = getWeatherDescription(
          data.current_weather.weathercode
        );
        setWeather({
          temperature: data.current_weather.temperature,
          weathercode: data.current_weather.weathercode,
          description,
        });
      }
    } catch (err) {
      console.error("Weather fetch error:", err);
    }
  }, [getWeatherDescription]);

  // Load bookmarks
  const loadBookmarks = useCallback(async () => {
    try {
      const tree = await getBookmarks();
      const root = tree[0]?.children || [];

      // Find bookmarks bar folder
      const barFolder =
        root.find((f: BookmarkNode) =>
          f.title.toLowerCase().includes("bookmark bar")
        ) || root[0];

      setBookmarks(barFolder?.children || []);
    } catch (err) {
      console.error("Bookmarks load error:", err);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    fetchWeather();
    loadBookmarks();
  }, [fetchWeather, loadBookmarks]);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
        "_blank"
      );
      setSearchQuery("");
    }
  };

  // Filter bookmarks
  const filteredBookmarks = (currentFolder?.children || bookmarks).filter(
    (bm) =>
      bm.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bm.url?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open folder view
  const openFolder = (folder: BookmarkNode) => {
    setFolderHistory([...folderHistory, folder]);
    setCurrentFolder(folder);
  };

  // Navigate back to previous folder
  const goBack = () => {
    if (folderHistory.length > 0) {
      const newHistory = [...folderHistory];
      const prevFolder = newHistory.pop();
      setFolderHistory(newHistory);
      setCurrentFolder(prevFolder || null);
    } else {
      setCurrentFolder(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-6xl flex flex-col items-center">
        <div className="w-full max-w-2xl flex flex-col items-center mb-8">
          <Clock />
          <WeatherWidget weather={weather} />
        </div>

        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
        />

        <BookmarkGrid
          bookmarks={filteredBookmarks}
          currentFolder={currentFolder}
          folderHistory={folderHistory}
          openFolder={openFolder}
          goBack={goBack}
        />
      </div>
    </div>
  );
};

export default Dashboard;
