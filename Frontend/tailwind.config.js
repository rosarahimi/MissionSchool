/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#4ECDC4',
          secondary: '#FF6B6B',
          dark: '#0F172A',
          card: 'rgba(255, 255, 255, 0.05)',
        }
      },
      fontFamily: {
        vazir: ['Vazirmatn', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
