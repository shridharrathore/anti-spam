/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0b69ff",
        accent: "#1b1b1f",
        success: "#22c55e",
        warning: "#fbbf24"
      }
    }
  },
  plugins: []
};
