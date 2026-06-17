import { useState, useEffect } from 'react'
import { tableService } from '../admin/shared/services'

// ─── helpers ────────────────────────────────────────────────────────────────

function slugify(str) {
    return str.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

function uid() { return Math.random().toString(36).slice(2) }

/**
 * Auto-generates a SKU from color name + size.
 * "White & Blue", "XS"  →  "WHIBLU-XS"
 */
function autoSku(color, size) {
    const words = (color || '').split(/[\s&]+/).filter(Boolean)
    const col = words.map(w => w.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3))
        .join('').toUpperCase().slice(0, 6)
    const sz = (size || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4)
    if (col && sz)  return `${col}-${sz}`
    if (col)        return `${col}-${uid().slice(0, 4).toUpperCase()}`
    if (sz)         return `${uid().slice(0, 4).toUpperCase()}-${sz}`
    return uid().slice(0, 8).toUpperCase()
}

/**
 * When editing an existing product, group the flat DB rows by color+option
 * so they map onto the "one card per colour" UI.
 */
function groupVariantsFromDB(dbVariants) {
    const groups = []
    const map = new Map()

    for (const v of dbVariants) {
        const key = `${v.color ?? ''}||${v.option_name ?? ''}||${v.option_value ?? ''}`
        if (!map.has(key)) {
            const g = {
                _gid: uid(),
                color:        v.color        || '',
                color_hex:    Array.isArray(v.color_hex) ? v.color_hex : [],
                price:        v.price        ?? '',
                is_active:    v.is_active    ?? true,
                option_name:  v.option_name  || '',
                option_value: v.option_value || '',
                sizes: [],
            }
            groups.push(g)
            map.set(key, g)
        }
        map.get(key).sizes.push({
            _sid:  uid(),
            id:    v.id,          // real DB id — needed for UPDATE
            size:  v.size  || '',
            stock: v.stock ?? 0,
            sku:   v.sku   || '',
        })
    }
    return groups
}

const CLOUDINARY_PREFIX = 'https://res.cloudinary.com/duqj7bubb/'

function isValidImageUrl(url) {
    return !url || url.startsWith(CLOUDINARY_PREFIX)
}

// ─── defaults ────────────────────────────────────────────────────────────────

const DEFAULT_CONTENT_SECTIONS = {
    fulfillment: {
        policy: {
            body: 'We currently do not offer returns or refunds, all sales are final!\n\nPlease see our full Shipping & Refunds Policy for further details.',
        },
        shipping: {
            body: 'As all our items are handmade, please allow 2-5 weeks for your item to be sent out. Once your order has shipped, you will receive an email with further information. Delivery times vary depending on your location.',
            'estimated time': '2-5 weeks',
        },
    },
    laundryGuide: 'https://res.cloudinary.com/duqj7bubb/image/upload/v1779484892/laundry-guide_eezneh.png',
    careInstructions: 'https://res.cloudinary.com/duqj7bubb/image/upload/v1779484891/care-instructions_uloq8d.png',
    compositionAndMaterials: [],
}

function mergeContentSections(existing) {
    if (!existing || Array.isArray(existing) || typeof existing !== 'object') {
        return structuredClone(DEFAULT_CONTENT_SECTIONS)
    }
    return {
        fulfillment: {
            policy:   { body: existing.fulfillment?.policy?.body   ?? DEFAULT_CONTENT_SECTIONS.fulfillment.policy.body },
            shipping: {
                body:              existing.fulfillment?.shipping?.body             ?? DEFAULT_CONTENT_SECTIONS.fulfillment.shipping.body,
                'estimated time':  existing.fulfillment?.shipping?.['estimated time'] ?? DEFAULT_CONTENT_SECTIONS.fulfillment.shipping['estimated time'],
            },
        },
        laundryGuide:      existing.laundryGuide      ?? DEFAULT_CONTENT_SECTIONS.laundryGuide,
        careInstructions:  existing.careInstructions  ?? DEFAULT_CONTENT_SECTIONS.careInstructions,
        compositionAndMaterials: Array.isArray(existing.compositionAndMaterials)
            ? existing.compositionAndMaterials
            : [],
    }
}

