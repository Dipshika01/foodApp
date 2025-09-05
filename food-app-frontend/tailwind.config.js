/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6793c0",
        accentPurple: "#553790",
        accentPink: "#727298",
      },
    },
  },//bg-gradient-to-b from-[#6793c0] via-[#553790] to-[#727298]
  plugins: [],
}
