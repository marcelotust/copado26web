import { useI18n } from '../../i18n'
import { useTradeSuggestions } from '../../state/friends'
import { useStickersContext } from '../../state/StickersProvider'
import { interpolate } from '../../lib/shareText'
import GroupedStickerList from '../trading/GroupedStickerList'

const INCOMING_ICON = (
  <svg className='w-3.5 h-3.5 shrink-0' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' aria-hidden>
    <path d='M12 3v14m-7-7 7 7 7-7' strokeLinecap='round' strokeLinejoin='round' />
  </svg>
)

const OUTGOING_ICON = (
  <svg className='w-3.5 h-3.5 shrink-0' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' aria-hidden>
    <path d='M12 21V7m-7 7 7-7 7 7' strokeLinecap='round' strokeLinejoin='round' />
  </svg>
)

type Props = { friendUserId: string }

export default function TradeSuggestionList({ friendUserId }: Props) {
  const { t } = useI18n()
  const { catalog, teams } = useStickersContext()
  const { data, loading, error } = useTradeSuggestions(friendUserId)

  function groupLabel(key: string): string {
    return key.length === 1
      ? `${t('sidebar.group')} ${key}`
      : t(`sections.${key.toLowerCase()}`)
  }

  if (loading) {
    return (
      <div className='animate-pulse'>
        <div className='h-4 bg-slate-800 rounded w-1/2 mb-3' />
        <div className='h-20 bg-slate-800 rounded-xl' />
      </div>
    )
  }

  if (error) return null

  if (!data) return null

  if (!data.ok) {
    if (data.reason === 'collection_private') {
      return (
        <div className='px-4 py-3 rounded-xl bg-slate-800/60 text-slate-400 text-sm text-center'>
          {t('friends.trades.private')}
        </div>
      )
    }
    return null
  }

  const hasMatches = data.they_have_i_need.length > 0 || data.i_have_they_need.length > 0

  return (
    <section>
      <h3 className='text-sm font-semibold text-slate-300 mb-3'>{t('friends.trades.title')}</h3>

      {!hasMatches ? (
        <div className='px-4 py-3 rounded-xl bg-slate-800/60 text-slate-400 text-sm text-center'>
          {t('friends.trades.empty')}
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {data.they_have_i_need.length > 0 && (
            <div className='rounded-lg border border-emerald-700/40 overflow-hidden'>
              <div className='flex items-center gap-1.5 px-3 py-2 bg-emerald-900/40 text-emerald-300'>
                <span className='text-xs font-semibold flex-1'>
                  {interpolate(t('tradingPartners.theyHaveINeed'), { n: String(data.they_have_i_need.length) })}
                </span>
                {INCOMING_ICON}
              </div>
              <div className='px-3 py-3 bg-emerald-900/15'>
                <GroupedStickerList
                  ids={data.they_have_i_need}
                  catalog={catalog}
                  teams={teams}
                  groupLabel={groupLabel}
                />
              </div>
            </div>
          )}
          {data.i_have_they_need.length > 0 && (
            <div className='rounded-lg border border-amber-700/40 overflow-hidden'>
              <div className='flex items-center gap-1.5 px-3 py-2 bg-amber-900/40 text-amber-300'>
                <span className='text-xs font-semibold flex-1'>
                  {interpolate(t('tradingPartners.iHaveTheyNeed'), { n: String(data.i_have_they_need.length) })}
                </span>
                {OUTGOING_ICON}
              </div>
              <div className='px-3 py-3 bg-amber-900/15'>
                <GroupedStickerList
                  ids={data.i_have_they_need}
                  catalog={catalog}
                  teams={teams}
                  groupLabel={groupLabel}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
