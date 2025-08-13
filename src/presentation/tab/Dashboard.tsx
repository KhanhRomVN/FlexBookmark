import React, { useEffect, useState, useCallback } from "react";
import { useTheme } from "../providers/theme-provider";
import { getBookmarks } from "../../utils/api";
import Clock from "../components/Dashboard/Clock";
import WeatherWidget from "../components/Dashboard/WeatherWidget";
import SearchBar from "../components/common/SearchBar";
import BookmarkGrid from "../components/Dashboard/BookmarkGrid";
import useWindowSize from "../../hooks/useWindowSize";

export interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
}

const Dashboard: React.FC = () => {
  const windowSize = useWindowSize();
  const { theme } = useTheme();
  const [weather, setWeather] = useState<{
    temperature: number;
    weathercode: number;
    description: string;
  } | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
  const [barFolderId, setBarFolderId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentFolder, setCurrentFolder] = useState<BookmarkNode | null>(null);
  const [folderHistory, setFolderHistory] = useState<BookmarkNode[]>([]);

  const getWeatherDescription = useCallback((code: number): string => {
    const map: Record<number, string> = {
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
    return map[code] || `Weather code: ${code}`;
  }, []);

  const fetchWeather = useCallback(async () => {
    if (!navigator.geolocation) return;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      );
      const { latitude, longitude } = pos.coords;
      const r = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
      );
      const data = await r.json();
      if (data.current_weather) {
        const desc = getWeatherDescription(data.current_weather.weathercode);
        setWeather({
          temperature: data.current_weather.temperature,
          weathercode: data.current_weather.weathercode,
          description: desc,
        });
      }
    } catch (err) {
      console.error("Weather fetch error:", err);
    }
  }, [getWeatherDescription]);

  const loadBookmarks = useCallback(async () => {
    try {
      const tree = await getBookmarks();
      const rootChildren = tree[0]?.children || [];
      const bar =
        rootChildren.find((f) =>
          f.title.toLowerCase().includes("bookmark bar")
        ) || rootChildren[0];
      setBarFolderId(bar?.id || "");
      setBookmarks(bar?.children || []);
    } catch (err) {
      console.error("Bookmarks load error:", err);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    loadBookmarks();
  }, [fetchWeather, loadBookmarks]);

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

  const filtered = (currentFolder?.children || bookmarks).filter(
    (bm) =>
      bm.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bm.url?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openFolder = (folder: BookmarkNode) => {
    if (folderHistory.length >= 1) {
      alert("Nested folders are not supported");
      return;
    }
    setFolderHistory([...folderHistory, folder]);
    setCurrentFolder(folder);
  };

  const goBack = () => {
    if (folderHistory.length) {
      const hist = [...folderHistory];
      const prev = hist.pop()!;
      setFolderHistory(hist);
      setCurrentFolder(prev);
    } else {
      setCurrentFolder(null);
    }
  };

  return (
    <div
      style={
        theme === "image"
          ? {
              backgroundImage: "var(--bg-url)",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {}
      }
      className={`min-h-screen flex flex-col items-center justify-center p-4 text-gray-900 dark:text-gray-100 ${
        theme === "image"
          ? ""
          : "bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800"
      }`}
    >
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
          bookmarks={filtered}
          currentFolder={currentFolder}
          folderHistory={folderHistory}
          openFolder={openFolder}
          goBack={goBack}
          barFolderId={barFolderId}
          loadBookmarks={loadBookmarks}
          key={windowSize.width}
        />
      </div>
    </div>
  );
};

export default Dashboard;
