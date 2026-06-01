import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { AnalyticsEvent, telemetry } from '../../lib/telemetry'
import { buildShareText, interpolate } from '../../lib/shareText'
import { supabase } from '../../lib/supabase'
import type { TradePartner } from '../../hooks/useTradePartners'

type Detail = { they_have_i_need: string[]; i_have_they_need: string[] }

type Props = {
  partner: TradePartner
  currentNickname: string
}

function formatList(ids: string[]): string {
  return ids.join(' · ')
}

export default function TradePartnerCard({ partner, currentNickname }: Props) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleExpand() {
    if (expanded) { setExpanded(false); return }
    setExpanded(true)
    if (detail) return
    setDetailLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.rpc as any)('get_trade_partner_detail', { p_partner_id: partner.user_id })
      setDetail(data as Detail)
    } finally {
      setDetailLoading(false)
    }
  }

  function buildDetailShareText(): string {
    if (!detail) return ''
    const headline = t('tradingPartners.shareDetailHeadline')
    const theyHaveLine = interpolate(t('tradingPartners.shareDetailTheyHave'), { nickname: partner.nickname, n: String(detail.they_have_i_need.length) })
    const iHaveLine = interpolate(t('tradingPartners.shareDetailIHave'), { nickname: partner.nickname, m: String(detail.i_have_they_need.length) })
    const body = [
      headline,
      '',
      theyHaveLine,
      formatList(detail.they_have_i_need),
      '',
      iHaveLine,
      formatList(detail.i_have_they_need),
      '',
      `@${currentNickname} × @${partner.nickname}`,
    ].join('\n')
    return buildShareText(body, t)
  }

  async function handleShare(text: string, channel: 'native_share' | 'clipboard') {
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

  function whatsappUrl(text: string): string {
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

  const detailShareText = detail ? buildDetailShareText() : simpleShareText

  return (
    <div className='rounded-xl bg-slate-800 border border-slate-700 overflow-hidden'>
      {/* header row */}
      <div className='flex items-center gap-3 px-4 pt-3 pb-2'>
        <div className='shrink-0 w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center'>
          {partner.avatar_url
            ? <img src={partner.avatar_url} alt='' className='w-full h-full object-cover' />
            : <span className='text-xl'>👤</span>
          }
        </div>
        <Link to={`/u/${partner.nickname}`} className='flex-1 min-w-0'>
          <p className='text-sm font-semibold text-white truncate'>{partner.display_name || partner.nickname}</p>
          <p className='text-xs text-slate-400'>@{partner.nickname} · {partner.completion_pct}%</p>
        </Link>
      </div>

      {/* counters */}
      <div className='flex gap-2 flex-wrap px-4 pb-2'>
        <span className='px-2 py-1 rounded-md bg-emerald-900/40 border border-emerald-700/40 text-xs text-emerald-300 font-medium'>
          {interpolate(t('tradingPartners.theyHaveINeed'), { n: String(partner.they_have_i_need) })}
        </span>
        <span className='px-2 py-1 rounded-md bg-amber-900/40 border border-amber-700/40 text-xs text-amber-300 font-medium'>
          {interpolate(t('tradingPartners.iHaveTheyNeed'), { n: String(partner.i_have_they_need) })}
        </span>
      </div>

      {/* expandable detail */}
      <button
        type='button'
        onClick={() => void handleExpand()}
        className='w-full px-4 py-2 text-left text-xs text-indigo-400 hover:text-indigo-300 hover:bg-slate-700/30 transition-colors flex items-center gap-1'
      >
        <span>{expanded ? '▲' : '▼'}</span>
        {expanded ? t('tradingPartners.hideCards') : t('tradingPartners.seeCards')}
      </button>

      {expanded && (
        <div className='px-4 pb-3 flex flex-col gap-3 border-t border-slate-700'>
          {detailLoading ? (
            <div className='py-4 flex justify-center'>
              <div className='w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin' />
            </div>
          ) : detail ? (
            <>
              {detail.they_have_i_need.length > 0 && (
                <div className='pt-3'>
                  <p className='text-xs font-semibold text-emerald-400 mb-1'>
                    {interpolate(t('tradingPartners.theyHaveINeedList'), { n: String(detail.they_have_i_need.length) })}
                  </p>
                  <p className='text-xs text-slate-300 leading-relaxed break-words'>
                    {formatList(detail.they_have_i_need)}
                  </p>
                </div>
              )}
              {detail.i_have_they_need.length > 0 && (
                <div>
                  <p className='text-xs font-semibold text-amber-400 mb-1'>
                    {interpolate(t('tradingPartners.iHaveTheyNeedList'), { n: String(detail.i_have_they_need.length) })}
                  </p>
                  <p className='text-xs text-slate-300 leading-relaxed break-words'>
                    {formatList(detail.i_have_they_need)}
                  </p>
                </div>
              )}
            </>
          ) : null}

          {/* share buttons (only in expanded) */}
          <div className='flex gap-2'>
            <a
              href={whatsappUrl(detailShareText)}
              target='_blank'
              rel='noopener noreferrer'
              onClick={() => telemetry.track(AnalyticsEvent.TRADE_PARTNER_SHARE, { channel: 'whatsapp' })}
              className='flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] text-xs font-semibold transition-colors border border-[#25D366]/30'
            >
              <svg className='w-4 h-4 shrink-0' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
                <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z'/>
              </svg>
              {t('tradingPartners.shareWhatsapp')}
            </a>
            <button
              type='button'
              onClick={() => void handleShare(detailShareText, navigator.share !== undefined ? 'native_share' : 'clipboard')}
              className='flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-colors'
            >
              {copied ? t('tradingPartners.copied') : t('tradingPartners.share')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
