/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      colors: {
        wayzen: {
          50: '#faf2ff',
          100: '#f3e0ff',
          200: '#e9c2ff',
          300: '#de9eff',
          400: '#d164ff',
          500: '#BF00FF',
          600: '#9f00d4',
          700: '#7f00aa',
          800: '#600080',
          900: '#3e0054',
        },
        brand: {
          black: '#141414',
          midnight: '#272757',
          teal: '#008080',
          magenta: '#FF00FF',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Metrophobic', 'Manrope', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px rgba(16, 24, 40, 0.08)',
      },
      backgroundImage: {
        'wayzen-glow': 'radial-gradient(circle at 10% 10%, rgba(139, 92, 246, 0.18), transparent 42%), radial-gradient(circle at 90% 0%, rgba(124, 58, 237, 0.15), transparent 32%)',
      },
    },
  },
  plugins: [],
};
