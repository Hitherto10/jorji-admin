export default function Button({ children, onClick, disabled, variant = 'primary', className = '' }) {
  const baseClasses = 'px-4 py-2 text-sm rounded transition-colors font-medium'
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500',
    danger: 'text-red-500 hover:text-red-400 disabled:opacity-40'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
