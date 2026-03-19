import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f1720",
        mist: "#eef4f2",
        sand: "#f7f1e8",
        line: "#d6dfda",
        accent: "#0f766e",
        "accent-strong": "#115e59"
      },
      boxShadow: {
        panel: "0 20px 60px rgba(15, 23, 32, 0.08)"
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};

export default config;

