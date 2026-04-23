import { useState } from 'react'

export default function Dropdown({ children, trigger }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-gray-400 hover:text-gray-200 text-lg leading-none"
      >
        ⋮
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-32 bg-gray-800 border border-gray-700 rounded shadow-lg z-20">
            {children}
          </div>
        </>
      )}
    </div>
  )
}
