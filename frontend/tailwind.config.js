/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#F6F4EF',
          2: '#FFFFFF',
          3: '#F5EFE6',
        },
        card:   '#FFFFFF',
        border: '#E5D8C8',
        accent: {
          DEFAULT: '#C4704A',
          2:       '#D4855C',
          muted:   'rgba(196,112,74,0.1)',
        },
        sage:   '#4A6B47',
        teal:   '#4A6B47',
        text: {
          DEFAULT: '#1C1917',
          2:       '#78716C',
          3:       '#A8A29E',
        },
      },
      borderRadius: {
        DEFAULT: '16px',
        sm:      '12px',
        full:    '9999px',
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 2px 16px rgba(0,0,0,0.08)',
        sm:   '0 1px 6px rgba(0,0,0,0.06)',
        md:   '0 4px 20px rgba(0,0,0,0.10)',
      },
      maxWidth: {
        app:   '430px',
        modal: '430px',
      },
      screens: {
        xs: '400px',
      },
    },
  },
  plugins: [],
}
