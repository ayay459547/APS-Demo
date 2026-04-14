import { Card, Tag, Progress, Badge } from 'antd'
import {
  User,
  AlertTriangle,
  Activity,
  Timer,
  ArrowRightCircle,
  PackageCheck,
  ShieldCheck
} from 'lucide-react'
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

// --- 子組件：高階產線資訊卡片 ---
const LineVisionCard: React.FC<{ data: LineData }> = ({ data }) => {
  const cfg = statusConfig[data.status]
  const progress = Math.min((data.actual / data.target) * 100, 100)

  return (
    <Card
      className={cn(
        'h-full transition-all duration-500 shadow-sm !rounded-[24px] !border-l-[16px] overflow-hidden relative',
        data.status === 'ALARM' && 'border-y-rose-200 border-r-rose-200',
        cfg.border
      )}
      classNames={{ body: 'h-full p-5 flex flex-col gap-4 bg-white' }}
    >
      {/* 若有異常/待料，顯示閃爍背景層以增加警示效果 */}
      {(data.status === 'ALARM' || data.status === 'IDLE') && (
        <div
          className={cn(
            'absolute inset-0 opacity-10 pointer-events-none',
            cfg.bgLight,
            cfg.animate
          )}
        ></div>
      )}

      {/* 第一層：標題與狀態 */}
      <div className='flex justify-between items-start relative z-10'>
        <div className='min-w-0 flex-1 pr-4'>
          <div className='flex items-center gap-2 mb-1'>
            <Tag className='m-0 font-black px-2 rounded border-none bg-slate-800 text-white shadow-sm'>
              {data.id}
            </Tag>
            <h2 className='text-xl xl:text-2xl font-black truncate m-0 tracking-tight text-slate-800'>
              {data.lineName}
            </h2>
          </div>

          <div className='flex items-center gap-2 mt-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100 inline-flex w-full max-w-full overflow-hidden'>
            <span className='text-indigo-600 font-mono text-xs font-bold uppercase shrink-0 bg-indigo-50 px-1.5 py-0.5 rounded'>
              {data.currentOrder}
            </span>
            <span className='text-sm font-bold truncate text-slate-600'>
              {data.productName}
            </span>
          </div>
        </div>

        <div
          className={cn(
            'flex flex-col items-end gap-1 shrink-0',
            cfg.text,
            cfg.animate
          )}
        >
          <Badge
            status={cfg.statusColor as any}
            text={
              <span
                className={cn('text-sm font-black tracking-wider', cfg.text)}
              >
                {cfg.label}
              </span>
            }
            className='scale-110 origin-right'
          />
        </div>
      </div>

      {/* 異常資訊橫幅 (僅在非 RUNNING 時顯示) */}
      {data.alertMsg && (
        <div
          className={cn(
            'px-3 py-2 !rounded-lg flex items-start gap-2 text-xs font-bold border relative z-10',
            data.status === 'ALARM'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          )}
        >
          <AlertTriangle size={16} className='shrink-0 mt-0.5' />
          <span className='leading-tight'>{data.alertMsg}</span>
        </div>
      )}

      {/* 第二層：核心數據區 (四宮格) */}
      <div className='grid grid-cols-2 gap-3 relative z-10'>
        {/* 進度 */}
        <div className='p-3.5 rounded-[16px] border bg-slate-50/50 border-slate-200 flex flex-col justify-center'>
          <span className='text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1'>
            <Activity size={12} /> 進度 (Act/Tgt)
          </span>
          <div className='flex items-baseline gap-1 mt-1'>
            <span
              className={cn(
                'text-3xl xl:text-4xl font-black tabular-nums tracking-tighter',
                data.status === 'ALARM' ? 'text-rose-600' : 'text-slate-800'
              )}
            >
              {data.actual}
            </span>
            <span className='text-sm text-slate-400 font-bold'>
              / {data.target}
            </span>
          </div>
          <Progress
            percent={progress}
            strokeColor={data.status === 'ALARM' ? '#ef4444' : '#4f46e5'}
            railColor={'#e2e8f0'}
            size={{ height: 6 }}
            showInfo={false}
            className='mt-2 mb-0'
          />
        </div>

        {/* OEE */}
        <div className='p-3.5 rounded-[16px] border bg-slate-50/50 border-slate-200 flex flex-col justify-center'>
          <span className='text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1'>
            <Timer size={12} /> 綜合效率 OEE
          </span>
          <div
            className={cn(
              'text-3xl xl:text-4xl font-black tracking-tighter tabular-nums flex items-baseline mt-1',
              data.oee < 60
                ? 'text-rose-500'
                : data.oee < 85
                  ? 'text-amber-500'
                  : 'text-indigo-600'
            )}
          >
            {data.oee.toFixed(1)}
            <span className='text-base ml-1 opacity-60 font-bold'>%</span>
          </div>
        </div>

        {/* 直通良率 FPY */}
        <div className='p-3 rounded-xl border bg-slate-50/50 border-slate-100 flex justify-between items-center'>
          <span className='text-[10px] font-black text-slate-500 tracking-wider flex items-center gap-1'>
            <ShieldCheck size={12} /> FPY 良率
          </span>
          <span
            className={cn(
              'text-lg font-black',
              data.yieldRate < 95 ? 'text-rose-500' : 'text-emerald-600'
            )}
          >
            {data.yieldRate}%
          </span>
        </div>

        {/* UPH 產能 */}
        <div className='p-3 rounded-xl border bg-slate-50/50 border-slate-100 flex justify-between items-center'>
          <span className='text-[10px] font-black text-slate-500 tracking-wider flex items-center gap-1'>
            <PackageCheck size={12} /> UPH 產能
          </span>
          <span className='text-lg font-black text-slate-700'>
            {data.uph} <span className='text-[10px] text-slate-400'>pcs/h</span>
          </span>
        </div>
      </div>

      {/* 第三層：底部資訊 (人員, ETA, 下一張單) */}
      <div className='mt-auto pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-y-2 relative z-10'>
        <div className='flex items-center gap-2'>
          <div className='w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center'>
            <User size={14} className='text-slate-500' />
          </div>
          <span className='text-xs font-bold text-slate-600'>
            {data.operator}
          </span>
        </div>

        <div className='flex items-center gap-3 text-[11px] font-bold'>
          <div className='flex items-center gap-1 bg-slate-50 px-2 py-1 rounded text-slate-500'>
            <span>ETA:</span>
            <span
              className={cn(
                'font-mono text-xs',
                data.status === 'ALARM' ? 'text-rose-500' : 'text-slate-700'
              )}
            >
              {data.eta}
            </span>
          </div>
          <div
            className='flex items-center gap-1 text-slate-400 max-w-[120px] truncate'
            title={data.nextOrder}
          >
            <ArrowRightCircle size={12} className='text-indigo-400 shrink-0' />
            <span className='truncate'>Next: {data.nextOrder}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default LineVisionCard
