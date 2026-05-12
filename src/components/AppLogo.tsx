type Size = 'sm' | 'md' | 'lg'

export default function AppLogo({ size = 'md' }: { size?: Size }) {
  const sizes: Record<Size, { fontSize: string }> = {
    sm: { fontSize: '22px' },
    md: { fontSize: '28px' },
    lg: { fontSize: '42px' },
  }

  const base = {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: sizes[size].fontSize,
    letterSpacing: '0.08em',
    lineHeight: 1,
  }

  return (
    <div className='flex items-baseline leading-none select-none' style={{ gap: '0.2em' }}>
      <span style={{ ...base, color: '#3B82F6' }}>Meu</span>
      <span style={{ ...base, color: '#F43F5E' }}>Álbum</span>
      <span style={{ ...base, color: '#10B981' }}>2026</span>
    </div>
  )
}
