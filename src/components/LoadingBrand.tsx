import BrandMark from './brand/BrandMark'

export default function LoadingBrand() {
  return (
    <div className='flex flex-col items-center gap-1'>
      <BrandMark variant='card' className='w-32 h-32' />
      <span
        className='text-xl font-black tracking-wide'
        style={{
          background:
            'linear-gradient(to right, #7a99d6 0%, #6db9c7 25%, #c97ab8 50%, #e0c177 75%, #5fb591 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Meu Álbum 2026
      </span>
    </div>
  )
}
