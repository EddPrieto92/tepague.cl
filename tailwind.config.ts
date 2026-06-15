import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#151515",
        paper: "#fffaf0",
        limewash: "#d6ff69",
        tomato: "#ff5f4a",
        aqua: "#1fb6aa",
        plum: "#6b4eff",
      },
      boxShadow: {
        soft: "0 20px 50px rgba(21, 21, 21, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
