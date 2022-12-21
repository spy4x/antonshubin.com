module.exports = {
  content: ['./dist/**/*.{html,js}'],
  safelist: [
    {
      pattern: /hljs+/,
    },
  ],
  theme: {
    extend: {},
    hljs: {
      theme: 'github-dark',
    },
  },
  plugins: [require('@tailwindcss/aspect-ratio'), require('tailwind-highlightjs')],
};
