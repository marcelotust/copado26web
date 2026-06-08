import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { AnalyticsEvent, telemetry } from '../../lib/telemetry'
import { buildShareText, interpolate } from '../../lib/shareText'
import { supabase } from '../../lib/supabase'
import type { TradePartner } from '../../hooks/useTradePartners'
import Avatar from '../friends/Avatar'
import { useStickersContext } from '../../state/stickersStore'
import { groupStickerIds, formatGroupedStickerText } from '../../pages/trade/groupStickerIds'
import GroupedStickerList from './GroupedStickerList'

type Detail = { they_have_i_need: string[]; i_have_they_need: string[] }

type Props = {
  partner: TradePartner
  currentNickname: string
}

const WA_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z'

const INCOMING_ICON = (
  <svg className='w-3.5 h-3.5 shrink-0' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' aria-hidden>
    <path d='M12 3v14m-7-7 7 7 7-7' strokeLinecap='round' strokeLinejoin='round'/>
  </svg>
)

const OUTGOING_ICON = (
  <svg className='w-3.5 h-3.5 shrink-0' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' aria-hidden>
    <path d='M12 21V7m-7 7 7-7 7 7' strokeLinecap='round' strokeLinejoin='round'/>
  </svg>
)

export default function TradePartnerCard({ partner, currentNickname }: Props) {
  const { t } = useI18n()
  const { catalog, teams } = useStickersContext()
  const [expanded, setExpanded] = useState(false)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(false)
  const [copied, setCopied] = useState(false)

  function groupLabel(key: string): string {
    return key.length === 1
      ? `${t('sidebar.group')} ${key}`
      : t(`sections.${key.toLowerCase()}`)
  }

  async function handleExpand() {
    if (expanded) { setExpanded(false); return }
    setExpanded(true)
    if (detail) return
    setDetailLoading(true)
    setDetailError(false)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_trade_partner_detail', { p_partner_id: partner.user_id })
      if (error) throw error
      setDetail(data as Detail)
    } catch {
      setDetailError(true)
    } finally {
      setDetailLoading(false)
    }
  }

  function buildDetailShareText(): string {
    if (!detail) return ''
    const headline = t('tradingPartners.shareDetailHeadline')
    const theyHaveLine = interpolate(t('tradingPartners.shareDetailTheyHave'), { nickname: partner.nickname, n: String(detail.they_have_i_need.length) })
    const iHaveLine = interpolate(t('tradingPartners.shareDetailIHave'), { nickname: partner.nickname, m: String(detail.i_have_they_need.length) })
    const theyHaveText = formatGroupedStickerText(groupStickerIds(detail.they_have_i_need, catalog, teams), groupLabel)
    const iHaveText = formatGroupedStickerText(groupStickerIds(detail.i_have_they_need, catalog, teams), groupLabel)
    const body = [
      headline, '',
      theyHaveLine,
      theyHaveText, '',
      iHaveLine,
      iHaveText, '',
      `@${currentNickname} × @${partner.nickname}`,
    ].join('\n')
    return buildShareText(body, t)
  }

  async function handleShare(channel: 'native_share' | 'clipboard') {
    const text = detail ? buildDetailShareText() : simpleShareText
    if (channel === 'native_share' && navigator.share !== undefined) {
      try {
        await navigator.share({ text })
        telemetry.track(AnalyticsEvent.TRADE_PARTNER_SHARE, { channel: 'native_share' })
      } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        telemetry.track(AnalyticsEvent.TRADE_PARTNER_SHARE, { channel: 'clipboard' })
      } catch { /* denied */ }
    }
  }

  function whatsappUrl(): string {
    const text = detail ? buildDetailShareText() : simpleShareText
    return `https://wa.me/?text=${encodeURIComponent(text)}`
  }

  const simpleShareText = buildShareText(
    interpolate(t('tradingPartners.shareText'), {
      nickname: partner.nickname,
      m: String(partner.they_have_i_need),
      n: String(partner.i_have_they_need),
    }),
    t,
  )

  return (
    <div className='rounded-xl bg-slate-800 border border-slate-700 overflow-hidden'>
      {/* header: avatar + name + share buttons */}
      <div className='flex items-center gap-3 px-4 pt-3 pb-2'>
        <Avatar
          userId={partner.user_id}
          displayName={partner.display_name || partner.nickname}
          avatarUrl={partner.avatar_url}
          size='md'
        />
        <Link to={`/u/${partner.nickname}`} className='flex-1 min-w-0'>
          <p className='text-sm font-semibold text-white truncate'>{partner.display_name || partner.nickname}</p>
          <p className='text-xs text-slate-400'>@{partner.nickname} · {partner.completion_pct}%</p>
        </Link>
        {/* share actions — always visible */}
        <div className='flex items-center gap-1 shrink-0'>
          <a
            href={whatsappUrl()}
            target='_blank'
            rel='noopener noreferrer'
            onClick={() => telemetry.track(AnalyticsEvent.TRADE_PARTNER_SHARE, { channel: 'whatsapp' })}
            className='flex items-center justify-center w-8 h-8 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] transition-colors'
            aria-label={t('tradingPartners.shareWhatsapp')}
          >
            <svg className='w-4 h-4 shrink-0' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
              <path d={WA_PATH} />
            </svg>
          </a>
          <button
            type='button'
            onClick={() => void handleShare(navigator.share !== undefined ? 'native_share' : 'clipboard')}
            className='flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors text-xs font-semibold'
            aria-label={t('tradingPartners.share')}
          >
            {copied ? '✓' : (
              <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden>
                <path d='M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13' strokeLinecap='round' strokeLinejoin='round'/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* badges — row when collapsed, move to section headers when expanded */}
      {!expanded && (
        <div className='flex gap-2 flex-wrap px-4 pb-2'>
          <span className='flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-900/40 border border-emerald-700/40 text-xs text-emerald-300 font-medium'>
            {interpolate(t('tradingPartners.theyHaveINeed'), { n: String(partner.they_have_i_need) })}
            {INCOMING_ICON}
          </span>
          <span className='flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-900/40 border border-amber-700/40 text-xs text-amber-300 font-medium'>
            {interpolate(t('tradingPartners.iHaveTheyNeed'), { n: String(partner.i_have_they_need) })}
            {OUTGOING_ICON}
          </span>
        </div>
      )}

      {/* ver listas toggle */}
      <button
        type='button'
        onClick={() => void handleExpand()}
        className='w-full px-4 py-2 text-left text-xs text-indigo-400 hover:text-indigo-300 hover:bg-slate-700/30 transition-colors flex items-center gap-1'
      >
        <span>{expanded ? '▲' : '▼'}</span>
        {expanded ? t('tradingPartners.hideCards') : t('tradingPartners.seeCards')}
      </button>

      {/* sticker lists — each section led by its badge */}
      {expanded && (
        <div className='px-4 pb-4 border-t border-slate-700'>
          {detailLoading ? (
            <div className='py-4 flex justify-center'>
              <div className='w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin' />
            </div>
          ) : detailError ? (
            <p className='py-3 text-xs text-slate-400'>{t('tradingPartners.detailError')}</p>
          ) : detail ? (
            <div className='flex flex-col gap-4 pt-3'>
              {detail.they_have_i_need.length > 0 && (
                <div>
                  <div className='flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-900/40 border border-emerald-700/40 text-emerald-300 mb-3'>
                    <span className='text-xs font-semibold'>
                      {interpolate(t('tradingPartners.theyHaveINeed'), { n: String(detail.they_have_i_need.length) })}
                    </span>
                    {INCOMING_ICON}
                  </div>
                  <GroupedStickerList
                    ids={detail.they_have_i_need}
                    catalog={catalog}
                    teams={teams}
                    groupLabel={groupLabel}
                  />
                </div>
              )}
              {detail.i_have_they_need.length > 0 && (
                <div>
                  <div className='flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-900/40 border border-amber-700/40 text-amber-300 mb-3'>
                    <span className='text-xs font-semibold'>
                      {interpolate(t('tradingPartners.iHaveTheyNeed'), { n: String(detail.i_have_they_need.length) })}
                    </span>
                    {OUTGOING_ICON}
                  </div>
                  <GroupedStickerList
                    ids={detail.i_have_they_need}
                    catalog={catalog}
                    teams={teams}
                    groupLabel={groupLabel}
                  />
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
