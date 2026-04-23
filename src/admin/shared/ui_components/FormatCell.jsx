import { formatCellValue } from '../utils/formatters'

export default function FormatCell({ field, value }) {
  const formatted = formatCellValue(field, value)

  if (field.type === 'boolean') {
    return value
      ? <span className="text-green-400 text-xs font-medium">{formatted}</span>
      : <span className="text-gray-600 text-xs">{formatted}</span>
  }
  if (field.type === 'json' || field.type === 'array') {
    return <span className="text-gray-500 text-xs font-mono">{formatted}</span>
  }
  return <span className="text-gray-300 whitespace-nowrap">{formatted}</span>
}
