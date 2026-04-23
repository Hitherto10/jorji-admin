import { useForeignKey } from '../hooks'

// Renders the correct input for a given field type
export default function FieldInput({ field, value, onChange, disabled }) {
  const { options: fkOptions, loading: fkLoading } = useForeignKey(field.fk)

  const base = `w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100
    focus:outline-none focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed`

  if (disabled) {
    return (
      <input
        className={base}
        value={value ?? ''}
        disabled
        readOnly
      />
    )
  }

  // FK dropdown
  if (field.fk) {
    return (
      <select
        className={base}
        value={value ?? ''}
        onChange={e => onChange(e.target.value || null)}
        disabled={fkLoading}
      >
        <option value="">{fkLoading ? 'Loading…' : '— none —'}</option>
        {fkOptions.map(opt => (
          <option key={opt.id} value={opt.id}>
            {opt[field.fk.labelField] || opt.id}
          </option>
        ))}
      </select>
    )
  }

  // Select with predefined options
  if (field.type === 'select') {
    return (
      <select
        className={base}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">— select —</option>
        {field.options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    )
  }

  // Boolean toggle
  if (field.type === 'boolean') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <div
          onClick={() => onChange(!value)}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            value ? 'bg-indigo-500' : 'bg-gray-700'
          }`}
        >
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`} />
        </div>
        <span className="text-sm text-gray-400">{value ? 'Yes' : 'No'}</span>
      </label>
    )
  }

  // Textarea
  if (field.type === 'textarea') {
    return (
      <textarea
        className={`${base} min-h-[80px] resize-y`}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        rows={3}
      />
    )
  }

  // JSON editor
  if (field.type === 'json') {
    const display = typeof value === 'string' ? value : JSON.stringify(value ?? [], null, 2)
    return (
      <textarea
        className={`${base} min-h-[120px] resize-y font-mono text-xs`}
        value={display}
        onChange={e => {
          try {
            onChange(JSON.parse(e.target.value))
          } catch {
            onChange(e.target.value) // allow partial edits
          }
        }}
        rows={5}
        placeholder="[]"
      />
    )
  }

  // Array — stored as Postgres array, edited as comma-separated string
  if (field.type === 'array') {
    const display = Array.isArray(value) ? value.join(', ') : (value ?? '')
    return (
      <input
        className={base}
        value={display}
        onChange={e => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
        placeholder="value1, value2, value3"
      />
    )
  }

  // Number
  if (field.type === 'number') {
    return (
      <input
        type="number"
        className={base}
        value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
        step="any"
      />
    )
  }

  // Datetime
  if (field.type === 'datetime') {
    const iso = value ? new Date(value).toISOString().slice(0, 16) : ''
    return (
      <input
        type="datetime-local"
        className={base}
        value={iso}
        onChange={e => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
      />
    )
  }

  // Default: text
  return (
    <input
      type="text"
      className={base}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder ?? ''}
    />
  )
}
