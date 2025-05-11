/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        interMedium: ["Inter-Medium", "sans-serif"],
        interBold: ["Inter-Bold", "sans-serif"],
        interSemiBold: ["Inter-SemiBold", "sans-serif"],
        interLight: ["Inter-Light", "sans-serif"],
        interExtraLight: ["Inter-ExtraLight", "sans-serif"],
        interThin: ["Inter-Thin", "sans-serif"],
        interExtraBold: ["Inter-ExtraBold", "sans-serif"],
        interBlack: ["Inter-Black", "sans-serif"],
      },
      colors: {
        grayscale: {
          100: "#F5F5F5",
          200: "#ABABAB",
          300: "#999999",
          400: "#5F5F5F",
          500: "#363636",
          600: "#1C1C1C",
          700: "#1B1C1D",
          800: "#161719",
          900: "#000000",
        },
        primary: "#FFC800",
        secondary: "#A162FF",
        success: "#89E219",
        error: "#FF4B4B",
        gestBlue: "#448BEB",
      },
    },
  },
  plugins: [],
};
