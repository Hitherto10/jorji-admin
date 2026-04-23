import { supabase } from '../../../lib/supabase'

export const tableService = {
  async get(tableKey, options = {}) {
    const { page = 0, pageSize = 50, search, searchField, columnFilters, sortField, sortOrder } = options
    let query = supabase
        .from(tableKey)
        .select('*', { count: 'exact' })
        .range(page * pageSize, (page + 1) * pageSize - 1)

    if (search && searchField) {
      query = query.ilike(searchField, `%${search}%`)
    }

    if (sortField) {
      query = query.order(sortField, { ascending: sortOrder === 'asc' })
    }

    // Apply column equality filters (e.g. product_id = x)
    if (columnFilters && typeof columnFilters === 'object') {
      Object.entries(columnFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value)
        }
      })
    }

    const { data, error, count } = await query
    if (error) throw error
    return { data: data || [], count: count || 0 }
  },

  async create(tableKey, payload) {
    const { data, error } = await supabase
        .from(tableKey)
        .insert(payload)
        .select()
    if (error) throw error
    return data[0]
  },

  async update(tableKey, id, payload, primaryKey = 'id') {
    const { data, error } = await supabase
        .from(tableKey)
        .update(payload)
        .eq(primaryKey, id)
        .select()
    if (error) throw error
    return data[0]
  },

  async delete(tableKey, id, primaryKey = 'id') {
    const { error } = await supabase
        .from(tableKey)
        .delete()
        .eq(primaryKey, id)
    if (error) throw error
  }
}