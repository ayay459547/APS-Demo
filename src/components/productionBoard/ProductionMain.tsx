import { useState, useEffect } from 'react'
import { Row, Col } from 'antd'
import { Factory } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { MOCK_LINES } from './constants'
import LineVisionCard from './LineVisionCard.tsx'

/**
 * 樣式合併工具函數 (Project Standard)
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- 主元件 ---
export default function ProductionBoardMain() {
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
