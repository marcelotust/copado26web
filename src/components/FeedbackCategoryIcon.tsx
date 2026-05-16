import type { FeedbackCategory } from './feedbackWidgetConfig'

type Props = { category: FeedbackCategory }

export default function FeedbackCategoryIcon({ category }: Props) {
  if (category === 'feature') {
    return (
      <svg className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden='true'>
        <path d='M12 3v18M3 12h18' strokeLinecap='round' />
      </svg>
    )
  }

  if (category === 'bug') {
    return (
      <svg className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden='true'>
        <path d='M8 8h8v9a4 4 0 0 1-8 0V8Z' />
        <path d='M9 4h6l-1 4h-4L9 4ZM4 13h4M16 13h4M5 20l3-3M19 20l-3-3' strokeLinecap='round' />
      </svg>
    )
  }

  return (
    <svg className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden='true'>
      <path d='M4 5h16v10H8l-4 4V5Z' strokeLinejoin='round' />
      <path d='M8 9h8M8 12h5' strokeLinecap='round' />
    </svg>
  )
}