const EMPTY_PRODUCT = {
    name: '', slug: '', description: '', price: '', compare_price: '',
    currency: 'NGN', category_id: null, size_chart_id: null,
    is_active: true, is_featured: false, is_new_in: false,
    tags: [], meta_title: '', meta_desc: '',
    content_sections: structuredClone(DEFAULT_CONTENT_SECTIONS),
}

const EMPTY_IMAGE = {
    _id: '', url: '', alt_text: '', sort_order: 0, is_primary: false, variant_id: null,
}

function emptyGroup() {
    return {
        _gid: uid(),
        color: '', color_hex: [],
        sizes: [{ _sid: uid(), size: '', stock: 0, sku: '' }],
        price: '', is_active: true, option_name: '', option_value: '',
    }
}

const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size']

// ─── shared style constants ──────────────────────────────────────────────────

const inputCls = `w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3.5 py-2.5 text-sm text-gray-100
  focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30
  placeholder:text-gray-600 transition-colors`

const selectCls = inputCls + ' cursor-pointer'

// ─── small reusable pieces ───────────────────────────────────────────────────

function Toggle({ value, onChange, label }) {
    return (
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div onClick={() => onChange(!value)}
                 className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${value ? 'bg-indigo-500' : 'bg-gray-700'}`}>
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

/** Individual hex colour swatches with live preview */
function HexColorInputs({ values, onChange }) {
    const add    = ()       => onChange([...values, ''])
    const remove = (i)      => onChange(values.filter((_, idx) => idx !== i))
    const update = (i, v)   => { const n = [...values]; n[i] = v; onChange(n) }

    return (
        <div className="space-y-2">
            {values.map((hex, i) => (
                <div key={i} className="flex items-center gap-2">
                    {/* Live colour swatch */}
                    <div
                        className="w-7 h-7 rounded-md border border-gray-600 flex-shrink-0 transition-colors"
                        style={{ backgroundColor: /^#[0-9A-Fa-f]{3,6}$/.test(hex) ? hex : '#1f2937' }}
                    />
                    <input
                        className={inputCls + ' flex-1 font-mono'}
                        value={hex}
                        onChange={e => update(i, e.target.value)}
                        placeholder="#000000"
                        maxLength={7}
                    />
                    <button onClick={() => remove(i)}
                            className="text-gray-600 hover:text-red-400 text-xl leading-none w-6 flex-shrink-0 transition-colors">
                        ×
                    </button>
                </div>
            ))}
            <button onClick={add}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                + Add Colour
            </button>
        </div>
    )
}

/** Size rows — each row becomes one product_variant record in the DB */
function SizeRows({ sizes, onChange, colorName }) {
    const addSize    = ()      => onChange([...sizes, { _sid: uid(), size: '', stock: 0, sku: '' }])
    const removeSize = (i)     => onChange(sizes.filter((_, idx) => idx !== i))
    const updateSize = (i, k, v) => {
        const n = [...sizes]; n[i] = { ...n[i], [k]: v }; onChange(n)
    }

    const addPresets = () => {
        const existing = new Set(sizes.map(s => s.size))
        const toAdd = SIZE_PRESETS.filter(p => !existing.has(p))
            .map(size => ({ _sid: uid(), size, stock: 0, sku: '' }))
        if (toAdd.length) onChange([...sizes, ...toAdd])
    }

    return (
        <div className="space-y-2">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_90px_1fr_28px] gap-2 text-xs text-gray-500 uppercase tracking-wide px-0.5">
                <span>Size</span><span>Stock</span><span>SKU (leave blank to auto)</span><span />
            </div>

            {sizes.map((s, i) => (
                <div key={s._sid || i} className="grid grid-cols-[1fr_90px_1fr_28px] gap-2 items-center">
                    <input
                        list="size-presets-list"
                        className={inputCls}
                        value={s.size}
                        onChange={e => updateSize(i, 'size', e.target.value)}
                        placeholder="e.g. M"
                    />
                    <input
                        type="number"
                        className={inputCls}
                        value={s.stock}
                        min="0"
                        onChange={e => updateSize(i, 'stock', Number(e.target.value))}
                    />
                    <input
                        className={inputCls + ' font-mono text-xs'}
                        value={s.sku}
                        onChange={e => updateSize(i, 'sku', e.target.value)}
                        placeholder={autoSku(colorName, s.size) || 'Auto-generated'}
                    />
                    <button onClick={() => removeSize(i)}
                            className="text-gray-600 hover:text-red-400 text-xl leading-none flex items-center justify-center transition-colors">
                        ×
                    </button>
                </div>
            ))}

            <datalist id="size-presets-list">
                {SIZE_PRESETS.map(s => <option key={s} value={s} />)}
            </datalist>

            <div className="flex items-center gap-3 pt-1">
                <button onClick={addSize}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    + Add Size
                </button>
                <span className="text-gray-700 text-xs">or</span>
                <button onClick={addPresets}
                        className="text-xs text-gray-500 hover:text-gray-300 border border-gray-700 hover:border-gray-500 px-2 py-1 rounded transition-colors">
                    + Quick-add XS → XXL
                </button>
            </div>
        </div>
    )
}

// ─── TAB: Basic Info ─────────────────────────────────────────────────────────

function BasicInfoTab({ data, onChange, categories, sizeCharts }) {
    const handleName = (v) => {
        onChange('name', v)
        if (!data._slugEdited) onChange('slug', slugify(v))
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <Field label="Product Name" required>
                    <input className={inputCls} value={data.name}
                           onChange={e => handleName(e.target.value)} placeholder="e.g. Classic Linen Shirt" />
                </Field>
                <Field label="Slug" required hint="Auto-generated from name, but editable">
                    <input className={inputCls} value={data.slug}
                           onChange={e => { onChange('slug', e.target.value); onChange('_slugEdited', true) }}
                           placeholder="classic-linen-shirt" />
                </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <Field label="Price (₦)" required>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                        <input type="number" className={inputCls + ' pl-7'} value={data.price}
                               onChange={e => onChange('price', e.target.value)} placeholder="0.00" step="0.01" min="0" />
                    </div>
                </Field>
                <Field label="Compare-at Price (₦)" hint="Shown as crossed-out price">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                        <input type="number" className={inputCls + ' pl-7'} value={data.compare_price}
                               onChange={e => onChange('compare_price', e.target.value)} placeholder="0.00" step="0.01" min="0" />
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

            <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                    <select className={selectCls} value={data.category_id || ''}
                            onChange={e => onChange('category_id', e.target.value || null)}>
                        <option value="">— None —</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </Field>
                <Field label="Size Chart">
                    <select className={selectCls} value={data.size_chart_id || ''}
                            onChange={e => onChange('size_chart_id', e.target.value || null)}>
                        <option value="">— None —</option>
                        {sizeCharts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </Field>
            </div>

            <Field label="Description">
                <textarea className={inputCls + ' min-h-[120px] resize-y'} value={data.description}
                          onChange={e => onChange('description', e.target.value)}
                          placeholder="Describe this product…" rows={5} />
            </Field>

            <Field label="Tags" hint="Comma-separated (e.g. summer, cotton, casual)">
                <input className={inputCls}
                       value={Array.isArray(data.tags) ? data.tags.join(', ') : ''}
                       onChange={e => onChange('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                       placeholder="summer, cotton, casual" />
            </Field>

            <div className="flex flex-wrap gap-6 pt-2">
                <Toggle value={data.is_active}   onChange={v => onChange('is_active', v)}   label="Active (visible on store)" />
                <Toggle value={data.is_featured} onChange={v => onChange('is_featured', v)} label="Featured" />
                <Toggle value={data.is_new_in}   onChange={v => onChange('is_new_in', v)}   label="New In" />
            </div>

            <div className="border-t border-gray-800 pt-5 space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">SEO (optional)</p>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Meta Title">
                        <input className={inputCls} value={data.meta_title}
                               onChange={e => onChange('meta_title', e.target.value)}
                               placeholder="Leave blank to use product name" />
                    </Field>
                    <Field label="Meta Description">
                        <input className={inputCls} value={data.meta_desc}
                               onChange={e => onChange('meta_desc', e.target.value)}
                               placeholder="Short description for search engines" />
                    </Field>
                </div>
            </div>
        </div>
    )
}

// ─── TAB: Variants ───────────────────────────────────────────────────────────
// One card = one colour group.  Each size row inside the card = one DB row.

function VariantsTab({ groups, onChange }) {
    const addGroup    = ()      => onChange([...groups, emptyGroup()])
    const removeGroup = (gi)    => onChange(groups.filter((_, i) => i !== gi))
    const updateGroup = (gi, k, v) => {
        const n = [...groups]; n[gi] = { ...n[gi], [k]: v }; onChange(n)
    }

    const totalRows = groups.reduce((s, g) => s + g.sizes.length, 0)

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-300 font-medium">Product Variants</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                        Each colour / option is one card. Each size row creates one separate record in the database.
                        {totalRows > 0 && <span className="text-indigo-400 ml-1">({totalRows} DB rows)</span>}
                    </p>
                </div>
                <button onClick={addGroup}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors font-medium flex-shrink-0">
                    <span className="text-base leading-none">+</span> Add Colour / Option
                </button>
            </div>

            {groups.length === 0 && (
                <div className="border border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center py-12 text-gray-600">
                    <span className="text-3xl mb-2">🎨</span>
                    <p className="text-sm">No variants yet. Click "Add Colour / Option" to start.</p>
                    <p className="text-xs mt-1 text-gray-700">Each colour you add can have multiple sizes — each size becomes its own database row.</p>
                </div>
            )}

            {groups.map((g, gi) => (
                <div key={g._gid} className="bg-gray-800/50 border border-gray-700/60 rounded-xl p-5 space-y-5">

                    {/* Card header */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Colour / Option {gi + 1}
                            {g.color && <span className="text-gray-300 normal-case font-normal ml-2">— {g.color}</span>}
                        </span>
                        <button onClick={() => removeGroup(gi)} className="text-red-500 hover:text-red-400 text-xs transition-colors">
                            Remove
                        </button>
                    </div>

                    {/* Colour row */}
                    <div className="grid grid-cols-2 gap-5">
                        <Field label="Colour Name">
                            <input className={inputCls} value={g.color}
                                   onChange={e => updateGroup(gi, 'color', e.target.value)}
                                   placeholder="e.g. Midnight Black" />
                        </Field>
                        <Field label="Hex Colour(s)" hint="One swatch per hex value — click + Add Colour for each">
                            <HexColorInputs
                                values={g.color_hex}
                                onChange={v => updateGroup(gi, 'color_hex', v)}
                            />
                        </Field>
                    </div>

                    {/* Sizes — one row per DB record */}
                    <div className="border-t border-gray-700/60 pt-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                            Sizes <span className="text-gray-600 normal-case font-normal">(each row = one database record)</span>
                        </p>
                        <SizeRows
                            sizes={g.sizes}
                            colorName={g.color}
                            onChange={v => updateGroup(gi, 'sizes', v)}
                        />
                    </div>

                    {/* Price + option + active */}
                    <div className="border-t border-gray-700/60 pt-4 grid grid-cols-3 gap-4 items-end">
                        <Field label="Price Override (₦)" hint="Leave blank to use product price">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                                <input type="number" className={inputCls + ' pl-7'} value={g.price || ''}
                                       onChange={e => updateGroup(gi, 'price', e.target.value || null)}
                                       placeholder="—" step="0.01" min="0" />
                            </div>
                        </Field>
                        <Field label="Option Name" hint="e.g. Material, Style">
                            <input className={inputCls} value={g.option_name}
                                   onChange={e => updateGroup(gi, 'option_name', e.target.value)}
                                   placeholder="Material" />
                        </Field>
                        <Field label="Option Value">
                            <input className={inputCls} value={g.option_value}
                                   onChange={e => updateGroup(gi, 'option_value', e.target.value)}
                                   placeholder="Cotton" />
                        </Field>
                    </div>

                    <div className="pt-1">
                        <Toggle value={g.is_active}
                                onChange={v => updateGroup(gi, 'is_active', v)} label="All sizes in this group active" />
                    </div>
                </div>
            ))}
        </div>
    )
}

// ─── TAB: Images ─────────────────────────────────────────────────────────────

function ImagesTab({ images, onChange, variantGroups }) {
    const addImage    = ()      => onChange([...images, { ...EMPTY_IMAGE, _id: uid(), sort_order: images.length }])
    const removeImage = (idx)   => onChange(images.filter((_, i) => i !== idx))
    const updateImage = (idx, k, v) => { const n = [...images]; n[idx] = { ...n[idx], [k]: v }; onChange(n) }
    const setPrimary  = (idx)   => onChange(images.map((img, i) => ({ ...img, is_primary: i === idx })))

    // Flatten groups → sizes for the variant selector
    const allSizes = variantGroups.flatMap(g =>
        g.sizes.map(s => ({
            localId: s._sid,
            dbId:    s.id,
            label:   [g.color, s.size].filter(Boolean).join(' / ') || 'Unnamed variant',
        }))
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-300 font-medium">Product Images</p>
                    <p className="text-xs text-gray-600 mt-0.5">Add image URLs, set a primary image, and optionally link to a specific variant.</p>
                </div>
                <button onClick={addImage}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors font-medium">
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
                            <div className="flex-shrink-0 w-20 h-20 bg-gray-900 rounded-lg border border-gray-700 overflow-hidden flex items-center justify-center">
                                {img.url
                                    ? <img src={img.url} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                                    : <span className="text-gray-700 text-2xl">🖼</span>
                                }
                            </div>

                            <div className="flex-1 space-y-2.5">
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Image URL" required>
                                        <input
                                            className={inputCls + (!isValidImageUrl(img.url) ? ' border-red-500 focus:border-red-500 focus:ring-red-500/30' : '')}
                                            value={img.url}
                                            onChange={e => updateImage(idx, 'url', e.target.value)}
                                            placeholder="https://res.cloudinary.com/duqj7bubb/…" />
                                        {!isValidImageUrl(img.url) && (
                                            <p className="text-xs text-red-400 mt-1">Invalid source — URL must begin with https://res.cloudinary.com/duqj7bubb/</p>
                                        )}
                                    </Field>
                                    <Field label="Alt Text" hint="For accessibility & SEO">
                                        <input className={inputCls} value={img.alt_text || ''}
                                               onChange={e => updateImage(idx, 'alt_text', e.target.value)}
                                               placeholder="Describe the image…" />
                                    </Field>
                                </div>
                                <div className="grid grid-cols-3 gap-3 items-end">
                                    <Field label="Sort Order">
                                        <input type="number" className={inputCls} value={img.sort_order} min="0"
                                               onChange={e => updateImage(idx, 'sort_order', Number(e.target.value))} />
                                    </Field>
                                    {allSizes.length > 0 && (
                                        <Field label="Linked Variant" hint="Optional — ties image to one size">
                                            <select className={selectCls} value={img.variant_id || ''}
                                                    onChange={e => updateImage(idx, 'variant_id', e.target.value || null)}>
                                                <option value="">— All variants —</option>
                                                {allSizes.map(s => (
                                                    <option key={s.localId} value={s.localId}>{s.label}</option>
                                                ))}
                                            </select>
                                        </Field>
                                    )}
                                    <div className="flex items-center gap-4 pb-0.5">
                                        <Toggle value={img.is_primary} onChange={() => setPrimary(idx)} label="Primary" />
                                        <button onClick={() => removeImage(idx)}
                                                className="text-red-500 hover:text-red-400 text-xs transition-colors ml-auto">
                                            Remove
                                        </button>
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

// ─── TAB: Content Sections ───────────────────────────────────────────────────

function ContentSectionsTab({ data, onChange }) {
    const cs = data.content_sections
    const set = (path, value) => {
        const updated = structuredClone(cs)
        const keys = path.split('.')
        let cur = updated
        for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]]
        cur[keys[keys.length - 1]] = value
        onChange('content_sections', updated)
    }

    const addMaterial = () => {
        const mats = [...(cs.compositionAndMaterials || []), { component: '', percentage: '' }]
        onChange('content_sections', { ...cs, compositionAndMaterials: mats })
    }
    const removeMaterial = (i) => {
        const mats = cs.compositionAndMaterials.filter((_, idx) => idx !== i)
        onChange('content_sections', { ...cs, compositionAndMaterials: mats })
    }
    const updateMaterial = (i, key, value) => {
        const mats = cs.compositionAndMaterials.map((m, idx) => idx === i ? { ...m, [key]: value } : m)
        onChange('content_sections', { ...cs, compositionAndMaterials: mats })
    }

    return (
        <div className="space-y-8">

            {/* Fulfillment — pre-filled defaults */}
            <div className="space-y-4">
                <div>
                    <p className="text-sm text-gray-300 font-medium">Fulfillment</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                        These are pre-filled with standard copy. Leave as-is or customise per product.
                    </p>
                </div>

                <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 space-y-4">
                    <Field label="Returns & Refunds Policy">
                        <textarea className={inputCls + ' min-h-[80px] resize-y'}
                                  value={cs.fulfillment?.policy?.body ?? ''}
                                  onChange={e => set('fulfillment.policy.body', e.target.value)}
                                  rows={3} />
                    </Field>
                    <Field label="Shipping Info">
                        <textarea className={inputCls + ' min-h-[80px] resize-y'}
                                  value={cs.fulfillment?.shipping?.body ?? ''}
                                  onChange={e => set('fulfillment.shipping.body', e.target.value)}
                                  rows={3} />
                    </Field>
                    <Field label="Estimated Delivery Time" hint='Shown as a badge (e.g. "2-5 weeks")'>
                        <input className={inputCls}
                               value={cs.fulfillment?.shipping?.['estimated time'] ?? ''}
                               onChange={e => set('fulfillment.shipping.estimated time', e.target.value)}
                               placeholder="2-5 weeks" />
                    </Field>
                </div>
            </div>

            {/* Laundry Guide + Care Instructions */}
            <div className="space-y-4">
                <div>
                    <p className="text-sm text-gray-300 font-medium">Laundry Guide & Care Instructions</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                        Standard images used across all products. Change the URL only if you need a different image.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: 'Laundry Guide', field: 'laundryGuide' },
                        { label: 'Care Instructions', field: 'careInstructions' },
                    ].map(({ label, field }) => (
                        <div key={field} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 space-y-3">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
                            {cs[field] && (
                                <div className="w-full h-28 bg-gray-900 rounded-lg border border-gray-700 overflow-hidden flex items-center justify-center">
                                    <img src={cs[field]} alt={label}
                                         className="h-full w-full object-contain"
                                         onError={e => { e.target.style.display = 'none' }} />
                                </div>
                            )}
                            <input className={inputCls + ' text-xs'}
                                   value={cs[field] || ''}
                                   onChange={e => onChange('content_sections', { ...cs, [field]: e.target.value })}
                                   placeholder="https://res.cloudinary.com/duqj7bubb/…" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Composition & Materials */}
            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-gray-300 font-medium">Composition & Materials</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                            List each fibre / material with its percentage. At least one entry is recommended.
                        </p>
                    </div>
                    <button onClick={addMaterial}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors font-medium flex-shrink-0">
                        <span className="text-base leading-none">+</span> Add Material
                    </button>
                </div>

                {cs.compositionAndMaterials.length === 0 && (
                    <div className="border border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center py-10 text-gray-600">
                        <p className="text-sm">No materials added yet.</p>
                        <p className="text-xs mt-1 text-gray-700">e.g. Swallow yarn 60%, Milk fibre 30%, Long-staple cotton 10%</p>
                    </div>
                )}

                {cs.compositionAndMaterials.length > 0 && (
                    <div className="space-y-2">
                        <div className="grid grid-cols-[1fr_120px_28px] gap-2 text-xs text-gray-500 uppercase tracking-wide px-0.5">
                            <span>Component</span><span>Percentage</span><span />
                        </div>
                        {cs.compositionAndMaterials.map((m, i) => (
                            <div key={i} className="grid grid-cols-[1fr_120px_28px] gap-2 items-center">
                                <input className={inputCls}
                                       value={m.component}
                                       onChange={e => updateMaterial(i, 'component', e.target.value)}
                                       placeholder="e.g. Swallow yarn" />
                                <input className={inputCls}
                                       value={m.percentage}
                                       onChange={e => updateMaterial(i, 'percentage', e.target.value)}
                                       placeholder="e.g. 60%" />
                                <button onClick={() => removeMaterial(i)}
                                        className="text-gray-600 hover:text-red-400 text-xl leading-none flex items-center justify-center transition-colors">
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function ProductEditor({ product = null, onClose, onSaved }) {
    const isEdit = !!product?.id
    const [tab, setTab]       = useState('info')
    const [saving, setSaving] = useState(false)
    const [error, setError]   = useState(null)

    const [form, setForm] = useState(() => {
        if (!product) return { ...EMPTY_PRODUCT, content_sections: structuredClone(DEFAULT_CONTENT_SECTIONS) }
        const clean = { ...EMPTY_PRODUCT, ...product }
        delete clean.totalStock; delete clean.mainImage; delete clean.category
        delete clean.sku; delete clean.mode
        clean.content_sections = mergeContentSections(product.content_sections)
        return clean
    })

    // variants is now an array of colour groups (not flat DB rows)
    const [variantGroups, setVariantGroups] = useState([])
    const [images,        setImages]        = useState([])
    const [categories,    setCategories]    = useState([])
    const [sizeCharts,    setSizeCharts]    = useState([])

    // Reference data
    useEffect(() => {
        tableService.get('categories',  { pageSize: 500, sortField: 'name', sortOrder: 'asc' })
            .then(({ data }) => setCategories(data || []))
        tableService.get('size_charts', { pageSize: 500, sortField: 'name', sortOrder: 'asc' })
            .then(({ data }) => setSizeCharts(data || []))
    }, [])

    // Load and group existing variants + images when editing
    useEffect(() => {
        if (!isEdit) return
        tableService.get('product_variants', {
            columnFilters: { product_id: product.id },
            pageSize: 500,
            sortField: 'created_at',
            sortOrder: 'asc',
        }).then(({ data }) => setVariantGroups(groupVariantsFromDB(data || [])))

        tableService.get('product_images', {
            columnFilters: { product_id: product.id },
            pageSize: 500,
            sortField: 'sort_order',
            sortOrder: 'asc',
        }).then(({ data }) => setImages((data || []).map(i => ({ ...i, _id: i.id }))))
    }, [isEdit, product?.id])

    const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

    // ── Save ─────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        setSaving(true)
        setError(null)

        try {
            // Validate image URLs
            const badImages = images.filter(img => img.url && !isValidImageUrl(img.url))
            if (badImages.length) {
                setError(`Image from invalid source: all images must begin with ${CLOUDINARY_PREFIX}`)
                setSaving(false)
                setTab('images')
                return
            }

            // 1. Upsert product
            const payload = {
                name: form.name, slug: form.slug, description: form.description || null,
                price: Number(form.price),
                compare_price: form.compare_price ? Number(form.compare_price) : null,
                currency: form.currency,
                category_id: form.category_id || null,
                size_chart_id: form.size_chart_id || null,
                is_active: form.is_active, is_featured: form.is_featured, is_new_in: form.is_new_in,
                tags: form.tags,
                meta_title: form.meta_title || null, meta_desc: form.meta_desc || null,
                content_sections: form.content_sections,
            }

            let productId
            if (isEdit) {
                await tableService.update('products', product.id, payload)
                productId = product.id
            } else {
                const created = await tableService.create('products', payload)
                productId = created.id
            }

            // 2. Flatten groups → size rows
            //    variantIdMap: local _sid → real DB id (used to resolve image variant_id)
            const variantIdMap = {}

            // Find which existing DB ids are no longer in the form
            if (isEdit) {
                const { data: existingVars } = await tableService.get('product_variants', {
                    columnFilters: { product_id: productId },
                    pageSize: 500,
                })
                const keptIds = variantGroups.flatMap(g => g.sizes.filter(s => s.id).map(s => s.id))
                const toDelete = (existingVars || []).filter(v => !keptIds.includes(v.id)).map(v => v.id)
                if (toDelete.length) await tableService.batchDelete('product_variants', toDelete)
            }

            for (const group of variantGroups) {
                for (const s of group.sizes) {
                    const sku = s.sku || autoSku(group.color, s.size)
                    const vPayload = {
                        product_id:   productId,
                        size:         s.size         || null,
                        color:        group.color     || null,
                        color_hex:    group.color_hex?.length ? group.color_hex : null,
                        sku,
                        stock:        Number(s.stock) || 0,
                        price:        group.price ? Number(group.price) : null,
                        is_active:    group.is_active,
                        option_name:  group.option_name  || null,
                        option_value: group.option_value || null,
                    }

                    if (s.id) {
                        // Existing row — update
                        await tableService.update('product_variants', s.id, vPayload)
                        variantIdMap[s._sid] = s.id
                    } else {
                        // New row — insert
                        const created = await tableService.create('product_variants', vPayload)
                        variantIdMap[s._sid] = created.id
                    }
                }
            }

            // 3. Sync images
            if (isEdit) {
                const { data: existingImgs } = await tableService.get('product_images', {
                    columnFilters: { product_id: productId },
                    pageSize: 500,
                })
                const keptImageIds = images.filter(i => i.id).map(i => i.id)
                const toDelete     = (existingImgs || []).filter(e => !keptImageIds.includes(e.id)).map(e => e.id)
                if (toDelete.length) await tableService.batchDelete('product_images', toDelete)
            }

            for (const img of images) {
                if (!img.url) continue
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
                    await tableService.update('product_images', img.id, imgPayload)
                } else {
                    await tableService.create('product_images', imgPayload)
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

    // ── Tabs ─────────────────────────────────────────────────────────────────

    const totalVariantRows = variantGroups.reduce((s, g) => s + g.sizes.length, 0)

    const hasMaterials = (form.content_sections?.compositionAndMaterials?.length ?? 0) > 0

    const tabs = [
        { key: 'info',     icon: '📋', label: 'Product Info' },
        { key: 'variants', icon: '🎨', label: `Variants${totalVariantRows ? ` (${totalVariantRows})` : ''}` },
        { key: 'images',   icon: '🖼️', label: `Images${images.length ? ` (${images.length})` : ''}` },
        { key: 'content',  icon: '📄', label: 'Content Sections' },
    ]

    const infoComplete = form.name && form.slug && form.price
    const tabStatus = {
        info:     infoComplete          ? 'done' : 'pending',
        variants: totalVariantRows > 0  ? 'done' : 'empty',
        images:   images.length > 0     ? 'done' : 'empty',
        content:  hasMaterials          ? 'done' : 'empty',
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 overflow-y-auto py-6 px-4">
            <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-4xl shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-gray-800">
                    <div>
                        <h2 className="text-white font-bold text-lg tracking-tight">
                            {isEdit ? `Edit: ${product.name}` : 'Add New Product'}
                        </h2>
                        <p className="text-gray-600 text-xs mt-0.5">
                            {isEdit
                                ? 'Update product details, variants, and images'
                                : 'Fill in all sections to publish your product'}
                        </p>
                    </div>
                    <button onClick={onClose}
                            className="text-gray-500 hover:text-white transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800">
                        ×
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800 px-7">
                    {tabs.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                                    tab === t.key
                                        ? 'text-indigo-300 border-indigo-500'
                                        : 'text-gray-500 border-transparent hover:text-gray-300'
                                }`}>
                            <span>{t.icon}</span>
                            <span>{t.label}</span>
                            {tabStatus[t.key] === 'done' && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="px-7 py-6">
                    {tab === 'info' && (
                        <BasicInfoTab data={form} onChange={setField}
                                      categories={categories} sizeCharts={sizeCharts} />
                    )}
                    {tab === 'variants' && (
                        <VariantsTab groups={variantGroups} onChange={setVariantGroups} />
                    )}
                    {tab === 'images' && (
                        <ImagesTab images={images} onChange={setImages} variantGroups={variantGroups} />
                    )}
                    {tab === 'content' && (
                        <ContentSectionsTab data={form} onChange={setField} />
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-7 py-4 border-t border-gray-800 bg-gray-900/40 rounded-b-2xl">
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                        {tabs.map(t => (
                            <span key={t.key} className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${tabStatus[t.key] === 'done' ? 'bg-emerald-400' : 'bg-gray-700'}`} />
                                {t.label.split('(')[0].trim()}
                            </span>
                        ))}
                    </div>

                    {error && <p className="text-red-400 text-xs max-w-xs truncate">{error}</p>}

                    <div className="flex items-center gap-3">
                        <button onClick={onClose}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800">
                            Cancel
                        </button>
                        {tab !== 'content' && (
                            <button onClick={() => setTab(tab === 'info' ? 'variants' : tab === 'variants' ? 'images' : 'content')}
                                    className="px-4 py-2 text-sm text-indigo-300 border border-indigo-700 hover:border-indigo-500 rounded-lg transition-colors">
                                Next: {tab === 'info' ? 'Variants →' : tab === 'variants' ? 'Images →' : 'Content →'}
                            </button>
                        )}
                        <button onClick={handleSave}
                                disabled={saving || !form.name || !form.price}
                                className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold">
                            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}