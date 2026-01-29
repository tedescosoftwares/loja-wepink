/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/react-app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', '"San Francisco"', '-apple-system', 'BlinkMacSystemFont', '"avenir next"', 'avenir', '"helvetica neue"', 'helvetica', 'ubuntu', 'roboto', 'noto', '"segoe ui"', 'arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};