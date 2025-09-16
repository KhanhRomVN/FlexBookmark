import React, { useRef, useEffect, forwardRef } from "react";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

interface CustomTextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  label?: string;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  variant?:
    | "default"
    | "filled"
    | "outlined"
    | "underlined"
    | "floating"
    | "primary";
  size?: "sm" | "md" | "lg";
  showCharCount?: boolean;
  maxLength?: number;
  autoResize?: boolean;
  maxRows?: number;
  minRows?: number;
  onChange?: (value: string) => void;
}

const CustomTextArea = forwardRef<HTMLTextAreaElement, CustomTextAreaProps>(
  (
    {
      label,
      required = false,
      error,
      success,
      hint,
      variant = "default",
      size = "md",
      showCharCount = false,
      maxLength,
      autoResize = true,
      maxRows = 8,
      minRows = 3,
      className = "",
      value = "",
      onChange,
      disabled,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isFocused, setIsFocused] = React.useState(false);

    const hasValue = String(value).length > 0;
    const charCount = String(value).length;

    // Base styles
    const baseTextareaStyles = `
      w-full transition-all duration-200 outline-none resize-none
      disabled:opacity-50 disabled:cursor-not-allowed
      placeholder:text-gray-400 dark:placeholder:text-gray-500
    `;

    // Size styles
    const sizeStyles = {
      sm: "text-sm leading-5",
      md: "text-base leading-6",
      lg: "text-lg leading-7",
    };

    const paddingStyles = {
      sm: "px-3 py-2",
      md: "px-4 py-3",
      lg: "px-5 py-4",
    };

    // Variant styles
    const variantStyles = {
      default: {
        container: "relative",
        textarea: `
          bg-white dark:bg-gray-800 
          border border-gray-300 dark:border-gray-600 
          rounded-lg
          focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
        `,
        label:
          "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",
      },
      filled: {
        container: "relative",
        textarea: `
          bg-gray-50 dark:bg-gray-700 
          border border-transparent 
          rounded-lg
          focus:bg-white dark:focus:bg-gray-800
          focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
        `,
        label:
          "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",
      },
      outlined: {
        container: "relative",
        textarea: `
          bg-transparent 
          border-2 border-gray-300 dark:border-gray-600 
          rounded-lg
          focus:border-blue-500
        `,
        label:
          "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",
      },
      underlined: {
        container: "relative",
        textarea: `
          bg-transparent 
          border-0 border-b-2 border-gray-300 dark:border-gray-600 
          rounded-none
          focus:border-blue-500
        `,
        label:
          "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",
      },
      floating: {
        container: "relative",
        textarea: `
          bg-white dark:bg-gray-800 
          border border-gray-300 dark:border-gray-600 
          rounded-lg pt-6 pb-2
          focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
        `,
        label: `
          absolute left-4 transition-all duration-200 pointer-events-none z-10
          ${
            isFocused || hasValue
              ? "top-2 text-xs text-blue-500 dark:text-blue-400"
              : "top-4 text-base text-gray-400"
          }
        `,
      },
      primary: {
        container: "relative",
        textarea: `
          bg-input-background
          border border-gray-300 dark:border-gray-600 
          rounded-lg
          hover:border-gray-400 dark:hover:border-gray-500
          focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
        `,
        label:
          "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",
      },
    };

    // Status styles
    const getStatusStyles = () => {
      if (error) {
        return {
          border:
            "border-red-500 dark:border-red-400 hover:border-red-600 dark:hover:border-red-300 focus:border-red-500 focus:ring-red-500/20",
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          message: "text-red-600 dark:text-red-400",
        };
      }
      if (success) {
        return {
          border:
            "border-green-500 dark:border-green-400 focus:border-green-500 focus:ring-green-500/20",
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          message: "text-green-600 dark:text-green-400",
        };
      }
      return {
        border: "",
        icon: null,
        message: "text-gray-500 dark:text-gray-400",
      };
    };

    const statusStyles = getStatusStyles();

    // Auto resize functionality
    const adjustHeight = React.useCallback(() => {
      if (!autoResize) return;

      const textarea =
        textareaRef.current ||
        (ref as React.RefObject<HTMLTextAreaElement>)?.current;
      if (!textarea) return;

      // Reset height to measure content
      textarea.style.height = "auto";

      // Calculate line height and max/min heights
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24;
      const minHeight = lineHeight * minRows;
      const maxHeight = lineHeight * maxRows;

      // Set height based on content with constraints
      const contentHeight = textarea.scrollHeight;
      const newHeight = Math.max(minHeight, Math.min(maxHeight, contentHeight));

      textarea.style.height = `${newHeight}px`;

      // Show scrollbar if content exceeds max height
      if (contentHeight > maxHeight) {
        textarea.style.overflowY = "auto";
      } else {
        textarea.style.overflowY = "hidden";
      }
    }, [autoResize, maxRows, minRows]);

    // Auto resize when value changes
    useEffect(() => {
      adjustHeight();
    }, [value, adjustHeight]);

    // Auto resize on mount
    useEffect(() => {
      adjustHeight();
    }, [adjustHeight]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (maxLength && e.target.value.length > maxLength) return;
      onChange?.(e.target.value);
    };

    const handleInput = () => {
      adjustHeight();
    };

    return (
      <div className={variantStyles[variant].container}>
        {/* Label for non-floating variants */}
        {label && variant !== "floating" && (
          <label className={variantStyles[variant].label}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Textarea Container */}
        <div className="relative">
          {/* Floating Label */}
          {label && variant === "floating" && (
            <label className={variantStyles[variant].label}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}

          {/* Textarea */}
          <textarea
            ref={(node) => {
              textareaRef.current = node;
              if (typeof ref === "function") {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }}
            value={value}
            onChange={handleChange}
            onInput={handleInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            rows={autoResize ? minRows : rows}
            className={`
              ${baseTextareaStyles}
              ${sizeStyles[size]}
              ${paddingStyles[size]}
              ${variantStyles[variant].textarea}
              ${statusStyles.border}
              ${className}
            `
              .replace(/\s+/g, " ")
              .trim()}
            {...props}
          />
        </div>

        {/* Bottom Section */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex-1">
            {/* Error Message */}
            {error && (
              <p
                className={`text-sm flex items-center gap-1 ${statusStyles.message}`}
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}

            {/* Success Message */}
            {success && !error && (
              <p
                className={`text-sm flex items-center gap-1 ${statusStyles.message}`}
              >
                <CheckCircle className="w-4 h-4" />
                {success}
              </p>
            )}

            {/* Hint Message */}
            {hint && !error && !success && (
              <p
                className={`text-sm flex items-center gap-1 ${statusStyles.message}`}
              >
                <Info className="w-4 h-4" />
                {hint}
              </p>
            )}
          </div>

          {/* Character Count */}
          {showCharCount && maxLength && (
            <span
              className={`text-sm ml-2 ${
                charCount > maxLength * 0.9
                  ? "text-red-500"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

CustomTextArea.displayName = "CustomTextArea";

export default CustomTextArea;
