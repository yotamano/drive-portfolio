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
        'text-primary': '#111111',
        'text-secondary': '#888888',
        'sidebar-bg': '#f7f7f7',
        'sidebar-hover': '#e9e9e9',
      },
      fontSize: {
        'paragraph': '20px',
        'title': '50px',
      },
      letterSpacing: {
        'title': '-2.1px',
      },
      lineHeight: {
        'paragraph': '1.5',
        'title': '1.2',
      },
      maxWidth: {
        'text': '600px',
      },
      width: {
        'sidebar': '280px',
      },
      boxShadow: {
        'note': '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}; 