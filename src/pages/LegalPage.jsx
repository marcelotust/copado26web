import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'

const SECTIONS = {
  privacy: [
  'legal.privacy.intro',
  'legal.privacy.data',
  'legal.privacy.rights',
  ],
  terms: [
  'legal.terms.intro',
  'legal.terms.use',
  'legal.terms.liability',
  ],
}

/** @param {{ kind: 'privacy' | 'terms' }} props */
export default function LegalPage({ kind }) {
  const { t } = useI18n()
  const title = kind === 'privacy' ? t('legal.privacy.title') : t('legal.terms.title')
  const sections = SECTIONS[kind]

  return (
    <div className='min-h-screen bg-slate-950 text-slate-200 px-6 py-10'>
      <div className='mx-auto max-w-2xl space-y-6'>
        <Link to='/' className='text-sm text-sky-400 hover:underline'>
          {t('legal.back')}
        </Link>
        <h1 className='text-2xl font-bold text-white'>{title}</h1>
        <p className='text-xs text-slate-500'>{t('legal.version')}</p>
        {sections.map((key) => (
          <p key={key} className='text-sm leading-relaxed text-slate-300'>
            {t(key)}
          </p>
        ))}
      </div>
    </div>
  )
}
