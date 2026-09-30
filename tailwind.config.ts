import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101d36",
        paper: "#f5f7fb",
        line: "#e2e8f1",
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af"
        }
      },
      boxShadow: {
        panel: "0 34px 80px -38px rgba(13, 35, 82, 0.34), 0 10px 28px -18px rgba(13, 35, 82, 0.2)",
        soft: "0 18px 38px -24px rgba(13, 35, 82, 0.28)"
      }
    },
  },
  plugins: [],
};

export default config;
