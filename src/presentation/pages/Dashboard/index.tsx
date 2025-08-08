import React, { useEffect, useState } from "react";
import ThemeSelector from "../../components/common/ThemeSelector";
import { getBookmarks } from "../../../utils/api";

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
  } | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  // Fetch weather using browser geolocation and open-meteo API
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
        )
          .then((res) => res.json())
          .then((data) => {
            if (data.current_weather) {
              setWeather({
                temperature: data.current_weather.temperature,
                weathercode: data.current_weather.weathercode,
              });
            }
          })
          .catch((err) => console.error("Weather fetch error:", err))
          .finally(() => loadBookmarks());
      },
      (err) => {
        console.error("Geolocation error:", err);
        loadBookmarks();
      }
    );
  }, []);

  // Load bookmarks from "Bookmarks bar" folder
  const loadBookmarks = async () => {
    try {
      const tree = await getBookmarks();
      const root = tree[0]?.children || [];
      const barFolder =
        root.find((f: BookmarkNode) =>
          f.title.toLowerCase().includes("bookmark")
        ) || {};
      setBookmarks((barFolder as BookmarkNode).children || []);
    } catch (err) {
      console.error("Bookmarks load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-primary dark:bg-background-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-background-primary text-text-primary dark:bg-background-secondary dark:text-text-secondary">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-4xl font-mono">{time}</div>
          <div className="text-lg mt-1">{date}</div>
        </div>
        <ThemeSelector />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 card">
          <h3 className="text-xl font-semibold mb-2">Weather</h3>
          {weather ? (
            <div>
              <div className="text-3xl">{weather.temperature.toFixed(1)}°C</div>
              <div className="capitalize mt-1">Code: {weather.weathercode}</div>
            </div>
          ) : (
            <div>Unable to fetch weather</div>
          )}
        </div>
        <div className="p-4 card">
          <h3 className="text-xl font-semibold mb-2">Search</h3>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search..."
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-5xl font-semibold mb-4 text-red-500">
          Bookmarks Bar
        </h3>
        <div className="grid grid-rows-2 auto-cols-max grid-flow-col gap-4 overflow-x-auto pb-4">
          {bookmarks.map((bm) => (
            <a
              key={bm.id}
              href={bm.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 card min-w-[150px] hover:shadow-lg transition-shadow"
            >
              <div className="truncate">{bm.title || bm.url}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
