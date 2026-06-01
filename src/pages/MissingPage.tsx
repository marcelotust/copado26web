import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { FeatureFlag, telemetry } from '../lib/telemetry'
import { useMissing, useSwaps, useTeams } from '../state/stickersStore'
import MissingShareButtons from '../components/MissingShareButtons'
import MissingTradeChecker from '../components/MissingTradeChecker'
import StickerCodeGroup from '../components/StickerCodeGroup'
import MissingStickerTile from '../components/MissingStickerTile'
import StickerListPageHeader from '../components/StickerListPageHeader'
import { pad } from '../lib/shareText'

export default function MissingPage() {
  const { t } = useI18n()
  const groups = useMissing()
  const teams  = useTeams()
  const { swapsByTeam } = useSwaps()

  const totalMissing = groups.reduce((acc, g) => acc + g.numbers.length, 0)
  const socialEnabled = import.meta.env.DEV || telemetry.flag(FeatureFlag.SOCIAL_V1)

  const missingIds = new Set(
    groups.flatMap(({ teamCode, numbers }) => numbers.map(n => `${teamCode}-${pad(n)}`))
  )
  const swapIds = new Set(
    swapsByTeam.flatMap(({ stickers }) => stickers.map(s => s.id))
  )

  function teamName(code: string): string {
    const team = teams.find(team => team.code === code)
    return team ? t(team.name_key) : code
  }

  function teamFlag(code: string): string {
    return teams.find(team => team.code === code)?.flag ?? ''
  }

  return (
    <div className='flex flex-col h-full'>
      <StickerListPageHeader
        title={t('nav.missing')}
        icon='🏆'
        accentColor='#10B981'
        summary={(
          <>
            <span className='font-bold text-white'>{totalMissing}</span>{' '}
            {totalMissing === 1 ? t('missing.sticker') : t('missing.stickers')}{' '}
            {t('missing.missing')}
          </>
        )}
        actions={totalMissing > 0 ? (
          <div className='flex items-center gap-2'>
            <MissingShareButtons groups={groups} total={totalMissing} teamName={teamName} teamFlag={teamFlag} />
            {socialEnabled && (
              <Link
                to='/trading-partners'
                className='shrink-0 flex items-center gap-1.5 px-2 sm:px-2.5 h-8 rounded-lg text-indigo-400 hover:bg-indigo-500/15 border border-transparent hover:border-indigo-500/20 transition-colors text-xs font-semibold'
              >
                {t('tradingPartners.findPartners')}
              </Link>
            )}
          </div>
        ) : undefined}
      />

      <div className='flex-1 overflow-y-auto'>
        {groups.length === 0 ? (
          <div className='flex min-h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center'>
            <span className='text-5xl'>🏆</span>
            <p className='text-lg font-bold text-white'>{t('missing.emptyTitle')}</p>
            <p className='text-sm text-slate-400'>{t('missing.emptyDesc')}</p>
          </div>
        ) : (
          <div className='mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 sm:px-4'>
            <MissingTradeChecker
              missingIds={missingIds}
              swapIds={swapIds}
              validTeamCodes={new Set(teams.map(team => team.code))}
              teamFlag={teamFlag}
            />

            {groups.map(({ teamCode, numbers }) => (
              <StickerCodeGroup
                key={teamCode}
                teamCode={teamCode}
                flag={teamFlag(teamCode)}
                name={teamName(teamCode)}
                count={numbers.length}
                countLabel={numbers.length === 1 ? t('missing.sticker') : t('missing.stickers')}
              >
                {numbers.map((number) => (
                  <MissingStickerTile key={`${teamCode}-${pad(number)}`} teamCode={teamCode} number={number} />
                ))}
              </StickerCodeGroup>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
