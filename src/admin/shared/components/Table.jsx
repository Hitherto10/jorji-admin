import FormatCell from './FormatCell'

export default function Table({ columns, rows, renderRow, expandedRow, onRowClick, actions, showCheckbox = false, selectedRows = [], onSelectionChange, onSort }) {
  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-800">
            {showCheckbox && <th className="px-4 py-2.5 text-xs text-gray-500 font-medium uppercase tracking-wide">Select</th>}
            {columns.map(f => (
              <th key={f.key} className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">
                <button
                  onClick={() => onSort && onSort(f.key)}
                  className="hover:text-gray-300 transition-colors"
                >
                  {f.label} {onSort ? '↕' : ''}
                </button>
              </th>
            ))}
            {actions && <th className="px-4 py-2.5 text-right text-xs text-gray-500 font-medium uppercase tracking-wide">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => renderRow ? renderRow(row, i) : (
            <tr
              key={row.id || i}
              className={`border-b border-gray-800/60 hover:bg-gray-800/40 cursor-pointer transition-colors ${
                expandedRow === (row.id || i) ? 'bg-gray-800/60' : ''
              }`}
              onClick={() => onRowClick && onRowClick(row, i)}
            >
              {showCheckbox && (
                <td className="px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(row.id || i)}
                    onChange={(e) => onSelectionChange && onSelectionChange(row, e.target.checked)}
                  />
                </td>
              )}
              {columns.map(f => (
                <td key={f.key} className="px-4 py-2.5 text-gray-300 whitespace-nowrap">
                  <FormatCell field={f} value={row[f.key]} />
                </td>
              ))}
              {actions && (
                <td className="px-4 py-2.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
