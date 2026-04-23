import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import RecordModal from './RecordModal'

const PAGE_SIZE = 50

export default function TableView({ tableKey, tableDef, filter = {} }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [modal, setModal] = useState(null)   // null | 'create' | record object
  const [deleting, setDeleting] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)

  // Columns to show in the table (first 5 non-readonly fields + display field)
  const tableColumns = tableDef.fields
    .filter(f => !f.hidden)
    .slice(0, 6)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from(tableKey)
      .select('*', { count: 'exact' })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    // Simple search on the display field if it's a text column
    if (search && tableDef.displayField) {
      const displayFieldDef = tableDef.fields.find(f => f.key === tableDef.displayField)
      if (displayFieldDef?.type === 'text') {
        query = query.ilike(tableDef.displayField, `%${search}%`)
      }
    }

    // Apply additional filters if any
    Object.entries(filter).forEach(([key, value]) => {
      if (value) {
        query = query.eq(key, value)
      }
    })

    const { data, error: err, count } = await query
    setLoading(false)

    if (err) {
      setError(err.message)
    } else {
      setRows(data || [])
      setTotal(count || 0)
    }
  }, [tableKey, page, search, filter])

  useEffect(() => {
    setPage(0)
    setExpandedRow(null)
  }, [tableKey])

  useEffect(() => { load() }, [load])

  const handleDelete = async (row) => {
    if (!confirm(`Delete this ${tableDef.label} record? This cannot be undone.`)) return
    setDeleting(row[tableDef.primaryKey])

    const { error: err } = await supabase
      .from(tableKey)
      .delete()
      .eq(tableDef.primaryKey, row[tableDef.primaryKey])

    setDeleting(null)
    if (err) alert(`Delete failed: ${err.message}`)
    else load()
  }

  const formatCell = (field, value) => {
    if (value === null || value === undefined) return <span className="text-gray-600">—</span>
    if (field.type === 'boolean') return value
      ? <span className="text-green-400 text-xs font-medium">YES</span>
      : <span className="text-gray-600 text-xs">NO</span>
    if (field.type === 'datetime') return new Date(value).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
    if (field.type === 'json' || field.type === 'array') return (
      <span className="text-gray-500 text-xs font-mono">{JSON.stringify(value).slice(0, 40)}…</span>
    )
    if (typeof value === 'string' && value.length > 50) return value + '\n'
    return String(value)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="flex flex-col h-full">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-base">{tableDef.label}</span>
          <span className="text-gray-500 text-sm">{total.toLocaleString()} rows</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder={`Search ${tableDef.displayField || ''}…`}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200
              placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 w-56"
          />
          {tableDef.primaryKey && (
            <button
              onClick={() => setModal('create')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-1.5 rounded
                transition-colors font-medium"
            >
              + New
            </button>
          )}
          <button
            onClick={load}
            className="text-gray-500 hover:text-gray-200 text-sm px-3 py-1.5 rounded
              border border-gray-700 hover:border-gray-500 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-3 px-4 py-2 bg-red-900/40 border border-red-700 rounded text-red-300 text-sm">
          Error: {error}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-600 text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-600 text-sm">No records found</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-800">
                {tableColumns.map(f => (
                  <th key={f.key} className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">
                    {f.label}
                  </th>
                ))}
                <th className="px-4 py-2.5 text-right text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const pk = tableDef.primaryKey
                const rowKey = pk ? row[pk] : i
                const isExpanded = expandedRow === rowKey

                return (
                  <>
                    <tr
                      key={rowKey}
                      className={`border-b border-gray-800/60 hover:bg-gray-800/40 cursor-pointer transition-colors ${
                        isExpanded ? 'bg-gray-800/60' : ''
                      }`}
                      onClick={() => setExpandedRow(isExpanded ? null : rowKey)}
                    >
                      {tableColumns.map(f => (
                        <td key={f.key} className="px-4 py-2.5 text-gray-300 whitespace-nowrap max-w-60 overflow-hidden">
                          {formatCell(f, row[f.key])}
                        </td>
                      ))}
                      <td className="px-4 py-2.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setModal(row)}
                          className="text-indigo-400 hover:text-indigo-300 text-xs mr-3 transition-colors"
                        >
                          Edit
                        </button>
                        {pk && (
                          <button
                            onClick={() => handleDelete(row)}
                            disabled={deleting === row[pk]}
                            className="text-red-500 hover:text-red-400 text-xs transition-colors disabled:opacity-40"
                          >
                            {deleting === row[pk] ? '…' : 'Delete'}
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded row — shows all fields */}
                    {isExpanded && (
                      <tr key={`${rowKey}-expanded`} className="bg-gray-800/30">
                        <td colSpan={tableColumns.length + 1} className="px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {tableDef.fields.filter(f => !f.hidden).map(f => (
                              <div key={f.key}>
                                <div className="text-xs text-gray-500 mb-0.5 uppercase tracking-wide">{f.label}</div>
                                <div className="text-sm text-gray-300 break-all max-w-100">
                                  {formatCell(f, row[f.key])}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-800 text-sm">
          <span className="text-gray-500">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 border border-gray-700 rounded text-gray-400 hover:text-white
                disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 border border-gray-700 rounded text-gray-400 hover:text-white
                disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <RecordModal
          tableKey={tableKey}
          tableDef={tableDef}
          record={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
