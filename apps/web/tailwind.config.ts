import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        helix: {
          bg: '#0a0a0f',
          'bg-alt': '#0f0f17',
          panel: '#13131b',
          border: '#1f1f2b',
          fg: '#e8e8f0',
          'fg-muted': '#8a8aa3',
          accent: '#7c5cff',
          'accent-glow': '#a78bfa',
          warn: '#f59e0b',
          danger: '#ef4444',
          ok: '#22c55e',
        },
      },
      backgroundImage: {
        'helix-grad': 'radial-gradient(ellipse at top, #1f1f2b 0%, #0a0a0f 60%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
