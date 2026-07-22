/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#faf8f5',
        ink: '#2a2725',
        muted: '#7b7671',
        accent: '#c65d3b',
        'accent-soft': '#fdf2ee',
        'card-border': '#ede8e3',
      },
      fontFamily: {
        display: ['"Playfair Display"', '"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
