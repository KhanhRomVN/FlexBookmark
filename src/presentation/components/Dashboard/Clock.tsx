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
          "text-7xl md:text-8xl font-bold tracking-tighter font-mono bg-clip-text text-transparent",
          theme === "image" ? "text-[var(--clock-color)]" : ""
        )}
        style={
          theme !== "image"
            ? {
                backgroundImage:
                  "linear-gradient(to right, var(--clock-gradient-from), var(--clock-gradient-to))",
              }
            : undefined
        }
      >
        {time}
      </div>
      <div
        className={cn(
          "text-xl md:text-2xl font-medium mt-2",
          theme === "image"
            ? "text-[var(--clock-color)] opacity-90"
            : "opacity-90"
        )}
      >
        {date}
      </div>
    </div>
  );
};

export default Clock;
