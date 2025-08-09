/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        background: "var(--background)",
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
        },
        card: {
          background: "var(--card-background)",
          border: "var(--card-border)",
          hover: "var(--card-hover)",
          shadow: "var(--card-shadow)",
          focus: "var(--card-focus)",
        },
        input: {
          background: "var(--input-background)",
          border: "var(--input-border)",
          text: "var(--input-text)",
          placeholder: "var(--input-placeholder)",
        },
        dialog: {
          background: "var(--dialog-background)",
          border: "var(--dialog-border)",
          shadow: "var(--dialog-shadow)",
        },
        dropdown: {
          background: "var(--dropdown-background)",
          border: "var(--dropdown-border)",
          shadow: "var(--dropdown-shadow)",
          hover: "var(--dropdown-hover)",
          focus: "var(--dropdown-focus)",
        },
        sidebar: {
          background: "var(--sidebar-background)",
          border: "var(--sidebar-border)",
          hover: "var(--sidebar-hover)",
          focus: "var(--sidebar-focus)",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
