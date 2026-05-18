export type BrandMarkVariant = 'primary' | 'stacked' | 'inline' | 'selo'

interface Props {
  variant?: BrandMarkVariant
  className?: string
  ariaLabel?: string
}

const SRC: Record<BrandMarkVariant, string> = {
  primary: '/brand/logo-primary.svg',
  stacked: '/brand/logo-stacked.svg',
  inline: '/brand/logo-inline.svg',
  selo: '/brand/selo-26.svg',
}

export default function BrandMark({
  variant = 'inline',
  className,
  ariaLabel = 'Meu Álbum 2026',
}: Props) {
  return (
    <img
      src={SRC[variant]}
      alt={ariaLabel}
      role='img'
      className={className}
      draggable={false}
    />
  )
}
