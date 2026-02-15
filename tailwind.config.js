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
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fb',
          400: '#36aaf5',
          500: '#0c8ee6',
          600: '#0070c4',
          700: '#01599f',
          800: '#064c83',
          900: '#0b406d',
        },
        medical: {
          mint: '#e8f5f0',
          soft: '#f8fafc',
          border: '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(12, 142, 230, 0.08)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.04)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.5) inset',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.6) inset',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0c8ee6 0%, #0070c4 50%, #01599f 100%)',
        'gradient-soft': 'linear-gradient(180deg, rgba(240, 247, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 50%, rgba(232, 245, 240, 0.85) 100%)',
        'gradient-mesh': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(12, 142, 230, 0.15), transparent), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(0, 112, 196, 0.08), transparent), radial-gradient(ellipse 50% 30% at 0% 80%, rgba(54, 170, 245, 0.1), transparent)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
