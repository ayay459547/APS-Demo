import React, { useState, useEffect } from 'react'
import { Tag } from 'antd'
import { Factory } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import dayjs from 'dayjs'

/**
 * 樣式合併工具函數 (Project Standard)
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ProductionBoardHeader: React.FC = () => {
  const [now, setNow] = useState(dayjs())

  // 初始化
  useEffect(() => {
    const interval = setInterval(() => setNow(dayjs()), 1000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <header className='flex md:items-center justify-between gap-4 relative z-10'>
      <div className='flex items-center gap-4'>
        <div
          className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center shadow-2xl transition-all',
            'bg-indigo-600 shadow-indigo-200'
          )}
        >
          <Factory size={16} className='text-white' />
        </div>

        <div className='flex flex-col gap-1 hidden sm:block'>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse' />
            <span
              className={cn(
                'font-black text-xs uppercase tracking-widest',
                'text-emerald-600'
              )}
            >
              PLC Link Active
            </span>
          </div>
          <div className='flex items-center gap-3'>
            <Tag
              className={cn(
                'border-none font-black px-2.5 py-0.5 rounded-md text-[11px] shadow-sm',
                'bg-indigo-50 text-indigo-600'
              )}
            >
              日班
            </Tag>
            <span
              className={cn(
                'font-black text-xs uppercase tracking-widest opacity-40',
                'text-slate-900'
              )}
            >
              Sector 01-A
            </span>
          </div>
        </div>
      </div>

      {/* 巨大數字時鐘區塊 */}
      <div
        className={cn(
          'w-fit flex items-center gap-4 p-2 px-6 mr-6 rounded-4xl border transition-all shadow-sm backdrop-blur-md',
          'bg-white/80 border-slate-200'
        )}
      >
        <div
          className={cn(
            'border-r pr-4 border-current',
            'font-black uppercase text-[10px] tracking-widest',
            'text-slate-500'
          )}
        >
          {now.format('YYYY.MM.DD')} ({now.format('dddd')})
        </div>
        <div
          className={cn(
            'text-2xl font-black font-mono tracking-tighter tabular-nums leading-none transition-all',
            'text-slate-800'
          )}
        >
          {now.format('HH:mm:ss')}
        </div>
      </div>
    </header>
  )
}

export default ProductionBoardHeader
