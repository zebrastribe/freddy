/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./**/*.html",
    "./**/*.js",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        cat: {
          ginger: '#ff6b35',
          orange: '#ff8c42',
          cream: '#fff8dc',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
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
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
  safelist: [
    // Login form and admin UI essentials
    "bg-white", "bg-gray-50", "bg-gray-100", "bg-gray-200", "bg-blue-600", "bg-blue-700", "text-gray-900", "text-gray-600", "text-white", "text-3xl", "font-extrabold", "font-bold", "rounded-md", "rounded-t-md", "rounded-b-md", "rounded-none", "border", "border-gray-300", "border-transparent", "focus:outline-none", "focus:ring-blue-500", "focus:border-blue-500", "focus:z-10", "sm:text-sm", "w-full", "px-3", "py-2", "mt-6", "mt-2", "mt-8", "space-y-8", "space-y-6", "block", "relative", "flex", "justify-center", "group", "transition", "hover:bg-blue-700", "min-h-screen", "max-w-md", "mx-auto", "py-12", "px-4", "sm:px-6", "lg:px-8", "shadow-sm", "shadow", "appearance-none", "placeholder-gray-500", "text-center", "text-sm", "text-base", "mb-4", "mb-6", "mb-8", "p-4", "p-6", "p-8", "rounded-lg", "rounded", "rounded-xl", "rounded-full", "border-b", "border-t", "border-r", "overflow-hidden", "overflow-x-auto", "overflow-y-auto", "cursor-pointer", "capitalize", "uppercase", "transition-colors", "transition-shadow", "duration-150", "duration-200", "duration-300", "z-50", "inline-block", "inline-flex", "absolute", "fixed", "sticky", "static", "items-center", "items-end", "items-start", "items-stretch", "justify-between", "justify-end", "gap-2", "gap-6", "h-full", "h-6", "h-24", "max-w-7xl", "max-w-lg", "w-64", "min-w-full", "min-h-full", "min-h-0", "my-0", "my-4", "my-6", "my-8", "ml-2", "mr-4", "py-3", "py-4", "py-8", "px-6", "px-8", "mb-4", "mb-6", "mb-8", "mt-0", "mt-4", "mt-6", "mt-8", "space-x-4", "space-y-2", "space-y-3", "grid", "grid-cols-1", "grid-cols-2", "grid-cols-4", "hidden", "focus:ring-2", "focus:ring-offset-2", "focus-visible:ring-2", "focus-visible:ring-offset-2", "last:border-none", "focus:border-transparent"
  ],
} 