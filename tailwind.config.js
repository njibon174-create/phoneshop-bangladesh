/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Apple-inspired White Minimal Palette
        'brand-white': '#FFFFFF',
        'brand-offwhite': '#F5F5F7',
        'brand-grey': '#86868B',
        'brand-dark': '#1D1D1F',
        'brand-accent': '#0066CC', // Classic Apple Blue
        
        // Semantic Tokens
        'bg-main': '#FFFFFF',
        'bg-secondary': '#F5F5F7',
        'text-main': '#1D1D1F',
        'text-sec': '#86868B',
        'text-muted': '#A1A1A6',
        'border-main': '#D2D2D7',
        'border-light': '#E5E5E7',
        
        'success': '#28CD41',
        'danger': '#FF3B30',
        'warning': '#FF9500',
        'info': '#007AFF',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'apple': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'apple-hover': '0 8px 30px rgba(0, 0, 0, 0.12)',
      }
    },
  },
  plugins: [],
}
