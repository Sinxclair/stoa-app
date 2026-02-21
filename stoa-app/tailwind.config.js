/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Epilogue', 'system-ui', 'sans-serif'],
        sans: ['Epilogue', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary:  '#3e2723',
        cream:    '#FAF5EB',
        accent:   '#C2A06E',
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '2rem',
        xl: '3rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
}
