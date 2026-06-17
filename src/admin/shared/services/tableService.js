import { api } from '../../../lib/api.js'

export const tableService = {
  /**
   * List rows from a table with optional pagination, search, sort, and filters.
   *
   * @param {string} table
   * @param {{
   *   page?: number,
   *   pageSize?: number,
   *   search?: string,
   *   searchField?: string,
   *   sortField?: string,
   *   sortOrder?: 'asc'|'desc',
   *   columnFilters?: Record<string, string>,
   *   inFilters?: Record<string, string[]>,
   * }} options
   * @returns {Promise<{ data: object[], count: number }>}
   */
  async get(table, options = {}) {
    const {
      page = 0,
      pageSize = 50,
      search,
      searchField,
      sortField,
      sortOrder,
      columnFilters,
      inFilters,
    } = options

    const params = { page, pageSize }
    if (search)      params.search      = search
    if (searchField) params.searchField = searchField
    if (sortField)   params.sortField   = sortField
    if (sortOrder)   params.sortOrder   = sortOrder

    if (columnFilters && Object.keys(columnFilters).length) {
      const active = Object.fromEntries(
        Object.entries(columnFilters).filter(([, v]) => v !== undefined && v !== null && v !== '')
      )
      if (Object.keys(active).length) params.filters = JSON.stringify(active)
    }

    if (inFilters) {
      for (const [col, vals] of Object.entries(inFilters)) {
        if (Array.isArray(vals) && vals.length) {
          params[`in_${col}`] = vals.join(',')
        }
      }
    }

    return api.get(`/api/admin/tables/${table}`, params)
  },

  /**
   * Insert a single row and return the created record.
   */
  async create(table, payload) {
    const result = await api.post(`/api/admin/tables/${table}`, payload)
    return result.data
  },

  /**
   * Update a row identified by a single primary key.
   */
  async update(table, id, payload, primaryKey = 'id') {
    const result = await api.patch(
      `/api/admin/tables/${table}/${encodeURIComponent(id)}`,
      payload,
      { primaryKey },
    )
    return result.data
  },

  /**
   * Delete a row identified by a single primary key.
   */
  async delete(table, id, primaryKey = 'id') {
    return api.delete(
      `/api/admin/tables/${table}/${encodeURIComponent(id)}`,
      { primaryKey },
    )
  },

  /**
   * Delete multiple rows by an array of primary key values.
   */
  async batchDelete(table, ids, primaryKey = 'id') {
    return api.post(`/api/admin/tables/${table}/batch-delete`, { ids, primaryKey })
  },
}
