import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Dropdown } from '../admin/shared/ui_components/index.js'
import ProductEditor from './ProductEditor.jsx'

const PAGE_SIZE = 50

export default function ProductsTable() {
  const [products, setProducts] = useState([])
  const [variants, setVariants] = useState([])
  const [images, setImages] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [editor, setEditor] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
          .from('products')
          .select('*', { count: 'exact' })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
          .order('created_at', { ascending: false })

      if (search) query = query.ilike('name', `%${search}%`)

      const { data: prodData, error: prodErr, count } = await query
      if (prodErr) throw prodErr

      const prodIds = (prodData || []).map(p => p.id)
      const [varRes, imgRes, catRes] = await Promise.all([
        prodIds.length
            ? supabase.from('product_variants').select('product_id, stock, sku').in('product_id', prodIds)
            : Promise.resolve({ data: [], error: null }),
        prodIds.length
            ? supabase.from('product_images').select('product_id, url, is_primary').in('product_id', prodIds)
            : Promise.resolve({ data: [], error: null }),
        supabase.from('categories').select('id, name'),
      ])

      if (varRes.error) throw varRes.error
      if (imgRes.error) throw imgRes.error
      if (catRes.error) throw catRes.error

      setProducts(prodData || [])
      setVariants(varRes.data || [])
      setImages(imgRes.data || [])
      setCategories(catRes.data || [])
      setTotal(count || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { load() }, [load])

  const getProductDisplay = (product) => {
    const prodVariants = variants.filter(v => v.product_id === product.id)
    const totalStock = prodVariants.reduce((sum, v) => sum + (v.stock || 0), 0)
    const mainImage = images.find(img => img.product_id === product.id && img.is_primary)?.url
        || images.find(img => img.product_id === product.id)?.url
    const category = categories.find(c => c.id === product.category_id)?.name || '—'
    const sku = prodVariants[0]?.sku || '—'
    return { ...product, totalStock, mainImage, category, sku }
  }

  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    const { error: err } = await supabase.from('products').delete().eq('id', product.id)
    if (err) alert(`Delete failed: ${err.message}`)
    else load()
  }

  const columns = [
    { key: 'mainImage', label: 'Image' },
    { key: 'name', label: 'Product Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price', type: 'price' },
    { key: 'totalStock', label: 'Stock' },
    { key: 'is_active', label: 'Status', type: 'boolean' },
    { key: 'created_at', label: 'Created', type: 'datetime' },
  ]

  const formatCell = (col, value) => {
    if (col.key === 'mainImage') {
      return value
          ? <img src={value} alt="" className="w-12 h-12 object-cover rounded-lg" />
          : <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-gray-700 text-xs">—</div>
    }
    if (value === null || value === undefined) return <span className="text-gray-600">—</span>
    if (col.type === 'boolean') return value
        ? <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />Active</span>
        : <span className="inline-flex items-center gap-1.5 text-gray-600 text-xs"><span className="w-1.5 h-1.5 rounded-full bg-gray-600 inline-block" />Inactive</span>
    if (col.type === 'datetime') return <span className="text-gray-500 text-xs">{new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
    if (col.type === 'price') return <span className="font-medium text-gray-200">₦{Number(value).toLocaleString()}</span>
    return <span className="text-gray-300">{String(value)}</span>
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-white font-semibold">Products</span>
            <span className="text-gray-600 text-sm">{total.toLocaleString()} total</span>
          </div>
          <div className="flex items-center gap-3">
            <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0) }}
                placeholder="Search products…"
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200
              placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 w-56"
            />
            <button
                onClick={() => setEditor({ mode: 'create' })}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-1.5 rounded-lg transition-colors font-medium"
            >
              + New Product
            </button>
            <button
                onClick={load}
                className="text-gray-500 hover:text-gray-300 text-sm px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
            >
              ↻
            </button>
          </div>
        </div>

        {error && (
            <div className="mx-6 mt-3 px-4 py-2 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
              Error: {error}
            </div>
        )}

        <div className="flex-1 overflow-auto">
          {loading ? (
              <div className="flex items-center justify-center h-40 text-gray-600 text-sm">Loading…</div>
          ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-600">
                <span className="text-3xl">🛍️</span>
                <p className="text-sm">{search ? 'No products match your search' : 'No products yet — create your first one!'}</p>
              </div>
          ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                <tr className="border-b border-gray-800">
                  {columns.map(c => (
                      <th key={c.key} className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider whitespace-nowrap">
                        {c.label}
                      </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs text-gray-500 font-semibold uppercase tracking-wider">Actions</th>
                </tr>
                </thead>
                <tbody>
                {products.map(product => {
                  const data = getProductDisplay(product)
                  return (
                      <tr key={product.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        {columns.map(col => (
                            <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                              {formatCell(col, data[col.key])}
                            </td>
                        ))}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Dropdown>
                            <button
                                onClick={() => setEditor(product)}
                                className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                            >
                              ✏️ Edit Product
                            </button>
                            <button
                                onClick={() => handleDelete(product)}
                                className="block w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                            >
                              🗑️ Delete
                            </button>
                          </Dropdown>
                        </td>
                      </tr>
                  )
                })}
                </tbody>
              </table>
          )}
        </div>

        {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-800 text-sm">
              <span className="text-gray-600">Page {page + 1} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                        className="px-3 py-1 border border-gray-700 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  ← Prev
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                        className="px-3 py-1 border border-gray-700 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  Next →
                </button>
              </div>
            </div>
        )}

        {editor && (
            <ProductEditor
                product={editor.mode === 'create' ? null : editor}
                onClose={() => setEditor(null)}
                onSaved={load}
            />
        )}
      </div>
  )
}