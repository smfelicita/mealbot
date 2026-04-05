/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#faf7f2',
          2: '#f2ede4',
          3: '#e8e0d4',
        },
        card: '#ffffff',
        border: 'rgba(0,0,0,0.09)',
        accent: {
          DEFAULT: '#b5813a',
          2: '#d4a855',
          muted: 'rgba(181,129,58,0.1)',
        },
        teal: '#5a9e8a',
        purple: '#9a7ec8',
        text: {
          DEFAULT: '#2a2018',
          2: '#7a6a54',
          3: '#a89880',
        },
      },
      borderRadius: {
        DEFAULT: '14px',
        sm: '8px',
        full: '9999px',
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
        serif: ['Nunito', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.12)',
      },
      maxWidth: {
        'app': '760px',
        'modal': '600px',
      },
      screens: {
        'xs': '400px',
      },
    },
  },
  plugins: [],
}
