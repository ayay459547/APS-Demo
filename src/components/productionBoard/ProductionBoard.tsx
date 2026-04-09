import React, { useState, useEffect } from 'react'
import { Card, Tag, Progress, Badge, Row, Col } from 'antd'
import { User, Factory } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 樣式合併工具函數 (Project Standard)
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- 現場數據定義 ---
interface LineData {
  id: string
  lineName: string
  status: 'RUNNING' | 'ALARM' | 'IDLE' | 'SETUP'
  currentOrder: string
  productName: string
  target: number
  actual: number
  oee: number
  operator: string
}

const MOCK_LINES: LineData[] = [
  {
    id: 'L1',
    lineName: 'SMT 自動貼片 A 線',
    status: 'RUNNING',
    currentOrder: 'MO-260408-01',
    productName: 'M3 Pro Mainboard',
    target: 500,
    actual: 428,
    oee: 92.5,
    operator: '陳大文'
  },
  {
    id: 'L2',
    lineName: 'CNC 精密加工 B 線',
    status: 'ALARM',
    currentOrder: 'MO-260408-05',
    productName: 'Aluminum Chassis',
    target: 200,
    actual: 85,
    oee: 45.2,
    operator: '李小龍'
  },
  {
    id: 'L3',
    lineName: '雷射切割 C 線',
    status: 'RUNNING',
    currentOrder: 'MO-260408-12',
    productName: 'Heat Sink v2',
    target: 1200,
    actual: 1150,
    oee: 98.1,
    operator: '張學友'
  },
  {
    id: 'L4',
    lineName: '自動焊接手臂 D 線',
    status: 'IDLE',
    currentOrder: 'MO-260408-20',
    productName: 'Power Module X1',
    target: 800,
    actual: 620,
    oee: 82.4,
    operator: '王嘉爾'
  },
  {
    id: 'L5',
    lineName: '組裝測試 E 線',
    status: 'RUNNING',
    currentOrder: 'MO-260408-09',
    productName: 'OLED Display Unit',
    target: 450,
    actual: 320,
    oee: 88.4,
    operator: '劉德華'
  },
  {
    id: 'L6',
    lineName: '出貨包裝 F 線',
    status: 'SETUP',
    currentOrder: 'MO-260408-15',
    productName: 'Retail Pack Box',
    target: 1000,
    actual: 120,
    oee: 75.0,
    operator: '周杰倫'
  },
  {
    id: 'L7',
    lineName: '注塑成型 G 線',
    status: 'RUNNING',
    currentOrder: 'MO-260408-22',
    productName: 'Plastic Casing B',
    target: 2000,
    actual: 1850,
    oee: 95.3,
    operator: '林志玲'
  },
  {
    id: 'L8',
    lineName: '電鍍處理 H 線',
    status: 'RUNNING',
    currentOrder: 'MO-260408-25',
    productName: 'Chrome Plate Z',
    target: 300,
    actual: 210,
    oee: 89.2,
    operator: '彭于晏'
  }
]

// --- 子元件：產線卡片 ---
const LineVisionCard: React.FC<{ data: LineData }> = ({ data }) => {
  // 修正：明確定義狀態配置型別以解決 TypeScript Property 'animate' 報錯
  const statusConfig: Record<
    LineData['status'],
    {
      border: string
      text: string
      label: string
      statusColor: string
      animate?: string
    }
  > = {
    RUNNING: {
      border: 'border-l-emerald-500',
      text: 'text-emerald-500',
      label: '生產中',
      statusColor: 'success'
    },
    ALARM: {
      border: 'border-l-rose-500',
      text: 'text-rose-500',
      label: '異常',
      animate: 'animate-pulse',
      statusColor: 'error'
    },
    IDLE: {
      border: 'border-l-amber-500',
      text: 'text-amber-500',
      label: '待料',
      statusColor: 'warning'
    },
    SETUP: {
      border: 'border-l-blue-500',
      text: 'text-blue-500',
      label: '調機',
      statusColor: 'processing'
    }
  }

  const cfg = statusConfig[data.status]
  const progress = Math.min((data.actual / data.target) * 100, 100)

  return (
    <Card
      className={cn(
        'h-full transition-all duration-500 shadow-sm',
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
              trailColor={'#e2e8f0'}
              strokeWidth={10}
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

// --- 主元件 ---
export default function ProductionBoard() {
  const [loading, setLoading] = useState(true)
  // const scrollContainerRef = useRef<HTMLElement>(null)

  // 初始化
  useEffect(() => {
    let isMounted = true
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false)
    }, 800)
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [])

  // 自動捲動邏輯
  // useEffect(() => {
  //   if (loading) return
  //   const container = scrollContainerRef.current
  //   if (!container) return

  //   let requestId: number
  //   let scrollPos = 0
  //   const speed = 0.4

  //   const performScroll = () => {
  //     scrollPos += speed
  //     container.scrollTop = scrollPos
  //     if (scrollPos >= container.scrollHeight - container.clientHeight) {
  //       setTimeout(() => {
  //         scrollPos = 0
  //         container.scrollTo({ top: 0, behavior: 'smooth' })
  //       }, 3000)
  //     }
  //     requestId = requestAnimationFrame(performScroll)
  //   }

  //   const startTimeout = setTimeout(() => {
  //     requestId = requestAnimationFrame(performScroll)
  //   }, 2000)

  //   return () => {
  //     clearTimeout(startTimeout)
  //     cancelAnimationFrame(requestId)
  //   }
  // }, [loading])

  return (
    <div className='w-full h-full overflow-hidden'>
      {/* 中間：自動捲動產線區域 */}
      <main
        // ref={scrollContainerRef}
        className='w-full h-full overflow-y-auto no-scrollbar py-2'
      >
        <Row gutter={[24, 24]}>
          {MOCK_LINES.map(line => (
            <Col key={line.id} xs={24} lg={12} xl={8}>
              <LineVisionCard data={line} />
            </Col>
          ))}
        </Row>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes marquee {
          0% { transform: translateX(40%); }
          100% { transform: translateX(-160%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 45s linear infinite;
        }

        .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .ant-progress-inner { background-color: '#f1f5f9' !important; }

        @media (max-width: 1280px) {
          .text-6xl { font-size: 3rem; }
        }
      `}</style>

      {/* 全螢幕 Loading */}
      {loading && (
        <div
          className={cn(
            'fixed inset-0 z-[1000] flex flex-col items-center justify-center transition-colors duration-500',
            'bg-white'
          )}
        >
          <div className='relative'>
            <div
              className={cn(
                'w-20 h-20 border-[6px] rounded-full animate-spin',
                'border-slate-100 border-t-indigo-600'
              )}
            />
            <Factory
              className={cn('absolute inset-0 m-auto', 'text-indigo-600')}
              size={32}
            />
          </div>
          <p
            className={cn(
              'mt-6 font-black tracking-[0.5em] uppercase text-[11px]',
              'text-slate-400'
            )}
          >
            Syncing Dashboard...
          </p>
        </div>
      )}
    </div>
  )
}
