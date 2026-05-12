// src/components/MagicLinkForm.jsx
import { useState } from 'react'

export function MagicLinkForm({ onSubmit, error, loading }) {
  const [email, setEmail] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (email.trim()) onSubmit(email.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold text-white">WC 2026 Album</h1>
        <p className="text-slate-400 text-sm mt-1">Enter your email to receive a login link</p>
      </div>

      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="px-4 py-3 rounded-lg bg-slate-700 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:border-blue-500"
      />

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Sending…' : 'Send login link'}
      </button>
    </form>
  )
}
