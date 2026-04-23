export default function Loading({ message = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
      {message}
    </div>
  )
}
