import { useState, useEffect } from 'react'
import FieldInput from './FieldInput'
import { supabase } from '../lib/supabase'

export default function RecordModal({ tableKey, tableDef, record, onClose, onSaved }) {
  const isEdit = !!record
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Initialise form with existing record values or field defaults
  useEffect(() => {
    const initial = {}
    tableDef.fields.forEach(f => {
      if (f.readonly) return
      initial[f.key] = record?.[f.key] ?? f.defaultValue ?? null
    })
    setForm(initial)
  }, [record])

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    // Build payload — exclude readonly fields and null UUIDs
    const payload = {}
    tableDef.fields.forEach(f => {
      if (f.readonly) return
      const val = form[f.key]
      // Don't send empty string for UUID fields — send null
      if (f.type === 'uuid' && !val) {
        payload[f.key] = null
      } else {
        payload[f.key] = val ?? null
      }
    })

    let result
    if (isEdit) {
      const pkField = tableDef.primaryKey
      result = await supabase
        .from(tableKey)
        .update(payload)
        .eq(pkField, record[pkField])
        .select()
    } else {
      result = await supabase
        .from(tableKey)
        .insert(payload)
        .select()
    }

    setSaving(false)

    if (result.error) {
      setError(result.error.message)
    } else {
      onSaved()
      onClose()
    }
  }

  const editableFields = tableDef.fields.filter(f => !f.hidden)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 overflow-y-auto py-8">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl mx-4 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-white font-semibold text-base">
            {isEdit ? `Edit ${tableDef.label}` : `New ${tableDef.label}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Fields */}
        <div className="px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
          {editableFields.map(field => (
            <div key={field.key}>
              <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              <FieldInput
                field={field}
                value={form[field.key]}
                onChange={val => set(field.key, val)}
                disabled={field.readonly}
              />
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-2 px-4 py-2 bg-red-900/40 border border-red-700 rounded text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
