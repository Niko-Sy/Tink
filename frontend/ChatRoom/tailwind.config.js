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
      borderRadius: {
        'btn': '2.0rem', // 自定义按钮圆角
        'list': '1.4rem', // 自定义列表圆角
      },
      fontSize:{
        'max':'2.6rem', // 42px
        'name':'1.6rem', //32px
        'logo':'1.4rem' // 29px
      }
    },
  },
  plugins: [],
}
