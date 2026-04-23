import Button from './Button'
import {FieldInput} from "./index.js";

export default function Form({ fields, form, onChange, onSave, onCancel, saving, error, title }) {
  return (
    <div className="px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
      {fields.map(field => (
        <div key={field.key}>
          <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </label>
          <FieldInput
            field={field}
            value={form[field.key]}
            onChange={val => onChange(field.key, val)}
            disabled={field.readonly}
          />
        </div>
      ))}
      {error && (
        <div className="px-4 py-2 bg-red-900/40 border border-red-700 rounded text-red-300 text-sm">
          {error}
        </div>
      )}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : title}
        </Button>
      </div>
    </div>
  )
}
