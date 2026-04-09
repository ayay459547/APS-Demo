import { useState, useEffect, useRef } from 'react'
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
  const scrollContainerRef = useRef<HTMLElement>(null)

  // 初始化
  useEffect(() => {
    let isMounted = true
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false)
    }, 1000)
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [])

  const [isHovering, setIsHovering] = useState(false)
  const handleEnter = () => {
    setIsHovering(true)
  }
  const handleLeave = () => {
    setIsHovering(false)
  }

  // 自動捲動邏輯
  useEffect(() => {
    if (loading) return
    const container = scrollContainerRef.current
    if (!container) return

    let requestId: number
    let scrollPos = 0
    const speed = 0.4

    const performScroll = () => {
      if (isHovering) {
        requestId = requestAnimationFrame(performScroll)
        return
      }
      scrollPos += speed
      container.scrollTop = scrollPos
      if (scrollPos >= container.scrollHeight - container.clientHeight) {
        setTimeout(() => {
          scrollPos = 0
          container.scrollTo({ top: 0, behavior: 'smooth' })
        }, 3000)
      }
      requestId = requestAnimationFrame(performScroll)
    }

    const startTimeout = setTimeout(() => {
      requestId = requestAnimationFrame(performScroll)
    }, 2000)

    return () => {
      clearTimeout(startTimeout)
      cancelAnimationFrame(requestId)
    }
  }, [loading, isHovering])

  return (
    <>
      <div className='w-full h-full overflow-hidden'>
        {/* 中間：自動捲動產線區域 */}
        <main
          ref={scrollContainerRef}
          className='w-full h-full overflow-y-auto no-scrollbar py-2'
        >
          <Row gutter={[24, 24]}>
            {MOCK_LINES.map(line => (
              <Col
                key={line.id}
                xs={24}
                lg={12}
                xl={8}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
              >
                <LineVisionCard data={line} />
              </Col>
            ))}
          </Row>
        </main>
      </div>

      {/* 全螢幕 Loading */}
      {loading && (
        <div
          className={cn(
            'fixed top-0 left-0 w-dvw h-dvh inset-0 z-[1000] flex flex-col items-center justify-center transition-colors duration-500',
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
    </>
  )
}
