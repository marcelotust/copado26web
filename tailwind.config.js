/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      keyframes: {
        floatUp: {
          '0%':   { opacity: '1',   transform: 'translate(-50%, -50%) scale(1.2)' },
          '25%':  { opacity: '1',   transform: 'translate(-50%, -70%) scale(2)'   },
          '100%': { opacity: '0',   transform: 'translate(-50%, -120%) scale(1.4)' }
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(0.88)' },
          '100%': { transform: 'scale(1)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      },
      animation: {
        floatUp: 'floatUp 0.75s cubic-bezier(0.22,1,0.36,1) forwards',
        pop: 'pop 0.2s ease-out',
        shimmer: 'shimmer 1.8s linear infinite'
      }
    }
  },
  plugins: [],
  safelist: [
    'bg-emerald-500', 'bg-sky-500', 'bg-indigo-500', 'bg-amber-500',
    'bg-rose-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500',
    'bg-violet-500', 'bg-fuchsia-500',
    'from-emerald-600', 'from-sky-600', 'from-indigo-600', 'from-amber-600',
    'from-rose-600', 'from-teal-600', 'from-orange-600', 'from-cyan-600',
    'from-violet-600', 'from-fuchsia-600',
    'to-emerald-400', 'to-sky-400', 'to-indigo-400', 'to-amber-400',
    'to-rose-400', 'to-teal-400', 'to-orange-400', 'to-cyan-400',
    'to-violet-400', 'to-fuchsia-400',
    'ring-emerald-400', 'ring-sky-400', 'ring-indigo-400', 'ring-amber-400',
    'ring-rose-400', 'ring-teal-400', 'ring-orange-400', 'ring-cyan-400',
    'ring-violet-400', 'ring-fuchsia-400',
    'text-emerald-300', 'text-sky-300', 'text-indigo-300', 'text-amber-300',
    'text-rose-300', 'text-teal-300', 'text-orange-300', 'text-cyan-300',
    'text-violet-300', 'text-fuchsia-300',
  ]
}
