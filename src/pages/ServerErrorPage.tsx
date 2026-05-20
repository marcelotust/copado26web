import { useI18n } from '../i18n'
import ErrorPageShell from '../components/error/ErrorPageShell'
import ErrorStickerCard from '../components/error/ErrorStickerCard'

type ServerErrorPageProps = {
  onRetry?: () => void
  detail?: string
}

export default function ServerErrorPage({ onRetry, detail }: ServerErrorPageProps = {}) {
  const { t } = useI18n()
  const retry = onRetry ?? (() => window.location.reload())

  return (
    <>
      <ErrorPageShell
        card={<ErrorStickerCard code='500' tag={t('errors.serverError.tag')} accent='#f59e0b' glyph='🛠️' />}
        title={t('errors.serverError.title')}
        subtitle={t('errors.serverError.subtitle')}
        primary={{ label: t('errors.serverError.primaryCta'), onClick: retry }}
        secondary={{ label: t('errors.serverError.secondaryCta'), to: '/' }}
      />
      {detail ? (
        <pre
          aria-hidden='true'
          className='fixed bottom-4 inset-x-4 max-w-3xl mx-auto rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-[11px] font-mono text-slate-500 overflow-x-auto'
        >
          {detail}
        </pre>
      ) : null}
    </>
  )
}
