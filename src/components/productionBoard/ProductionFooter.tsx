import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 樣式合併工具函數 (Project Standard)
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ProductionBoardFooter: React.FC = () => {
  {
    /* 底部：異常跑馬燈 */
  }
  return (
    <footer className='h-12 shrink-0 relative z-10'>
      <div
        className={cn(
          'h-full rounded-2xl border flex items-center px-8 relative overflow-hidden transition-all shadow-sm',
          'bg-white border-slate-200'
        )}
      >
        <div className='absolute left-0 top-0 bottom-0 w-2.5 bg-rose-500 animate-pulse' />
        <div
          className={cn(
            'flex items-center gap-4 shrink-0 mr-10 border-r pr-10',
            'border-slate-100'
          )}
        >
          <AlertTriangle className='text-rose-500' size={24} />
          <span
            className={cn(
              'font-black uppercase tracking-[0.2em] text-xs',
              'text-rose-600'
            )}
          >
            即時警報
          </span>
        </div>
        <div className='flex-1 overflow-hidden'>
          <div
            className={cn(
              'animate-marquee whitespace-nowrap text-lg font-bold tracking-tight',
              'text-slate-500'
            )}
          >
            [系統通知] 產線 B-05
            切削刀具磨耗接近臨界值，建議換班後進行預防性更換。
            <span className={cn('mx-24 opacity-20', 'text-slate-900')}>●</span>
            [物流通知] SMT-A線 元件 C102
            庫存低於安全水位，倉管人員已在備料路徑中。
            <span className={cn('mx-24 opacity-20', 'text-slate-900')}>●</span>
            [品質通知] 組裝 E-01 站良率連續三小時超過 99.5%，表現優異。
          </div>
        </div>
      </div>
    </footer>
  )
}

export default ProductionBoardFooter
