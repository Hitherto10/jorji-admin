export const categoriesTables = {
  categories: {
    label: 'Categories',
    icon: '📂',
    primaryKey: 'id',
    displayField: 'name',
    fields: [
      { key: 'id', label: 'ID', type: 'text', readonly: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'image_url', label: 'Image URL', type: 'text' },
      { key: 'parent_id', label: 'Parent Category', type: 'uuid', fk: { table: 'categories', labelField: 'name' } },
      { key: 'sort_order', label: 'Sort Order', type: 'number', defaultValue: 0 },
      { key: 'is_active', label: 'Active', type: 'boolean', defaultValue: true },
      { key: 'created_at', label: 'Created At', type: 'datetime', readonly: true },
    ],
  },

  collections: {
    label: 'Collections',
    icon: '✨',
    primaryKey: 'id',
    displayField: 'name',
    fields: [
      { key: 'id', label: 'ID', type: 'text', readonly: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'image_url', label: 'Image URL', type: 'text' },
      { key: 'is_active', label: 'Active', type: 'boolean', defaultValue: true },
      { key: 'sort_order', label: 'Sort Order', type: 'number', defaultValue: 0 },
      { key: 'created_at', label: 'Created At', type: 'datetime', readonly: true },
    ],
  },

  collection_products: {
    label: 'Collection → Products',
    icon: '🔗',
    primaryKey: null,
    displayField: 'collection_id',
    compositePK: ['collection_id', 'product_id'],
    fields: [
      { key: 'collection_id', label: 'Collection', type: 'uuid', required: true, fk: { table: 'collections', labelField: 'name' } },
      { key: 'product_id', label: 'Product', type: 'uuid', required: true, fk: { table: 'products', labelField: 'name' } },
      { key: 'sort_order', label: 'Sort Order', type: 'number', defaultValue: 0 },
    ],
  },

  size_charts: {
    label: 'Size Charts',
    icon: '📏',
    primaryKey: 'id',
    displayField: 'name',
    fields: [
      { key: 'id', label: 'ID', type: 'text', readonly: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'headers', label: 'Headers (comma separated)', type: 'array' },
      { key: 'rows', label: 'Rows (JSON array of arrays)', type: 'json' },
      { key: 'created_at', label: 'Created At', type: 'datetime', readonly: true },
    ],
  },
}
