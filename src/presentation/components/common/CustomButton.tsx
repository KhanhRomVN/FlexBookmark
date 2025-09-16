import React from "react";

interface CustomButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "error"
    | "warning"
    | "success"
    | "loading"
    | "ghost";
  size?: "sm" | "md" | "lg";
  align?: "left" | "center" | "right";
  children: React.ReactNode;
  loading?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  variant = "primary",
  size = "md",
  align = "center",
  children,
  loading = false,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center gap-2 rounded-md font-normal 
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const alignStyles = {
    left: "justify-start text-left",
    center: "justify-center text-center",
    right: "justify-end text-right",
  };

  const sizeStyles = {
    sm: "px-2 py-1 text-xs", // Thu nhỏ từ px-3 py-1.5 text-sm
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const variantStyles = {
    primary: `
      bg-button-bg text-button-bgText border border-button-border
      hover:bg-button-bgHover hover:border-button-borderHover
      focus:ring-blue-500
    `,
    secondary: `
      bg-gray-100 text-gray-700 border border-gray-300
      hover:bg-gray-200 hover:border-gray-400
      dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600
      dark:hover:bg-gray-600 dark:hover:border-gray-500
      focus:ring-gray-500
    `,
    error: `
      bg-red-600 text-white border border-red-600
      hover:bg-red-700 hover:border-red-700
      focus:ring-red-500
    `,
    warning: `
      bg-yellow-500 text-white border border-yellow-500
      hover:bg-yellow-600 hover:border-yellow-600
      focus:ring-yellow-500
    `,
    success: `
      bg-green-600 text-white border border-green-600
      hover:bg-green-700 hover:border-green-700
      focus:ring-green-500
    `,
    loading: `
      bg-gray-400 text-white border border-gray-400
      cursor-not-allowed
    `,
    ghost: `
      text-text-primary font-normal
      hover:bg-sidebar-itemHover
      focus:bg-button-bg focus:text-button-bgText focus:ring-button-bg
      active:bg-button-bg active:text-button-bgText
      border-none
    `,
  };

  // Override size styles for ghost variant - cũng thu nhỏ cho ghost variant
  const ghostSizeStyles = {
    sm: "w-full px-2 py-1 text-xs",
    md: "w-full px-3 py-2 text-base",
    lg: "w-full px-4 py-3 text-lg",
  };

  const LoadingSpinner = () => (
    <svg
      className="animate-spin h-3 w-3" // Thu nhỏ spinner từ h-4 w-4
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  const currentVariant = loading ? "loading" : variant;
  const isDisabled = disabled || loading || variant === "loading";

  return (
    <button
      className={`
        ${baseStyles}
        ${alignStyles[align]}
        ${variant === "ghost" ? ghostSizeStyles[size] : sizeStyles[size]}
        ${variantStyles[currentVariant]}
        ${className}
      `
        .replace(/\s+/g, " ")
        .trim()}
      disabled={isDisabled}
      {...props}
    >
      {(loading || variant === "loading") && <LoadingSpinner />}
      {children}
    </button>
  );
};

export default CustomButton;
