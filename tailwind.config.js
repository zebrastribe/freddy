/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./admin/**/*.html",
    "./admin/**/*.js",
    "./v2-frontend/src/**/*",
    "./v2-frontend/index.html",
    "./v2-frontend/test-firebase.html",
    "./index.html",
    "./test-firebase.html"
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
    // Background colors
    "bg-white", "bg-gray-50", "bg-gray-100", "bg-gray-200", "bg-gray-300", "bg-blue-500", "bg-blue-600", "bg-blue-700", "bg-green-500", "bg-green-600", "bg-red-500", "bg-red-600", "bg-indigo-600", "bg-yellow-500", "bg-pink-500",
    // Text colors
    "text-white", "text-gray-900", "text-gray-700", "text-gray-600", "text-blue-700", "text-black",
    // Typography
    "font-bold", "font-medium", "font-semibold", "text-sm", "text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-left", "text-center", "text-right",
    // Layout
    "flex", "flex-col", "flex-row", "grid", "grid-cols-1", "grid-cols-2", "grid-cols-4", "hidden", "block", "inline-block", "inline-flex", "relative", "absolute", "fixed", "sticky", "static",
    // Spacing
    "p-4", "p-6", "p-8", "px-4", "px-6", "px-8", "py-2", "py-3", "py-4", "py-8", "mb-4", "mb-6", "mb-8", "mt-0", "mt-4", "mt-6", "mt-8", "ml-2", "mr-4", "mx-auto", "my-0", "my-4", "my-6", "my-8", "space-x-4", "space-y-2", "space-y-3", "gap-2", "gap-6",
    // Sizing
    "w-full", "w-64", "min-w-full", "min-h-screen", "min-h-full", "min-h-0", "h-full", "h-6", "h-24", "max-w-7xl", "max-w-lg",
    // Borders
    "border", "border-b", "border-r", "border-t", "border-gray-200", "border-gray-300", "border-transparent", "rounded", "rounded-lg", "rounded-md", "rounded-xl", "rounded-full",
    // Shadows
    "shadow", "shadow-sm", "shadow-lg", "shadow-md",
    // Effects
    "opacity-0", "transition", "transition-all", "transition-colors", "transition-shadow", "duration-150", "duration-200", "duration-300",
    // Interactive states
    "hover:bg-gray-50", "hover:bg-gray-100", "hover:bg-blue-600", "hover:bg-green-600", "hover:bg-red-600", "hover:bg-indigo-600", "hover:bg-yellow-600", "hover:bg-pink-600", "hover:text-gray-700", "focus:outline-none", "focus:ring-2", "focus:ring-blue-500", "focus:ring-offset-2", "focus-visible:ring-2", "focus-visible:ring-offset-2",
    // Utilities
    "z-50", "overflow-hidden", "overflow-x-auto", "overflow-y-auto", "cursor-pointer", "whitespace-nowrap", "capitalize", "uppercase", "transform", "translate-x-full",
    // Responsive
    "md:flex", "md:hidden", "lg:px-8", "sm:px-6", "sm:grid-cols-2", "lg:grid-cols-4",
    // Complex selectors
    "last:border-none", "focus:border-transparent"
  ],
  extract: {
    include: ['**/*.{js,jsx,ts,tsx,html}'],
  },
} 