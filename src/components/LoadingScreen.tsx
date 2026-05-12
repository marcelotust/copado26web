export default function LoadingScreen({ label }: { label: string }) {
  return (
    <div className='fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4'>
      <span className='text-6xl animate-bounce'>⚽</span>
      <p className='text-slate-400 text-sm font-medium'>{label}</p>
    </div>
  )
}
