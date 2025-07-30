/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'note-bg': '#ffffff',
        'note-border': '#e1e1e1',
        'text-primary': '#000000',
        'text-secondary': '#555555',
        'sidebar-bg': '#f7f7f7',
        'sidebar-hover': '#e9e9e9',
      },
      width: {
        'sidebar': '280px',
      },
      boxShadow: {
        'note': '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}; 