import React from "react";
import { Transaction } from "../../../types/types";

interface CalendarViewProps {
  transactions: Transaction[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  transactions,
  selectedDate,
  onDateSelect,
}) => {
  const currentDate = new Date();
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getTransactionsForDate = (date: Date) => {
    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.toDateString() === date.toDateString();
    });
  };

  const getDayClassName = (date: Date) => {
    const today = new Date();
    const classes = [
      "text-center p-2 rounded cursor-pointer hover:bg-gray-100",
    ];

    if (date.toDateString() === today.toDateString()) {
      classes.push("border-2 border-blue-500");
    }

    if (date.toDateString() === selectedDate.toDateString()) {
      classes.push("bg-blue-500 text-white");
    }

    if (date.getMonth() !== currentMonth) {
      classes.push("text-gray-400");
    }

    return classes.join(" ");
  };

  const getAmountForDate = (date: Date) => {
    const dailyTransactions = getTransactionsForDate(date);
    return dailyTransactions.reduce((total, transaction) => {
      if (transaction.type === "income") return total + transaction.amount;
      if (transaction.type === "expense") return total - transaction.amount;
      return total;
    }, 0);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Previous month days
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevMonth, prevYear);

    for (let i = 0; i < firstDay; i++) {
      const date = new Date(
        prevYear,
        prevMonth,
        daysInPrevMonth - firstDay + i + 1
      );
      days.push(
        <div key={`prev-${i}`} className={getDayClassName(date)}>
          <div className="text-sm">{date.getDate()}</div>
          <div className="text-xs">
            {getAmountForDate(date) !== 0 && (
              <span
                className={
                  getAmountForDate(date) > 0 ? "text-green-500" : "text-red-500"
                }
              >
                {getAmountForDate(date).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      );
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      days.push(
        <div
          key={`current-${i}`}
          className={getDayClassName(date)}
          onClick={() => onDateSelect(date)}
        >
          <div className="text-sm">{i}</div>
          <div className="text-xs">
            {getAmountForDate(date) !== 0 && (
              <span
                className={
                  getAmountForDate(date) > 0 ? "text-green-500" : "text-red-500"
                }
              >
                {getAmountForDate(date).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      );
    }

    // Next month days
    const totalCells = 42; // 6 weeks * 7 days
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    for (let i = 1; i <= totalCells - (firstDay + daysInMonth); i++) {
      const date = new Date(nextYear, nextMonth, i);
      days.push(
        <div key={`next-${i}`} className={getDayClassName(date)}>
          <div className="text-sm">{i}</div>
          <div className="text-xs">
            {getAmountForDate(date) !== 0 && (
              <span
                className={
                  getAmountForDate(date) > 0 ? "text-green-500" : "text-red-500"
                }
              >
                {getAmountForDate(date).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Calendar View</h3>
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekdays.map((day) => (
          <div
            key={day}
            className="text-center font-medium text-sm text-gray-600"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">{renderCalendar()}</div>
    </div>
  );
};

export default CalendarView;
