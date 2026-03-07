/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f7ff",
          100: "#dce8ff",
          500: "#3d70e0",
          700: "#1f4fb7"
        }
      },
      gridTemplateColumns: {
        18: "repeat(18, minmax(0, 1fr))"
      }
    }
  },
  plugins: []
};