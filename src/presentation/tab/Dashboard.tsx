import React, { useEffect, useState, useCallback } from "react";
import { getBookmarks } from "../../utils/api";

interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
}

const Dashboard: React.FC = () => {
  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [weather, setWeather] = useState<{
    temperature: number;
    weathercode: number;
    description: string;
  } | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Update clock and date every second
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-GB", { hour12: false }));
      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Weather code mapping
  const getWeatherDescription = (code: number): string => {
    const weatherCodes: Record<number, string> = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Depositing rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      56: "Light freezing drizzle",
      57: "Dense freezing drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      66: "Light freezing rain",
      67: "Heavy freezing rain",
      71: "Slight snow fall",
      73: "Moderate snow fall",
      75: "Heavy snow fall",
      77: "Snow grains",
      80: "Slight rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
      85: "Slight snow showers",
      86: "Heavy snow showers",
      95: "Thunderstorm",
      96: "Thunderstorm with hail",
      99: "Heavy thunderstorm with hail",
    };

    return weatherCodes[code] || `Weather code: ${code}`;
  };

  // Fetch weather using browser geolocation and open-meteo API
  const fetchWeather = useCallback(async () => {
    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
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
  }, []);

  // Load bookmarks from "Bookmarks bar" folder
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
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchWeather(), loadBookmarks()]);
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
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

  // Filter bookmarks based on search query
  const filteredBookmarks = bookmarks.filter(
    (bm) =>
      bm.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bm.url?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-primary dark:bg-background-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-background-primary text-text-primary dark:bg-background-secondary dark:text-text-secondary">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="text-4xl md:text-5xl font-mono font-medium">
            {time}
          </div>
          <div className="text-lg md:text-xl mt-1 opacity-90">{date}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 card bg-card-background border border-card-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-xl font-semibold mb-4">Weather</h3>
          {weather ? (
            <div className="flex items-center gap-4">
              <div className="text-5xl font-light">
                {weather.temperature.toFixed(1)}°C
              </div>
              <div className="flex flex-col">
                <div className="text-lg capitalize">{weather.description}</div>
                <div className="text-sm opacity-80 mt-1">
                  {weather.weathercode} -{" "}
                  {getWeatherDescription(weather.weathercode)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-lg">Weather data unavailable</div>
          )}
        </div>

        <div className="p-6 card bg-card-background border border-card-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-xl font-semibold mb-4">Search</h3>
          <form onSubmit={handleSearch}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search web or bookmarks..."
                className="input-field w-full pl-10 pr-4 py-3 rounded-lg bg-input-background border border-input-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-md hover:bg-opacity-90 transition-colors"
              >
                Go
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl md:text-3xl font-semibold">Bookmarks Bar</h3>
          <div className="text-sm opacity-80">
            {filteredBookmarks.length} of {bookmarks.length} items
          </div>
        </div>

        {filteredBookmarks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredBookmarks.map((bm) => (
              <a
                key={bm.id}
                href={bm.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 card bg-card-background border border-card-border rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center group"
              >
                <div className="bg-gray-200 dark:bg-gray-700 w-12 h-12 rounded-full mb-3 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  {bm.title?.charAt(0) || "🔗"}
                </div>
                <div className="font-medium truncate w-full">
                  {bm.title || "Untitled"}
                </div>
                {bm.url && (
                  <div className="text-xs opacity-70 mt-1 truncate w-full">
                    {new URL(bm.url).hostname.replace("www.", "")}
                  </div>
                )}
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card-background rounded-xl border border-card-border">
            <div className="text-xl opacity-80">
              No bookmarks match your search
            </div>
            <div className="mt-2 opacity-60">Try a different search term</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
