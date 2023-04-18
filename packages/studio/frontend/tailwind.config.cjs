/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sinopia: '#dc2f02',
        persimmon: '#e85d04',
        'rich-black': '#03071e',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
