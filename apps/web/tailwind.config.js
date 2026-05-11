import animate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // legacy aliases — keep for backward compat with existing classes
        p1: '#ef4444',
        p2: '#3b82f6',
        // neon accent layer (semantic intent over raw tailwind palette)
        neon: {
          yellow: '#fde047',
          red: '#ff3b54',
          blue: '#3ea0ff',
          green: '#34d399',
          purple: '#a855f7',
        },
        // premium dark surfaces
        surface: {
          base: '#030712',   // alias of gray-950 — current vibe preserved
          raised: '#0b0f1a', // matches index.html loading bg
          elev: '#13131a',
          panel: '#1c1c26',
        },
      },
      fontFamily: {
        display: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        'glow-yellow-sm': '0 0 8px rgba(253, 224, 71, 0.35)',
        'glow-yellow-md': '0 0 16px rgba(253, 224, 71, 0.45)',
        'glow-yellow-lg': '0 0 28px rgba(253, 224, 71, 0.6)',
        'glow-red-sm': '0 0 8px rgba(239, 68, 68, 0.35)',
        'glow-red-md': '0 0 16px rgba(239, 68, 68, 0.45)',
        'glow-red-lg': '0 0 28px rgba(239, 68, 68, 0.6)',
        'glow-blue-sm': '0 0 8px rgba(59, 130, 246, 0.35)',
        'glow-blue-md': '0 0 16px rgba(59, 130, 246, 0.45)',
        'glow-blue-lg': '0 0 28px rgba(59, 130, 246, 0.6)',
      },
      keyframes: {
        'tile-pop': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(0.92)' },
          '100%': { transform: 'scale(1)' },
        },
        'tile-claim-p1': {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(239,68,68,0)' },
          '50%': { transform: 'scale(1.08)', boxShadow: '0 0 22px rgba(239,68,68,0.85)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(239,68,68,0)' },
        },
        'tile-claim-p2': {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(59,130,246,0)' },
          '50%': { transform: 'scale(1.08)', boxShadow: '0 0 22px rgba(59,130,246,0.85)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(59,130,246,0)' },
        },
        'target-reveal': {
          '0%': { transform: 'translateY(-6px) scale(0.85)', opacity: '0', filter: 'blur(4px)' },
          '60%': { transform: 'translateY(0) scale(1.1)', opacity: '1', filter: 'blur(0)' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'score-bump': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.35)', color: '#fde047' },
          '100%': { transform: 'scale(1)' },
        },
        'fade-in-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(253,224,71,0.3)' },
          '50%': { boxShadow: '0 0 22px rgba(253,224,71,0.7)' },
        },
        'stagger-in': {
          '0%': { transform: 'translateY(6px) scale(0.96)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
      },
      animation: {
        'tile-pop': 'tile-pop 200ms ease-out',
        'tile-claim-p1': 'tile-claim-p1 420ms cubic-bezier(0.34,1.56,0.64,1)',
        'tile-claim-p2': 'tile-claim-p2 420ms cubic-bezier(0.34,1.56,0.64,1)',
        'target-reveal': 'target-reveal 380ms cubic-bezier(0.34,1.56,0.64,1)',
        'score-bump': 'score-bump 360ms ease-out',
        'fade-in-up': 'fade-in-up 280ms ease-out',
        'pulse-glow': 'pulse-glow 1.8s ease-in-out infinite',
        'stagger-in': 'stagger-in 320ms ease-out backwards',
      },
    },
  },
  plugins: [animate],
}
