/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
    screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        /* Base colors */
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          hover: "var(--primary-hover)",
        },
        
        /* Background colors */
        background: {
          primary: "var(--background-primary)",
          secondary: "var(--background-secondary)",
          tertiary: "var(--background-tertiary)",
        },
        
        /* Text colors - Enhanced */
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          disabled: "var(--text-disabled)",
          success: "var(--text-success)",
          warning: "var(--text-warning)",
          error: "var(--text-error)",
          info: "var(--text-info)",
        },
        
        /* Border colors - Enhanced */
        border: {
          DEFAULT: "var(--border-primary)",
          secondary: "var(--border-secondary)",
          focus: "var(--border-focus)",
          error: "var(--border-error)",
          success: "var(--border-success)",
        },
        
        /* Card colors - Enhanced */
        card: {
          background: "var(--card-background)",
          header: "var(--card-header)",
          footer: "var(--card-footer)",
          border: "var(--card-border)",
          hover: "var(--card-hover)",
          shadow: "var(--card-shadow)",
          selected: "var(--card-selected)",
        },
        
        /* Input colors - Enhanced */
        input: {
          background: "var(--input-background)",
          border: "var(--input-border)",
          text: "var(--input-text)",
          placeholder: "var(--input-placeholder)",
          focus: "var(--input-focus)",
          "disabled-bg": "var(--input-disabled-bg)",
          "disabled-text": "var(--input-disabled-text)",
          error: "var(--input-error)",
          success: "var(--input-success)",
        },
        
        /* Button colors - Enhanced */
        button: {
          primary: "var(--button-primary)",
          "primary-hover": "var(--button-primary-hover)",
          secondary: "var(--button-secondary)", 
          "secondary-hover": "var(--button-secondary-hover)",
          disabled: "var(--button-disabled)",
          "disabled-text": "var(--button-disabled-text)",
          danger: "var(--button-danger)",
          "danger-hover": "var(--button-danger-hover)",
          success: "var(--button-success)",
          "success-hover": "var(--button-success-hover)",
        },
        
        /* Dialog colors - New */
        dialog: {
          background: "var(--dialog-background)",
          border: "var(--dialog-border)",
          shadow: "var(--dialog-shadow)",
          overlay: "var(--dialog-overlay)",
          header: "var(--dialog-header)",
          footer: "var(--dialog-footer)",
        },

        /* Dropdown colors - New */
        dropdown: {
          background: "var(--dropdown-background)",
          border: "var(--dropdown-border)",
          shadow: "var(--dropdown-shadow)",
          hover: "var(--dropdown-hover)",
          selected: "var(--dropdown-selected)",
        },

        /* Toast colors - New */
        toast: {
          background: "var(--toast-background)",
          border: "var(--toast-border)",
          shadow: "var(--toast-shadow)",
          success: "var(--toast-success)",
          error: "var(--toast-error)",
          warning: "var(--toast-warning)",
          info: "var(--toast-info)",
        },

        /* Table colors - New */
        table: {
          "header-bg": "var(--table-header-bg)",
          "header-text": "var(--table-header-text)",
          "header-border": "var(--table-header-border)",
          "row-bg": "var(--table-row-bg)",
          "row-alt-bg": "var(--table-row-alt-bg)",
          "row-hover": "var(--table-row-hover)",
          "cell-border": "var(--table-cell-border)",
          "footer-bg": "var(--table-footer-bg)",
          "footer-text": "var(--table-footer-text)",
          selected: "var(--table-selected)",
        },

        /* Tooltip colors - New */
        tooltip: {
          background: "var(--tooltip-background)",
          text: "var(--tooltip-text)",
          arrow: "var(--tooltip-arrow)",
        },
      },
      keyframes: {
        shimmer: {
          '100%': {
            transform: 'translateX(0)',
          },
          '0%': {
            transform: 'translateX(-100%)',
          },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-position': '0% 50%',
          },
          '50%': {
            'background-position': '100% 50%',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-5px)',
          },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};