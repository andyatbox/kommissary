/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        salmon: '#f78a76',
        brick: '#c2402f',
      },
    },
  },
  plugins: [],
};
