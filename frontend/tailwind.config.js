/** @type {import('tailwindcss').Config} */
export default {
 // Scan these files to extract the CSS classes used
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "../templates/**/*.html",
    "../blog/templates/**/*.html",
    "../accounts/templates/**/*.html",
    "../comments/templates/**/*.html",
    "../oauth/templates/**/*.html",
  ],

  //Dark mode configuration - using the data-theme attribute in conjunction with the dark_mode plugin.
  darkMode: ['selector', '[data-theme="dark"]'],

  theme: {
    extend: {
      // Custom colors, using CSS variables to support dynamic themes
      colors: {
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
        },
      },

      // Z-index Level definition
      zIndex: {
        'modal': '9999',  // Fixed elements such as dark mode buttons
      },

      // Font family
      fontFamily: {
        sans: ['Open Sans', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      },

      // The maximum width of the container is consistent with the existing layout.
      maxWidth: {
        'site': '1040px',
      },

      // animation
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },

  plugins: [
    require('@tailwindcss/typography'),
  ],
};
