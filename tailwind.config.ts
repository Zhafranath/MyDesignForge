import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F3EFFF',
          100: '#E8E0FF',
          200: '#D4C5FF',
          300: '#C9B8FF',
          400: '#A892FF',
          500: '#8B6FFF',
          600: '#6E4FE0',
        },
        secondary: {
          50: '#FFF0F8',
          100: '#FFE8F3',
          200: '#FFD4E8',
          300: '#FFB8D9',
          400: '#FF8FBD',
          500: '#FF6BA1',
        },
        accent: {
          50: '#F0FFF9',
          100: '#E8FFF5',
          200: '#D4FFE9',
          300: '#B8FFE4',
          400: '#8FFFE1',
        },
        kawaii: {
          yellow: '#FFF3B8',
          peach: '#FFD9B8',
          sky: '#B8E8FF',
          bg: '#FAF8FF',
          muted: '#7B6B9E',
          border: '#E8E0FF',
          text: '#2D2640',
        },
      },
      fontFamily: {
        display: ['var(--font-fredoka)', 'sans-serif'],
        body: ['var(--font-nunito)', 'sans-serif'],
      },
      borderRadius: {
        'kawaii-sm': '12px',
        'kawaii': '20px',
        'kawaii-lg': '28px',
        'kawaii-xl': '40px',
      },
      boxShadow: {
        'kawaii': '0 4px 20px rgba(201, 184, 255, 0.25)',
        'kawaii-hover': '0 8px 32px rgba(201, 184, 255, 0.45)',
        'kawaii-pink': '0 4px 20px rgba(255, 184, 217, 0.3)',
        'kawaii-mint': '0 4px 20px rgba(184, 255, 228, 0.4)',
      },
      animation: {
        'bounce-soft': 'bounce-soft 0.6s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
        'pop-in': 'pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.75)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
