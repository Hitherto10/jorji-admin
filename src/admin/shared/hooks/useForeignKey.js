import { useState, useEffect } from 'react'
import { tableService } from '../services'

export function useForeignKey(fk) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!fk) return

    const loadOptions = async () => {
      setLoading(true)
      try {
        const result = await tableService.get(fk.table, { pageSize: 500 })
        setOptions(result.data)
      } catch (err) {
        console.error('Failed to load FK options:', err)
      } finally {
        setLoading(false)
      }
    }

    loadOptions()
  }, [fk?.table])

  return { options, loading }
}
