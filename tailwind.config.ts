import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/components/ui/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        figtree: ["Figtree", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "blue-main": "var(--blue-main)",
        "blue-main-20": "var(--blue-main-20)",
        "yellow-main": "var(--yellow-main)",
        "yellow-main-20": "var(--yellow-main-20)",
        "red-main": "var(--red-main)",
        "red-main-20": "var(--red-main-20)",
        "white-main": "var(--white-main)",
        "white-main-20": "var(--white-main-20)",
        "black-main": "var(--black-main)",
        "black-main-20": "var(--black-main-20)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  safelist: [
    "rounded-none",
    "rounded-sm",
    "rounded-md",
    "rounded-lg",
    "rounded-xl",
    "rounded-2xl",
    "rounded-3xl",
    "rounded-full",
  ],
  plugins: [tailwindcssAnimate],
} satisfies Config;
