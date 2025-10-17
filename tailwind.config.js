import { heroui } from "@heroui/theme";
import tailwindScrollbar from "tailwind-scrollbar";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/react/dist/index.js",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [heroui(), tailwindScrollbar],
};

export default config;
