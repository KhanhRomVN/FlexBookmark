import React, { useState, useEffect } from "react";
import { useTheme } from "../../providers/theme-provider";
import { cn } from "../../../shared/utils/cn";

const Clock: React.FC = () => {
  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const { theme } = useTheme();

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
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

  return (
    <div className="text-center mb-6">
      <div
        className={cn(
          "text-7xl md:text-8xl font-bold tracking-tighter font-mono",
          theme === "image"
            ? "text-white"
            : "bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-400 dark:to-indigo-400"
        )}
      >
        {time}
      </div>
      <div
        className={cn(
          "text-xl md:text-2xl font-medium mt-2",
          theme === "image" ? "text-white opacity-90" : "opacity-90"
        )}
      >
        {date}
      </div>
    </div>
  );
};

export default Clock;
