/** @param {{ size?: 'sm' | 'md' | 'lg' }} props */
export default function AppLogo({ size = 'md' }) {
  const sizes = {
    sm: { title: '22px', subtitle: '10px', gap: '1px' },
    md: { title: '28px', subtitle: '11px', gap: '2px' },
    lg: { title: '42px', subtitle: '13px', gap: '4px' },
  }
  const s = sizes[size]

  return (
    <div className='flex flex-col items-center leading-none select-none' style={{ gap: s.gap }}>
      <span
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: s.title,
          letterSpacing: '0.08em',
          background: 'linear-gradient(135deg, #60a5fa 0%, #ffffff 50%, #93c5fd 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
        }}
      >
        Meu Álbum 2026
      </span>
    </div>
  )
}
