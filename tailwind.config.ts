import { heroui } from "@heroui/theme";
import lineClamp from "@tailwindcss/line-clamp";
import scrollbarHide from "tailwind-scrollbar-hide";
import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  important: true,
  content: ["./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
      },
    },
  },
  darkMode: "class",
  plugins: [heroui(), animate, lineClamp, scrollbarHide],
} satisfies Config;
