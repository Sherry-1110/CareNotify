/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        calm: {
          50: '#f0f8fc',
          100: '#eaf4fa',
          200: '#d7eaf4',
          300: '#bddaea',
          400: '#8fc2d8',
          500: '#5aa9c9',
          600: '#4a99b9',
          700: '#3e7f99',
          800: '#366b80',
          900: '#2f586a',
        },
        medical: {
          mint: '#f0f8fc',
          soft: '#f7f7f7',
          border: '#ebebeb',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '0.75rem',
        '3xl': '1rem',
      },
      boxShadow: {
        'soft': '0 8px 24px rgba(17, 24, 39, 0.08)',
        'card': '0 2px 12px rgba(17, 24, 39, 0.06)',
        'glass': '0 8px 24px rgba(17, 24, 39, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.55) inset',
        'glass-lg': '0 16px 40px rgba(17, 24, 39, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.62) inset',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #5aa9c9 0%, #4f9dbc 55%, #3e7f99 100%)',
        'gradient-soft': 'linear-gradient(180deg, rgba(247, 247, 247, 0.95) 0%, rgba(248, 250, 251, 0.92) 50%, rgba(240, 248, 252, 0.88) 100%)',
        'gradient-mesh': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(90, 169, 201, 0.16), transparent), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(90, 169, 201, 0.08), transparent), radial-gradient(ellipse 50% 30% at 0% 80%, rgba(234, 244, 250, 0.9), transparent)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
