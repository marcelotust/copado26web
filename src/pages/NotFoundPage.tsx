import { useI18n } from '../i18n'
import ErrorPageShell from '../components/error/ErrorPageShell'
import ErrorStickerCard from '../components/error/ErrorStickerCard'

export default function NotFoundPage() {
  const { t } = useI18n()

  return (
    <ErrorPageShell
      card={<ErrorStickerCard code='404' tag={t('errors.notFound.tag')} accent='#3b82f6' glyph='⚽' />}
      title={t('errors.notFound.title')}
      subtitle={t('errors.notFound.subtitle')}
      primary={{ label: t('errors.notFound.primaryCta'), to: '/' }}
      secondary={{ label: t('errors.notFound.secondaryCta'), to: '/album' }}
    />
  )
}
