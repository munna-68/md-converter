import type { Config } from "tailwindcss"

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'Newsreader'", "Georgia", "serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        ink: "#e6dfd3",
        "ink-muted": "#a39b8f",
        "ink-dim": "#6b6459",
        paper: "#171614",
        "paper-light": "#1f1d1b",
        "paper-lighter": "#252321",
        border: {
          DEFAULT: "#2e2b28",
          hover: "#4a453d",
        },
        accent: {
          DEFAULT: "#c9a96e",
          hover: "#d4b87a",
          dim: "#8c7243",
        },
      },
    },
  },
  plugins: [],
} satisfies Config
