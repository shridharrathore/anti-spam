/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Manrope", "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 16px 40px -24px rgba(60, 115, 255, 0.45)",
        shell: "0 20px 45px -30px rgba(15, 34, 64, 0.75)"
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(circle at 20% 20%, rgba(60,115,255,0.22) 0, transparent 55%), radial-gradient(circle at 80% 0%, rgba(24,221,255,0.18) 0, transparent 50%)",
        "surface-grid": "linear-gradient(180deg, rgba(17,24,39,0.9) 0%, rgba(7,12,22,0.9) 100%)"
      },
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81"
        },
        teal: {
          500: "#2dd4bf"
        },
        amber: {
          500: "#f59e0b"
        },
        surface: {
          950: "#05070f",
          900: "#070b1a",
          800: "#0d1323",
          700: "#151d2f",
          600: "#1e293b"
        }
      }
    }
  },
  plugins: []
};
