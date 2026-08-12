/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // PhoneLedger-aligned palette
        'neon-green': '#00FF88',
        'neon-blue': '#00D4FF',
        'dark-bg': '#0A0E1A',
        'sec-bg': '#111827',
        'card-bg': '#111827',
        'elev-bg': '#1E2A3A',
        'card-light': '#1E2A3A',
        'border': '#1E3A5F',
        'main-text': '#F0F8FF',
        'sec-text': '#7EB8DA',
        'muted-text': '#4A7A9B',
        // Semantic aliases
        'success': '#39FF88',
        'danger': '#F87171',
        'warning': '#FBBF24',
        'info': '#60A5FA',
        // Backward-compatible aliases (used by existing components)
        'background': '#0A0E1A',
        'surface': '#111827',
        'surfaceElevated': '#1E2A3A',
        'borderHover': '#34557A',
        'text': '#F0F8FF',
        'textMuted': '#7EB8DA',
        'textSubtle': '#4A7A9B',
        'accent': '#00FF88',
        'accentHover': '#00D4FF',
      },
      textColor: {
        success: '#39FF88',
        danger: '#F87171',
        warning: '#FBBF24',
        info: '#60A5FA',
        'neon-green': '#00FF88',
        'neon-blue': '#00D4FF',
      },
      backgroundColor: {
        success: '#39FF8820',
        danger: '#F8717120',
        warning: '#FBBF2420',
        info: '#60A5FA20',
      },
      borderColor: {
        success: '#39FF8850',
        danger: '#F8717150',
        warning: '#FBBF2450',
        info: '#60A5FA50',
      },
      boxShadow: {
        'neon-green': '0 0 12px #00FF8866, 0 0 24px #00FF8833',
        'neon-blue': '0 0 12px #00D4FF66, 0 0 24px #00D4FF33',
        'card': '0 1px 3px 0 rgba(0,0,0,0.4)',
        'card-hover': '0 10px 30px -5px rgba(0,0,0,0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 12px #00FF8866, 0 0 24px #00FF8833' },
          '50%': { boxShadow: '0 0 24px #00FF88aa, 0 0 48px #00FF8866' },
        },
      },
    },
  },
  plugins: [],
}
