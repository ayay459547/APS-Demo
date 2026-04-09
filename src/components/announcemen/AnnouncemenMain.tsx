import { Tag, Space } from 'antd'
import { ShieldAlert, Wrench, Settings, Info } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import type { Announcement } from './types'
import { MOCK_ANNOUNCEMENTS } from './constants'

/**
 * 樣式合併工具函數 (Project Standard)
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const AnnouncemenMain: React.FC = () => {
  const getAnnouncementIcon = (type: Announcement['type']) => {
    switch (type) {
      case 'Safety':
        return <ShieldAlert size={18} className='text-rose-500' />
      case 'Maintenance':
        return <Wrench size={18} className='text-amber-500' />
      case 'System':
        return <Settings size={18} className='text-blue-500' />
      case 'Info':
        return <Info size={18} className='text-emerald-500' />
    }
  }

  return (
    <div className='mt-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar'>
      <Space direction='vertical' size={16} className='w-full'>
        {MOCK_ANNOUNCEMENTS.map(item => (
          <div
            key={item.id}
            className={cn(
              'p-5 rounded-2xl border cursor-default transition-all duration-300',
              // 透過背景與邊框顏色變更來輔助聚焦
              item.isNew
                ? 'bg-indigo-50/40 border-indigo-100 shadow-sm hover:bg-indigo-50 hover:border-indigo-300'
                : 'bg-slate-50/60 border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-md'
            )}
          >
            <div className='flex justify-between items-start mb-3'>
              <div className='flex items-center gap-3'>
                <div className='p-2 rounded-xl shadow-sm border flex items-center justify-center bg-white border-slate-100 transition-colors'>
                  {getAnnouncementIcon(item.type)}
                </div>
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-black tracking-tight text-slate-800'>
                      {item.title}
                    </span>
                    {item.isNew && (
                      <div className='w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse' />
                    )}
                  </div>
                  <span className='text-[10px] text-slate-400 font-mono font-bold uppercase tracking-tighter'>
                    {item.time}
                  </span>
                </div>
              </div>
              <Tag className='m-0 border-none px-2 py-0.5 rounded-md font-bold text-[9px] uppercase shadow-sm bg-white text-slate-500'>
                {item.type}
              </Tag>
            </div>
            <p className='text-xs leading-relaxed m-0 opacity-80 text-slate-500'>
              {item.content}
            </p>
          </div>
        ))}
      </Space>
    </div>
  )
}

export default AnnouncemenMain
