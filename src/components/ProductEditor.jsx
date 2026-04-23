import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ─── helpers ────────────────────────────────────────────────────────────────

function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
}

function uid() {
    return Math.random().toString(36).slice(2)
}

const EMPTY_PRODUCT = {
    name: '', slug: '', description: '', price: '', compare_price: '',
    currency: 'NGN', category_id: null, size_chart_id: null,
    is_active: true, is_featured: false, is_new_in: false,
    tags: [], meta_title: '', meta_desc: '', content_sections: [],
}

const EMPTY_VARIANT = {
    _id: '', size: '', color: '', color_hex: [], sku: '',
    stock: 0, price: '', is_active: true, option_name: '', option_value: '',
}

const EMPTY_IMAGE = {
    _id: '', url: '', alt_text: '', sort_order: 0, is_primary: false, variant_id: null,
}

// ─── sub-ui_components ─────────────────────────────────────────────────────────

function Toggle({ value, onChange, label }) {
    return (
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
                onClick={() => onChange(!value)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${value ? 'bg-indigo-500' : 'bg-gray-700'}`}
            >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-gray-400">{label}</span>
        </label>
    )
}

function Field({ label, required, children, hint }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest">
                {label}{required && <span className="text-indigo-400 ml-1">*</span>}
            </label>
            {children}
            {hint && <p className="text-xs text-gray-600">{hint}</p>}
        </div>
    )
}

const inputCls = `w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3.5 py-2.5 text-sm text-gray-100
  focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30
  placeholder:text-gray-600 transition-colors`

const selectCls = inputCls + ' cursor-pointer'

// ─── TAB: Basic Info ─────────────────────────────────────────────────────────

function BasicInfoTab({ data, onChange, categories, sizeCharts }) {
    const handleName = (v) => {
        onChange('name', v)
        if (!data._slugEdited) onChange('slug', slugify(v))
    }

    return (
        <div className="space-y-6">
            {/* Name + Slug */}
            <div className="grid grid-cols-2 gap-4">
                <Field label="Product Name" required>
                    <input className={inputCls} value={data.name} onChange={e => handleName(e.target.value)} placeholder="e.g. Classic Linen Shirt" />
                </Field>
                <Field label="Slug" required hint="Auto-generated from name, but editable">
                    <input
                        className={inputCls}
                        value={data.slug}
                        onChange={e => { onChange('slug', e.target.value); onChange('_slugEdited', true) }}
                        placeholder="classic-linen-shirt"
                    />
                </Field>
            </div>

            {/* Price row */}
            <div className="grid grid-cols-3 gap-4">
                <Field label="Price (₦)" required>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                        <input type="number" className={inputCls + ' pl-7'} value={data.price} onChange={e => onChange('price', e.target.value)} placeholder="0.00" step="0.01" min="0" />
                    </div>
                </Field>
                <Field label="Compare-at Price (₦)" hint="Shown as crossed-out price">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                        <input type="number" className={inputCls + ' pl-7'} value={data.compare_price} onChange={e => onChange('compare_price', e.target.value)} placeholder="0.00" step="0.01" min="0" />
                    </div>
                </Field>
                <Field label="Currency">
                    <select className={selectCls} value={data.currency} onChange={e => onChange('currency', e.target.value)}>
                        <option value="NGN">NGN</option>
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                    </select>
                </Field>
            </div>

            {/* Category + Size Chart */}
            <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                    <select className={selectCls} value={data.category_id || ''} onChange={e => onChange('category_id', e.target.value || null)}>
                        <option value="">— None —</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </Field>
                <Field label="Size Chart">
                    <select className={selectCls} value={data.size_chart_id || ''} onChange={e => onChange('size_chart_id', e.target.value || null)}>
                        <option value="">— None —</option>
                        {sizeCharts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </Field>
            </div>

            {/* Description */}
            <Field label="Description">
        <textarea
            className={inputCls + ' min-h-[120px] resize-y'}
            value={data.description}
            onChange={e => onChange('description', e.target.value)}
            placeholder="Describe this product…"
            rows={5}
        />
            </Field>

            {/* Tags */}
            <Field label="Tags" hint="Comma-separated (e.g. summer, cotton, casual)">
                <input
                    className={inputCls}
                    value={Array.isArray(data.tags) ? data.tags.join(', ') : ''}
                    onChange={e => onChange('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="summer, cotton, casual"
                />
            </Field>

            {/* Flags */}
            <div className="flex flex-wrap gap-6 pt-2">
                <Toggle value={data.is_active} onChange={v => onChange('is_active', v)} label="Active (visible on store)" />
                <Toggle value={data.is_featured} onChange={v => onChange('is_featured', v)} label="Featured" />
                <Toggle value={data.is_new_in} onChange={v => onChange('is_new_in', v)} label="New In" />
            </div>

            {/* SEO */}
            <div className="border-t border-gray-800 pt-5 space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">SEO (optional)</p>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Meta Title">
                        <input className={inputCls} value={data.meta_title} onChange={e => onChange('meta_title', e.target.value)} placeholder="Leave blank to use product name" />
                    </Field>
                    <Field label="Meta Description">
                        <input className={inputCls} value={data.meta_desc} onChange={e => onChange('meta_desc', e.target.value)} placeholder="Short description for search engines" />
                    </Field>
                </div>
            </div>
        </div>
    )
}

// ─── TAB: Variants ───────────────────────────────────────────────────────────

function VariantsTab({ variants, onChange, savedVariants = [] }) {
    const addVariant = () => onChange([...variants, { ...EMPTY_VARIANT, _id: uid() }])
    const removeVariant = (idx) => onChange(variants.filter((_, i) => i !== idx))
    const updateVariant = (idx, key, val) => {
        const updated = [...variants]
        updated[idx] = { ...updated[idx], [key]: val }
        onChange(updated)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-300 font-medium">Product Variants</p>
                    <p className="text-xs text-gray-600 mt-0.5">Each variant represents a unique combination of size, color, or option (e.g. S / Red)</p>
                </div>
                <button
                    onClick={addVariant}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors font-medium"
                >
                    <span className="text-base leading-none">+</span> Add Variant
                </button>
            </div>

            {variants.length === 0 && (
                <div className="border border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center py-12 text-gray-600">
                    <span className="text-3xl mb-2">🎨</span>
                    <p className="text-sm">No variants yet. Click "Add Variant" to create size/color options.</p>
                    <p className="text-xs mt-1">If your product has no variants, it will use the base product price & stock.</p>
                </div>
            )}

            {variants.map((v, idx) => (
                <div key={v._id || v.id || idx} className="bg-gray-800/50 border border-gray-700/60 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Variant #{idx + 1}</span>
                        <button onClick={() => removeVariant(idx)} className="text-red-500 hover:text-red-400 text-xs transition-colors">Remove</button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <Field label="Size">
                            <input className={inputCls} value={v.size || ''} onChange={e => updateVariant(idx, 'size', e.target.value)} placeholder="XS, S, M, L, XL…" />
                        </Field>
                        <Field label="Color Name">
                            <input className={inputCls} value={v.color || ''} onChange={e => updateVariant(idx, 'color', e.target.value)} placeholder="e.g. Midnight Black" />
                        </Field>
                        <Field label="Color Hex(es)" hint="Comma-separated e.g. #000,#111">
                            <input
                                className={inputCls}
                                value={Array.isArray(v.color_hex) ? v.color_hex.join(', ') : ''}
                                onChange={e => updateVariant(idx, 'color_hex', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                placeholder="#000000"
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <Field label="SKU">
                            <input className={inputCls} value={v.sku || ''} onChange={e => updateVariant(idx, 'sku', e.target.value)} placeholder="AUTO-001" />
                        </Field>
                        <Field label="Stock" required>
                            <input type="number" className={inputCls} value={v.stock} onChange={e => updateVariant(idx, 'stock', Number(e.target.value))} min="0" />
                        </Field>
                        <Field label="Price Override (₦)" hint="Leave blank to use product price">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                                <input type="number" className={inputCls + ' pl-7'} value={v.price || ''} onChange={e => updateVariant(idx, 'price', e.target.value || null)} placeholder="—" step="0.01" min="0" />
                            </div>
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Option Name" hint="e.g. Material, Style">
                            <input className={inputCls} value={v.option_name || ''} onChange={e => updateVariant(idx, 'option_name', e.target.value)} placeholder="Material" />
                        </Field>
                        <Field label="Option Value">
                            <input className={inputCls} value={v.option_value || ''} onChange={e => updateVariant(idx, 'option_value', e.target.value)} placeholder="Cotton" />
                        </Field>
                    </div>

                    <div className="pt-1">
                        <Toggle value={v.is_active} onChange={val => updateVariant(idx, 'is_active', val)} label="Variant Active" />
                    </div>
                </div>
            ))}
        </div>
    )
}

// ─── TAB: Images ─────────────────────────────────────────────────────────────

function ImagesTab({ images, onChange, variants }) {
    const addImage = () => onChange([...images, { ...EMPTY_IMAGE, _id: uid(), sort_order: images.length }])
    const removeImage = (idx) => onChange(images.filter((_, i) => i !== idx))
    const updateImage = (idx, key, val) => {
        const updated = [...images]
        updated[idx] = { ...updated[idx], [key]: val }
        onChange(updated)
    }
    const setPrimary = (idx) => {
        onChange(images.map((img, i) => ({ ...img, is_primary: i === idx })))
    }

    const variantOptions = variants.filter(v => v._id || v.id)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-300 font-medium">Product Images</p>
                    <p className="text-xs text-gray-600 mt-0.5">Add image URLs, set a primary image, and optionally link to a specific variant.</p>
                </div>
                <button
                    onClick={addImage}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors font-medium"
                >
                    <span className="text-base leading-none">+</span> Add Image
                </button>
            </div>

            {images.length === 0 && (
                <div className="border border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center py-12 text-gray-600">
                    <span className="text-3xl mb-2">🖼️</span>
                    <p className="text-sm">No images yet. Add image URLs for this product.</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-3">
                {images.map((img, idx) => (
                    <div key={img._id || img.id || idx} className="bg-gray-800/50 border border-gray-700/60 rounded-xl p-4">
                        <div className="flex gap-4">
                            {/* Preview */}
                            <div className="flex-shrink-0 w-20 h-20 bg-gray-900 rounded-lg border border-gray-700 overflow-hidden flex items-center justify-center">
                                {img.url ? (
                                    <img src={img.url} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                                ) : (
                                    <span className="text-gray-700 text-2xl">🖼</span>
                                )}
                            </div>

                            {/* Fields */}
                            <div className="flex-1 space-y-2.5">
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Image URL" required>
                                        <input
                                            className={inputCls}
                                            value={img.url}
                                            onChange={e => updateImage(idx, 'url', e.target.value)}
                                            placeholder="https://…"
                                        />
                                    </Field>
                                    <Field label="Alt Text" hint="For accessibility & SEO">
                                        <input
                                            className={inputCls}
                                            value={img.alt_text || ''}
                                            onChange={e => updateImage(idx, 'alt_text', e.target.value)}
                                            placeholder="Describe the image…"
                                        />
                                    </Field>
                                </div>
                                <div className="grid grid-cols-3 gap-3 items-end">
                                    <Field label="Sort Order">
                                        <input type="number" className={inputCls} value={img.sort_order} onChange={e => updateImage(idx, 'sort_order', Number(e.target.value))} min="0" />
                                    </Field>
                                    {variantOptions.length > 0 && (
                                        <Field label="Linked Variant" hint="Optional — ties this image to a variant">
                                            <select className={selectCls} value={img.variant_id || ''} onChange={e => updateImage(idx, 'variant_id', e.target.value || null)}>
                                                <option value="">— All variants —</option>
                                                {variantOptions.map((v, vi) => (
                                                    <option key={v._id || v.id} value={v._id || v.id}>
                                                        {[v.size, v.color, v.option_value].filter(Boolean).join(' / ') || `Variant ${vi + 1}`}
                                                    </option>
                                                ))}
                                            </select>
                                        </Field>
                                    )}
                                    <div className="flex items-center gap-4 pb-0.5">
                                        <Toggle
                                            value={img.is_primary}
                                            onChange={() => setPrimary(idx)}
                                            label="Primary"
                                        />
                                        <button onClick={() => removeImage(idx)} className="text-red-500 hover:text-red-400 text-xs transition-colors ml-auto">Remove</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function ProductEditor({ product = null, onClose, onSaved }) {
    const isEdit = !!product?.id
    const [tab, setTab] = useState('info')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    // Core data
    const [form, setForm] = useState(() => {
        if (!product) return { ...EMPTY_PRODUCT }
        const clean = { ...EMPTY_PRODUCT, ...product }
        delete clean.totalStock; delete clean.mainImage; delete clean.category; delete clean.sku; delete clean.mode
        return clean
    })

    const [variants, setVariants] = useState([])
    const [images, setImages] = useState([])

    // Reference data
    const [categories, setCategories] = useState([])
    const [sizeCharts, setSizeCharts] = useState([])

    // Load reference data
    useEffect(() => {
        supabase.from('categories').select('id, name').order('name').then(({ data }) => setCategories(data || []))
        supabase.from('size_charts').select('id, name').order('name').then(({ data }) => setSizeCharts(data || []))
    }, [])

    // Load existing variants + images when editing
    useEffect(() => {
        if (!isEdit) return
        supabase.from('product_variants').select('*').eq('product_id', product.id).order('created_at')
            .then(({ data }) => setVariants((data || []).map(v => ({ ...v, _id: v.id }))))
        supabase.from('product_images').select('*').eq('product_id', product.id).order('sort_order')
            .then(({ data }) => setImages((data || []).map(i => ({ ...i, _id: i.id }))))
    }, [isEdit, product?.id])

    const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

    // ── Save logic ──────────────────────────────────────────────────────────────

    const handleSave = async () => {
        setSaving(true)
        setError(null)

        try {
            // 1. Upsert product
            const payload = {
                name: form.name, slug: form.slug, description: form.description || null,
                price: Number(form.price), compare_price: form.compare_price ? Number(form.compare_price) : null,
                currency: form.currency, category_id: form.category_id || null,
                size_chart_id: form.size_chart_id || null,
                is_active: form.is_active, is_featured: form.is_featured, is_new_in: form.is_new_in,
                tags: form.tags, meta_title: form.meta_title || null, meta_desc: form.meta_desc || null,
                content_sections: form.content_sections,
            }

            let productId
            if (isEdit) {
                const { error: e } = await supabase.from('products').update(payload).eq('id', product.id)
                if (e) throw e
                productId = product.id
            } else {
                const { data, error: e } = await supabase.from('products').insert(payload).select('id').single()
                if (e) throw e
                productId = data.id
            }

            // 2. Sync variants
            if (isEdit) {
                // Delete removed variants
                const keptIds = variants.filter(v => v.id).map(v => v.id)
                const { data: existing } = await supabase.from('product_variants').select('id').eq('product_id', productId)
                const toDelete = (existing || []).filter(e => !keptIds.includes(e.id)).map(e => e.id)
                if (toDelete.length) {
                    await supabase.from('product_variants').delete().in('id', toDelete)
                }
            }

            // Map local _id → real db id for image linking
            const variantIdMap = {}

            for (const v of variants) {
                const vPayload = {
                    product_id: productId,
                    size: v.size || null, color: v.color || null,
                    color_hex: v.color_hex?.length ? v.color_hex : null,
                    sku: v.sku || null, stock: Number(v.stock) || 0,
                    price: v.price ? Number(v.price) : null,
                    is_active: v.is_active,
                    option_name: v.option_name || null, option_value: v.option_value || null,
                }

                if (v.id) {
                    // Existing variant — update
                    await supabase.from('product_variants').update(vPayload).eq('id', v.id)
                    variantIdMap[v._id] = v.id
                } else {
                    // New variant — insert
                    const { data: vData, error: vErr } = await supabase.from('product_variants').insert(vPayload).select('id').single()
                    if (vErr) throw vErr
                    variantIdMap[v._id] = vData.id
                }
            }

            // 3. Sync images
            if (isEdit) {
                const keptImageIds = images.filter(i => i.id).map(i => i.id)
                const { data: existingImgs } = await supabase.from('product_images').select('id').eq('product_id', productId)
                const toDeleteImgs = (existingImgs || []).filter(e => !keptImageIds.includes(e.id)).map(e => e.id)
                if (toDeleteImgs.length) {
                    await supabase.from('product_images').delete().in('id', toDeleteImgs)
                }
            }

            for (const img of images) {
                if (!img.url) continue
                // Resolve variant_id: if it was a local _id key, map to real db id
                const resolvedVariantId = img.variant_id
                    ? (variantIdMap[img.variant_id] || img.variant_id)
                    : null

                const imgPayload = {
                    product_id: productId,
                    url: img.url, alt_text: img.alt_text || null,
                    sort_order: img.sort_order || 0, is_primary: img.is_primary,
                    variant_id: resolvedVariantId,
                }

                if (img.id) {
                    await supabase.from('product_images').update(imgPayload).eq('id', img.id)
                } else {
                    await supabase.from('product_images').insert(imgPayload)
                }
            }

            onSaved?.()
            onClose?.()
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    // ── Tab config ──────────────────────────────────────────────────────────────

    const tabs = [
        { key: 'info', label: 'Product Info', icon: '📋' },
        { key: 'variants', label: `Variants${variants.length ? ` (${variants.length})` : ''}`, icon: '🎨' },
        { key: 'images', label: `Images${images.length ? ` (${images.length})` : ''}`, icon: '🖼️' },
    ]

    // Tab completeness indicators
    const infoComplete = form.name && form.slug && form.price
    const tabStatus = {
        info: infoComplete ? 'done' : 'pending',
        variants: variants.length > 0 ? 'done' : 'empty',
        images: images.length > 0 ? 'done' : 'empty',
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 overflow-y-auto py-6 px-4">
            <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-4xl shadow-2xl">

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-gray-800">
                    <div>
                        <h2 className="text-white font-bold text-lg tracking-tight">
                            {isEdit ? `Edit: ${product.name}` : 'Add New Product'}
                        </h2>
                        <p className="text-gray-600 text-xs mt-0.5">
                            {isEdit ? 'Update product details, variants, and images' : 'Fill in all sections to publish your product'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800">
                        ×
                    </button>
                </div>

                {/* ── Tabs ── */}
                <div className="flex border-b border-gray-800 px-7">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                                tab === t.key
                                    ? 'text-indigo-300 border-indigo-500'
                                    : 'text-gray-500 border-transparent hover:text-gray-300'
                            }`}
                        >
                            <span>{t.icon}</span>
                            <span>{t.label}</span>
                            {tabStatus[t.key] === 'done' && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Tab Content ── */}
                <div className="px-7 py-6">
                    {tab === 'info' && (
                        <BasicInfoTab
                            data={form}
                            onChange={setField}
                            categories={categories}
                            sizeCharts={sizeCharts}
                        />
                    )}
                    {tab === 'variants' && (
                        <VariantsTab
                            variants={variants}
                            onChange={setVariants}
                            savedVariants={variants.filter(v => v.id)}
                        />
                    )}
                    {tab === 'images' && (
                        <ImagesTab
                            images={images}
                            onChange={setImages}
                            variants={variants}
                        />
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-between px-7 py-4 border-t border-gray-800 bg-gray-900/40 rounded-b-2xl">
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                        {tabs.map(t => (
                            <span key={t.key} className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${tabStatus[t.key] === 'done' ? 'bg-emerald-400' : 'bg-gray-700'}`} />
                                {t.label.split('(')[0].trim()}
              </span>
                        ))}
                    </div>

                    {error && (
                        <p className="text-red-400 text-xs max-w-xs truncate">{error}</p>
                    )}

                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800">
                            Cancel
                        </button>

                        {/* Tab navigation */}
                        {tab !== 'images' && (
                            <button
                                onClick={() => setTab(tab === 'info' ? 'variants' : 'images')}
                                className="px-4 py-2 text-sm text-indigo-300 border border-indigo-700 hover:border-indigo-500 rounded-lg transition-colors"
                            >
                                Next: {tab === 'info' ? 'Variants →' : 'Images →'}
                            </button>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={saving || !form.name || !form.price}
                            className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
                        >
                            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}