import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  BarChart2,
  Clock,
  Download,
  AlertTriangle,
  MonitorCog,
  Activity,
  Factory,
  Settings,
  AlertCircle
} from 'lucide-react'

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

interface Machine extends BaseMachine {
  id: string
}

interface Routing {
  id: string
  name: string
  steps: string[]
}

interface Task {
  workOrderId: string
  machineId: string
  duration: number
}

interface BottleneckStat extends Machine {
  usedHours: number
  utilization: number
  taskCount: number
  uniqueWorkOrders: number
}

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

const MACHINES: Machine[] = Array.from({ length: 100 }, (_, i) => {
  const base = BASE_MACHINES[i % BASE_MACHINES.length]
  return {
    id: `MCH-${String(i + 1).padStart(3, '0')}`,
    name: `${base.name}-${String(i + 1).padStart(3, '0')}`,
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

const DAYS_TO_SHOW = 30

const getBaseDate = (): Date => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
const BASE_DATE: Date = getBaseDate()

// --- 資料生成引擎 (專注於工時與機台分配) ---
const generateMockData = (): Task[] => {
  const tasks: Task[] = []
  const TOTAL_WORK_ORDERS = 1000

  const machineAvailableTimes: Record<string, Date> = {}
  MACHINES.forEach(
    m => (machineAvailableTimes[m.id] = new Date(BASE_DATE.getTime()))
  )

  for (let wo = 1; wo <= TOTAL_WORK_ORDERS; wo++) {
    const workOrderId = `WO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(wo).padStart(4, '0')}`
    const routing = ROUTINGS[Math.floor(Math.random() * ROUTINGS.length)]

    let currentTaskReadyTime = new Date(
      BASE_DATE.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000
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

      const actualStart: Date = earliestAvailable
      const durationHours = 2 + Math.floor(Math.random() * 6)
      const endTime = new Date(
        actualStart.getTime() + durationHours * 60 * 60 * 1000
      )

      machineAvailableTimes[selectedMachine.id] = new Date(
        endTime.getTime() + 0.5 * 60 * 60 * 1000
      )

      tasks.push({
        workOrderId,
        machineId: selectedMachine.id,
        duration: durationHours
      })

      currentTaskReadyTime = new Date(endTime.getTime() + 1 * 60 * 60 * 1000)
    })
  }
  return tasks
}

// --- 主元件 ---
export default function MachineBottleneck() {
  const [tasksByMachine, setTasksByMachine] = useState<Record<string, Task[]>>(
    {}
  )
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setTimeout(() => {
        const rawTasks = generateMockData()
        const map: Record<string, Task[]> = {}
        MACHINES.forEach(m => (map[m.id] = []))
        rawTasks.forEach(task => map[task.machineId].push(task))

        setTasksByMachine(map)
        setLoading(false)
      }, 500)
    }
    loadData()
  }, [])

  // --- 瓶頸分析數據計算 ---
  const bottleneckStats = useMemo<BottleneckStat[]>(() => {
    if (Object.keys(tasksByMachine).length === 0) return []
    const totalAvailable = DAYS_TO_SHOW * 24
    const machineStats = MACHINES.map(m => {
      const machineTasks = tasksByMachine[m.id] || []
      const usedHours = machineTasks.reduce((sum, t) => sum + t.duration, 0)
      const utilization = Math.round((usedHours / totalAvailable) * 100)
      const uniqueWorkOrders = new Set(machineTasks.map(t => t.workOrderId))
        .size
      return {
        ...m,
        usedHours,
        utilization,
        taskCount: machineTasks.length,
        uniqueWorkOrders
      }
    })
    machineStats.sort((a, b) => b.utilization - a.utilization)
    return machineStats
  }, [tasksByMachine])

  // --- 匯出 CSV 報表功能 (針對瓶頸分析) ---
  const handleExportCSV = useCallback(() => {
    if (loading || bottleneckStats.length === 0) return

    const headers = [
      '排名',
      '設備名稱',
      '設備代號',
      '影響工單數(筆)',
      '排隊工序數(項)',
      '積壓工時(H)',
      '稼動率(%)',
      '狀態'
    ]
    const rows = bottleneckStats.map((m, index) => {
      let status = '運作健康'
      if (m.utilization >= 85) status = '嚴重超載'
      else if (m.utilization >= 60) status = '滿載警告'

      return [
        (index + 1).toString(),
        m.name,
        m.id,
        m.uniqueWorkOrders.toString(),
        m.taskCount.toString(),
        m.usedHours.toString(),
        m.utilization.toString(),
        status
      ]
    })

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
    link.setAttribute('download', `產能瓶頸分析報表.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [bottleneckStats, loading])

  return (
    <div className='flex flex-col h-full bg-slate-50 font-sans text-slate-800 overflow-hidden'>
      {/* Module Header */}
      <header className='flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm shrink-0 gap-4 sm:gap-0 z-10'>
        <div className='flex items-center gap-3'>
          <div className='bg-red-500 p-2 rounded-lg shadow-sm'>
            <MonitorCog size={24} className='text-white' />
          </div>
          <div>
            <h1 className='text-xl font-bold text-slate-800 tracking-wide flex items-center gap-2'>
              機台瓶頸分析報告{' '}
              <span className='text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase tracking-wider'>
                Machine Bottleneck
              </span>
            </h1>
            <p className='text-xs text-slate-500 font-medium tracking-wide mt-1'>
              自動偵測全廠高負載設備，識別潛在停工風險與排程延遲原因。
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={loading}
          className='w-full sm:w-auto text-sm bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <Download size={16} /> 匯出分析報表
        </button>
      </header>

      {/* Main Content Area */}
      <main className='flex-1 relative overflow-auto bg-slate-50 p-4 md:p-8'>
        {loading ? (
          <div className='absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm z-50'>
            <div className='w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-6 shadow-lg'></div>
            <p className='text-slate-600 font-bold text-lg mb-2'>
              聚合全廠稼動率數據中...
            </p>
            <p className='text-slate-400 text-sm animate-pulse'>
              正在解析 4,000 筆排程邏輯以尋找產能瓶頸
            </p>
          </div>
        ) : (
          <div className='max-w-7xl mx-auto space-y-6 md:space-y-8'>
            {/* 4 Overview Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6'>
              <div className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow'>
                <span className='text-slate-500 text-sm font-medium flex items-center gap-1.5'>
                  <Factory size={16} /> 最大瓶頸設備
                </span>
                <div
                  className='mt-3 text-xl font-bold text-slate-800 truncate'
                  title={bottleneckStats[0]?.name}
                >
                  {bottleneckStats[0]?.name || '-'}
                </div>
                <div className='text-xs text-red-500 mt-1 font-bold'>
                  稼動率 {bottleneckStats[0]?.utilization || 0}%
                </div>
              </div>
              <div className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow'>
                <span className='text-slate-500 text-sm font-medium flex items-center gap-1.5'>
                  <AlertTriangle size={16} /> 超載設備數 (&ge;85%)
                </span>
                <div className='mt-3 text-3xl font-black text-red-600'>
                  {bottleneckStats.filter(m => m.utilization >= 85).length}{' '}
                  <span className='text-sm font-medium text-slate-400'>台</span>
                </div>
              </div>
              <div className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow'>
                <span className='text-slate-500 text-sm font-medium flex items-center gap-1.5'>
                  <Clock size={16} /> 瓶頸積壓總工時
                </span>
                <div className='mt-3 text-3xl font-black text-amber-600'>
                  {bottleneckStats
                    .filter(m => m.utilization >= 85)
                    .reduce((s, m) => s + m.usedHours, 0)}{' '}
                  <span className='text-sm font-medium text-slate-400'>H</span>
                </div>
              </div>
              <div className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow'>
                <span className='text-slate-500 text-sm font-medium flex items-center gap-1.5'>
                  <Activity size={16} /> 全廠平均稼動率
                </span>
                <div className='mt-3 text-3xl font-black text-blue-600'>
                  {Math.round(
                    bottleneckStats.reduce((s, m) => s + m.utilization, 0) /
                      (bottleneckStats.length || 1)
                  )}
                  %
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8'>
              {/* Chart: Top 10 Bottlenecks */}
              <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col'>
                <h3 className='text-lg font-bold text-slate-800 mb-6 flex items-center gap-2'>
                  <BarChart2 className='text-slate-400' size={20} />前 10
                  大高負載設備排行
                </h3>
                <div className='space-y-5 flex-1'>
                  {bottleneckStats.slice(0, 10).map((m, i) => (
                    <div key={m.id} className='flex items-center gap-3'>
                      <div className='w-6 text-center font-bold text-slate-400 text-sm'>
                        #{i + 1}
                      </div>
                      <div
                        className='w-24 sm:w-40 truncate font-medium text-slate-700 text-sm'
                        title={m.name}
                      >
                        {m.name}
                      </div>
                      <div className='flex-1 h-3 bg-slate-100 rounded-full overflow-hidden flex'>
                        <div
                          className={`h-full transition-all duration-1000 ease-out ${m.utilization >= 85 ? 'bg-red-500' : m.utilization >= 60 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                          style={{ width: `${Math.min(m.utilization, 100)}%` }}
                        ></div>
                      </div>
                      <div
                        className={`w-12 text-right font-bold text-sm ${m.utilization >= 85 ? 'text-red-600' : 'text-slate-600'}`}
                      >
                        {m.utilization}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail List */}
              <div className='bg-white p-0 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden'>
                <div className='p-6 border-b border-slate-100'>
                  <h3 className='text-lg font-bold text-slate-800 flex items-center gap-2'>
                    <Settings className='text-slate-400' size={20} />
                    瓶頸設備與影響工單分析
                  </h3>
                </div>
                <div className='overflow-x-auto flex-1 p-0'>
                  <table className='w-full text-left text-sm whitespace-nowrap'>
                    <thead className='bg-slate-50 sticky top-0'>
                      <tr className='border-b border-slate-200 text-slate-500'>
                        <th className='py-3 font-medium px-4'>排名</th>
                        <th className='py-3 font-medium px-4'>設備名稱</th>
                        <th className='py-3 font-medium px-4 text-right'>
                          影響工單
                        </th>
                        <th className='py-3 font-medium px-4 text-right'>
                          積壓工時
                        </th>
                        <th className='py-3 font-medium px-4 text-center'>
                          狀態
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bottleneckStats.slice(0, 10).map((m, index) => (
                        <tr
                          key={m.id}
                          className='border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors'
                        >
                          <td className='py-3 px-4 font-bold text-slate-400'>
                            {index + 1}
                          </td>
                          <td className='py-3 px-4 font-bold text-slate-700'>
                            {m.name}
                          </td>
                          <td className='py-3 px-4 text-slate-600 text-right'>
                            {m.uniqueWorkOrders}{' '}
                            <span className='text-xs text-slate-400'>筆</span>
                          </td>
                          <td className='py-3 px-4 text-slate-600 text-right font-mono'>
                            {m.usedHours}{' '}
                            <span className='text-xs text-slate-400'>H</span>
                          </td>
                          <td className='py-3 px-4 text-center'>
                            <span
                              className={`px-2 py-1 rounded text-[10px] font-bold ${m.utilization >= 85 ? 'bg-red-100 text-red-700 border border-red-200' : m.utilization >= 60 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}
                            >
                              {m.utilization >= 85
                                ? '嚴重超載'
                                : m.utilization >= 60
                                  ? '滿載警告'
                                  : '運作健康'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Context Warning Box */}
            {bottleneckStats[0]?.utilization >= 85 && (
              <div className='bg-red-50 border border-red-200 rounded-xl p-5 flex gap-3 items-start text-sm shadow-sm'>
                <AlertCircle
                  className='text-red-500 shrink-0 mt-0.5'
                  size={20}
                />
                <div className='text-red-800 leading-relaxed'>
                  <span className='font-bold text-base block mb-1'>
                    系統調度建議：
                  </span>
                  首要瓶頸{' '}
                  <strong className='bg-white px-1.5 py-0.5 rounded border border-red-200 mx-1'>
                    {bottleneckStats[0].name}
                  </strong>{' '}
                  已達超載標準（{bottleneckStats[0].utilization}%）。
                  系統偵測到有{' '}
                  <strong className='mx-1'>
                    {bottleneckStats[0].uniqueWorkOrders}
                  </strong>{' '}
                  筆主工單正排隊等待該機台。建議生管人員立即安排假日加班消化產能、評估將部分製程外包，或利用
                  APS 系統進行「產能平準化
                  (Leveling)」運算以重新分配至同型號備用機台。
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
