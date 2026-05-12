export default function ProgressBar({ collected, total }: { collected: number; total: number }) {
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0;

  return (
    <div className='flex-1 flex items-center gap-2 min-w-0'>
      <div className='flex-1 bg-slate-800 rounded-full h-2 min-w-[60px]'>
        <div
          className='h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500'
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className='text-slate-400 text-xs tabular-nums shrink-0'>
        <span className='text-white font-semibold'>{collected}</span>
        <span className='text-slate-600'>/{total}</span>
      </span>
      <span className='text-slate-500 text-xs shrink-0 hidden sm:inline'>
        {pct}%
      </span>
    </div>
  );
}
