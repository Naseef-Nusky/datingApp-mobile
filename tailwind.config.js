/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nex-orange': '#FF6B35',
        'nex-pink': '#FF1493',
        'nex-blue': '#0B1220', // Dark background (RGB: 11, 18, 32)
        'nex-dark': '#0d1440',
        'vantage-purple': '#5A2D8A', // Vantage logo theme
      },
      backgroundImage: {
        'gradient-nex': 'linear-gradient(to right, #FF6B35, #FF1493)',
        'gradient-nex-vertical': 'linear-gradient(to bottom, #FF6B35, #FF1493)',
        /* Vantage logo theme: purple → magenta → coral */
        'gradient-vantage': 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)',
      },
    },
  },
  plugins: [],
}

