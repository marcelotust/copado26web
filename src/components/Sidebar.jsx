import { SECTIONS, CONF_ORDER } from '../db/seed'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { teamColor } from '../utils'
import { useI18n, LOCALE_META } from '../i18n'

function SectionItem({ section, active, onClick }) {
  const { t } = useI18n()

  const collected = useLiveQuery(
    () => db.stickers.where('teamCode').equals(section.code).filter(s => s.quantity > 0).count(),
    [section.code]
  ) ?? 0
  const total = section.count
  const done  = collected === total && total > 0
  const name  = t(`teams.${section.code}`)

  return (
    <button
      onClick={onClick}
      title={name}
      className={[
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-100',
        'hover:bg-slate-700/60 active:scale-95',
        active ? 'bg-slate-700 ring-1 ring-slate-600' : ''
      ].join(' ')}
    >
      {/* Flag — always visible */}
      <span className="text-lg shrink-0 leading-none w-6 text-center">{section.flag}</span>

      {/* Full name — desktop only */}
      <div className="hidden lg:flex flex-col flex-1 min-w-0">
        <span className={[
          'text-[11px] font-semibold truncate leading-tight',
          active ? `text-${teamColor(section.code)}-300` : 'text-slate-200'
        ].join(' ')}>
          {name}
        </span>
        <span className="text-[9px] text-slate-600 font-mono leading-none">{section.code}</span>
      </div>

      {/* Code initials — mobile only */}
      <span className={[
        'lg:hidden text-[9px] font-bold font-mono tracking-wide leading-none',
        active ? `text-${teamColor(section.code)}-300` : 'text-slate-500'
      ].join(' ')}>
        {section.code}
      </span>

      {/* Progress badge — desktop only */}
      <span className="hidden lg:inline text-[9px] shrink-0">
        {done
          ? <span className="text-emerald-400 font-bold">✓</span>
          : collected > 0
            ? <span className="text-slate-600 tabular-nums">{collected}</span>
            : null
        }
      </span>
    </button>
  )
}

export default function Sidebar({ selected, onSelect }) {
  const { locale, setLocale, t } = useI18n()

  const grouped = CONF_ORDER.reduce((acc, conf) => {
    const items = SECTIONS.filter(s => s.conf === conf)
    if (items.length) acc[conf] = items
    return acc
  }, {})

  return (
    // Mobile: w-14 (flag + code initials). Desktop lg: w-40 (flag + full name)
    <aside className="w-14 lg:w-40 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">

      {/* Logo */}
      <div className="flex items-center gap-2 px-2 lg:px-3 py-3 border-b border-slate-800 shrink-0">
        <span className="text-xl shrink-0">⚽</span>
        <div className="hidden lg:block min-w-0">
          <p className="text-white font-black text-xs leading-none tracking-tight">WC 2026</p>
          <p className="text-slate-600 text-[9px] leading-none mt-0.5">{t('appSubtitle')}</p>
        </div>
      </div>

      {/* Teams list */}
      <nav className="flex-1 overflow-y-auto py-1 px-1">
        {CONF_ORDER.map(conf => {
          const items = grouped[conf]
          if (!items) return null
          return (
            <div key={conf} className="mb-1">
              {/* Confederation label — desktop only */}
              <p className="hidden lg:block text-[8px] text-slate-600 font-bold tracking-widest uppercase px-2 pt-2 pb-1">
                {t(`conf.${conf}`)}
              </p>
              {/* Thin divider — mobile only */}
              <div className="lg:hidden h-px bg-slate-800 mx-1 my-1" />
              {items.map(section => (
                <SectionItem
                  key={section.code}
                  section={section}
                  active={selected === section.code}
                  onClick={() => onSelect(section.code)}
                />
              ))}
            </div>
          )
        })}
      </nav>

      {/* Language switcher */}
      <div className="border-t border-slate-800 px-1 py-2 flex flex-col gap-1 shrink-0">
        {Object.entries(LOCALE_META).map(([code, meta]) => (
          <button
            key={code}
            onClick={() => setLocale(code)}
            title={meta.label}
            className={[
              'flex items-center gap-1.5 px-2 py-1 rounded-md text-left transition-colors w-full',
              locale === code
                ? 'bg-slate-700 text-white'
                : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800'
            ].join(' ')}
          >
            <span className="text-sm leading-none">{meta.flag}</span>
            <span className="hidden lg:inline text-[10px] font-bold">{meta.label}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
