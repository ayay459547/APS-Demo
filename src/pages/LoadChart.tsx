import { useState, useEffect, useMemo } from 'react'
import {
  Calendar,
  Activity,
  Zap,
  TrendingUp,
  AlertTriangle,
  Clock,
  Factory
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

const MACHINES = Array.from({ length: 100 }, (_, i) => {
  const base = BASE_MACHINES[i % BASE_MACHINES.length]
  return {
    id: `MCH-${String(i + 1).padStart(3, '0')}`,
    name: `${base.name}-${String(i + 1).padStart(3, '0')}`,
    type: base.type
  }
})

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
  { steps: ['下料', 'CNC加工', '表面處理', '檢驗'] },
  { steps: ['下料', 'CNC加工', '研磨', '檢驗'] },
  { steps: ['下料', '組裝', '表面處理', '檢驗'] }
]

const DAYS_TO_SHOW = 14
const getBaseDate = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
const BASE_DATE: any = getBaseDate()

// --- 資料生成引擎 ---
// 為了呈現負載圖，我們簡化為直接產出每日負載時數
const generateLoadData = () => {
  const loadMap: Record<string, any> = {}
  MACHINES.forEach(m => (loadMap[m.id] = Array(DAYS_TO_SHOW).fill(0)))

  const machineAvailableTimes: Record<string, any> = {}
  MACHINES.forEach(
    m => (machineAvailableTimes[m.id] = new Date(BASE_DATE.getTime()))
  )

  const TOTAL_WORK_ORDERS = 1500 // 增加數量以顯示真實的負載波動

  for (let wo = 1; wo <= TOTAL_WORK_ORDERS; wo++) {
    const routing = ROUTINGS[Math.floor(Math.random() * ROUTINGS.length)]
    // 將訂單隨機打散在未來 14 天內
    let currentTaskReadyTime = new Date(
      BASE_DATE.getTime() + Math.random() * 12 * 24 * 60 * 60 * 1000
    )

    routing.steps.forEach(processName => {
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

      const actualStart = earliestAvailable
      const durationHours = 1 + Math.floor(Math.random() * 5) // 1~5小時
      const endTime = new Date(
        actualStart.getTime() + durationHours * 60 * 60 * 1000
      )

      // 轉換成每日負載 (處理跨日情況)
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

// 格式化日期 (MM/DD)
const formatDate = (offsetDays: any) => {
  const d = new Date(BASE_DATE.getTime() + offsetDays * 24 * 60 * 60 * 1000)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

// 取得負載顏色與狀態
const getLoadStatus = (percent: number) => {
  if (percent >= 85)
    return {
      color: 'bg-red-500',
      text: 'text-red-500',
      label: '超載',
      bg: 'bg-red-50'
    }
  if (percent >= 60)
    return {
      color: 'bg-amber-400',
      text: 'text-amber-500',
      label: '滿載',
      bg: 'bg-amber-50'
    }
  return {
    color: 'bg-emerald-400',
    text: 'text-emerald-500',
    label: '健康',
    bg: 'bg-emerald-50'
  }
}

// --- 主元件 ---
export default function MachineLoadDashboard() {
  const [loading, setLoading] = useState(true)
  const [dailyLoadByMachine, setDailyLoadByMachine] = useState<
    Record<string, any>
  >({})
  const [selectedMachineId, setSelectedMachineId] = useState<string>('ALL') // 'ALL' 或 特定 machineId

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setTimeout(() => {
        const loadMap = generateLoadData()
        setDailyLoadByMachine(loadMap)
        setLoading(false)
      }, 600)
    }
    loadData()
  }, [])

  // 計算機台總覽數據 (供左側列表使用)
  const machineSummaries = useMemo(() => {
    if (Object.keys(dailyLoadByMachine).length === 0) return []

    return MACHINES.map(m => {
      const loads: any[] = dailyLoadByMachine[m.id]
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
    }).sort((a, b) => b.avgLoadPercent - a.avgLoadPercent) // 負載高的排前面
  }, [dailyLoadByMachine])

  // 計算圖表顯示數據 (全廠 或 單一機台)
  const chartData = useMemo(() => {
    if (Object.keys(dailyLoadByMachine).length === 0) return []

    const data = []
    for (let d = 0; d < DAYS_TO_SHOW; d++) {
      let dailyHours = 0
      let availableHours = 24

      if (selectedMachineId === 'ALL') {
        // 全廠綜合
        MACHINES.forEach(m => {
          dailyHours += dailyLoadByMachine[m.id][d]
        })
        availableHours = MACHINES.length * 24
      } else {
        // 單一機台
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

  // 綜合統計數據 (圖表下方卡片)
  const stats = useMemo(() => {
    if (chartData.length === 0)
      return { totalReq: 0, totalAvail: 0, avg: 0, peak: 0 }
    const totalReq = chartData.reduce((s, d) => s + d.scheduledHours, 0)
    const totalAvail = chartData.reduce((s, d) => s + d.availableHours, 0)
    const avg = Math.round((totalReq / totalAvail) * 100)
    const peak = Math.max(...chartData.map(d => d.percent))
    return { totalReq, totalAvail, avg, peak }
  }, [chartData])

  return (
    <div className='flex flex-col h-full bg-slate-50 font-sans text-slate-800'>
      {/* 2. Main Content Area */}
      <main className='flex-1 flex overflow-hidden'>
        {/* --- Left Panel: Machine List --- */}
        <aside className='w-80 flex flex-col bg-white border-r border-slate-200 shrink-0 shadow-[2px_0_8px_rgba(0,0,0,0.02)] z-10'>
          <div className='p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50'>
            <h2 className='font-bold text-slate-700 flex items-center gap-2'>
              <Factory size={18} /> 設備總覽
            </h2>
            <span className='text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold'>
              {MACHINES.length} 台
            </span>
          </div>

          <div className='flex-1 overflow-y-auto p-2 space-y-1'>
            {/* All Machines Option */}
            <button
              onClick={() => setSelectedMachineId('ALL')}
              className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                selectedMachineId === 'ALL'
                  ? 'bg-blue-50 border-blue-200 shadow-sm'
                  : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
              }`}
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

            <div className='my-2 border-b border-slate-100'></div>

            {/* Individual Machines */}
            {loading ? (
              <div className='flex flex-col items-center justify-center py-10 text-slate-400'>
                <Zap size={24} className='animate-pulse mb-2 text-slate-300' />
                <p className='text-sm'>載入設備數據...</p>
              </div>
            ) : (
              machineSummaries.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMachineId(m.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedMachineId === m.id
                      ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-500'
                      : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className='flex justify-between items-start mb-1.5'>
                    <div className='truncate'>
                      <div className='font-bold text-slate-800 text-sm truncate'>
                        {m.name}
                      </div>
                      <div className='text-[10px] text-slate-500 font-mono mt-0.5'>
                        {m.id}
                      </div>
                    </div>
                    <div
                      className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${m.status.bg} ${m.status.text}`}
                    >
                      {m.avgLoadPercent}%
                    </div>
                  </div>

                  {/* Gauge Bar */}
                  <div className='w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2'>
                    <div
                      className={`h-full ${m.status.color}`}
                      style={{ width: `${Math.min(m.avgLoadPercent, 100)}%` }}
                    ></div>
                  </div>
                </button>
              ))
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
              <div className='flex items-end justify-between mb-2'>
                <div>
                  <h2 className='text-2xl font-black text-slate-800'>
                    {selectedMachineId === 'ALL'
                      ? '全廠綜合負載趨勢'
                      : MACHINES.find(m => m.id === selectedMachineId)?.name}
                  </h2>
                  <p className='text-sm text-slate-500 mt-1 flex items-center gap-2'>
                    <Calendar size={14} /> 分析區間：未來 {DAYS_TO_SHOW} 天
                  </p>
                </div>
                <div className='flex items-center gap-4 text-xs font-medium text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm'>
                  <div className='flex items-center gap-1.5'>
                    <div className='w-3 h-3 rounded-sm bg-emerald-400'></div>{' '}
                    健康 (&lt;60%)
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <div className='w-3 h-3 rounded-sm bg-amber-400'></div> 滿載
                    (60~84%)
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <div className='w-3 h-3 rounded-sm bg-red-500'></div> 超載
                    (&ge;85%)
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <div className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col'>
                  <span className='text-slate-500 text-sm font-medium flex items-center gap-1.5'>
                    <TrendingUp size={16} /> 平均稼動率
                  </span>
                  <div className='mt-2 flex items-baseline gap-2'>
                    <span className='text-3xl font-black text-slate-800'>
                      {stats.avg}%
                    </span>
                  </div>
                </div>
                <div className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col'>
                  <span className='text-slate-500 text-sm font-medium flex items-center gap-1.5'>
                    <AlertTriangle size={16} /> 尖峰負載
                  </span>
                  <div className='mt-2 flex items-baseline gap-2'>
                    <span
                      className={`text-3xl font-black ${stats.peak >= 85 ? 'text-red-500' : 'text-slate-800'}`}
                    >
                      {stats.peak}%
                    </span>
                  </div>
                </div>
                <div className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col'>
                  <span className='text-slate-500 text-sm font-medium flex items-center gap-1.5'>
                    <Clock size={16} /> 已排程工時
                  </span>
                  <div className='mt-2 flex items-baseline gap-2'>
                    <span className='text-3xl font-black text-blue-600'>
                      {Math.round(stats.totalReq)}
                    </span>
                    <span className='text-sm font-bold text-slate-400'>H</span>
                  </div>
                </div>
                <div className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col'>
                  <span className='text-slate-500 text-sm font-medium flex items-center gap-1.5'>
                    <Zap size={16} /> 總可用產能
                  </span>
                  <div className='mt-2 flex items-baseline gap-2'>
                    <span className='text-3xl font-black text-slate-800'>
                      {stats.totalAvail}
                    </span>
                    <span className='text-sm font-bold text-slate-400'>H</span>
                  </div>
                </div>
              </div>

              {/* The Classic Bar Chart */}
              <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-4'>
                <h3 className='text-sm font-bold text-slate-700 mb-8'>
                  每日負載分佈 (%)
                </h3>

                {/* Chart Container */}
                <div className='relative h-80 w-full pl-10 pb-8'>
                  {/* Y-Axis Lines & Labels (Max 120% to show overload) */}
                  {[120, 100, 75, 50, 25, 0].map(val => (
                    <div
                      key={val}
                      className='absolute left-10 right-0 flex items-center'
                      style={{ bottom: `${(val / 120) * 100}%` }}
                    >
                      <span className='absolute -left-10 text-xs text-slate-400 font-medium w-8 text-right'>
                        {val}%
                      </span>
                      <div
                        className={`w-full h-px ${val === 100 ? 'bg-red-300 border-t border-dashed border-red-400' : 'bg-slate-100'}`}
                      ></div>
                    </div>
                  ))}

                  {/* Bars Area */}
                  <div className='absolute left-10 right-0 bottom-8 top-0 flex items-end justify-between px-2 gap-2'>
                    {chartData.map((d, i) => {
                      // 限制長條圖視覺最高到 120%
                      const barHeightPercent = Math.min(
                        (d.percent / 120) * 100,
                        100
                      )

                      return (
                        <div
                          key={i}
                          className='relative flex-1 flex flex-col items-center group'
                        >
                          {/* Tooltip */}
                          <div className='absolute bottom-full mb-2 bg-slate-800 text-white text-xs px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg whitespace-nowrap text-center'>
                            <div className='font-bold mb-1 border-b border-slate-600 pb-1'>
                              {d.dateLabel}
                            </div>
                            <div className='mb-0.5'>
                              負載：
                              <span
                                className={`font-bold ${d.status.text.replace('500', '400')}`}
                              >
                                {d.percent}%
                              </span>
                            </div>
                            <div className='text-slate-400 font-mono'>
                              時數：{d.scheduledHours.toFixed(1)} /{' '}
                              {d.availableHours}
                            </div>
                            <div className='absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 transform rotate-45 -mt-1'></div>
                          </div>

                          {/* Bar */}
                          <div
                            className={`w-full max-w-[40px] rounded-t-sm shadow-sm ${d.status.color} transition-all duration-500 ease-out hover:brightness-110 hover:shadow-md cursor-pointer`}
                            style={{
                              height: `${Math.max(barHeightPercent, 1)}%`
                            }} // 最少給 1% 顯示底線
                          ></div>

                          {/* X-Axis Label */}
                          <div className='absolute top-full mt-3 text-xs text-slate-500 font-medium rotate-45 origin-top-left ml-2 whitespace-nowrap'>
                            {d.dateLabel}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Context Warning Box */}
              {stats.peak >= 100 && (
                <div className='bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start'>
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
    </div>
  )
}
