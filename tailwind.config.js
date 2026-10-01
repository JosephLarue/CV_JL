/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0c0813',
        panel: '#171221',
        accent: '#38bdf8',
        accent2: '#ff6ec7',
        neon: '#ff6ec7',
      },
      boxShadow: {
        neon: '0 0 24px rgba(255,110,199,0.3)',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
