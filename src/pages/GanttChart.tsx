import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Calendar,
  Settings,
  BarChart2,
  Clock,
  CheckCircle2,
  Map as MapIcon,
  Route
} from 'lucide-react'

// --- 設定與常數 ---
const BASE_MACHINES = [
  { type: 'CNC', name: 'CNC 銑床' },
  { type: 'CNC', name: 'CNC 車床' },
  { type: '5-AXIS', name: '五軸加工機' },
  { type: 'LASER', name: '雷射切割機' },
  { type: 'WELDING', name: '自動焊接手臂' },
  { type: 'HEAT', name: '熱處理爐' },
  { type: 'GRIND', name: '表面研磨機' },
  { type: 'COATING', name: '陽極處理線' },
  { type: 'ASM', name: '自動組裝線' },
  { type: 'QC', name: '三次元量測儀' },
  { type: 'PACK', name: '出貨包裝站' }
]

// 動態擴增至 100 台機台以展示虛擬渲染效能
const MACHINES = Array.from({ length: 100 }, (_, i) => {
  const base = BASE_MACHINES[i % BASE_MACHINES.length]
  return {
    id: `MCH-${String(i + 1).padStart(3, '0')}`,
    name: `${base.name}-${String(i + 1).padStart(3, '0')}`,
    type: base.type
  }
})

const PROCESSES = [
  { name: '下料', color: 'bg-slate-500 border-slate-600 text-slate-100' },
  { name: 'CNC加工', color: 'bg-blue-500 border-blue-600 text-blue-50' },
  { name: '熱處理', color: 'bg-red-500 border-red-600 text-red-50' },
  { name: '研磨', color: 'bg-purple-500 border-purple-600 text-purple-50' },
  { name: '表面處理', color: 'bg-orange-500 border-orange-600 text-orange-50' },
  { name: '組裝', color: 'bg-emerald-500 border-emerald-600 text-emerald-50' },
  { name: '檢驗', color: 'bg-teal-500 border-teal-600 text-teal-50' }
]

const PROCESS_MACHINE_MAP: Record<string, string[]> = {
  下料: ['LASER'],
  CNC加工: ['CNC', '5-AXIS'],
  熱處理: ['HEAT'],
  研磨: ['GRIND'],
  表面處理: ['COATING'],
  組裝: ['ASM', 'WELDING'],
  檢驗: ['QC', 'PACK']
}

const ROUTINGS = [
  {
    id: 'R-A',
    name: '標準金屬件途程',
    steps: ['下料', 'CNC加工', '表面處理', '檢驗']
  },
  {
    id: 'R-B',
    name: '精密研磨件途程',
    steps: ['下料', 'CNC加工', '研磨', '檢驗']
  },
  {
    id: 'R-C',
    name: '銲接組裝件途程',
    steps: ['下料', '組裝', '表面處理', '檢驗']
  }
]

// 擴展至 30 天，涵蓋因防碰撞演算法而往後遞延的工單，解決超出 14 天會跑版的問題
const DAYS_TO_SHOW = 30
const PIXELS_PER_HOUR = 30 // 縮放比例：1小時 = 30px
const DAY_WIDTH = 24 * PIXELS_PER_HOUR
const ROW_HEIGHT = 48 // 每列高度 48px
const SIDEBAR_WIDTH = 256 // 側邊欄寬度 256px

const getBaseDate = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
const BASE_DATE: any = getBaseDate()

