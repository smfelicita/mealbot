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
        sage:   '#5C7A59',
        teal:   '#5C7A59',
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
        sans:  ['Nunito', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '1.3' }],
      },
      boxShadow: {
        card:   '0 2px 16px rgba(0,0,0,0.08)',
        sm:     '0 1px 6px rgba(0,0,0,0.06)',
        md:     '0 4px 20px rgba(0,0,0,0.10)',
        accent: '0 4px 16px rgba(196,112,74,0.35)',
        sage:   '0 1px 6px rgba(92,122,89,0.3)',
        top:    '0 -4px 24px rgba(0,0,0,0.12)',
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
