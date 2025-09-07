import { BookmarkNode, WeatherData } from "../types";

export const getWeatherDescription = (code: number): string => {
  const weatherMap: Record<number, string> = {
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
  return weatherMap[code] || `Weather code: ${code}`;
};

export const fetchWeather = async (): Promise<WeatherData | null> => {
  if (!navigator.geolocation) return null;

  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 5000,
      })
    );

    const { latitude, longitude } = pos.coords;
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.current_weather) {
      return {
        temperature: data.current_weather.temperature,
        weathercode: data.current_weather.weathercode,
        description: getWeatherDescription(data.current_weather.weathercode),
      };
    }

    return null;
  } catch (error) {
    console.error("Weather fetch error:", error);
    return null;
  }
};

export const loadBookmarks = async (): Promise<{
  bookmarks: BookmarkNode[];
  barFolderId: string;
}> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((tree) => {
      try {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        const rootChildren = tree[0]?.children || [];
        const bar =
          rootChildren.find((f) =>
            f.title.toLowerCase().includes("bookmark bar")
          ) || rootChildren[0];

        const processBookmarkNode = (
          node: chrome.bookmarks.BookmarkTreeNode
        ): BookmarkNode => ({
          id: node.id,
          title: node.title,
          url: node.url,
          parentId: node.parentId,
          children: node.children
            ? node.children.map(processBookmarkNode)
            : undefined,
        });

        const bookmarks = bar?.children
          ? bar.children.map(processBookmarkNode)
          : [];

        resolve({
          bookmarks,
          barFolderId: bar?.id || "",
        });
      } catch (error) {
        reject(error);
      }
    });
  });
};

export const updateBookmark = async (
  id: string,
  title: string,
  url?: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.update(id, { title, url }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
};

export const deleteBookmark = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.remove(id, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
};

export const createBookmark = async (
  parentId: string,
  title: string,
  url: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.create({ parentId, title, url }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
};

export const moveBookmark = async (
  id: string,
  parentId: string,
  index?: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.move(id, { parentId, index }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
};

export const deleteFolder = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.removeTree(id, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
};
