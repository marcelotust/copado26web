// src/pages/LoginPage.jsx
// @ts-nocheck
import { useState } from 'react'
import { MagicLinkForm } from '../components/MagicLinkForm'
import { MagicLinkSent } from '../components/MagicLinkSent'

export default function LoginPage({ onSendLink, magicLinkSent, error }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(emailValue) {
    setEmail(emailValue)
    setSending(true)
    await onSendLink(emailValue)
    setSending(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      {magicLinkSent
        ? <MagicLinkSent email={email} />
        : <MagicLinkForm onSubmit={handleSubmit} error={error} loading={sending} />
      }
    </div>
  )
}
