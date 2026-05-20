import BrandMark from './brand/BrandMark'

export default function LoadingScreen({ label }: { label: string }) {
  return (
    <div className='fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-6'>
      <BrandMark variant='card-inline' className='h-10' />
      <span className='text-6xl inline-block animate-bounce-squish'>⚽</span>
      <p className='text-slate-400 text-sm font-medium'>{label}</p>
    </div>
  )
}
