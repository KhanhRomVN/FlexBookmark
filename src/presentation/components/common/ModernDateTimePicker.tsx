// ModernDateTimePicker.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  X,
  ChevronDown,
} from "lucide-react";

interface ModernDateTimePickerProps {
  selectedDate: Date | null;
  selectedTime: Date | null;
  onDateChange: (date: Date | null) => void;
  onTimeChange: (time: Date | null) => void;
  label: string;
  color?: "green" | "red" | "blue" | "purple";
  placeholder?: string;
}

const ModernDateTimePicker: React.FC<ModernDateTimePickerProps> = ({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  label,
  color = "green",
  placeholder = "Select date & time",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const [animationClass, setAnimationClass] = useState("");
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

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return placeholder;
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDisplayTime = (time: Date | null) => {
    if (!time) return "";
    return new Date(time).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonth.getDate() - i,
        isCurrentMonth: false,
        isNext: false,
        date: new Date(year, month - 1, prevMonth.getDate() - i),
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        isNext: false,
        date: new Date(year, month, day),
      });
    }

    // Next month's leading days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        isNext: true,
        date: new Date(year, month + 1, day),
      });
    }

    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setAnimationClass(direction === "prev" ? "slide-right" : "slide-left");

    setTimeout(() => {
      const newMonth = new Date(currentMonth);
      newMonth.setMonth(newMonth.getMonth() + (direction === "prev" ? -1 : 1));
      setCurrentMonth(newMonth);
      setAnimationClass("");
    }, 150);
  };

  const handleDateSelect = (date: Date) => {
    onDateChange(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTimeString(time);
    const timeDate = new Date(`1970-01-01T${time}`);
    onTimeChange(timeDate);
  };

  const getDatePresets = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return [
      { label: "Today", value: today, color: "bg-blue-500", icon: "📅" },
      {
        label: "Tomorrow",
        value: tomorrow,
        color: "bg-violet-500",
        icon: "🌅",
      },
    ];
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

  const days = getDaysInMonth(currentMonth);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

        .slide-left {
          transform: translateX(-20px);
          opacity: 0.7;
        }
        .slide-right {
          transform: translateX(20px);
          opacity: 0.7;
        }

        .calendar-enter {
          animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .day-hover {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .day-hover:hover {
          transform: translateY(-1px) scale(1.05);
          box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.25);
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
      `}</style>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-text-secondary flex items-center gap-2">
          <div className={`p-1 rounded-lg ${theme.bg}`}>
            <Calendar size={14} className={theme.text} />
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
              <div className="space-y-1">
                <div className="text-gray-900 dark:text-gray-100 font-medium">
                  {formatDisplayDate(selectedDate)}
                </div>
                {selectedTime && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Clock size={12} />
                    {formatDisplayTime(selectedTime)}
                  </div>
                )}
              </div>
            </div>
            <ChevronDown
              size={18}
              className={`text-gray-400 dark:text-gray-500 transition-all duration-300 group-hover:text-gray-600 dark:group-hover:text-gray-300 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Calendar Dropdown */}
          {isOpen && (
            <div className="absolute z-50 mt-3 w-[28rem] glass-effect rounded-3xl shadow-2xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden calendar-enter">
              {/* Header */}
              <div
                className={`bg-gradient-to-br ${theme.primary} text-white p-6`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Calendar size={20} />
                    {label}
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigateMonth("prev")}
                    className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <h2 className="font-bold text-xl">
                    {currentMonth.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h2>

                  <button
                    onClick={() => navigateMonth("next")}
                    className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Quick Presets */}
                <div>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">
                    Quick Select
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {getDatePresets().map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => {
                          handleDateSelect(preset.value);
                          setIsOpen(false);
                        }}
                        className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 text-left border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                      >
                        <span className="text-lg">{preset.icon}</span>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm group-hover:text-gray-700 dark:group-hover:text-gray-200">
                            {preset.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {preset.value.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calendar Grid */}
                <div>
                  {/* Week Days */}
                  <div className="grid grid-cols-7 gap-1 mb-3">
                    {weekDays.map((day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-bold text-gray-600 dark:text-gray-400 py-2"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div
                    className={`grid grid-cols-7 gap-2 transition-all duration-200 ${animationClass}`}
                  >
                    {days.map((dayObj, index) => {
                      const isCurrentMonth = dayObj.isCurrentMonth;
                      const dayIsToday = isToday(dayObj.date);
                      const dayIsSelected = isSelected(dayObj.date);

                      return (
                        <button
                          key={`${dayObj.date.getTime()}-${index}`}
                          onClick={() =>
                            isCurrentMonth && handleDateSelect(dayObj.date)
                          }
                          disabled={!isCurrentMonth}
                          className={`
                            relative h-11 w-11 rounded-xl text-sm font-semibold transition-all duration-200 day-hover
                            ${
                              isCurrentMonth
                                ? `${theme.hover} hover:text-white cursor-pointer`
                                : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                            }
                            ${
                              dayIsToday && !dayIsSelected
                                ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg"
                                : ""
                            }
                            ${
                              dayIsSelected
                                ? `${theme.selected} text-white shadow-lg scale-105 ring-4 ring-white/30`
                                : "text-gray-700 dark:text-gray-300"
                            }
                          `}
                        >
                          {dayObj.day}
                          {dayIsToday && !dayIsSelected && (
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Selection */}
                <div>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Clock size={12} />
                    Time Selection
                  </p>

                  <div className="space-y-4">
                    {/* Hour and Minute Wheels */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="text-center text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                          Hour
                        </div>
                        <div className="h-40 bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-y-auto scrollbar-hide border border-gray-200 dark:border-gray-700">
                          {Array.from({ length: 24 }, (_, i) =>
                            i.toString().padStart(2, "0")
                          ).map((hour) => (
                            <button
                              key={hour}
                              onClick={() => {
                                const currentMinute =
                                  selectedTimeString.split(":")[1];
                                handleTimeSelect(`${hour}:${currentMinute}`);
                              }}
                              className={`w-full py-2 text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 text-sm font-medium ${
                                selectedTimeString.split(":")[0] === hour
                                  ? `${theme.bg} ${theme.text} font-bold shadow-sm`
                                  : "text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {hour}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="text-2xl font-bold text-gray-400 dark:text-gray-600">
                        :
                      </div>

                      <div className="flex-1">
                        <div className="text-center text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                          Min
                        </div>
                        <div className="h-40 bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-y-auto scrollbar-hide border border-gray-200 dark:border-gray-700">
                          {Array.from({ length: 12 }, (_, i) =>
                            (i * 5).toString().padStart(2, "0")
                          ).map((minute) => (
                            <button
                              key={minute}
                              onClick={() => {
                                const currentHour =
                                  selectedTimeString.split(":")[0];
                                handleTimeSelect(`${currentHour}:${minute}`);
                              }}
                              className={`w-full py-2 text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 text-sm font-medium ${
                                selectedTimeString.split(":")[1] === minute
                                  ? `${theme.bg} ${theme.text} font-bold shadow-sm`
                                  : "text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {minute}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Time Presets */}
                    <div className="grid grid-cols-3 gap-2">
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
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      onDateChange(null);
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

export default ModernDateTimePicker;
