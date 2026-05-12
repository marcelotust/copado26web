// src/components/MagicLinkSent.jsx
export function MagicLinkSent({ email }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center max-w-sm">
      <div className="text-5xl">📬</div>
      <h2 className="text-xl font-bold text-white">Check your email</h2>
      <p className="text-slate-400 text-sm">
        We sent a login link to <span className="text-white font-medium">{email}</span>.
        Click it to sign in — no password needed.
      </p>
      <p className="text-slate-500 text-xs">The link expires in 1 hour.</p>
    </div>
  )
}
