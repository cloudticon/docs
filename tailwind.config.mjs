import starlightPlugin from "@astrojs/starlight-tailwind";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        accent: {
          200: "#99f6e4",
          600: "#0d9488",
          900: "#083344",
          950: "#042f2e",
        },
        gray: {
          100: "#f4f6f7",
          200: "#e4e8eb",
          300: "#b4bcc2",
          400: "#7b8a94",
          500: "#47555e",
          700: "#283840",
          800: "#18272e",
          900: "#111b21",
        },
      },
    },
  },
  plugins: [starlightPlugin()],
};
