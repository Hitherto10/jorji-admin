export const PAGE_SIZE = 50

export const formatCellValue = (field, value) => {
  if (value === null || value === undefined) return '—'
  if (field.type === 'boolean') return value ? 'YES' : 'NO'
  if (field.type === 'datetime') return new Date(value).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
  if (field.type === 'json' || field.type === 'array') return JSON.stringify(value).slice(0, 40) + '…'
  if (typeof value === 'string' && value.length > 50) return value.slice(0, 50) + '…'
  return String(value)
}
