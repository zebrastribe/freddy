/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*",
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
    "min-h-screen", "bg-gradient-to-br", "from-blue-50", "to-white", "py-12", "px-4",
    "max-w-4xl", "mx-auto", "text-center", "mb-12", "text-5xl", "font-bold", "text-gray-900", "mb-4",
    "text-xl", "text-gray-600", "grid", "grid-cols-1", "md:grid-cols-2", "lg:grid-cols-3", "gap-6", "mb-8",
    "bg-white", "rounded-lg", "shadow-lg", "p-6", "hover:shadow-xl", "transition-shadow", "text-3xl", "mb-4",
    "text-xl", "font-semibold", "text-gray-900", "mb-2", "text-gray-600", "mb-4", "bg-blue-500", "hover:bg-blue-600",
    "text-white", "font-semibold", "py-2", "px-4", "rounded-lg", "transition-colors", "bg-green-500", "hover:bg-green-600",
    "bg-purple-500", "hover:bg-purple-600", "bg-orange-500", "hover:bg-orange-600", "bg-pink-500", "hover:bg-pink-600",
    "bg-red-500", "hover:bg-red-600", "text-gray-500"
  ],
  extract: {
    include: [
      './src/**/*.{js,jsx,ts,tsx,html}',
      './index.html',
      './test-firebase.html'
    ],
  },
} 