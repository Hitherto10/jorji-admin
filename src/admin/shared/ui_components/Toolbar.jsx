import SearchBar from './SearchBar'
import Button from './Button'

export default function Toolbar({ title, total, search, onSearchChange, onNew, onRefresh, canCreate }) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-800">
      <div className="flex items-center gap-3">
        <span className="text-white font-semibold text-base">{title}</span>
        <span className="text-gray-500 text-sm">{total.toLocaleString()} rows</span>
      </div>
      <div className="flex items-center gap-3">
        <SearchBar
          value={search}
          onChange={onSearchChange}
          placeholder={`Search…`}
        />
        {canCreate && (
          <Button onClick={onNew}>
            + New
          </Button>
        )}
        <Button onClick={onRefresh} variant="secondary">
          ↻ Refresh
        </Button>
      </div>
    </div>
  )
}
