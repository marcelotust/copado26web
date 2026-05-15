import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

type SimpleDialogProps = {
  isOpen: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export default function SimpleDialog({ isOpen, title, children, onClose }: SimpleDialogProps) {
  if (!isOpen) return null

  return createPortal(
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} />
      <div className='relative w-full max-w-md max-h-[85vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col'>
        <div className='p-5 border-b border-slate-700 flex justify-between items-start gap-3'>
          <h2 className='text-white font-bold text-base leading-snug'>{title}</h2>
          <button
            type='button'
            onClick={onClose}
            className='shrink-0 text-slate-400 hover:text-white text-sm font-medium px-2 py-1 rounded-lg hover:bg-slate-800'
          >
            ×
          </button>
        </div>
        <div className='p-5 overflow-y-auto text-slate-300 text-sm leading-relaxed'>{children}</div>
      </div>
    </div>,
    document.body,
  )
}
