export default function ErrorMessage({ error }) {
  if (!error) return null
  return (
    <div className="mx-6 mt-3 px-4 py-2 bg-red-900/40 border border-red-700 rounded text-red-300 text-sm">
      Error: {error}
    </div>
  )
}
