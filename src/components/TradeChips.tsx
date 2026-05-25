function codeLabel(id: string, teamFlag: (code: string) => string): string {
  const [team, num] = id.split('-')
  return `${teamFlag(team!)} ${team} ${num}`
}

/** Toggleable sticker-code chips for one side of a trade. */
export default function TradeChips({
  ids, selected, onToggle, teamFlag, tone,
}: {
  ids: string[]
  selected: Set<string>
  onToggle: (id: string) => void
  teamFlag: (code: string) => string
  tone: 'green' | 'amber'
}) {
  const onClasses = tone === 'green'
    ? 'border-emerald-500 bg-emerald-600/25 text-emerald-200'
    : 'border-amber-500 bg-amber-600/25 text-amber-200'
  return (
    <div className='flex flex-wrap gap-1.5'>
      {ids.map((id) => {
        const isOn = selected.has(id)
        return (
          <button
            key={id}
            type='button'
            aria-pressed={isOn}
            onClick={() => onToggle(id)}
            className={`rounded-md border px-2 py-1 font-mono text-xs transition-colors ${
              isOn ? onClasses : 'border-slate-700 bg-slate-950/45 text-slate-300 hover:border-slate-500'
            }`}
          >
            {codeLabel(id, teamFlag)}
          </button>
        )
      })}
    </div>
  )
}
