import { useI18n } from '../../i18n'
import { useTradeSuggestions } from '../../state/friends'

function stickerChip(id: string) {
  return (
    <span key={id} className='inline-flex items-center px-2 py-0.5 rounded bg-slate-700 text-slate-200 text-xs font-mono'>
      {id}
    </span>
  )
}

type Props = { friendUserId: string }

export default function TradeSuggestionList({ friendUserId }: Props) {
  const { t } = useI18n()
  const { data, loading, error } = useTradeSuggestions(friendUserId)

  if (loading) {
    return (
      <div className='mt-6 animate-pulse'>
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
        <div className='mt-6 px-4 py-3 rounded-xl bg-slate-800/60 text-slate-400 text-sm text-center'>
          {t('friends.trades.private')}
        </div>
      )
    }
    return null
  }

  const hasMatches = data.they_have_i_need.length > 0 || data.i_have_they_need.length > 0

  return (
    <section className='mt-6'>
      <h3 className='text-sm font-semibold text-slate-300 mb-3'>{t('friends.trades.title')}</h3>

      {!hasMatches ? (
        <div className='px-4 py-3 rounded-xl bg-slate-800/60 text-slate-400 text-sm text-center'>
          {t('friends.trades.empty')}
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          {data.they_have_i_need.length > 0 && (
            <div className='rounded-xl bg-slate-800/60 p-3'>
              <p className='text-xs font-semibold text-emerald-400 mb-2'>{t('friends.trades.theyHaveINeed')}</p>
              <div className='flex flex-wrap gap-1.5'>
                {data.they_have_i_need.map(id => stickerChip(id))}
              </div>
            </div>
          )}
          {data.i_have_they_need.length > 0 && (
            <div className='rounded-xl bg-slate-800/60 p-3'>
              <p className='text-xs font-semibold text-amber-400 mb-2'>{t('friends.trades.iHaveTheyNeed')}</p>
              <div className='flex flex-wrap gap-1.5'>
                {data.i_have_they_need.map(id => stickerChip(id))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
