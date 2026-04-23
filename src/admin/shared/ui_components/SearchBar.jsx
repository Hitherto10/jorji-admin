export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200
        placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 w-56"
    />
  )
}
