/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        // Single Primary Brand Accent Scale
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Primary Action Accent
          700: '#1d4ed8', // Primary Action Hover
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#0f172a',
        },
        // Surfaces, Cards, and Backgrounds
        surface: {
          light: '#ffffff',
          dark: '#0f172a',
          altLight: '#f8fafc',
          altDark: '#020617',
          cardLight: '#ffffff',
          cardDark: '#1e293b',
          hoverLight: '#f1f5f9',
          hoverDark: '#334155',
        },
        // Borders
        border: {
          light: '#e2e8f0',
          dark: '#334155',
          subtleLight: '#f1f5f9',
          subtleDark: '#1e293b',
        },
        // Content Typography
        content: {
          primaryLight: '#0f172a',
          primaryDark: '#f8fafc',
          secondaryLight: '#475569',
          secondaryDark: '#94a3b8',
          mutedLight: '#94a3b8',
          mutedDark: '#64748b',
        },
        // Fixed Semantic State Colors
        status: {
          successBg: '#ecfdf5',
          successText: '#047857',
          successBorder: '#a7f3d0',
          successBgDark: 'rgba(6, 78, 59, 0.4)',
          successTextDark: '#34d399',
          successBorderDark: 'rgba(52, 211, 153, 0.3)',

          warningBg: '#fffbeb',
          warningText: '#b45309',
          warningBorder: '#fde68a',
          warningBgDark: 'rgba(120, 53, 15, 0.4)',
          warningTextDark: '#fbbf24',
          warningBorderDark: 'rgba(251, 191, 36, 0.3)',

          dangerBg: '#fef2f2',
          dangerText: '#b91c1c',
          dangerBorder: '#fecaca',
          dangerBgDark: 'rgba(127, 29, 29, 0.4)',
          dangerTextDark: '#f87171',
          dangerBorderDark: 'rgba(248, 113, 113, 0.3)',

          infoBg: '#f0f9ff',
          infoText: '#0369a1',
          infoBorder: '#bae6fd',
          infoBgDark: 'rgba(12, 74, 110, 0.4)',
          infoTextDark: '#38bdf8',
          infoBorderDark: 'rgba(56, 189, 248, 0.3)',
        },
        // Legacy dark object support for backwards compatibility
        dark: {
          bg: '#020617',
          card: '#0f172a',
          border: '#334155',
          hover: '#1e293b',
          muted: '#64748b',
        }
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
