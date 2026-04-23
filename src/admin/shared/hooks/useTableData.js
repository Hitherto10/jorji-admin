import { useState, useEffect, useCallback } from 'react'
import { tableService } from '../services'
import { PAGE_SIZE } from '../utils'

export function useTableData(tableKey, tableDef, search, page, columnFilters = {}, sortField, sortOrder) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)

  // Stable serialisation of columnFilters so we only re-run when values actually change
  const filterKey = JSON.stringify(columnFilters)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const searchField = tableDef.displayField
      const result = await tableService.get(tableKey, {
        page,
        pageSize: PAGE_SIZE,
        search,
        searchField,
        columnFilters,
        sortField,
        sortOrder,
      })
      setRows(result.data)
      setTotal(result.count)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableKey, page, search, tableDef.displayField, filterKey, sortField, sortOrder])

  useEffect(() => { load() }, [load])

  return { rows, loading, error, total, load }
}