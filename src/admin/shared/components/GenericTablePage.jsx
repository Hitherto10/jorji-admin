import { useState, useMemo } from 'react'
import { useTableData } from '../hooks'
import { PAGE_SIZE } from '../utils'
import { Table, Toolbar, Pagination, ErrorMessage, Loading, ConfirmDialog, Modal, Form, FormatCell } from '../../shared/components'
import { tableService } from '../services'

export default function GenericTablePage({ tableKey, tableDef }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selectedRows, setSelectedRows] = useState([])
  const [deleting, setDeleting] = useState(null)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [sortField, setSortField] = useState(null)
  const [sortOrder, setSortOrder] = useState('asc')

  const filters = useMemo(() => ({ sortField, sortOrder }), [sortField, sortOrder])

  const { rows, loading, error, total, load } = useTableData(tableKey, tableDef, search, page, filters, sortField, sortOrder)

  const handleDelete = async (row) => {
    setDeleting(row[tableDef.primaryKey])
    try {
      await tableService.delete(tableKey, row[tableDef.primaryKey], tableDef.primaryKey)
      load()
    } catch (err) {
      alert(`Delete failed: ${err.message}`)
    } finally {
      setDeleting(null)
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedRows.length) return
    try {
      for (const id of selectedRows) {
        await tableService.delete(tableKey, id, tableDef.primaryKey)
      }
      setSelectedRows([])
      load()
    } catch (err) {
      alert(`Bulk delete failed: ${err.message}`)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setFormError(null)
    try {
      const payload = {}
      tableDef.fields.forEach(f => {
        if (f.readonly) return
        const val = form[f.key]
        if (f.type === 'uuid' && !val) {
          payload[f.key] = null
        } else {
          payload[f.key] = val ?? null
        }
      })

      if (modal === 'create') {
        await tableService.create(tableKey, payload)
      } else {
        await tableService.update(tableKey, modal[tableDef.primaryKey], payload, tableDef.primaryKey)
      }
      load()
      setModal(null)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const openModal = (record = null) => {
    const initial = {}
    tableDef.fields.forEach(f => {
      if (f.readonly) return
      initial[f.key] = record?.[f.key] ?? f.defaultValue ?? null
    })
    setForm(initial)
    setModal(record || 'create')
    setFormError(null)
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setPage(0)
  }

  const tableColumns = tableDef.fields
    .filter(f => !f.hidden)
    .slice(0, 6)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="flex flex-col h-full">
      <Toolbar
        title={tableDef.label}
        total={total}
        search={search}
        onSearchChange={setSearch}
        onNew={() => openModal()}
        onRefresh={load}
        canCreate={!!tableDef.primaryKey}
      />

      {selectedRows.length > 0 && (
        <div className="mx-6 mt-3 px-4 py-2 bg-indigo-900/40 border border-indigo-700 rounded text-indigo-300 text-sm flex items-center justify-between">
          <span>{selectedRows.length} selected</span>
          <button
            onClick={handleBulkDelete}
            className="text-red-400 hover:text-red-300 text-xs"
          >
            Delete Selected
          </button>
        </div>
      )}

      <ErrorMessage error={error} />

      <Table
        columns={tableColumns}
        rows={loading ? [] : rows}
        showCheckbox={!!tableDef.primaryKey}
        selectedRows={selectedRows}
        onSelectionChange={(row, checked) => {
          const pk = tableDef.primaryKey
          const rowKey = pk ? row[pk] : rows.indexOf(row)
          if (checked) {
            setSelectedRows(prev => [...prev, rowKey])
          } else {
            setSelectedRows(prev => prev.filter(id => id !== rowKey))
          }
        }}
        renderRow={(row, i) => {
          const pk = tableDef.primaryKey
          const rowKey = pk ? row[pk] : i
          const isSelected = selectedRows.includes(rowKey)

          return (
            <tr
              key={rowKey}
              className={`border-b border-gray-800/60 hover:bg-gray-800/40 transition-colors ${
                isSelected ? 'bg-indigo-900/20' : ''
              }`}
            >
              {tableDef.primaryKey && (
                <td className="px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(prev => [...prev, rowKey])
                      } else {
                        setSelectedRows(prev => prev.filter(id => id !== rowKey))
                      }
                    }}
                  />
                </td>
              )}
              {tableColumns.map(f => (
                <td key={f.key} className="px-4 py-2.5">
                  <FormatCell field={f} value={row[f.key]} />
                </td>
              ))}
              <td className="px-4 py-2.5 text-right whitespace-nowrap">
                <button
                  onClick={() => openModal(row)}
                  className="text-indigo-400 hover:text-indigo-300 text-xs mr-3 transition-colors"
                >
                  Edit
                </button>
                {pk && (
                  <button
                    onClick={() => setDeleting(row)}
                    disabled={deleting === row[pk]}
                    className="text-red-500 hover:text-red-400 text-xs transition-colors disabled:opacity-40"
                  >
                    {deleting === row[pk] ? '…' : 'Delete'}
                  </button>
                )}
              </td>
            </tr>
          )
        }}
        onSort={handleSort}
        actions={null}
      />

      {loading && <Loading />}

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {deleting && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
          title="Delete Record"
          message={`Delete this ${tableDef.label} record? This cannot be undone.`}
        />
      )}

      {modal && (
        <Modal
          isOpen={true}
          onClose={() => setModal(null)}
          title={modal === 'create' ? `New ${tableDef.label}` : `Edit ${tableDef.label}`}
        >
          <Form
            fields={tableDef.fields.filter(f => !f.hidden)}
            form={form}
            onChange={(key, val) => setForm(prev => ({ ...prev, [key]: val }))}
            onSave={handleSave}
            onCancel={() => setModal(null)}
            saving={saving}
            error={formError}
            title={modal === 'create' ? 'Create' : 'Save Changes'}
          />
        </Modal>
      )}
    </div>
  )
}
