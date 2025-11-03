import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/react/dist/index.js",
    "./node_modules/@heroui/theme/dist/components/(select|form|listbox|divider|popover|button|ripple|spinner|scroll-shadow|card|image|chip|skeleton).js",
  ],
  darkMode: "class",
  plugins: [
    heroui(),
    // Custom plugin to add brand-primary utility classes
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".bg-brand-primary": {
          "background-color": "#D72323",
        },
        ".text-brand-primary": {
          color: "#D72323",
        },
        ".border-brand-primary": {
          "border-color": "#D72323",
        },
      });
    }),
  ],
};

export default config;
