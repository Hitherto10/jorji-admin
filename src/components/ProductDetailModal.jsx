import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { TABLES } from '../config/tables'
import { Modal, Form } from '../admin/shared/components'
import TableView from './TableView'

export default function ProductDetailModal({ product, onClose, onSaved }) {
  const [activeTab, setActiveTab] = useState('info')
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState(product.mode === 'create' ? {} : product)

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...formData }
      delete payload.mode
      delete payload.totalStock
      delete payload.mainImage
      delete payload.category
      delete payload.sku

      if (product.mode === 'create') {
        const { error } = await supabase.from('products').insert(payload)
        if (error) throw error
      } else {
        const { error } = await supabase.from('products').update(payload).eq('id', product.id)
        if (error) throw error
      }
      onSaved()
      onClose()
    } catch (err) {
      alert(`Save failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { key: 'info', label: 'Product Info' },
    { key: 'variants', label: 'Variants' },
    { key: 'images', label: 'Images' },
  ]

  const productFilter = useMemo(() => ({ product_id: product.id }), [product.id])

  return (
    <Modal onClose={onClose} className="max-w-6xl max-h-[90vh] overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg">
            {product.mode === 'create' ? 'New Product' : product.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-indigo-300 border-b-2 border-indigo-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'info' && (
            <div className="p-6">
              <Form
                tableDef={TABLES.products}
                record={formData}
                onChange={setFormData}
                onSave={handleSave}
                saving={saving}
              />
            </div>
          )}

          {activeTab === 'variants' && product.id && (
            <div className="h-96">
              <TableView
                tableKey="product_variants"
                tableDef={TABLES.product_variants}
                filter={productFilter}
              />
            </div>
          )}

          {activeTab === 'images' && product.id && (
            <div className="h-96">
              <TableView
                tableKey="product_images"
                tableDef={TABLES.product_images}
                filter={productFilter}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
