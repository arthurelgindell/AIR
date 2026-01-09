/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background colors - premium dark palette
        'board-bg': '#0a0a0b',
        'board-secondary': '#121215',
        'board-tertiary': '#1a1a1f',
        'board-elevated': '#242428',     // NEW: For elevated cards

        // Gold accent palette
        'gold': '#c9a962',
        'gold-light': '#dbb978',
        'gold-dark': '#a88b4e',
        'gold-glow': 'rgba(201, 169, 98, 0.15)',  // NEW: Subtle glow

        // Director colors - subtle accents
        'director-claude': '#d4a574',
        'director-gemini': '#74b4d4',
        'director-grok': '#d47474',

        // Text - improved contrast
        'text-primary': '#ffffff',
        'text-secondary': '#b0b0b0',     // BRIGHTER (was #a0a0a0)
        'text-muted': '#808080',         // BRIGHTER (was #6b6b6b)
      },
      fontFamily: {
        'heading': ['"Playfair Display"', 'serif'],
        'body': ['"Source Sans Pro"', 'sans-serif'],
        'data': ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        // Premium depth shadows
        'board': '0 4px 12px rgba(0, 0, 0, 0.5)',
        'board-lg': '0 8px 24px rgba(0, 0, 0, 0.6)',
        'board-xl': '0 12px 32px rgba(0, 0, 0, 0.7)',
        'gold-glow': '0 0 20px rgba(201, 169, 98, 0.2)',
        'gold-glow-lg': '0 0 30px rgba(201, 169, 98, 0.3)',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
