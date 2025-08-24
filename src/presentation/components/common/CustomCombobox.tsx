import { FC, useMemo, useRef, useState, KeyboardEvent, useEffect } from "react";
import { ChevronDown, Search, X as XIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

type Option = {
  value: string;
  label: string;
};

interface CustomComboboxProps {
  label: string;
  value: string | string[];
  options: Option[];
  onChange: (value: string | string[]) => void;
  className?: string;
  placeholder?: string;
  searchable?: boolean;
  multiple?: boolean;
  creatable?: boolean;
}

const OPTION_INPUT_THRESHOLD = 10;

const CustomCombobox: FC<CustomComboboxProps> = ({
  label,
  value,
  options,
  onChange,
  className,
  placeholder = "Please enter/select your option...",
  searchable,
  multiple = false,
  creatable = false,
}) => {
  const isInput =
    multiple === true
      ? true
      : typeof searchable === "boolean"
      ? searchable
      : options.length >= OPTION_INPUT_THRESHOLD;

  return (
    <ComboboxInput
      label={label}
      value={value}
      options={options}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      multiple={multiple}
      isInput={isInput}
      creatable={creatable}
    />
  );
};

const ComboboxInput: FC<
  Omit<CustomComboboxProps, "searchable"> & { isInput?: boolean }
> = ({
  label,
  value,
  options,
  onChange,
  className,
  placeholder,
  multiple = false,
  creatable = false,
}) => {
  const [input, setInput] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [dynamicOptions, setDynamicOptions] = useState<Option[]>([]);
  const isMulti = !!multiple;
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDrop(false);
        setInput("");
      }
    };

    if (showDrop) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDrop]);

  // Sync dynamicOptions for values from outside (AI, setValue, etc.)
  useEffect(() => {
    if (isMulti && Array.isArray(value)) {
      const missing = value.filter(
        (v) =>
          !options.some((opt) => opt.value === v) &&
          !dynamicOptions.some((opt) => opt.value === v)
      );
      if (missing.length > 0) {
        setDynamicOptions((prev) => [
          ...prev,
          ...missing.map((v) => ({
            value: v,
            label: v.charAt(0).toUpperCase() + v.slice(1),
          })),
        ]);
      }
    }
    if (!isMulti && typeof value === "string" && value) {
      if (
        !options.some((opt) => opt.value === value) &&
        !dynamicOptions.some((opt) => opt.value === value)
      ) {
        setDynamicOptions((prev) => [
          ...prev,
          {
            value,
            label: value.charAt(0).toUpperCase() + value.slice(1),
          },
        ]);
      }
    }
  }, [value, options, dynamicOptions, isMulti]);

  // Merge options
  const allOptions = useMemo(
    () => [
      ...options,
      ...dynamicOptions.filter(
        (opt) => !options.some((o) => o.value === opt.value)
      ),
    ],
    [options, dynamicOptions]
  );

  // Filtered options
  const filteredOpts = useMemo(() => {
    if (isMulti && Array.isArray(value)) {
      return allOptions
        .filter((opt) => !value.includes(opt.value))
        .filter((opt) =>
          input
            ? opt.label.toLowerCase().includes(input.toLowerCase()) ||
              opt.value.toLowerCase().includes(input.toLowerCase())
            : true
        );
    }
    return input
      ? allOptions.filter(
          (opt) =>
            opt.label.toLowerCase().includes(input.toLowerCase()) ||
            opt.value.toLowerCase().includes(input.toLowerCase())
        )
      : allOptions;
  }, [allOptions, input, value, isMulti]);

  // Selected options
  const selectedOpts: Option[] =
    isMulti && Array.isArray(value)
      ? allOptions.filter((o) => value.includes(o.value))
      : typeof value === "string" && value
      ? allOptions.filter((o) => o.value === value)
      : [];

  // Display value logic
  let displayValue: string = input;
  if (isMulti && Array.isArray(value)) {
    // badges handle display, input is just search
  } else if (
    !isMulti &&
    typeof value === "string" &&
    value &&
    allOptions.find((o) => o.value === value)
  ) {
    displayValue =
      input !== "" ? input : allOptions.find((o) => o.value === value)!.label;
  }

  // Dropdown toggles
  const openDropdown = () => {
    setShowDrop(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const closeDropdown = () => {
    setShowDrop(false);
    setInput("");
  };

  const toggleMulti = (val: string) => {
    if (!isMulti) {
      onChange(val);
      setShowDrop(false);
      return;
    }
    const arr = Array.isArray(value) ? value.slice() : [];
    if (arr.includes(val)) {
      onChange(arr.filter((v) => v !== val));
    } else {
      onChange([...arr, val]);
    }
    setInput("");
    setShowDrop(true);
  };

  // Remove badge for multi
  const handleRemoveBadge = (val: string) => {
    if (!isMulti) return;
    const arr = Array.isArray(value) ? value.slice() : [];
    onChange(arr.filter((v) => v !== val));
  };

  // Creatable: when pressing Enter, create new tag
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (
      creatable &&
      e.key === "Enter" &&
      input.trim() !== "" &&
      !allOptions.some(
        (opt) => opt.value.toLowerCase() === input.trim().toLowerCase()
      )
    ) {
      e.preventDefault();
      const newOption: Option = {
        value: input.trim(),
        label: input.trim(),
      };
      setDynamicOptions((prev) => [...prev, newOption]);
      if (isMulti) {
        const curArr = Array.isArray(value) ? value.slice() : [];
        onChange([...curArr, newOption.value]);
      } else {
        onChange(newOption.value);
        setShowDrop(false);
      }
      setInput("");
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}

      {/* Input container */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            value={displayValue}
            placeholder={placeholder}
            className={cn(
              "w-full pl-10 pr-8 py-2 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
            )}
            onChange={(e) => {
              setInput(e.target.value);
              setShowDrop(true);
            }}
            onFocus={() => setShowDrop(true)}
            onKeyDown={handleKeyDown}
          />

          {/* Search Icon */}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

          {/* Chevron/Close Button */}
          {showDrop ? (
            <button
              type="button"
              aria-label="Close menu"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-600"
              tabIndex={0}
              onClick={closeDropdown}
            >
              <XIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Open menu"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-600"
              tabIndex={0}
              onClick={openDropdown}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
            >
              <ChevronDown className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-transform" />
            </button>
          )}
        </div>

        {/* Dropdown Menu - Styled like Header's menu */}
        {showDrop && (
          <div className="absolute left-0 right-0 top-full z-30 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95">
            <div className="max-h-60 overflow-auto py-1">
              {filteredOpts.length === 0 ? (
                <div className="px-3 py-2.5 text-gray-400 dark:text-gray-600 text-sm">
                  No options found
                  {creatable &&
                    input.trim() !== "" &&
                    !allOptions.some(
                      (opt) =>
                        opt.value.toLowerCase() === input.trim().toLowerCase()
                    ) && (
                      <div className="text-blue-500 dark:text-blue-400 mt-1">
                        Press <b>Enter</b> to create "{input.trim()}"
                      </div>
                    )}
                </div>
              ) : (
                filteredOpts.map((opt: Option, index) => (
                  <button
                    key={opt.value}
                    tabIndex={0}
                    className={cn(
                      "w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors text-sm",
                      isMulti && Array.isArray(value)
                        ? value.includes(opt.value)
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        : value === opt.value
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
                      index === 0 ? "rounded-t-lg" : "",
                      index === filteredOpts.length - 1 ? "rounded-b-lg" : ""
                    )}
                    onMouseDown={() => toggleMulti(opt.value)}
                  >
                    {isMulti &&
                      Array.isArray(value) &&
                      value.includes(opt.value) && (
                        <span className="w-3.5 h-3.5 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          ✓
                        </span>
                      )}
                    <span className="flex-1">{opt.label}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Multi-select badges */}
      {isMulti && selectedOpts.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedOpts.map((opt) => (
            <span
              key={opt.value}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-sm px-3 py-1 rounded-md flex items-center gap-1.5 font-medium"
            >
              <span>{opt.label}</span>
              <button
                type="button"
                className="hover:text-red-500 dark:hover:text-red-400 focus:outline-none transition-colors"
                onClick={() => handleRemoveBadge(opt.value)}
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomCombobox;
