/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['system-ui', 'sans-serif']
      },
      keyframes: {
        'flash-red': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 2px rgb(239 68 68 / 0.8)' },
          '50%': { opacity: '0.85', boxShadow: '0 0 12px 4px rgb(239 68 68 / 0.6)' }
        }
      },
      animation: {
        'flash-red': 'flash-red 0.5s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
