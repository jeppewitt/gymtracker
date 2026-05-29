/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0b",
        surface: "#161618",
        accent: "#22c55e",
      },
    },
  },
  plugins: [],
};