// --- 資料生成引擎 (4000筆，含防碰撞與預先計算座標) ---
const generateMockData = () => {
  const tasks: any[] = []
  const TOTAL_WORK_ORDERS = 1000 // 1000主工單 * 4途程 = 4000子工單
  let taskIdCounter = 1

  const machineAvailableTimes: Record<string, any> = {}
  MACHINES.forEach(
    m => (machineAvailableTimes[m.id] = new Date(BASE_DATE.getTime()))
  )

  const nowTime = new Date(BASE_DATE.getTime() + 2 * 24 * 60 * 60 * 1000)

  for (let wo = 1; wo <= TOTAL_WORK_ORDERS; wo++) {
    const workOrderId = `WO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(wo).padStart(4, '0')}`
    const routing = ROUTINGS[Math.floor(Math.random() * ROUTINGS.length)]

    let currentTaskReadyTime = new Date(
      BASE_DATE.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000
    )

    routing.steps.forEach((processName, idx) => {
      const allowedTypes = PROCESS_MACHINE_MAP[processName]
      const validMachines = MACHINES.filter(m => allowedTypes.includes(m.type))

      let selectedMachine = validMachines[0]
      let earliestAvailable = new Date(8640000000000000)

      validMachines.forEach(m => {
        const machineReadyTime = machineAvailableTimes[m.id]
        const actualStart = new Date(
          Math.max(currentTaskReadyTime.getTime(), machineReadyTime.getTime())
        )
        if (actualStart < earliestAvailable) {
          earliestAvailable = actualStart
          selectedMachine = m
        }
      })

      const actualStart: any = earliestAvailable
      const durationHours = 2 + Math.floor(Math.random() * 6)
      const endTime = new Date(
        actualStart.getTime() + durationHours * 60 * 60 * 1000
      )

      machineAvailableTimes[selectedMachine.id] = new Date(
        endTime.getTime() + 0.5 * 60 * 60 * 1000
      )

      let status = 'PENDING'
      if (endTime < nowTime) status = 'COMPLETED'
      else if (actualStart <= nowTime && endTime >= nowTime)
        status = 'IN_PROGRESS'

      const processObj: any = PROCESSES.find(p => p.name === processName)

      // 預先計算 CSS 渲染所需座標，大幅節省 Scroll 時的 CPU 計算
      const diffHours = (actualStart - BASE_DATE) / (1000 * 60 * 60)
      const left = diffHours * PIXELS_PER_HOUR
      const width = durationHours * PIXELS_PER_HOUR

      tasks.push({
        id: `TASK-${taskIdCounter++}`,
        workOrderId,
        subOrderId: `${workOrderId}-${idx + 1}`,
        machineId: selectedMachine.id,
        process: processName,
        colorClass: processObj.color,
        startTime: new Date(actualStart),
        endTime: new Date(endTime),
        status,
        duration: durationHours,
        routingName: routing.name,
        routingSteps: routing.steps,
        stepIndex: idx,
        left,
        width
      })

      currentTaskReadyTime = new Date(endTime.getTime() + 1 * 60 * 60 * 1000)
    })
  }
  return tasks
}

