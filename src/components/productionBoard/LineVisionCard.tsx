import { Card, Tag, Progress, Badge } from 'antd'
import { User } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import type { LineData } from './types'
import { statusConfig } from './constants'

/**
 * 樣式合併工具函數 (Project Standard)
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- 子元件：產線卡片 ---
const LineVisionCard: React.FC<{ data: LineData }> = ({ data }) => {
  const cfg = statusConfig[data.status]
  const progress = Math.min((data.actual / data.target) * 100, 100)

  return (
    <Card
      className={cn(
        'h-full transition-all duration-500 shadow-sm !rounded-[28px] !border-l-[14px]',
        data.status === 'ALARM' && 'ring-4 ring-rose-100',
        cfg.border,
        cfg.animate // 現在 cfg.animate 不會再報錯了
      )}
      classNames={{
        body: 'h-full'
      }}
    >
      <div className='h-full flex flex-col gap-8'>
        <div className='flex justify-between items-start'>
          <div className='min-w-0'>
            <div className='flex items-center gap-3 mb-1'>
              <Tag
                className={cn(
                  'm-0 font-bold px-2 rounded-md border-none h-6 flex items-center shadow-sm',
                  'bg-slate-100 text-slate-600'
                )}
              >
                {data.id}
              </Tag>
              <h2
                className={cn(
                  'text-2xl font-black truncate m-0 tracking-tight',
                  'text-slate-800'
                )}
              >
                {data.lineName}
              </h2>
            </div>
            <div className='flex items-center gap-2 mt-1 px-1'>
              <span className='text-indigo-500 font-mono text-sm font-bold uppercase'>
                {data.currentOrder}
              </span>
              <span className={cn('text-sm opacity-20', 'text-slate-900')}>
                |
              </span>
              <span
                className={cn('text-sm font-bold truncate', 'text-slate-500')}
              >
                {data.productName}
              </span>
            </div>
          </div>

          <div className={cn('flex flex-col items-end gap-1', cfg.text)}>
            <Badge
              status={cfg.statusColor as any}
              text={
                <span className='text-xs font-black uppercase tracking-widest'>
                  {cfg.label}
                </span>
              }
              className='scale-125'
            />
          </div>
        </div>

        <div className='flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div
            className={cn(
              'p-6 rounded-[24px] border transition-colors',
              'bg-slate-50 border-slate-100/50'
            )}
          >
            <span className='text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest'>
              目標進度 (Actual / Target)
            </span>
            <div className='flex items-baseline gap-3'>
              <span
                className={cn(
                  'text-5xl font-black tabular-nums tracking-tighter',
                  'text-slate-800'
                )}
              >
                {data.actual}
              </span>
              <span className='text-2xl text-slate-400 font-black'>
                / {data.target}
              </span>
            </div>
            <Progress
              percent={progress}
              strokeColor={data.status === 'ALARM' ? '#ef4444' : '#6366f1'}
              railColor={'#e2e8f0'}
              size={{ height: 10 }}
              showInfo={false}
              className='mt-6'
            />
          </div>

          <div
            className={cn(
              'p-6 rounded-[24px] border flex flex-col justify-center transition-colors',
              'bg-slate-50 border-slate-100/50'
            )}
          >
            <span className='text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest'>
              當前效率 (OEE)
            </span>
            <div className='text-6xl font-black text-indigo-500 tracking-tighter tabular-nums flex items-baseline'>
              {data.oee.toFixed(1)}
              <span className='text-2xl ml-1 opacity-50 font-bold'>%</span>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'flex items-center justify-between pt-4 border-t',
            'border-slate-100'
          )}
        >
          <div className='flex items-center gap-3'>
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center border transition-colors',
                'bg-white border-slate-200 shadow-sm'
              )}
            >
              <User size={18} className={'text-slate-500'} />
            </div>
            <span className={cn('text-base font-bold', 'text-slate-700')}>
              {data.operator}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default LineVisionCard
