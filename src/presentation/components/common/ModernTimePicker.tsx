// ModernTimePicker.tsx
import React, { useState, useEffect, useRef } from "react";
import { Clock, ChevronDown, X } from "lucide-react";

interface ModernTimePickerProps {
  selectedTime: Date | null;
  onTimeChange: (time: Date | null) => void;
  label: string;
  color?: "green" | "red";
  placeholder?: string;
}

const ModernTimePicker: React.FC<ModernTimePickerProps> = ({
  selectedTime,
  onTimeChange,
  label,
  color = "green",
  placeholder = "Select time",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTimeString, setSelectedTimeString] = useState(
    selectedTime ? selectedTime.toISOString().slice(11, 16) : "09:00"
  );
  const pickerRef = useRef<HTMLDivElement>(null);

  const colorThemes = {
    green: {
      primary: "from-emerald-500 via-green-500 to-teal-500",
      secondary: "border-emerald-300 dark:border-emerald-600",
      ring: "ring-emerald-500/30 dark:ring-emerald-400/40",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
      text: "text-emerald-700 dark:text-emerald-300",
      dot: "bg-emerald-500",
      button:
        "from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700",
      hover: "hover:bg-emerald-500 dark:hover:bg-emerald-600",
      selected: "bg-emerald-500 dark:bg-emerald-600",
    },
    red: {
      primary: "from-rose-500 via-red-500 to-pink-500",
      secondary: "border-rose-300 dark:border-rose-600",
      ring: "ring-rose-500/30 dark:ring-rose-400/40",
      bg: "bg-rose-50 dark:bg-rose-950/50",
      text: "text-rose-700 dark:text-rose-300",
      dot: "bg-rose-500",
      button: "from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700",
      hover: "hover:bg-rose-500 dark:hover:bg-rose-600",
      selected: "bg-rose-500 dark:bg-rose-600",
    },
  };

  const theme = colorThemes[color];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Update selectedTimeString when selectedTime prop changes
  useEffect(() => {
    if (selectedTime) {
      setSelectedTimeString(selectedTime.toISOString().slice(11, 16));
    }
  }, [selectedTime]);

  const formatDisplayTime = (time: Date | null) => {
    if (!time) return placeholder;
    return new Date(time).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTimeString(time);
    const timeDate = new Date(`1970-01-01T${time}`);
    onTimeChange(timeDate);
  };

  const getTimePresets = () => [
    {
      label: "Morning",
      value: "09:00",
      color: "bg-amber-100 dark:bg-amber-900/30",
      textColor: "text-amber-800 dark:text-amber-200",
      icon: "🌅",
    },
    {
      label: "Lunch",
      value: "12:00",
      color: "bg-orange-100 dark:bg-orange-900/30",
      textColor: "text-orange-800 dark:text-orange-200",
      icon: "🍽️",
    },
    {
      label: "Afternoon",
      value: "14:00",
      color: "bg-sky-100 dark:bg-sky-900/30",
      textColor: "text-sky-800 dark:text-sky-200",
      icon: "☀️",
    },
    {
      label: "Evening",
      value: "18:00",
      color: "bg-purple-100 dark:bg-purple-900/30",
      textColor: "text-purple-800 dark:text-purple-200",
      icon: "🌆",
    },
    {
      label: "Night",
      value: "21:00",
      color: "bg-indigo-100 dark:bg-indigo-900/30",
      textColor: "text-indigo-800 dark:text-indigo-200",
      icon: "🌙",
    },
    {
      label: "Midnight",
      value: "00:00",
      color: "bg-gray-100 dark:bg-gray-900/30",
      textColor: "text-gray-800 dark:text-gray-200",
      icon: "🌌",
    },
  ];

  // Generate hour and minute options
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  const getCurrentHour = () => selectedTimeString.split(":")[0];
  const getCurrentMinute = () => selectedTimeString.split(":")[1];

  const handleHourChange = (hour: string) => {
    const currentMinute = getCurrentMinute();
    handleTimeSelect(`${hour}:${currentMinute}`);
  };

  const handleMinuteChange = (minute: string) => {
    const currentHour = getCurrentHour();
    handleTimeSelect(`${currentHour}:${minute}`);
  };

  return (
    <>
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .time-picker-enter {
          animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-effect {
          backdrop-filter: blur(16px);
          background: rgba(255, 255, 255, 0.95);
        }

        @media (prefers-color-scheme: dark) {
          .glass-effect {
            background: rgba(17, 24, 39, 0.95);
          }
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .time-wheel::-webkit-scrollbar {
          width: 4px;
        }

        .time-wheel::-webkit-scrollbar-track {
          background: transparent;
        }

        .time-wheel::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 2px;
        }

        .time-wheel::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.7);
        }
      `}</style>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <div className={`p-1 rounded-lg ${theme.bg}`}>
            <Clock size={14} className={theme.text} />
          </div>
          {label}
        </label>

        <div className="relative" ref={pickerRef}>
          {/* Trigger Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`group w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-4 text-left flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/20 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-4 ${theme.ring}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 ${theme.dot} rounded-full shadow-sm`}
              ></div>
              <div>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {formatDisplayTime(selectedTime)}
                </span>
              </div>
            </div>
            <ChevronDown
              size={18}
              className={`text-gray-400 dark:text-gray-500 transition-all duration-300 group-hover:text-gray-600 dark:group-hover:text-gray-300 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Time Picker Dropdown */}
          {isOpen && (
            <div className="absolute z-50 mt-3 w-96 glass-effect rounded-3xl shadow-2xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden time-picker-enter">
              {/* Header */}
              <div
                className={`bg-gradient-to-br ${theme.primary} text-white p-6`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Clock size={20} />
                    {label}
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Time Input */}
                <div>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">
                    Time Input
                  </p>
                  <input
                    type="time"
                    value={selectedTimeString}
                    onChange={(e) => handleTimeSelect(e.target.value)}
                    className={`w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 ${theme.ring} focus:border-transparent transition-all text-center text-xl font-mono hover:border-gray-300 dark:hover:border-gray-600`}
                  />
                </div>

                {/* Time Wheel Selectors */}
                <div>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">
                    Hour : Minute
                  </p>
                  <div className="flex items-center gap-4">
                    {/* Hour Selector */}
                    <div className="flex-1">
                      <div className="text-center text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                        Hour
                      </div>
                      <div className="h-40 bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-y-auto time-wheel border border-gray-200 dark:border-gray-700">
                        {hours.map((hour) => (
                          <button
                            key={hour}
                            onClick={() => handleHourChange(hour)}
                            className={`w-full py-3 text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 font-medium ${
                              getCurrentHour() === hour
                                ? `${theme.bg} ${theme.text} font-bold shadow-sm border-l-4 ${theme.secondary}`
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {hour}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Separator */}
                    <div className="text-3xl font-bold text-gray-400 dark:text-gray-600">
                      :
                    </div>

                    {/* Minute Selector */}
                    <div className="flex-1">
                      <div className="text-center text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                        Minute
                      </div>
                      <div className="h-40 bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-y-auto time-wheel border border-gray-200 dark:border-gray-700">
                        {minutes
                          .filter((_, index) => index % 5 === 0)
                          .map((minute) => (
                            <button
                              key={minute}
                              onClick={() => handleMinuteChange(minute)}
                              className={`w-full py-3 text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 font-medium ${
                                getCurrentMinute() === minute
                                  ? `${theme.bg} ${theme.text} font-bold shadow-sm border-l-4 ${theme.secondary}`
                                  : "text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {minute}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time Presets */}
                <div>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">
                    Quick Select
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {getTimePresets().map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handleTimeSelect(preset.value)}
                        className={`group p-3 rounded-2xl text-center transition-all duration-200 border ${
                          selectedTimeString === preset.value
                            ? `${theme.bg} border-2 ${theme.secondary} shadow-md`
                            : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <div className="text-lg mb-1">{preset.icon}</div>
                        <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
                          {preset.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {preset.value}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      onTimeChange(null);
                      setSelectedTimeString("09:00");
                      setIsOpen(false);
                    }}
                    className="flex-1 px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all duration-200"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className={`flex-1 bg-gradient-to-r ${theme.button} text-white px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 hover:shadow-lg shadow-lg`}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ModernTimePicker;
