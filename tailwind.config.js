/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Large displays only. Deliberately ABOVE 1440: that range and below is where the
      // laptops sit (a 1280 or 1440 viewport is the common MacBook case) and is what the
      // rest of the layout is tuned for. Past it you're on an external monitor or a large
      // desktop, where the design has genuine slack to spend on bigger type.
      screens: {
        wide: '1441px',
      },
      colors: {
        navy: '#000666',
        coral: '#ff6666',
        gold: '#ffcf33',
        salmon: '#f78a76',
        brick: '#c2402f',
      },
    },
  },
  plugins: [],
};
