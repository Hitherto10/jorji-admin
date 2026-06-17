import { useState } from 'react'
import { TABLES, TABLE_GROUPS } from './config/tables'
import TableView from './components/TableView'
import ProductsTable from './components/ProductsTable'
import Login from './components/Login'
import { isAuthenticated, clearToken } from './lib/auth.js'
import white_logo from './assets/white-logo.png'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated)
  const [activeTable, setActiveTable] = useState('products')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />
  }

  const tableDef = TABLES[activeTable]

  const handleLogout = () => {
    clearToken()
    setAuthed(false)
  }

  return (
    <div className="flex h-screen text-gray-100 overflow-hidden font-[Bricolage_Grotesque]">

      {/* Sidebar */}
      <aside className={`shrink-0 flex flex-col border-r border-gray-800 transition-all duration-200 ${
        sidebarOpen ? 'w-56' : 'w-12'
      }`}>

        {/* Brand */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-gray-800">
          {sidebarOpen && (
              <img className="w-4/5" alt="" src={white_logo} />
          )}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="text-gray-600 hover:text-gray-300 transition-colors text-xl leading-none ml-auto"
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            {sidebarOpen ? <ChevronLeft className="w-5" /> : <ChevronRight className="w-5" />}
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
                    <span className="text-base shrink-0">{def.icon}</span>
                    {sidebarOpen && <span className="truncate">{def.label}</span>}
                  </button>
                )
              })}
              {sidebarOpen && <div className="h-px bg-gray-800/60 mx-3 mt-1" />}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-800 p-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-300 hover:bg-gray-800/50 rounded transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-800 bg-gray-950/80 shrink-0">
          <span className="text-xl">{tableDef.icon}</span>
          <h1 className="text-white font-semibold">{tableDef.label}</h1>
          <span className="text-gray-600 text-sm ml-1">/ {activeTable}</span>
        </div>

        {/* Table view fills remaining space */}
        <div className="flex-1 overflow-hidden">
          {activeTable === 'products' ? (
            <ProductsTable />
          ) : (
            <TableView
              key={activeTable}
              tableKey={activeTable}
              tableDef={tableDef}
            />
          )}
        </div>
      </main>
    </div>
  )
}