const formatTime = (date: any) => {
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// --- 主元件 ---
export default function GanttChart() {
  const [tasksByMachine, setTasksByMachine] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  // 虛擬渲染視窗狀態
  const [viewport, setViewport] = useState({
    top: 0,
    left: 0,
    width: 1200,
    height: 800
  })
  const scrollContainerRef = useRef<any | null>(null)
  const sidebarRef = useRef<any | null>(null)

  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    data: any
    isTop?: boolean
  }>({
    visible: false,
    x: 0,
    y: 0,
    data: null
  })

  // 監聽容器大小，確保虛擬渲染邊界正確。依賴於 loading 確保在 DOM 節點存在後才綁定
  useEffect(() => {
    if (!loading && scrollContainerRef.current) {
      const observer = new ResizeObserver(entries => {
        setViewport(prev => ({
          ...prev,
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height
        }))
      })
      observer.observe(scrollContainerRef.current)
      return () => observer.disconnect()
    }
  }, [loading])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setTimeout(() => {
        const rawTasks = generateMockData()
        // 將資料分組至對應機台
        const map: Record<string, any> = {}
        MACHINES.forEach(m => (map[m.id] = []))
        rawTasks.forEach(task => map[task.machineId].push(task))

        setTasksByMachine(map)
        setLoading(false)
      }, 500)
    }
    loadData()
  }, [])

  const timelineHeaders = useMemo(() => {
    const headers = []
    for (let i = 0; i < DAYS_TO_SHOW; i++) {
      const d = new Date(BASE_DATE.getTime() + i * 24 * 60 * 60 * 1000)
      headers.push({
        label: `${d.getMonth() + 1}月${d.getDate()}日`,
        hours: Array.from(
          { length: 24 },
          (_, h) => String(h).padStart(2, '0') + ':00'
        )
      })
    }
    return headers
  }, [])

  // 處理高效能滾動更新 (包含同步更新側邊欄，避免 null 參照錯誤)
  const handleScroll = useCallback((e: any) => {
    const target = e.currentTarget
    const top = target.scrollTop
    const left = target.scrollLeft

    setViewport(prev => ({
      ...prev,
      top,
      left
    }))

    if (sidebarRef.current) {
      sidebarRef.current.scrollTop = top
    }
  }, [])

  const handleMouseEnterTask = useCallback((e: any, task: any) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const isTop = rect.top > window.innerHeight / 2
    const yOffset = isTop ? rect.top - 10 : rect.bottom + 10

    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: yOffset,
      data: task,
      isTop
    })
  }, [])

  const handleMouseLeaveTask = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }))
  }, [])

  // --- 虛擬渲染核心邏輯 (Virtualization Core) ---
  const OVERSCAN_Y = 5 // 垂直預載列數
  const OVERSCAN_X = 500 // 水平預載像素

  const visibleMachines = useMemo(() => {
    const startIndex = Math.max(
      0,
      Math.floor(viewport.top / ROW_HEIGHT) - OVERSCAN_Y
    )
    const endIndex = Math.min(
      MACHINES.length - 1,
      Math.ceil((viewport.top + viewport.height) / ROW_HEIGHT) + OVERSCAN_Y
    )

    const result: any[] = []
    for (let i = startIndex; i <= endIndex; i++) {
      if (MACHINES[i]) {
        result.push({ ...MACHINES[i], index: i })
      }
    }
    return result
  }, [viewport.top, viewport.height])

  const totalTimeWidth = DAYS_TO_SHOW * DAY_WIDTH
  const totalContentHeight = MACHINES.length * ROW_HEIGHT

  return (
    <div className='flex flex-col h-full bg-slate-50 font-sans text-slate-800 overflow-hidden'>
      {/* Toolbar */}
      <div className='flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 shadow-sm z-10 shrink-0 overflow-x-auto scrollbar-hide'>
        <div className='flex items-center gap-4 text-xs font-medium text-slate-600 whitespace-nowrap'>
          <span className='flex items-center gap-1'>
            <Calendar size={14} /> 排程區間：未來 {DAYS_TO_SHOW} 天
          </span>
          <div className='h-4 w-px bg-slate-300'></div>
          <div className='flex items-center gap-3'>
            製程圖例：
            {PROCESSES.map(p => (
              <div key={p.name} className='flex items-center gap-1'>
                <div
                  className={`w-3 h-3 rounded-sm ${p.color.split(' ')[0]}`}
                ></div>
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
        <button className='text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded border border-blue-200 font-medium hover:bg-blue-100 transition-colors flex items-center gap-1 whitespace-nowrap ml-4'>
          <CheckCircle2 size={14} /> 產能衝突已解決
        </button>
      </div>

      {/* Main Gantt Chart Area */}
      <main className='flex-1 relative overflow-hidden bg-white'>
        {loading ? (
          <div className='absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm z-50'>
            <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6 shadow-lg'></div>
            <p className='text-slate-600 font-bold text-lg mb-2'>
              執行 APS 防撞演算法與生成資料中...
            </p>
            <p className='text-slate-400 text-sm animate-pulse'>
              正在運算 4,000 筆排程防撞邏輯並預備虛擬渲染座標
            </p>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className='w-full h-full overflow-auto relative'
            style={{ willChange: 'transform' }} // 提示瀏覽器優化捲動
          >
            {/* 總內容尺寸容器，撐開捲軸 */}
            <div
              style={{
                width: SIDEBAR_WIDTH + totalTimeWidth,
                height: 60 + totalContentHeight,
                position: 'relative'
              }}
            >
              {/* Top-Left Corner (Sticky) */}
              <div
                className='sticky top-0 left-0 bg-slate-100 border-b border-r border-slate-300 z-40 flex items-center px-4 font-bold text-slate-700 text-sm shadow-[2px_2px_5px_rgba(0,0,0,0.05)]'
                style={{ width: SIDEBAR_WIDTH, height: 60 }}
              >
                設備資源清單 ({MACHINES.length}台)
              </div>

              {/* Timeline Headers (Sticky Top) */}
              <div
                className='sticky top-0 flex z-30 bg-white border-b border-slate-300 shadow-sm'
                style={{
                  left: SIDEBAR_WIDTH,
                  width: totalTimeWidth,
                  height: 60,
                  marginTop: -60,
                  marginLeft: SIDEBAR_WIDTH
                }}
              >
                {timelineHeaders.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    className='flex flex-col border-r border-slate-200'
                    style={{ width: DAY_WIDTH }}
                  >
                    <div className='h-8 bg-slate-50 border-b border-slate-200 flex items-center justify-center font-bold text-sm text-slate-600'>
                      {day.label}
                    </div>
                    <div className='flex h-7 bg-white'>
                      {day.hours.map((hour, hIdx) => (
                        <div
                          key={hIdx}
                          className='border-r border-slate-100 flex items-center justify-center text-[10px] text-slate-400'
                          style={{ width: PIXELS_PER_HOUR }}
                        >
                          {hIdx % 4 === 0 ? hour : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid Background (純 CSS 繪製，無 DOM 節點) */}
              <div
                className='absolute top-[60px] bottom-0 z-0'
                style={{
                  left: SIDEBAR_WIDTH,
                  width: totalTimeWidth,
                  backgroundImage: `repeating-linear-gradient(to right, transparent, transparent ${PIXELS_PER_HOUR - 1}px, #f1f5f9 ${PIXELS_PER_HOUR - 1}px, #f1f5f9 ${PIXELS_PER_HOUR}px)`
                }}
              ></div>

              {/* Virtualized Rows Container */}
              <div
                className='absolute left-0 right-0 top-[60px] z-10'
                style={{ height: totalContentHeight }}
              >
                {visibleMachines.map(m => {
                  const tasks: any[] = tasksByMachine[m.id] || []
                  const topOffset = m.index * ROW_HEIGHT

                  return (
                    <div
                      key={m.id}
                      className='absolute flex w-full hover:bg-blue-50/30 transition-colors border-b border-slate-100'
                      style={{ top: topOffset, height: ROW_HEIGHT }}
                    >
                      {/* Sidebar Machine Cell (Sticky Left) */}
                      <div
                        className='sticky left-0 bg-white border-r border-slate-200 z-20 flex flex-col justify-center px-4 shrink-0'
                        style={{ width: SIDEBAR_WIDTH }}
                      >
                        <div className='font-semibold text-sm text-slate-800 truncate'>
                          {m.name}
                        </div>
                        <div className='text-[10px] text-slate-400 font-mono'>
                          {m.id} · {m.type}
                        </div>
                      </div>

                      {/* Tasks Container 加上 overflow-hidden 避免跑版撐破 */}
                      <div className='relative flex-1 overflow-hidden'>
                        {tasks.map(task => {
                          // Horizontal Culling (水平視角裁切)
                          const isVisibleX =
                            task.left + task.width >=
                              viewport.left - SIDEBAR_WIDTH - OVERSCAN_X &&
                            task.left <=
                              viewport.left + viewport.width + OVERSCAN_X

                          if (!isVisibleX) return null

                          return (
                            <div
                              key={task.id}
                              onMouseEnter={e => handleMouseEnterTask(e, task)}
                              onMouseLeave={handleMouseLeaveTask}
                              className={`absolute top-1.5 bottom-1.5 rounded shadow-sm border flex flex-col justify-center px-2 cursor-pointer transition-transform hover:scale-[1.03] hover:z-30 overflow-hidden ${task.colorClass}`}
                              style={{
                                left: task.left,
                                width: Math.max(task.width, 60), // 確保寬度不會過小導致文字看不見
                                opacity: task.status === 'COMPLETED' ? 0.4 : 1
                              }}
                            >
                              <div className='truncate text-[11px] font-bold w-full flex items-center gap-1.5 drop-shadow-md'>
                                {task.status === 'COMPLETED' && (
                                  <CheckCircle2
                                    size={10}
                                    className='shrink-0'
                                  />
                                )}
                                {task.status === 'IN_PROGRESS' && (
                                  <div className='w-2 h-2 rounded-full bg-white animate-pulse shrink-0'></div>
                                )}
                                <span className='truncate tracking-wider'>
                                  {task.subOrderId}
                                </span>
                              </div>
                              <div className='truncate text-[9px] opacity-90 mt-[1px] tracking-tight font-mono'>
                                {formatTime(task.startTime)} -{' '}
                                {formatTime(task.endTime)}
                              </div>
                              {task.status === 'IN_PROGRESS' && (
                                <div
                                  className='absolute bottom-0 left-0 h-1 bg-white/40'
                                  style={{ width: '60%' }}
                                ></div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- Global Tooltip --- */}
      {tooltip.visible && tooltip.data && (
        <div
          className={`fixed z-50 bg-slate-900 text-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-slate-700 p-5 w-[340px] pointer-events-none transform -translate-x-1/2 transition-opacity duration-150 ${tooltip.isTop ? '-translate-y-full' : 'translate-y-0'}`}
          style={{
            left: tooltip.x,
            top: tooltip.y,
            marginTop: tooltip.isTop ? 0 : '10px'
          }}
        >
          {/* Header */}
          <div className='flex justify-between items-start border-b border-slate-700 pb-3 mb-3'>
            <div>
              <div className='text-xs text-blue-400 font-mono mb-1 flex items-center gap-1'>
                <MapIcon size={12} /> 子工單：{tooltip.data.subOrderId}
              </div>
              <div className='font-bold text-lg text-white'>
                主工單：{tooltip.data.workOrderId}
              </div>
            </div>
            <div
              className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                tooltip.data.status === 'COMPLETED'
                  ? 'bg-green-900/50 text-green-400 border border-green-800'
                  : tooltip.data.status === 'IN_PROGRESS'
                    ? 'bg-blue-900/50 text-blue-400 border border-blue-800'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {tooltip.data.status === 'COMPLETED'
                ? '已完成'
                : tooltip.data.status === 'IN_PROGRESS'
                  ? '加工中'
                  : '待派工'}
            </div>
          </div>

          {/* Detailed Info */}
          <div className='space-y-2.5 text-sm bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 mb-4'>
            <div className='flex items-center gap-2'>
              <Settings size={14} className='text-slate-400 shrink-0' />
              <span className='text-slate-400 w-12'>製程：</span>
              <span className='font-bold text-white px-2 py-0.5 rounded bg-slate-700'>
                {tooltip.data.process}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <BarChart2 size={14} className='text-slate-400 shrink-0' />
              <span className='text-slate-400 w-12'>機台：</span>
              <span className='text-white truncate'>
                {MACHINES.find(m => m.id === tooltip.data.machineId)?.name}
              </span>
            </div>
            <div className='flex items-start gap-2'>
              <Clock size={14} className='text-slate-400 shrink-0 mt-0.5' />
              <div className='flex flex-col'>
                <span className='text-slate-400'>
                  工時：
                  <span className='text-blue-300 font-bold'>
                    {tooltip.data.duration}
                  </span>{' '}
                  小時
                </span>
                <span className='font-mono text-[11px] mt-1 text-slate-300'>
                  {formatTime(tooltip.data.startTime)} ~{' '}
                  {formatTime(tooltip.data.endTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Routing Visualizer */}
          <div className='pt-2 border-t border-slate-700'>
            <div className='text-[11px] text-slate-400 mb-3 flex items-center gap-1.5'>
              <Route size={12} />
              <span>
                途程資料：
                <strong className='text-slate-200'>
                  {tooltip.data.routingName}
                </strong>
              </span>
            </div>

            <div className='flex items-center w-full justify-between relative'>
              <div className='absolute top-1/2 left-0 w-full h-0.5 bg-slate-700 -translate-y-1/2 z-0'></div>
              {tooltip.data.routingSteps.map((step: any, idx: number) => {
                const isCurrent = idx === tooltip.data.stepIndex
                const isPast = idx < tooltip.data.stepIndex
                return (
                  <div
                    key={idx}
                    className='relative z-10 flex flex-col items-center'
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isCurrent
                          ? 'bg-blue-500 border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]'
                          : isPast
                            ? 'bg-green-500 border-green-500'
                            : 'bg-slate-800 border-slate-600'
                      }`}
                    >
                      {isPast && (
                        <CheckCircle2 size={8} className='text-white' />
                      )}
                    </div>
                    <div
                      className={`absolute top-5 text-[10px] whitespace-nowrap px-1 py-0.5 rounded transition-colors ${
                        isCurrent
                          ? 'text-blue-300 font-bold'
                          : isPast
                            ? 'text-slate-400'
                            : 'text-slate-500'
                      }`}
                    >
                      {step}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className='h-6'></div>
          </div>

          <div
            className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-slate-700 transform rotate-45 ${
              tooltip.isTop
                ? 'bottom-[-9px] border-b border-r'
                : 'top-[-9px] border-t border-l'
            }`}
          ></div>
        </div>
      )}
    </div>
  )
}
