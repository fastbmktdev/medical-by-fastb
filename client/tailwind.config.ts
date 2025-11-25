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
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#A78BFA', // Violet-400 - primary brand color
          secondary: '#00ACC1', // Medical teal - clean and modern
          accent: '#4CAF50', // Medical green - health and wellness
          light: '#EDE9FE', // Violet-100 - soft backgrounds
          dark: '#8B5CF6', // Violet-500 - depth and contrast
        },
        background: {
          primary: '#FFFFFF',
          secondary: '#E8F5E9', // Light green tint - fresh and clean
          elevated: '#EDE9FE', // Violet-100 - elevated surfaces
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite linear",
        spin: "spin 1s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [
    heroui(),
    // Custom plugin to add brand-primary utility classes
    plugin(function ({ addUtilities }: { addUtilities: (utilities: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        ".bg-brand-primary": {
          "background-color": "#A78BFA",
        },
        ".text-brand-primary": {
          color: "#A78BFA",
        },
        ".border-brand-primary": {
          "border-color": "#A78BFA",
        },
      });
    }),
  ],
};

export default config;
