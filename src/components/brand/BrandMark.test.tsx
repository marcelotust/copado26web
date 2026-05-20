import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BrandMark, { type BrandMarkVariant } from './BrandMark'

const VARIANT_SRC: Record<BrandMarkVariant, string> = {
  primary: '/brand/logo-primary.svg',
  stacked: '/brand/logo-stacked.svg',
  inline: '/brand/logo-inline.svg',
  selo: '/brand/selo-26.svg',
  card: '/brand/card-stack-bare.svg',
  'card-tile': '/brand/card-stack.svg',
}

describe('BrandMark', () => {
  it.each(Object.entries(VARIANT_SRC))(
    'renders variant %s with the matching SVG src',
    (variant, expectedSrc) => {
      render(<BrandMark variant={variant as BrandMarkVariant} />)
      const img = screen.getByRole('img', { name: 'Meu Álbum 2026' })
      expect(img).toHaveAttribute('src', expectedSrc)
    },
  )

  it('defaults to the inline variant', () => {
    render(<BrandMark />)
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      VARIANT_SRC.inline,
    )
  })

  it('uses the provided ariaLabel as the accessible name', () => {
    render(<BrandMark ariaLabel='Meu Álbum — versão guest' />)
    expect(
      screen.getByRole('img', { name: 'Meu Álbum — versão guest' }),
    ).toBeInTheDocument()
  })

  it('forwards className to the rendered image', () => {
    render(<BrandMark className='h-12 w-auto' />)
    expect(screen.getByRole('img')).toHaveClass('h-12', 'w-auto')
  })
})
