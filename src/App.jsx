import { useState } from 'react'
import { TABLES, TABLE_GROUPS } from './config/tables'
import TableView from './components/TableView'

export default function App() {
  const [activeTable, setActiveTable] = useState('products')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const tableDef = TABLES[activeTable]

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-mono overflow-hidden">

      {/* Sidebar */}
      <aside className={`flex-shrink-0 flex flex-col border-r border-gray-800 transition-all duration-200 ${
        sidebarOpen ? 'w-56' : 'w-12'
      }`}>

        {/* Brand */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-gray-800">
          {sidebarOpen && (
            <span className="text-indigo-400 font-semibold text-sm tracking-tight">
              JorjiMara Admin
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="text-gray-600 hover:text-gray-300 transition-colors text-lg leading-none ml-auto"
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            {sidebarOpen ? '‹' : '›'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {TABLE_GROUPS.map(group => (
            <div key={group.label} className="mb-1">
              {sidebarOpen && (
                <div className="px-3 py-1.5 text-xs text-gray-600 uppercase tracking-widest font-medium">
                  {group.label}
                </div>
              )}
              {group.tables.map(key => {
                const def = TABLES[key]
                const isActive = activeTable === key
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTable(key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-300 border-r-2 border-indigo-500'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                    }`}
                    title={!sidebarOpen ? def.label : undefined}
                  >
                    <span className="text-base flex-shrink-0">{def.icon}</span>
                    {sidebarOpen && (
                      <span className="truncate">{def.label}</span>
                    )}
                  </button>
                )
              })}
              {sidebarOpen && <div className="h-px bg-gray-800/60 mx-3 mt-1" />}
            </div>
          ))}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="px-3 py-3 border-t border-gray-800">
            <div className="text-xs text-gray-700">Internal tool — no auth</div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-800 bg-gray-950/80 flex-shrink-0">
          <span className="text-xl">{tableDef.icon}</span>
          <h1 className="text-white font-semibold">{tableDef.label}</h1>
          <span className="text-gray-600 text-sm ml-1">/ {activeTable}</span>
        </div>

        {/* Table view fills remaining space */}
        <div className="flex-1 overflow-hidden">
          <TableView
            key={activeTable}
            tableKey={activeTable}
            tableDef={tableDef}
          />
        </div>
      </main>
    </div>
  )
}
