import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { TABLES } from '../config/tables'
import {Dropdown} from "../admin/shared/components/index.js";
import ProductDetailModal from "./ProductDetailModal.jsx";

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
  const [modal, setModal] = useState(null) // null | product object for detail

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch products with search and pagination
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        .order('created_at', { ascending: false })

      if (search) {
        query = query.ilike('name', `%${search}%`)
      }

      const { data: prodData, error: prodErr, count } = await query
      if (prodErr) throw prodErr

      // Fetch related data
      const prodIds = prodData.map(p => p.id)
      const [varRes, imgRes, catRes] = await Promise.all([
        prodIds.length ? supabase.from('product_variants').select('product_id, stock, sku').in('product_id', prodIds) : { data: [] },
        prodIds.length ? supabase.from('product_images').select('product_id, url, is_primary').in('product_id', prodIds) : { data: [] },
        supabase.from('categories').select('id, name')
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

  const getProductData = (product) => {
    const prodVariants = variants.filter(v => v.product_id === product.id)
    const totalStock = prodVariants.reduce((sum, v) => sum + (v.stock || 0), 0)
    const mainImage = images.find(img => img.product_id === product.id && img.is_primary)?.url
    const category = categories.find(c => c.id === product.category_id)?.name
    const sku = prodVariants.length > 0 ? prodVariants[0].sku : ''
    return { ...product, totalStock, mainImage, category, sku }
  }

  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return

    const { error: err } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id)

    if (err) alert(`Delete failed: ${err.message}`)
    else load()
  }

  const handleEdit = (product) => {
    setModal({ ...product, mode: 'edit' })
  }

  const handleViewMore = (product) => {
    setModal(product)
  }

  const columns = [
    { key: 'mainImage', label: 'Image', type: 'text' },
    { key: 'name', label: 'Product Name', type: 'text' },
    { key: 'sku', label: 'SKU', type: 'text' },
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'price', label: 'Price', type: 'number' },
    { key: 'totalStock', label: 'Stock', type: 'number' },
    { key: 'is_active', label: 'Status', type: 'boolean' },
    { key: 'created_at', label: 'Created Date', type: 'datetime' },
  ]

  const formatCell = (field, value) => {
    if (field.key === 'mainImage') {
      return value ? <img src={value} alt="" className="w-12 h-12 object-cover rounded" /> : <div className="w-12 h-12 bg-gray-700 rounded"></div>
    }
    if (field.type === 'boolean') return value
      ? <span className="text-green-400 text-xs font-medium">Active</span>
      : <span className="text-gray-600 text-xs">Inactive</span>
    if (field.type === 'datetime') return new Date(value).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
    if (field.type === 'number' && field.key === 'price') return `₦${value?.toLocaleString()}`
    return String(value || '')
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-base">Products</span>
          <span className="text-gray-500 text-sm">{total.toLocaleString()} products</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search products…"
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200
              placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 w-56"
          />
          <button
            onClick={() => setModal({ mode: 'create' })}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-1.5 rounded
              transition-colors font-medium"
          >
            + New Product
          </button>
          <button
            onClick={load}
            className="text-gray-500 hover:text-gray-200 text-sm px-3 py-1.5 rounded
              border border-gray-700 hover:border-gray-500 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-3 px-4 py-2 bg-red-900/40 border border-red-700 rounded text-red-300 text-sm">
          Error: {error}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-600 text-sm">Loading…</div>
        ) : products.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-600 text-sm">No products found</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-800">
                {columns.map(f => (
                  <th key={f.key} className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">
                    {f.label}
                  </th>
                ))}
                <th className="px-4 py-2.5 text-right text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const data = getProductData(product)
                return (
                  <tr key={product.id} className="border-b border-gray-800/60 hover:bg-gray-800/40">
                    {columns.map(f => (
                      <td key={f.key} className="px-4 py-2.5 text-gray-300 whitespace-nowrap">
                        {formatCell(f, data[f.key])}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <Dropdown>
                        <button
                          onClick={() => handleViewMore(product)}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        >
                          View More
                        </button>
                        <button
                          onClick={() => handleEdit(product)}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="block w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700"
                        >
                          Delete
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-800 text-sm">
          <span className="text-gray-500">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 border border-gray-700 rounded text-gray-400 hover:text-white
                disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 border border-gray-700 rounded text-gray-400 hover:text-white
                disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {modal && (
        <ProductDetailModal
          product={modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
