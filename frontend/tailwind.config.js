/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saarthi: {
          blue: '#1E40AF',
          navy: '#0F172A',
          teal: '#0D9488',
          gold: '#F59E0B',
          danger: '#DC2626',
          warning: '#D97706',
          safe: '#16A34A'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
