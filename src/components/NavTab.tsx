import { Link } from 'react-router-dom'

type NavTabProps = {
  to: string
  label: string
  active: boolean
  color: string
  badge?: number
}

export default function NavTab({ to, label, active, color, badge }: NavTabProps) {
  return (
    <Link
      to={to}
      className={[
        'flex items-center gap-1.5 px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-150',
        active ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800',
      ].join(' ')}
      style={active ? { backgroundColor: color } : undefined}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          className='text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1'
          style={{ backgroundColor: color, filter: 'brightness(0.75)' }}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}
