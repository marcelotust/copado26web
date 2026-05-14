import { Link, useLocation } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { AUTH_POST_LOGIN_PATH_KEY } from '../../lib/tradePayload'

export default function TradeLoginState() {
  const { t } = useI18n()
  const location = useLocation()
  const returnPath = `${location.pathname}${location.search}`

  function persistReturn() {
    try {
      sessionStorage.setItem(AUTH_POST_LOGIN_PATH_KEY, returnPath)
    } catch {
      /* quota / private mode */
    }
  }

  return (
    <div className='flex flex-col items-center text-center gap-4 pt-8'>
      <span className='text-5xl'>🔐</span>
      <p className='text-white font-semibold'>{t('trade.loginTitle')}</p>
      <p className='text-slate-400 text-sm max-w-xs leading-relaxed'>{t('trade.loginDesc')}</p>
      <Link
        to='/login'
        onClick={persistReturn}
        className='mt-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors'
      >
        {t('trade.loginCta')}
      </Link>
    </div>
  )
}
