export default function Modal({ isOpen = true, onClose, children, title, className = '' }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 overflow-y-auto py-8">
      <div className={`bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl mx-4 shadow-2xl ${className}`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
            <h2 className="text-white font-semibold text-base">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
