import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { SECTIONS } from '../db/seed'
import { decrement, increment } from '../hooks/useStickers'
import { gradientClasses, teamColor } from '../utils'
import { useI18n } from '../i18n'

function SwapCard({ sticker }) {
  const { t } = useI18n()
  const section = SECTIONS.find(s => s.code === sticker.teamCode)
  const name    = t(`teams.${sticker.teamCode}`)
  const dupes   = sticker.quantity - 1

  return (
    <div className={`relative flex items-center justify-between bg-gradient-to-r ${gradientClasses(sticker.teamCode)} rounded-xl px-3 py-2.5 shadow`}>
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-2xl shrink-0">{section?.flag ?? '🏳️'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-sm leading-tight">{sticker.id}</p>
          <p className="text-white/70 text-xs truncate">{name}</p>
        </div>
        {dupes > 1 && (
          <span className="bg-red-500 text-white text-[16px] font-black rounded-full min-w-[30px] h-[30px] flex items-center justify-center px-1">
            +{dupes}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => decrement(sticker.id)}
          className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-base flex items-center justify-center transition-colors"
        >−</button>
        <span className="text-white font-black tabular-nums text-sm w-5 text-center">{sticker.quantity}</span>
        <button
          onClick={() => increment(sticker.id)}
          className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-base flex items-center justify-center transition-colors"
        >+</button>
      </div>
    </div>
  )
}

export default function SwapsView() {
  const { t } = useI18n()

  const swaps = useLiveQuery(
    () => db.stickers.where('quantity').above(1).sortBy('teamCode'),
    []
  ) ?? []

  const byTeam = swaps.reduce((acc, s) => {
    if (!acc[s.teamCode]) acc[s.teamCode] = []
    acc[s.teamCode].push(s)
    return acc
  }, {})
  const teams = Object.keys(byTeam).sort()

  const stickerWord = swaps.length === 1 ? t('swaps.sticker') : t('swaps.stickers')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-800 shrink-0">
        <span className="text-3xl">🔄</span>
        <div>
          <h2 className="text-white font-bold text-lg">{t('swaps.title')}</h2>
          <p className="text-slate-400 text-xs">
            {swaps.length} {stickerWord} {t('swaps.toTrade')}
          </p>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4">
        {swaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
            <span className="text-5xl">✨</span>
            <p className="text-slate-400 font-semibold">{t('swaps.empty')}</p>
            <p className="text-slate-600 text-sm">{t('swaps.emptyDesc')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map(teamCode => {
              const section = SECTIONS.find(s => s.code === teamCode)
              const name    = t(`teams.${teamCode}`)
              return (
                <div key={teamCode}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{section?.flag ?? '🏳️'}</span>
                    <span className={`text-xs font-bold tracking-wide text-${teamColor(teamCode)}-300`}>
                      {name}
                    </span>
                    <span className="text-slate-600 text-xs">
                      · {byTeam[teamCode].length} {t('swaps.dupes')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {byTeam[teamCode].map(s => (
                      <SwapCard key={s.id} sticker={s} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
