import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#FBF8F3",
        burgundy: {
          50: '#fdf2f4',
          100: '#fbe5e8',
          200: '#f7ced4',
          300: '#f0aab5',
          600: '#8b263e',
          700: '#751d32',
          800: '#621a2c',
        },
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      boxShadow: {
        'editorial': '0 20px 50px -10px rgba(0, 0, 0, 0.08), 0 10px 20px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
export default config;
