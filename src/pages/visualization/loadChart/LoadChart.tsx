import { useState, useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts'
import {
  Calendar,
  Download,
  Activity,
  Zap,
  TrendingUp,
  AlertTriangle,
  Clock,
  Factory,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// 使用 tailwind-merge 與 clsx 來智慧合併 className
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- 型別定義 (Type Definitions) ---
type MachineType =
  | 'CNC'
  | '5-AXIS'
  | 'LASER'
  | 'WELDING'
  | 'HEAT'
  | 'GRIND'
  | 'COATING'
  | 'ASM'
  | 'QC'
  | 'PACK'

interface BaseMachine {
  type: MachineType
  name: string
}

interface Machine {
  id: string
  name: string
  type: MachineType
}

interface Routing {
  steps: string[]
}

interface LoadStatus {
  color: string
  hex: string
  text: string
  label: string
  bg: string
}

interface MachineSummary extends Machine {
  totalScheduledHours: number
  avgLoadPercent: number
  status: LoadStatus
}

interface ChartDataPoint {
  dayIndex: number
  dateLabel: string
  scheduledHours: number
  availableHours: number
  percent: number
  status: LoadStatus
}

interface DashboardStats {
  totalReq: number
  totalAvail: number
  avg: number
  peak: number
}

// 扁平化列表的型別 (供自製虛擬滾動使用)
type FlattenedListItem =
  | { isHeader: true; type: string; count: number; avgLoad: number }
  | { isHeader: false; machine: MachineSummary }

// --- 設定與常數 ---
const BASE_MACHINES: BaseMachine[] = [
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

// 刻意放大資料量：生成 1000 台設備，測試自製虛擬滾動效能
const MACHINES: Machine[] = Array.from({ length: 1000 }, (_, i) => {
  const base = BASE_MACHINES[i % BASE_MACHINES.length]
  return {
    id: `MCH-${String(i + 1).padStart(4, '0')}`,
    name: `${base.name}-${String(i + 1).padStart(4, '0')}`,
    type: base.type
  }
})

const PROCESS_MACHINE_MAP: Record<string, MachineType[]> = {
  下料: ['LASER'],
  CNC加工: ['CNC', '5-AXIS'],
  熱處理: ['HEAT'],
  研磨: ['GRIND'],
  表面處理: ['COATING'],
  組裝: ['ASM', 'WELDING'],
  檢驗: ['QC', 'PACK']
}

const ROUTINGS: Routing[] = [
  { steps: ['下料', 'CNC加工', '表面處理', '檢驗'] },
  { steps: ['下料', 'CNC加工', '研磨', '檢驗'] },
  { steps: ['下料', '組裝', '表面處理', '檢驗'] }
]

const DAYS_TO_SHOW = 14
const getBaseDate = (): Date => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
const BASE_DATE = getBaseDate()

// --- 資料生成引擎 ---
const generateLoadData = (): Record<string, number[]> => {
  const loadMap: Record<string, number[]> = {}
  MACHINES.forEach(m => (loadMap[m.id] = Array(DAYS_TO_SHOW).fill(0)))

  const machineAvailableTimes: Record<string, Date> = {}
  MACHINES.forEach(
    m => (machineAvailableTimes[m.id] = new Date(BASE_DATE.getTime()))
  )

  // 大幅增加工單量以符合 1000 台設備的運算
  const TOTAL_WORK_ORDERS = 8000

  for (let wo = 1; wo <= TOTAL_WORK_ORDERS; wo++) {
    const routing = ROUTINGS[Math.floor(Math.random() * ROUTINGS.length)]
    let currentTaskReadyTime = new Date(
      BASE_DATE.getTime() + Math.random() * 12 * 24 * 60 * 60 * 1000
    )

    routing.steps.forEach(processName => {
      const allowedTypes = PROCESS_MACHINE_MAP[processName]
      const validMachines = MACHINES.filter(m => allowedTypes.includes(m.type))

      if (validMachines.length === 0) return

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

      const actualStart = earliestAvailable
      const durationHours = 1 + Math.floor(Math.random() * 5)
      const endTime = new Date(
        actualStart.getTime() + durationHours * 60 * 60 * 1000
      )

      for (let d = 0; d < DAYS_TO_SHOW; d++) {
        const dayStartMs = BASE_DATE.getTime() + d * 24 * 60 * 60 * 1000
        const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000

        const overlapStart = Math.max(actualStart.getTime(), dayStartMs)
        const overlapEnd = Math.min(endTime.getTime(), dayEndMs)

        if (overlapStart < overlapEnd) {
          loadMap[selectedMachine.id][d] +=
            (overlapEnd - overlapStart) / (1000 * 60 * 60)
        }
      }

      machineAvailableTimes[selectedMachine.id] = new Date(
        endTime.getTime() + 0.5 * 60 * 60 * 1000
      )
      currentTaskReadyTime = new Date(endTime.getTime() + 1 * 60 * 60 * 1000)
    })
  }
  return loadMap
}

const formatDate = (offsetDays: number): string => {
  const d = new Date(BASE_DATE.getTime() + offsetDays * 24 * 60 * 60 * 1000)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

const getLoadStatus = (percent: number): LoadStatus => {
  if (percent >= 85)
    return {
      color: 'bg-red-500',
      hex: '#ef4444',
      text: 'text-red-500',
      label: '超載',
      bg: 'bg-red-50'
    }
  if (percent >= 60)
    return {
      color: 'bg-amber-400',
      hex: '#fbbf24',
      text: 'text-amber-500',
      label: '滿載',
      bg: 'bg-amber-50'
    }
  return {
    color: 'bg-emerald-400',
    hex: '#34d399',
    text: 'text-emerald-500',
    label: '健康',
    bg: 'bg-emerald-50'
  }
}

// --- 主元件 ---
export default function MachineLoadDashboard() {
  const [loading, setLoading] = useState<boolean>(true)
  const [dailyLoadByMachine, setDailyLoadByMachine] = useState<
    Record<string, number[]>
  >({})
  const [selectedMachineId, setSelectedMachineId] = useState<string>('ALL')

  // Search 狀態與 Debounce
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [debouncedQuery, setDebouncedQuery] = useState<string>('')
  const [isSearching, setIsSearching] = useState<boolean>(false)

  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL')
  const [isTagsExpanded, setIsTagsExpanded] = useState<boolean>(false)
  const chartRef = useRef<HTMLDivElement>(null)

  // 自製虛擬滾動相關狀態
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [viewHeight, setViewHeight] = useState<number>(500)
  const [scrollTop, setScrollTop] = useState<number>(0)

  const MAX_VISIBLE_TAGS = 3

  // 初始化資料載入
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      // 故意延遲以顯示巨量數據載入動畫
      setTimeout(() => {
        const loadMap = generateLoadData()
        setDailyLoadByMachine(loadMap)
        setLoading(false)
      }, 1000)
    }
    loadData()
  }, [])

  // 實作 Search Debounce (防抖：輸入停止後 300ms 才會觸發過濾計算)
  useEffect(() => {
    setIsSearching(searchQuery !== debouncedQuery)
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setIsSearching(false)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery, debouncedQuery])

  // 監聽虛擬滾動容器高度
  useEffect(() => {
    if (!scrollContainerRef.current) return
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setViewHeight(entry.contentRect.height)
      }
    })
    resizeObserver.observe(scrollContainerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // 1. 計算機台總覽數據
  const machineSummaries = useMemo<MachineSummary[]>(() => {
    if (Object.keys(dailyLoadByMachine).length === 0) return []

    return MACHINES.map(m => {
      const loads = dailyLoadByMachine[m.id]
      const totalScheduledHours = loads.reduce((sum, h) => sum + h, 0)
      const totalAvailableHours = DAYS_TO_SHOW * 24
      const avgLoadPercent = Math.round(
        (totalScheduledHours / totalAvailableHours) * 100
      )

      return {
        ...m,
        totalScheduledHours,
        avgLoadPercent,
        status: getLoadStatus(avgLoadPercent)
      }
    }).sort((a, b) => b.avgLoadPercent - a.avgLoadPercent)
  }, [dailyLoadByMachine])

  // 取得所有機台類型供快速過濾標籤使用
  const availableTypes = useMemo(() => {
    return Array.from(new Set(machineSummaries.map(m => m.type))).sort()
  }, [machineSummaries])

  // 2. 過濾與分群，並打平為 一維陣列 (Flattened Array)
  const flattenedList = useMemo<FlattenedListItem[]>(() => {
    let filtered = machineSummaries

    if (debouncedQuery.trim()) {
      const lowerQuery = debouncedQuery.toLowerCase()
      filtered = filtered.filter(
        m =>
          m.name.toLowerCase().includes(lowerQuery) ||
          m.id.toLowerCase().includes(lowerQuery) ||
          m.type.toLowerCase().includes(lowerQuery)
      )
    }

    if (selectedTypeFilter !== 'ALL') {
      filtered = filtered.filter(m => m.type === selectedTypeFilter)
    }

    const groups: {
      [key: string]: { machines: MachineSummary[]; avgLoad: number }
    } = {}

    filtered.forEach(m => {
      if (!groups[m.type]) {
        groups[m.type] = { machines: [], avgLoad: 0 }
      }
      groups[m.type].machines.push(m)
    })

    const flatArray: FlattenedListItem[] = []

    Object.entries(groups)
      .map(([type, data]) => {
        const totalLoad = data.machines.reduce(
          (sum, m) => sum + m.avgLoadPercent,
          0
        )
        return {
          type,
          avgLoad: Math.round(totalLoad / data.machines.length),
          machines: data.machines
        }
      })
      .sort((a, b) => b.avgLoad - a.avgLoad)
      .forEach(group => {
        flatArray.push({
          isHeader: true,
          type: group.type,
          count: group.machines.length,
          avgLoad: group.avgLoad
        })
        group.machines.forEach(m => {
          flatArray.push({
            isHeader: false,
            machine: m
          })
        })
      })

    return flatArray
  }, [machineSummaries, debouncedQuery, selectedTypeFilter])

  // 3. 計算每個元素在虛擬列表中的絕對位置與高度
  const itemPositions = useMemo(() => {
    let y = 0
    return flattenedList.map((item, index) => {
      const height = item.isHeader ? 42 : 84
      const top = y
      y += height
      return { top, height, item, index }
    })
  }, [flattenedList])

  const totalListHeight =
    itemPositions.length > 0
      ? itemPositions[itemPositions.length - 1].top +
        itemPositions[itemPositions.length - 1].height
      : 0

  // 4. 計算當前可視範圍內的元素 (加上 Overscan 以保證滾動滑順)
  const visibleItems = useMemo(() => {
    if (itemPositions.length === 0) return []

    let start = 0
    let low = 0
    let high = itemPositions.length - 1

    // 使用二元搜尋快速找到第一個出現的可視元素
    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      if (itemPositions[mid].top === scrollTop) {
        start = mid
        break
      } else if (itemPositions[mid].top < scrollTop) {
        start = mid
        low = mid + 1
      } else {
        high = mid - 1
      }
    }

    let end = start
    while (
      end < itemPositions.length &&
      itemPositions[end].top < scrollTop + viewHeight
    ) {
      end++
    }

    // Overscan: 預渲染上下各 5 個元素，防止快速滾動白畫面
    start = Math.max(0, start - 5)
    end = Math.min(itemPositions.length - 1, end + 5)

    return itemPositions.slice(start, end + 1)
  }, [itemPositions, scrollTop, viewHeight])

  // 計算圖表顯示數據
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (Object.keys(dailyLoadByMachine).length === 0) return []

    const data: ChartDataPoint[] = []
    for (let d = 0; d < DAYS_TO_SHOW; d++) {
      let dailyHours = 0
      let availableHours = 24

      if (selectedMachineId === 'ALL') {
        MACHINES.forEach(m => {
          dailyHours += dailyLoadByMachine[m.id][d]
        })
        availableHours = MACHINES.length * 24
      } else {
        dailyHours = dailyLoadByMachine[selectedMachineId][d]
      }

      const percent = Math.round((dailyHours / availableHours) * 100)
      data.push({
        dayIndex: d,
        dateLabel: formatDate(d),
        scheduledHours: dailyHours,
        availableHours,
        percent,
        status: getLoadStatus(percent)
      })
    }
    return data
  }, [dailyLoadByMachine, selectedMachineId])

  // 綜合統計數據
  const stats = useMemo<DashboardStats>(() => {
    if (chartData.length === 0)
      return { totalReq: 0, totalAvail: 0, avg: 0, peak: 0 }
    const totalReq = chartData.reduce((s, d) => s + d.scheduledHours, 0)
    const totalAvail = chartData.reduce((s, d) => s + d.availableHours, 0)
    const avg = Math.round((totalReq / totalAvail) * 100)
    const peak = Math.max(...chartData.map(d => d.percent))
    return { totalReq, totalAvail, avg, peak }
  }, [chartData])

  // ECharts 渲染
  useEffect(() => {
    if (loading || chartData.length === 0 || !chartRef.current) return

    let chartInstance = echarts.getInstanceByDom(chartRef.current)
    if (!chartInstance) {
      chartInstance = echarts.init(chartRef.current)
    }

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        textStyle: { color: '#f8fafc', fontSize: 12 },
        formatter: function (params: any[]) {
          const dataIndex = params[0].dataIndex
          const d = chartData[dataIndex]
          return `
            <div style="font-weight:bold; border-bottom:1px solid #475569; padding-bottom:6px; margin-bottom:6px; text-align:center;">${d.dateLabel}</div>
            <div style="margin-bottom:4px;">負載：<span style="font-weight:bold; color:${d.status.hex};">${d.percent}%</span></div>
            <div style="color:#94a3b8; font-family:monospace;">時數：${d.scheduledHours.toFixed(1)} / ${d.availableHours}</div>
          `
        }
      },
      grid: {
        top: '10%',
        left: '2%',
        right: '4%',
        bottom: '5%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: chartData.map(d => d.dateLabel),
        axisLabel: { color: '#64748b', margin: 12 },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#cbd5e1' } }
      },
      yAxis: {
        type: 'value',
        max: 120,
        axisLabel: { formatter: '{value}%', color: '#64748b' },
        splitLine: { lineStyle: { color: '#f1f5f9' } }
      },
      series: [
        {
          type: 'bar',
          data: chartData.map(d => ({
            value: Math.min(d.percent, 120),
            itemStyle: { color: d.status.hex }
          })),
          barMaxWidth: 40,
          itemStyle: {
            borderRadius: [2, 2, 0, 0]
          },
          markLine: {
            silent: true,
            symbol: 'none',
            label: { show: false },
            lineStyle: { color: '#fca5a5', type: 'dashed', width: 2 },
            data: [{ yAxis: 100 }]
          }
        }
      ]
    }

    chartInstance.setOption(option)

    const handleResize = () => {
      if (chartInstance) chartInstance.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [chartData, loading])

  // 匯出 CSV 報表
  const handleExportCSV = () => {
    if (chartData.length === 0) return

    const machineName =
      selectedMachineId === 'ALL'
        ? '全廠綜合'
        : MACHINES.find(m => m.id === selectedMachineId)?.name || '未知設備'

    const headers = [
      '日期',
      '分析對象',
      '已排程工時(H)',
      '總可用產能(H)',
      '稼動率(%)',
      '負載狀態'
    ]
    const rows = chartData.map(d => [
      d.dateLabel,
      machineName,
      d.scheduledHours.toFixed(1),
      d.availableHours,
      d.percent,
      d.status.label
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join(
      '\n'
    )

    const bom = new Uint8Array([0xef, 0xbb, 0xbf])
    const blob = new Blob([bom, csvContent], {
      type: 'text/csv;charset=utf-8;'
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `機台負載分析報表_${machineName}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className='p-2 flex flex-col h-full bg-slate-50 font-sans text-slate-800'>
      <main className='flex-1 flex overflow-hidden'>
        {/* --- Left Panel: Machine List --- */}
        <aside className='w-80 flex flex-col bg-white border-r border-slate-200 shrink-0 shadow-[2px_0_8px_rgba(0,0,0,0.02)] z-10'>
          {/* 頂部標題與搜尋區塊 */}
          <div className='p-4 border-b border-slate-200 flex flex-col gap-3 bg-slate-50 shrink-0 z-20'>
            <div className='flex justify-between items-center'>
              <h2 className='font-bold text-slate-700 flex items-center gap-2'>
                <Factory size={18} /> 設備總覽
              </h2>
              <span className='text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold'>
                {MACHINES.length} 台
              </span>
            </div>

            {/* 搜尋輸入框 (帶 Debounce 指示器) */}
            <div className='relative'>
              <Search
                size={16}
                className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'
              />
              <input
                type='text'
                placeholder='搜尋代號、名稱或類型...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-700 placeholder:text-slate-400 shadow-inner shadow-slate-50'
              />
              {isSearching && (
                <Loader2
                  size={16}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin'
                />
              )}
            </div>

            {/* 機台類型快捷過濾標籤 (換行與展開/收起) */}
            <div className='flex flex-wrap items-center gap-1.5'>
              <button
                onClick={() => setSelectedTypeFilter('ALL')}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold transition-colors border',
                  selectedTypeFilter === 'ALL'
                    ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                )}
              >
                全廠
              </button>

              {(isTagsExpanded
                ? availableTypes
                : availableTypes.slice(0, MAX_VISIBLE_TAGS)
              ).map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedTypeFilter(type)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-bold transition-colors border',
                    selectedTypeFilter === type
                      ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                  )}
                >
                  {type}
                </button>
              ))}

              {/* 展開 / 收起按鈕 */}
              {availableTypes.length > MAX_VISIBLE_TAGS && (
                <button
                  onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                  className='text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5 px-2 py-1 rounded-full transition-colors hover:bg-blue-50 font-bold ml-0.5'
                >
                  {isTagsExpanded
                    ? '收起'
                    : `更多 (${availableTypes.length - MAX_VISIBLE_TAGS})`}
                  {isTagsExpanded ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </button>
              )}
            </div>
          </div>

          <div className='flex-1 flex flex-col bg-slate-50/50'>
            {/* All Machines Option (置頂固定) */}
            <div className='p-2 shrink-0 border-b border-slate-100 bg-white'>
              <button
                onClick={() => setSelectedMachineId('ALL')}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between',
                  selectedMachineId === 'ALL'
                    ? 'bg-blue-50 border-blue-200 shadow-sm'
                    : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
                )}
              >
                <div className='font-bold text-slate-700'>全廠綜合負載</div>
                <Activity
                  size={18}
                  className={
                    selectedMachineId === 'ALL'
                      ? 'text-blue-500'
                      : 'text-slate-400'
                  }
                />
              </button>
            </div>

            {/* 自製虛擬滾動機台列表 (Virtual Scrolling) */}
            {loading ? (
              <div className='flex-1 flex flex-col items-center justify-center text-slate-400'>
                <Zap size={24} className='animate-pulse mb-2 text-slate-300' />
                <p className='text-sm'>載入與演算 1000 台設備群組中...</p>
              </div>
            ) : flattenedList.length === 0 ? (
              <div className='flex-1 flex flex-col items-center justify-center text-slate-400 gap-2'>
                <Search size={24} className='text-slate-300' />
                <p className='text-sm'>找不到符合的機台</p>
              </div>
            ) : (
              <div className='flex-1 overflow-hidden relative'>
                <div
                  ref={scrollContainerRef}
                  style={{ height: '100%', overflowY: 'auto' }}
                  onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
                  className='custom-scrollbar absolute inset-0'
                >
                  <div
                    style={{ height: totalListHeight, position: 'relative' }}
                  >
                    {visibleItems.map(pos => {
                      const item = pos.item

                      // 如果是分類標題
                      if (item.isHeader) {
                        return (
                          <div
                            key={`header-${item.type}`}
                            style={{
                              position: 'absolute',
                              top: pos.top,
                              height: pos.height,
                              width: '100%'
                            }}
                            className='px-2 py-1'
                          >
                            <div className='w-full h-full bg-slate-200/60 rounded-md px-3 flex justify-between items-center shadow-inner'>
                              <span className='text-[11px] font-bold text-slate-600 tracking-wider flex items-center gap-1.5'>
                                {item.type}
                                <span className='bg-white text-slate-500 px-1.5 rounded shadow-sm text-[10px]'>
                                  {item.count}
                                </span>
                              </span>
                              <span
                                className={cn(
                                  'text-[10px] font-bold tracking-tight',
                                  item.avgLoad >= 85
                                    ? 'text-red-500'
                                    : item.avgLoad >= 60
                                      ? 'text-amber-500'
                                      : 'text-emerald-500'
                                )}
                              >
                                工段均載 {item.avgLoad}%
                              </span>
                            </div>
                          </div>
                        )
                      }

                      // 如果是實體機台卡片
                      const m = item.machine
                      return (
                        <div
                          key={`machine-${m.id}`}
                          style={{
                            position: 'absolute',
                            top: pos.top,
                            height: pos.height,
                            width: '100%'
                          }}
                          className='px-2 py-1'
                        >
                          <button
                            onClick={() => setSelectedMachineId(m.id)}
                            className={cn(
                              'w-full h-full text-left p-3 rounded-lg border transition-all flex flex-col justify-center',
                              selectedMachineId === m.id
                                ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-500'
                                : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                            )}
                          >
                            <div className='flex justify-between items-start mb-1 w-full'>
                              <div className='truncate pr-2 w-full'>
                                <div className='font-bold text-slate-800 text-sm truncate'>
                                  {m.name}
                                </div>
                                <div className='text-[10px] text-slate-500 font-mono mt-0.5'>
                                  {m.id}
                                </div>
                              </div>
                              <div
                                className={cn(
                                  'text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0',
                                  m.status.bg,
                                  m.status.text
                                )}
                              >
                                {m.avgLoadPercent}%
                              </div>
                            </div>

                            {/* Gauge Bar */}
                            <div className='w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1 shrink-0'>
                              <div
                                className={cn(
                                  'h-full transition-all duration-500',
                                  m.status.color
                                )}
                                style={{
                                  width: `${Math.min(m.avgLoadPercent, 100)}%`
                                }}
                              ></div>
                            </div>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* --- Right Panel: Charts & Stats --- */}
        <section className='flex-1 flex flex-col bg-slate-50 overflow-y-auto'>
          {loading ? (
            <div className='flex-1 flex items-center justify-center'>
              <div className='text-center'>
                <div className='w-16 h-16 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4'></div>
                <p className='text-slate-500 font-medium'>
                  演算稼動率資料中...
                </p>
              </div>
            </div>
          ) : (
            <div className='p-6 md:p-8 max-w-6xl mx-auto w-full flex flex-col gap-6'>
              {/* Context Header */}
              <div className='flex flex-col xl:flex-row xl:items-end justify-between mb-4 gap-4'>
                <div>
                  <h2 className='text-xl sm:text-2xl font-black text-slate-800'>
                    {selectedMachineId === 'ALL'
                      ? '全廠綜合負載趨勢'
                      : MACHINES.find(m => m.id === selectedMachineId)?.name}
                  </h2>
                  <p className='text-sm text-slate-500 mt-1 flex items-center gap-2'>
                    <Calendar size={14} /> 分析區間：未來 {DAYS_TO_SHOW} 天
                  </p>
                </div>
                <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto'>
                  <div className='flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm w-full sm:w-auto justify-start sm:justify-center'>
                    <div className='flex items-center gap-1.5 whitespace-nowrap'>
                      <div className='w-3 h-3 rounded-sm bg-emerald-400 shrink-0'></div>{' '}
                      健康 (&lt;60%)
                    </div>
                    <div className='flex items-center gap-1.5 whitespace-nowrap'>
                      <div className='w-3 h-3 rounded-sm bg-amber-400 shrink-0'></div>{' '}
                      滿載 (60~84%)
                    </div>
                    <div className='flex items-center gap-1.5 whitespace-nowrap'>
                      <div className='w-3 h-3 rounded-sm bg-red-500 shrink-0'></div>{' '}
                      超載 (&ge;85%)
                    </div>
                  </div>
                  <button
                    onClick={handleExportCSV}
                    disabled={loading}
                    className='w-full sm:w-auto text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0 whitespace-nowrap'
                  >
                    <Download size={16} /> 匯出報表
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
                <div className='bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col'>
                  <span className='text-slate-500 text-xs sm:text-sm font-medium flex items-center gap-1.5'>
                    <TrendingUp size={16} /> 平均稼動率
                  </span>
                  <div className='mt-2 flex items-baseline gap-2'>
                    <span className='text-2xl sm:text-3xl font-black text-slate-800'>
                      {stats.avg}%
                    </span>
                  </div>
                </div>
                <div className='bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col'>
                  <span className='text-slate-500 text-xs sm:text-sm font-medium flex items-center gap-1.5'>
                    <AlertTriangle size={16} /> 尖峰負載
                  </span>
                  <div className='mt-2 flex items-baseline gap-2'>
                    <span
                      className={`text-2xl sm:text-3xl font-black ${stats.peak >= 85 ? 'text-red-500' : 'text-slate-800'}`}
                    >
                      {stats.peak}%
                    </span>
                  </div>
                </div>
                <div className='bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col'>
                  <span className='text-slate-500 text-xs sm:text-sm font-medium flex items-center gap-1.5'>
                    <Clock size={16} /> 已排程工時
                  </span>
                  <div className='mt-2 flex items-baseline gap-2'>
                    <span className='text-2xl sm:text-3xl font-black text-blue-600'>
                      {Math.round(stats.totalReq)}
                    </span>
                    <span className='text-xs sm:text-sm font-bold text-slate-400'>
                      H
                    </span>
                  </div>
                </div>
                <div className='bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col'>
                  <span className='text-slate-500 text-xs sm:text-sm font-medium flex items-center gap-1.5'>
                    <Zap size={16} /> 總可用產能
                  </span>
                  <div className='mt-2 flex items-baseline gap-2'>
                    <span className='text-2xl sm:text-3xl font-black text-slate-800'>
                      {stats.totalAvail}
                    </span>
                    <span className='text-xs sm:text-sm font-bold text-slate-400'>
                      H
                    </span>
                  </div>
                </div>
              </div>

              {/* The Classic Bar Chart using ECharts */}
              <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-4'>
                <h3 className='text-sm font-bold text-slate-700 mb-4'>
                  每日負載分佈 (%)
                </h3>

                {/* ECharts Container */}
                <div ref={chartRef} className='h-80 w-full' />
              </div>

              {/* Context Warning Box */}
              {stats.peak >= 100 && (
                <div className='bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start mt-4'>
                  <AlertTriangle
                    className='text-red-500 shrink-0 mt-0.5'
                    size={20}
                  />
                  <div>
                    <h4 className='font-bold text-red-800 text-sm'>
                      產能超載警告
                    </h4>
                    <p className='text-sm text-red-600/80 mt-1'>
                      偵測到{' '}
                      {selectedMachineId === 'ALL' ? '部分日期全廠' : '此機台'}{' '}
                      排程超過 100%
                      負荷。建議生管人員安排加班、將工單發包外包，或利用系統進行「產能平準化
                      (Leveling)」運算。
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* 捲軸自定義樣式 */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #94a3b8;
        }
      `}</style>
    </div>
  )
}
