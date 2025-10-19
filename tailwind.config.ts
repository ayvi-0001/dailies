import { heroui } from "@heroui/theme";
import line_clamp from "@tailwindcss/line-clamp";
import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  important: true,
  content: ["./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [heroui(), animate, line_clamp],
} satisfies Config;
