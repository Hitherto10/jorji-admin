import Button from './Button'

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-800 text-sm">
      <span className="text-gray-500">
        Page {page + 1} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          variant="secondary"
        >
          ← Prev
        </Button>
        <Button
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          variant="secondary"
        >
          Next →
        </Button>
      </div>
    </div>
  )
}
