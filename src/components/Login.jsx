import { useState } from 'react'
import { setToken, clearToken } from '../lib/auth.js'
import { api } from '../lib/api.js'
import white_logo from '../assets/white-logo.png'

export default function Login({ onSuccess }) {
  const [secret, setSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!secret.trim()) return
    setLoading(true)
    setError(null)

    // Temporarily set the token so api.js sends it, then verify it
    setToken(secret.trim())

    try {
      await api.get('/api/admin/auth/verify')
      onSuccess()
    } catch {
      // Bad secret — clear it and show error
      clearToken()
      setError('Incorrect admin secret. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">

        <div className="flex justify-center mb-8">
          <img src={white_logo} alt="Jorji Mara" className="h-8" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-white font-bold text-xl mb-1">Admin Access</h1>
          <p className="text-gray-500 text-sm mb-6">Enter your admin secret to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">
                Admin Secret
              </label>
              <input
                type="password"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                placeholder="••••••••••••"
                autoFocus
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-100
                  placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1
                  focus:ring-indigo-500/30 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !secret.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed
                text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Verifying…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          Jorji Mara Admin · Internal use only
        </p>
      </div>
    </div>
  )
}
