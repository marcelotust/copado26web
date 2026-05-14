import type { CatalogSticker } from '../../types/database'

type TradeStickerListColumnProps = {
  title: string
  ids: string[]
  catalog: Map<string, CatalogSticker>
}

export default function TradeStickerListColumn({ title, ids, catalog }: TradeStickerListColumnProps) {
  return (
    <section className='rounded-xl border border-slate-800 bg-slate-900/50 p-3'>
      <h2 className='text-xs font-bold uppercase tracking-wide text-slate-500 mb-2'>{title}</h2>
      {ids.length === 0 ? (
        <p className='text-slate-600 text-sm py-2'>—</p>
      ) : (
        <ul className='flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto pr-1'>
          {ids.map((id) => {
            const c = catalog.get(id)
            if (!c) {
              return (
                <li key={id} className='text-slate-500 text-xs font-mono truncate'>
                  {id}
                </li>
              )
            }
            return (
              <li
                key={id}
                className='text-sm text-slate-200 flex items-baseline gap-2 border-b border-slate-800/80 pb-1.5 last:border-0'
              >
                <span className='text-slate-500 shrink-0'>{c.team_code}</span>
                <span className='font-mono text-emerald-400/90'>#{c.number}</span>
                {c.player_name && (
                  <span className='text-slate-400 truncate text-xs'>{c.player_name}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
