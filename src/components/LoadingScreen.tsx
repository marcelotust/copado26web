import LoadingBrand from './LoadingBrand'

export default function LoadingScreen({ label }: { label: string }) {
  return (
    <div className='fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-12'>
      <LoadingBrand />
      <div className='flex flex-col items-center gap-1 mt-10'>
        <span className='text-6xl inline-block animate-bounce-squish'>⚽</span>
        <p className='text-slate-400 text-sm font-medium'>{label}</p>
      </div>
    </div>
  )
}
