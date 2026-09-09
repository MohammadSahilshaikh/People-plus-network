/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff', 100: '#dbe6fe', 200: '#bfd4fe', 300: '#93b6fd',
          400: '#5f8ff9', 500: '#3a6bf3', 600: '#2650e6', 700: '#213fd1',
          800: '#2135a8', 900: '#213185',
        },
      },
      borderRadius: { xl: '0.75rem', '2xl': '1rem' },
    },
  },
  plugins: [],
}
