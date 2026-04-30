import { SECTIONS, CONF_ORDER, CONF_LABELS } from '../db/seed'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { teamColor } from '../utils'

function SectionItem({ section, active, onClick }) {
  const collected = useLiveQuery(
    () => db.stickers.where('teamCode').equals(section.code).filter(s => s.quantity > 0).count(),
    [section.code]
  ) ?? 0
  const total = section.count
  const done  = collected === total && total > 0

  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-100',
        'hover:bg-slate-700/60 active:scale-95',
        active ? 'bg-slate-700 ring-1 ring-slate-600' : ''
      ].join(' ')}
    >
      <span className="text-xl shrink-0 leading-none">{section.flag}</span>
      <span className={[
        'text-xs font-bold tracking-wider flex-1 truncate',
        active ? `text-${teamColor(section.code)}-300` : 'text-slate-300'
      ].join(' ')}>
        {section.code}
      </span>
      {done ? (
        <span className="text-[9px] text-emerald-400 font-bold shrink-0">✓</span>
      ) : collected > 0 ? (
        <span className="text-[9px] text-slate-500 shrink-0 tabular-nums">{collected}</span>
      ) : null}
    </button>
  )
}

export default function Sidebar({ selected, onSelect, open, onClose }) {
  const grouped = CONF_ORDER.reduce((acc, conf) => {
    const items = SECTIONS.filter(s => s.conf === conf)
    if (items.length) acc[conf] = items
    return acc
  }, {})

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside className={[
        'fixed top-0 left-0 h-full w-[72px] bg-slate-900 border-r border-slate-800',
        'flex flex-col z-30 transition-transform duration-200',
        'lg:relative lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ].join(' ')}>
        {/* Logo */}
        <div className="flex items-center justify-center py-4 border-b border-slate-800 shrink-0">
          <span className="text-2xl">⚽</span>
        </div>

        {/* Teams list */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-thin">
          {CONF_ORDER.map(conf => {
            const items = grouped[conf]
            if (!items) return null
            return (
              <div key={conf} className="mb-1">
                <p className="text-[8px] text-slate-600 font-bold tracking-widest uppercase px-3 py-1">
                  {CONF_LABELS[conf]}
                </p>
                {items.map(section => (
                  <SectionItem
                    key={section.code}
                    section={section}
                    active={selected === section.code}
                    onClick={() => { onSelect(section.code); onClose?.() }}
                  />
                ))}
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
