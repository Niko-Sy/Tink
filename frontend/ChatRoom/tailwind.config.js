/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // fontSize: {
    //     sm: '0.875rem', // 14px
    //     base: '1rem', // 16px
    //     lg: '1.125rem', // 18px
    //     xl: '1.25rem', // 20px
    //     '2xl': '1.5rem', // 24px
    //     custom: ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }], // 自定义
    // },
    extend: {
      colors: {
        gray: {
          400: '#A3A3A3', // 只覆盖 gray-400
          500: '#525353', // 只覆盖 gray-500
          600: '#3A3B3B', // 只覆盖 gray-600
          700: '#2A2B2B', // 只覆盖 gray-700
          800: '#1E1F1F', // 只覆盖 gray-800
          900: '#171818', // 覆盖 gray-900
        },
        'ground': '#0E1012',
        'primary': '#171819',
        'secondary': '#1E1F20',
        'grayborder': '#2A2B2B'
      },
      borderRadius: {
        'btn': '2.0rem', // 自定义按钮圆角
        'list': '1.4rem', // 自定义列表圆角
      },
      fontSize:{
        'max':'2.6rem', // 42px
        'name':'1.4rem', //29px
        'logo':'1.4rem' // 29px
      },
    },
  },
  plugins: [],
}
