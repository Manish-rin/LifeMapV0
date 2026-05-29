/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // Privacy mode colors (used dynamically in EscalationTimer, Notifications, RequestBlood)
    'bg-emerald-50', 'bg-emerald-100', 'bg-emerald-500/20', 'bg-emerald-500/30', 'bg-emerald-600',
    'text-emerald-400', 'text-emerald-600', 'text-emerald-700', 'text-emerald-800',
    'border-emerald-100', 'border-emerald-200', 'border-emerald-500/30',
    'bg-amber-50', 'bg-amber-100', 'bg-amber-500/20', 'bg-amber-500/30',
    'text-amber-400', 'text-amber-600', 'text-amber-700', 'text-amber-800',
    'border-amber-100', 'border-amber-200', 'border-amber-500/30',
    'bg-red-50', 'bg-red-100', 'bg-red-500/20', 'bg-red-500/30', 'bg-red-600',
    'text-red-400', 'text-red-600', 'text-red-700', 'text-red-800',
    'border-red-100', 'border-red-200', 'border-red-500/30',
    'bg-blue-50', 'bg-blue-100', 'bg-blue-600',
    'text-blue-400', 'text-blue-600', 'text-blue-700',
    'border-blue-100', 'border-blue-200', 'border-blue-500/30',
    'bg-gray-50', 'bg-gray-100',
    'text-gray-400', 'text-gray-500', 'text-gray-700',
    'border-gray-100', 'border-gray-500/30',
    // Badge colors
    'bg-orange-50', 'border-orange-100', 'bg-orange-100',
    'bg-purple-50', 'border-purple-100', 'bg-purple-500',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
