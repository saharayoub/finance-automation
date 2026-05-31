/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#FAF7F2',
        secondary: '#F0EBE1',
        earth: { dark: '#5C4A3A', mid: '#8B6E52', light: '#C4A882', pale: '#E8D5B7' },
        accent: { DEFAULT: '#A0785A', light: '#D4B896' },
        text: { primary: '#3D2B1F', secondary: '#7A6152', muted: '#B09080' },
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
