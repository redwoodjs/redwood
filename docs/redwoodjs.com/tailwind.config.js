/* See https://tailwindcss.com/docs/configuration for more options */

module.exports = {
  theme: {
    extend: {
      colors: {
        red: {
          '100': '#FDF8F6',
          '200': '#FAEAE5',
          '300': '#F3C7BA',
          '400': '#EBA48E',
          '500': '#E38163',
          '600': '#DC5E38',
          '700': '#BF4722',
          '800': '#682712',
          '900': '#341309',
        },
      },
      fontFamily: {
        sans: ['Open Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Fira Code', 'Fira Mono', 'Menlo', 'Monoco', 'monospace'],
      },
      spacing: {
        half: '0.125rem',
        '22': '5.5rem',
        '9/16': '56.25%',
      },
    },
  },
  variants: {},
  plugins: [],
}
