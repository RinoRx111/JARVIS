/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        jarvis: {
          blue: '#00f0ff',
          darkBlue: '#001a2e',
          neonGreen: '#39ff14',
          glowBg: '#020b14',
          panel: 'rgba(10, 25, 47, 0.7)'
        }
      },
      boxShadow: {
        'neon-blue': '0 0 15px rgba(0, 240, 255, 0.4)',
        'neon-green': '0 0 15px rgba(57, 255, 20, 0.4)'
      }
    },
  },
  plugins: [],
};
