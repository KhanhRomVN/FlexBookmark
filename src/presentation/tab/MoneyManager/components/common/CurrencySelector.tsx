import React from "react";
import { CURRENCIES } from "../../constants/constants";

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  className?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onCurrencyChange,
  className = "",
}) => {
  return (
    <select
      value={selectedCurrency}
      onChange={(e) => onCurrencyChange(e.target.value)}
      className={`border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
    >
      {Object.entries(CURRENCIES).map(([key, value]) => (
        <option key={key} value={value}>
          {value} - {key}
        </option>
      ))}
    </select>
  );
};
