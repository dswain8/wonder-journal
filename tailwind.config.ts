import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        honey: {
          50: '#fffaf0',
          100: '#fff1c6',
          200: '#ffe08d',
          300: '#ffc85f',
          400: '#f7a93b',
          500: '#eb8d26',
          600: '#cf6e1c',
          700: '#a8511a',
          800: '#833f1b',
          900: '#6b361b',
        },
        midnight: {
          700: '#21324d',
          800: '#1a2a42',
          900: '#122033',
        },
        paper: '#fff8ef',
        blush: '#f4c6ab',
        sage: '#91b7a0',
        skywash: '#f6fbff',
        storyink: '#2d2a26',
      },
      boxShadow: {
        glow: '0 24px 60px rgba(235, 141, 38, 0.16)',
        panel: '0 22px 60px rgba(26, 42, 66, 0.12)',
        lift: '0 14px 35px rgba(26, 42, 66, 0.14)',
      },
      backgroundImage: {
        'paper-glow':
          'radial-gradient(circle at top, rgba(255, 244, 207, 0.95), rgba(255, 251, 235, 0.75) 42%, rgba(246, 251, 255, 0.92) 100%)',
        'sky-story':
          'radial-gradient(circle at 20% 20%, rgba(255, 214, 123, 0.26), transparent 26%), radial-gradient(circle at 80% 10%, rgba(255, 255, 255, 0.18), transparent 18%), linear-gradient(135deg, #16253c 0%, #223755 45%, #3f5877 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
