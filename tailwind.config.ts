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
        "yellow-main": "var(--yellow-main)",
        "red-main": "var(--red-main)",
        "white-main": "var(--white-main)",
        "black-main": "var(--black-main)",
        "blue-main-10": "var(--blue-main-10)",
        "yellow-main-10": "var(--yellow-main-10)",
        "red-main-10": "var(--red-main-10)",
        "white-main-10": "var(--white-main-10)",
        "black-main-10": "var(--black-main-10)",
        muted: "var(--muted)",
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
    "bg-blue-main",
    "bg-yellow-main",
    "bg-red-main",
    "bg-white-main",
    "bg-black-main",
    "bg-blue-main-10",
    "bg-yellow-main-10",
    "bg-red-main-10",
    "bg-white-main-10",
    "bg-black-main-10",
    "bg-muted",
  ],
  plugins: [tailwindcssAnimate],
} satisfies Config;
