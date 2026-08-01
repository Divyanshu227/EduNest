import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
        },
        gold: {
          50: '#fcf8ee',
          100: '#f7edd3',
          200: '#f1dea9',
          300: '#eac875',
          400: '#e4b146',
          500: '#de9b23',
          600: '#c57c1b',
          700: '#a35d18',
          800: '#854918',
          900: '#6d3c16',
        }
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem'
      },
      boxShadow: {
        glow: '0 0 50px rgba(16, 185, 129, 0.18)'
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at top left, rgba(34,197,94,0.20), transparent 30%), radial-gradient(circle at top right, rgba(14,165,233,0.16), transparent 30%), linear-gradient(135deg, rgba(2,6,23,1) 0%, rgba(15,23,42,1) 100%)'
      }
    }
  },
  plugins: []
};

export default config;