import React from "react";

interface WeatherProps {
  weather: {
    temperature: number;
    weathercode: number;
    description: string;
  } | null;
}

const WeatherWidget: React.FC<WeatherProps> = ({ weather }) => {
  if (!weather) {
    return (
      <div className="flex justify-center items-center gap-2">
        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  const weatherIcon = (code: number) => {
    if (code === 0) return "☀️";
    if (code <= 3) return "⛅";
    if (code <= 67) return "🌧️";
    if (code <= 86) return "❄️";
    return "🌩️";
  };

  return (
    <div className="flex items-center justify-center gap-3 bg-button-secondBg text-text-primary rounded-full px-4 py-2">
      <div className="text-3xl">{weatherIcon(weather.weathercode)}</div>
      <div className="text-center">
        <div className="text-lg font-medium">{weather.description}</div>
        <div className="text-text-primary">
          {Math.round(weather.temperature)}°C
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
