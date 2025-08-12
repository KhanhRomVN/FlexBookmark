import React, { useEffect, useState, useCallback } from "react";
import { useTheme } from "../providers/theme-provider";
import { getBookmarks } from "../../utils/api";
import Clock from "../components/Dashboard/Clock";
import WeatherWidget from "../components/Dashboard/WeatherWidget";
import SearchBar from "../components/common/SearchBar";
import {
  DndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import BookmarkItem from "../components/Dashboard/BookmarkItem";
import FolderPreview from "../components/Dashboard/FolderPreview";

export interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
}

const Dashboard: React.FC = () => {
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

  // Weather code mapping
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

  // Fetch weather
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

  // Load bookmarks
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

  // Search
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

  // Filter list
  const filtered = (currentFolder?.children || bookmarks).filter(
    (bm) =>
      bm.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bm.url?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Navigation
  const openFolder = (folder: BookmarkNode) => {
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

  // Drag-n-drop setup
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const handleDragEnd = async (ev: DragEndEvent) => {
    const srcId = ev.active.id as string;
    const over = ev.over?.id as string | undefined;
    if (!over || srcId === over) return;
    // only at root level grouping
    if (currentFolder) return;
    // create new folder
    const name = prompt("Folder name", "New Folder");
    if (!name) return;
    const newNode = await new Promise<chrome.bookmarks.BookmarkTreeNode>(
      (res, rej) =>
        chrome.bookmarks.create(
          { title: name, parentId: barFolderId },
          (node) =>
            chrome.runtime.lastError ? rej(chrome.runtime.lastError) : res(node)
        )
    );
    // move both
    await chrome.bookmarks.move(srcId, { parentId: newNode.id });
    await chrome.bookmarks.move(over, { parentId: newNode.id, index: 1 });
    // refresh
    loadBookmarks();
    setCurrentFolder({
      id: newNode.id,
      title: newNode.title || name,
      children: [],
    });
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

        <div className="w-full max-w-6xl">
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
              {filtered.map((item) =>
                item.url ? (
                  <div
                    key={item.id}
                    id={item.id}
                    draggable
                    className="cursor-grab"
                  >
                    <BookmarkItem bookmark={item} />
                  </div>
                ) : (
                  <div
                    key={item.id}
                    id={item.id}
                    draggable
                    className="cursor-pointer"
                    onClick={() => openFolder(item)}
                  >
                    <FolderPreview folder={item} openFolder={openFolder} />
                  </div>
                )
              )}
            </div>
          </DndContext>
          {currentFolder && (
            <button
              onClick={goBack}
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
