import type { Config } from "tailwindcss";
import { heroui } from "@heroui/theme";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/react/dist/index.js",
    "./node_modules/@heroui/theme/dist/components/(select|form|listbox|divider|popover|button|ripple|spinner|scroll-shadow).js"
  ],
  theme: {
    extend: {
      borderRadius: {
        'DEFAULT': '0.75rem',  // 12px - ค่า default
        'none': '0',
        'sm': '0.5rem',        // 8px
        'md': '0.75rem',       // 12px
        'lg': '1rem',          // 16px
        'xl': '1.25rem',       // 20px
        '2xl': '1.5rem',       // 24px
        '3xl': '2rem',         // 32px
        'full': '9999px',
      },
    },
  },
  darkMode: "class",
  plugins: [heroui({
    themes: {
      dark: {
        colors: {
          default: {
            DEFAULT: "#27272a",
          },
        },
      },
    },
    layout: {
      // กำหนดขอบมนสำหรับ HeroUI components
      radius: {
        small: "0.5rem",    // 8px
        medium: "0.75rem",  // 12px (default)
        large: "1rem",      // 16px
      },
      borderWidth: {
        small: "1px",
        medium: "1px",
        large: "2px",
      },
    },
  })],
};

export default config;

