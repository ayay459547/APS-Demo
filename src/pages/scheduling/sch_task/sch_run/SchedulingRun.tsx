import React, { useState, useMemo } from 'react'
import {
  ConfigProvider,
  Button,
  Tag,
  Badge,
  Popover,
  Select,
  message,
  Progress,
  Timeline,
  Pagination,
  Input
} from 'antd'
import {
  Activity,
  Settings2,
  Zap,
  Cpu,
  Search,
  Clock,
  ArrowDownToLine,
  GripVertical,
  Wrench,
  Package,
  User,
  Filter,
  XCircle
} from 'lucide-react'
import dayjs from 'dayjs'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// 輕量版 cn 函數
function cn(...classes: (string | undefined | null | false)[]) {
  return twMerge(clsx(classes))
}

// --- 型別定義 ---
type PriorityType = 'Urgent' | 'High' | 'Normal'

interface ProcessStep {
  name: string
  machine: string
  duration: number
  startHour?: number // 排程後賦予
}

interface WorkOrder {
  id: string
  customer: string
  itemName: string
  plannedQty: number
  priority: PriorityType
  status: 'Pending' | 'Scheduled'
  steps: ProcessStep[]
}

interface TaskRow {
  key: string
  woId: string
  workOrder: WorkOrder // 關聯原始工單以供 Popover 使用
  stepIndex: number
  stepName: string
  machine: string
  startHour: number
  duration: number
  priority: PriorityType
}

// --- 500筆巨量數據生成器 ---
const BASE_DATE = dayjs('2026-04-21 08:00')

const CUSTOMERS = [
  'Tesla Giga',
  'Apple Inc.',
  'SpaceX',
  'TSMC',
  'NVIDIA',
  'Amazon Robotics'
]
const ITEMS = [
  'M3 Pro Mainboard',
  'Power Module X1',
  'Aluminum Chassis v4',
  'Lithium Battery Pack',
  'OLED Display Unit'
]
const MACHINES = [
  'LASER-01',
  'CNC-01',
  'CNC-02',
  'WJ-02',
  'ARM-01',
  'ARM-05',
  'ANO-02',
  'GR-08',
  'QC-01',
  'QC-02',
  'PKG-11'
]
const STEP_NAMES = [
  '下料切割',
  '精密加工',
  '研磨拋光',
  '表面處理',
  '機械組裝',
  '自動銲接',
  '品質檢驗',
  '成品包裝'
]

const generateWorkOrders = (count: number): WorkOrder[] => {
  return Array.from({ length: count }).map((_, i) => {
    const id = `WO-2604-${String(i + 1).padStart(4, '0')}`
    const p = Math.random()
    const priority: PriorityType =
      p > 0.9 ? 'Urgent' : p > 0.6 ? 'High' : 'Normal'
    const numSteps = Math.floor(Math.random() * 3) + 2 // 2 to 4 steps

    const steps: ProcessStep[] = Array.from({ length: numSteps }).map(() => ({
      name: STEP_NAMES[Math.floor(Math.random() * STEP_NAMES.length)],
      machine: MACHINES[Math.floor(Math.random() * MACHINES.length)],
      duration: Math.floor(Math.random() * 4) + 1 // 1 to 4 hours
    }))

    return {
      id,
      customer: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)],
      itemName: ITEMS[Math.floor(Math.random() * ITEMS.length)],
      plannedQty: Math.floor(Math.random() * 1000) + 50,
      priority,
      status: 'Pending',
      steps
    }
  })
}

// 模擬 APS 演算法產生排程任務 (防重疊)
const calculateSchedule = (workOrders: WorkOrder[]): TaskRow[] => {
  const machineAvailableHour: Record<string, number> = {}
  MACHINES.forEach(m => (machineAvailableHour[m] = 0))

  const scheduledTasks: TaskRow[] = []

  // 根據優先級初步排序，讓急單優先排入
  const sortedOrders = [...workOrders].sort((a, b) => {
    const weight = { Urgent: 3, High: 2, Normal: 1 }
    return weight[b.priority] - weight[a.priority]
  })

  sortedOrders.forEach(wo => {
    // 隨機決定此工單的釋放時間 (Release Time) 模擬真實情境
    let currentWoHour = Math.floor(Math.random() * 12)
    wo.status = 'Scheduled'

    wo.steps.forEach((step, idx) => {
      // 任務開始時間 = Max(工單目前可用時間, 機台目前可用時間)
      const startHour = Math.max(
        currentWoHour,
        machineAvailableHour[step.machine]
      )
      step.startHour = startHour // 回寫至工單內供 Popover 顯示

      scheduledTasks.push({
        key: `T-${wo.id}-${idx}`,
        woId: wo.id,
        workOrder: wo,
        stepIndex: idx,
        stepName: step.name,
        machine: step.machine,
        startHour,
        duration: step.duration,
        priority: wo.priority
      })

      // 更新可用時間 (+0.5h 緩衝)
      machineAvailableHour[step.machine] = startHour + step.duration
      currentWoHour = startHour + step.duration + 0.5
    })
  })

  // 將所有任務依據「開始時間」進行嚴格的絕對時間排序
  return scheduledTasks.sort((a, b) => a.startHour - b.startHour)
}

const initialOrders = generateWorkOrders(500)

export default function ProductionTimeline() {
  const [isCalculated, setIsCalculated] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [progress, setProgress] = useState(0)

  const [orders] = useState<WorkOrder[]>(initialOrders)
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [optStrategy, setOptStrategy] = useState('otd')

  // 篩選與分頁狀態
  const [searchText, setSearchText] = useState('')
  const [selectedMachines, setSelectedMachines] = useState<string[]>([])
  const [selectedSteps, setSelectedSteps] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(30)

  // 模擬 APS 運算過程
  const handleRunAPS = () => {
    setIsCalculating(true)
    setProgress(0)

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          return 100
        }
        return p + Math.floor(Math.random() * 15) + 5
      })
    }, 150)

    setTimeout(() => {
      setIsCalculating(false)
      setIsCalculated(true)
      // 執行核心演算
      const scheduledTasks = calculateSchedule(orders)
      setTasks(scheduledTasks)

      // 重置過濾條件與分頁
      setSearchText('')
      setSelectedMachines([])
      setSelectedSteps([])
      setCurrentPage(1)
      message.success({
        content: '排程演算完成！已生成高密度 Timeline 看板。',
        className: 'custom-message'
      })
    }, 1500)
  }

  const handleReset = () => {
    setIsCalculated(false)
    setTasks([])
    setSearchText('')
    setSelectedMachines([])
    setSelectedSteps([])
    setCurrentPage(1)
    message.info('已清除演算結果，還原為未排產狀態。')
  }

  // --- 高效能過濾引擎 (Memoized Filtering) ---
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchMachine =
        selectedMachines.length === 0 || selectedMachines.includes(task.machine)
      const matchStep =
        selectedSteps.length === 0 || selectedSteps.includes(task.stepName)

      const searchLower = searchText.toLowerCase()
      const matchSearch =
        searchText === '' ||
        task.woId.toLowerCase().includes(searchLower) ||
        task.workOrder.itemName.toLowerCase().includes(searchLower) ||
        task.workOrder.customer.toLowerCase().includes(searchLower)

      return matchMachine && matchStep && matchSearch
    })
  }, [tasks, selectedMachines, selectedSteps, searchText])

  // 取得當前頁面的任務 (分頁渲染)
  const currentTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredTasks.slice(startIndex, startIndex + pageSize)
  }, [filteredTasks, currentPage, pageSize])

  // --- 事件處理函式 (優化 React Rendering，移除 useEffect 以防 Double Render) ---
  const handleSearchTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value)
    setCurrentPage(1) // 篩選變更時直接重置頁碼
  }

  const handleMachinesChange = (values: string[]) => {
    setSelectedMachines(values)
    setCurrentPage(1)
  }

  const handleStepsChange = (values: string[]) => {
    setSelectedSteps(values)
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setSelectedMachines([])
    setSelectedSteps([])
    setSearchText('')
    setCurrentPage(1)
  }

  // --- UI 元件 ---
  const statsContent = (
    <div className='w-full max-w-[420px] p-1'>
      <div className='flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5'>
        <Cpu size={16} className='text-indigo-600' />
        <span className='font-bold text-slate-800'>排程演算效能預估</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <div className='bg-slate-50 p-3 rounded-xl border border-slate-100'>
          <span className='text-[10px] font-bold text-slate-400 block mb-1'>
            達交率 (OTD)
          </span>
          <span className='text-xl font-black text-indigo-600 font-mono'>
            {isCalculated ? '98.2%' : '--%'}
          </span>
        </div>
        <div className='bg-slate-50 p-3 rounded-xl border border-slate-100'>
          <span className='text-[10px] font-bold text-slate-400 block mb-1'>
            設備平均稼動率
          </span>
          <span className='text-xl font-black text-emerald-600 font-mono'>
            {isCalculated ? '85.4%' : '--%'}
          </span>
        </div>
        <div className='bg-slate-50 p-3 rounded-xl border border-slate-100'>
          <span className='text-[10px] font-bold text-slate-400 block mb-1'>
            已排產任務總數
          </span>
          <span className='text-xl font-black text-slate-700 font-mono'>
            {isCalculated ? tasks.length.toLocaleString() : '0'}
          </span>
        </div>
        <div className='bg-slate-50 p-3 rounded-xl border border-slate-100'>
          <span className='text-[10px] font-bold text-slate-400 block mb-1'>
            排程衝突/重疊
          </span>
          <span className='text-xl font-black text-rose-500 font-mono'>
            {isCalculated ? '0' : '--'}
          </span>
        </div>
      </div>
    </div>
  )

  // 渲染 Timeline 的 Item 內容 (高密度版)
  const renderTimelineItem = (record: TaskRow) => {
    const wo = record.workOrder

    const popoverContent = (
      <div className='w-full min-w-[320px] p-1'>
        <div className='flex items-center justify-between mb-3 border-b border-white/10 pb-2'>
          <span className='font-mono font-black text-lg text-white'>
            {wo.id}
          </span>
          <Tag
            color={
              wo.priority === 'Urgent'
                ? 'volcano'
                : wo.priority === 'High'
                  ? 'orange'
                  : 'blue'
            }
            className='m-0 border-none font-bold'
          >
            {wo.priority}
          </Tag>
        </div>

        <div className='grid grid-cols-2 gap-3 mb-4'>
          <div className='flex flex-col gap-1 bg-white/5 p-2 rounded-lg'>
            <span className='text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1'>
              <User size={10} /> 客戶
            </span>
            <span className='text-xs font-bold text-white truncate'>
              {wo.customer}
            </span>
          </div>
          <div className='flex flex-col gap-1 bg-white/5 p-2 rounded-lg'>
            <span className='text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1'>
              <Package size={10} /> 需求數量
            </span>
            <span className='text-xs font-mono font-bold text-white'>
              {wo.plannedQty.toLocaleString()} PCS
            </span>
          </div>
        </div>

        <div className='flex flex-col gap-1.5'>
          <span className='text-[10px] text-slate-400 uppercase font-bold'>
            工單總途程追蹤
          </span>
          <div className='bg-white/5 rounded-lg p-2.5 flex flex-col gap-2'>
            {wo.steps.map((step, idx) => {
              const isCurrent = idx === record.stepIndex
              const stepStart =
                step.startHour !== undefined
                  ? BASE_DATE.add(step.startHour, 'hour').format('MM/DD HH:mm')
                  : '未定'
              return (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center justify-between text-xs',
                    isCurrent
                      ? 'text-indigo-400 font-black'
                      : 'text-slate-300 font-medium'
                  )}
                >
                  <span className='flex items-center gap-1.5'>
                    {isCurrent ? (
                      <Activity size={12} className='animate-pulse' />
                    ) : (
                      <span className='w-1.5 h-1.5 rounded-full bg-slate-500 ml-1 mr-0.5' />
                    )}
                    {step.name}
                  </span>
                  <span className='font-mono text-[10px]'>{stepStart}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )

    return (
      <div className='flex items-center justify-between bg-white border border-slate-200 rounded-lg py-1.5 px-3 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group ml-1 mb-0 relative overflow-hidden min-h-[44px]'>
        {/* 緊急標示紅線 */}
        {record.priority === 'Urgent' && (
          <div className='absolute top-0 left-0 w-1 h-full bg-rose-500' />
        )}

        <div className='flex flex-wrap items-center gap-3 sm:gap-4 flex-1 pl-1'>
          {/* 機台 (Machine) */}
          <div className='bg-slate-50 py-1 px-2 rounded-md border border-slate-100 flex items-center justify-center w-[90px] shrink-0'>
            <span
              className='font-black text-slate-700 text-[11px] truncate max-w-full'
              title={record.machine}
            >
              {record.machine}
            </span>
          </div>

          {/* 製程 (Step) */}
          <div className='flex flex-col w-[100px] shrink-0'>
            <span className='text-[9px] font-black uppercase text-slate-400 leading-none mb-0.5'>
              製程階段
            </span>
            <span className='text-xs font-bold text-slate-600 flex items-center gap-1'>
              <Wrench size={10} className='text-slate-300' />
              {record.stepName}
            </span>
          </div>

          {/* 工單 (Order) */}
          <div className='flex flex-col w-[120px] shrink-0'>
            <span className='text-[9px] font-black uppercase text-slate-400 leading-none mb-0.5'>
              生產工單
            </span>
            <Popover
              content={popoverContent}
              trigger='hover'
              placement='right'
              color='#1e293b'
              overlayInnerStyle={{ padding: '16px' }}
              mouseEnterDelay={0.3}
            >
              <span className='font-mono font-black text-indigo-600 cursor-pointer hover:underline text-xs hover:text-indigo-800 transition-colors w-fit'>
                {record.woId}
              </span>
            </Popover>
          </div>

          {/* 產品 (Product) */}
          <div className='flex flex-col flex-1 min-w-[180px]'>
            <span className='text-[9px] font-black uppercase text-slate-400 leading-none mb-0.5'>
              產品與客戶
            </span>
            <div className='flex items-center gap-1.5'>
              <span
                className='text-xs font-black text-slate-700 truncate'
                title={wo.itemName}
              >
                {wo.itemName}
              </span>
              <span className='text-[9px] font-bold text-slate-400 border border-slate-200 rounded px-1 py-0.5 truncate shrink-0 hidden md:block'>
                {wo.customer} • {wo.plannedQty.toLocaleString()} PCS
              </span>
            </div>
          </div>
        </div>

        {/* 右側時間與優先級 (Status/Duration) */}
        <div className='flex items-center gap-2 shrink-0 ml-3 pl-3 border-l border-slate-100'>
          {record.priority === 'Urgent' ? (
            <Tag
              color='volcano'
              className='m-0 border-none font-bold rounded text-[10px] py-0 leading-5'
            >
              特急單
            </Tag>
          ) : record.priority === 'High' ? (
            <Tag
              color='orange'
              className='m-0 border-none font-bold rounded text-[10px] py-0 leading-5'
            >
              高優先
            </Tag>
          ) : (
            <Tag
              color='blue'
              className='m-0 border-none font-bold rounded text-[10px] py-0 leading-5'
            >
              一般單
            </Tag>
          )}
          <div className='flex flex-col items-end justify-center w-[40px]'>
            <span className='text-[9px] font-bold text-slate-400 leading-none mb-0.5'>
              耗時
            </span>
            <span className='text-xs font-mono font-black text-slate-700 flex items-center gap-0.5 leading-none'>
              {record.duration} <span className='text-[9px]'>h</span>
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          borderRadius: 8,
          borderRadiusSM: 4,
          fontFamily: 'Inter, Noto Sans TC, sans-serif'
        }
      }}
    >
      <div className='w-full h-full bg-[#f8fafc] font-sans text-slate-800 overflow-x-hidden flex flex-col'>
        <div className='mx-auto px-4 pt-4 pb-6 w-full h-full animate-fade-in flex flex-col'>
          {/* 全域懸浮導航列 (嚴格單行不跑版) */}
          <div className='flex items-center justify-between bg-white/90 py-3 px-5 rounded-2xl sticky top-2 z-50 backdrop-blur-xl shadow-sm border border-slate-200/60 mb-4 shrink-0'>
            {/* Left: APS 引擎狀態與策略 */}
            <div className='flex items-center gap-4'>
              <div className='bg-gradient-to-br from-indigo-500 to-cyan-500 p-2 rounded-xl shadow-md shadow-indigo-200/50 text-white shrink-0 hidden sm:block'>
                <GripVertical size={20} />
              </div>
              <div className='flex items-center gap-3'>
                <Popover
                  content={statsContent}
                  trigger='click'
                  placement='bottomLeft'
                  rootClassName='custom-stats-popover'
                >
                  <div className='cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 hover:border-indigo-300 transition-all'>
                    <Cpu size={14} className='text-indigo-600 animate-pulse' />
                    <span className='text-sm font-black text-slate-700'>
                      APS 演算引擎
                    </span>
                    <Badge
                      color={isCalculated ? 'green' : 'orange'}
                      className='ml-1 scale-75'
                    />
                  </div>
                </Popover>

                <div className='hidden md:flex items-center text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100'>
                  <Settings2 size={14} className='mr-1.5 opacity-70' />
                  排程規則:
                  <Select
                    value={optStrategy}
                    onChange={setOptStrategy}
                    variant='borderless'
                    size='small'
                    className='ml-1 font-black text-indigo-600 w-[140px]'
                  >
                    <Select.Option value='otd'>
                      時間優先 (依交期倒推)
                    </Select.Option>
                    <Select.Option value='oee'>
                      產能優先 (最大化稼動)
                    </Select.Option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Right: 執行按鈕區塊 */}
            <div className='flex items-center gap-2 shrink-0'>
              <Button
                onClick={handleReset}
                disabled={!isCalculated || isCalculating}
                className='rounded-lg border-slate-200 text-slate-500 font-bold h-9 hover:bg-slate-50 text-xs'
              >
                清除重算
              </Button>
              <Button
                type='primary'
                icon={
                  isCalculating ? (
                    <Activity size={14} className='animate-spin' />
                  ) : (
                    <Zap size={14} />
                  )
                }
                onClick={handleRunAPS}
                disabled={isCalculating || isCalculated}
                className={cn(
                  'rounded-lg font-black border-none transition-transform active:scale-95 h-9 px-5 shadow-sm text-xs',
                  isCalculated
                    ? 'bg-emerald-500 text-white shadow-emerald-200'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-200'
                )}
              >
                {isCalculating
                  ? '演算法推演中...'
                  : isCalculated
                    ? '已生成時間派工表'
                    : '執行智能排程 (500筆)'}
              </Button>
            </div>
          </div>

          {/* 運算中的全域遮罩 */}
          {isCalculating && (
            <div className='fixed inset-0 bg-white/70 backdrop-blur-md z-[100] flex flex-col items-center justify-center transition-all duration-300'>
              <div className='bg-white p-8 rounded-3xl shadow-2xl border border-indigo-100 flex flex-col items-center max-w-sm w-full'>
                <Cpu
                  size={40}
                  className='text-indigo-600 animate-bounce mb-5'
                />
                <h2 className='text-lg font-black text-slate-800 mb-2'>
                  排程演算法執行中...
                </h2>
                <p className='text-xs font-bold text-slate-400 text-center mb-6'>
                  正在為 500 筆工單分配最佳機台時間
                  <br />
                  並轉換為由上而下之時間序派工表。
                </p>
                <Progress
                  percent={progress}
                  status='active'
                  strokeColor='#4f46e5'
                  showInfo={false}
                  className='w-full mt-2'
                  size='small'
                />
              </div>
            </div>
          )}

          {/* 未排程的空狀態 */}
          {!isCalculated && !isCalculating && (
            <div className='bg-white rounded-[24px] border border-dashed border-slate-300 shadow-sm flex flex-col items-center justify-center flex-1 text-slate-500 min-h-[400px]'>
              <ArrowDownToLine size={40} className='text-slate-300 mb-3' />
              <h3 className='text-lg font-black text-slate-700'>
                時間序派工 Timeline
              </h3>
              <p className='text-xs font-medium mt-1 mb-5 text-slate-400 max-w-sm text-center leading-relaxed'>
                任務將依照開工時間由上而下排列，
                <br />
                高密度設計讓您一目了然機台與工單動態。
              </p>
              <Button
                type='primary'
                icon={<Zap size={14} />}
                onClick={handleRunAPS}
                className='bg-indigo-600 border-none rounded-lg font-bold px-6 shadow-sm text-xs h-9'
              >
                立即產生時間派工表
              </Button>
            </div>
          )}

          {/* 高密度 Timeline 排程看板 */}
          {isCalculated && (
            <div className='flex flex-col flex-1 overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm animate-fade-in relative z-10'>
              {/* 整合標頭與篩選工具列 (Combined Header & Filter Row) */}
              <div className='bg-slate-50/90 backdrop-blur-md border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-y-3 shrink-0 z-20 sticky top-0'>
                {/* 左側：標題與篩選控制區 */}
                <div className='flex flex-wrap items-center gap-2.5'>
                  <div className='flex items-center gap-2 mr-1 sm:mr-3'>
                    <Clock size={16} className='text-indigo-500' />
                    <span className='font-black text-[13px] text-slate-700 hidden sm:inline'>
                      時間排序任務
                    </span>
                    <span className='text-[11px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm'>
                      {filteredTasks.length} 筆
                    </span>
                  </div>

                  {/* 搜尋框 */}
                  <div className='flex items-center bg-white border border-slate-200 rounded-lg px-2 h-[28px] w-[140px] sm:w-[180px] transition-colors focus-within:border-indigo-400 shadow-sm'>
                    <Search
                      size={14}
                      className='text-slate-400 mr-1.5 shrink-0'
                    />
                    <Input
                      placeholder='搜尋工單或產品...'
                      variant='borderless'
                      className='text-[11px] font-bold p-0 placeholder:font-medium text-slate-600 w-full'
                      value={searchText}
                      onChange={handleSearchTextChange}
                    />
                  </div>

                  <Select
                    mode='multiple'
                    allowClear
                    placeholder='指定機台'
                    size='small'
                    maxTagCount='responsive'
                    value={selectedMachines}
                    onChange={handleMachinesChange}
                    className='min-w-[120px] max-w-[180px] text-xs font-bold custom-multi-select shadow-sm'
                    options={MACHINES.map(m => ({ label: m, value: m }))}
                  />

                  <Select
                    mode='multiple'
                    allowClear
                    placeholder='指定製程'
                    size='small'
                    maxTagCount='responsive'
                    value={selectedSteps}
                    onChange={handleStepsChange}
                    className='min-w-[120px] max-w-[180px] text-xs font-bold custom-multi-select shadow-sm'
                    options={STEP_NAMES.map(s => ({ label: s, value: s }))}
                  />

                  {(selectedMachines.length > 0 ||
                    selectedSteps.length > 0 ||
                    searchText !== '') && (
                    <Button
                      type='text'
                      size='small'
                      onClick={handleClearFilters}
                      className='text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 flex items-center gap-1 px-1.5 h-7'
                    >
                      <XCircle size={12} />{' '}
                      <span className='hidden sm:inline'>清除</span>
                    </Button>
                  )}
                </div>

                {/* 右側：分頁器 */}
                <div className='flex items-center'>
                  <Pagination
                    current={currentPage}
                    total={filteredTasks.length}
                    pageSize={pageSize}
                    onChange={(p, ps) => {
                      setCurrentPage(p)
                      setPageSize(ps)
                    }}
                    size='small'
                    showSizeChanger
                    pageSizeOptions={['15', '30', '50']}
                  />
                </div>
              </div>

              {/* Timeline 本體區塊 */}
              <div className='flex-1 overflow-y-auto px-4 py-4 md:px-6 custom-scrollbar bg-[#f8fafc]/40'>
                {currentTasks.length > 0 ? (
                  <Timeline
                    mode='left'
                    titleSpan={'150px'}
                    items={currentTasks.map(task => {
                      const start = BASE_DATE.add(task.startHour, 'hour')
                      const end = BASE_DATE.add(
                        task.startHour + task.duration,
                        'hour'
                      )

                      // 根據優先級決定 Timeline 的圓點顏色
                      const dotColor =
                        task.priority === 'Urgent'
                          ? 'red'
                          : task.priority === 'High'
                            ? 'orange'
                            : 'blue'

                      return {
                        color: dotColor,
                        label: (
                          <div className='flex flex-col items-end mr-2 pr-2'>
                            <span className='text-xs font-black text-slate-700 font-mono tracking-tight'>
                              {start.format('YYYY/MM/DD HH:mm')}
                            </span>
                            <span className='text-[10px] font-bold text-slate-400 flex items-center mt-2'>
                              至 {end.format('YYYY/MM/DD HH:mm')}
                            </span>
                          </div>
                        ),
                        children: renderTimelineItem(task)
                      }
                    })}
                  />
                ) : (
                  <div className='flex flex-col items-center justify-center h-full text-slate-400 gap-2 min-h-[200px]'>
                    <Filter size={32} className='opacity-30 mb-2' />
                    <span className='font-bold text-sm'>
                      無符合篩選條件的排程任務
                    </span>
                    <Button type='link' onClick={handleClearFilters}>
                      清除篩選條件
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <style>{`
            .custom-stats-popover .ant-popover-inner {
              border-radius: 12px !important;
              padding: 12px !important;
              border: 1px solid #e0e7ff;
              box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.1) !important;
            }

            /* 複選框樣式微調 */
            .custom-multi-select .ant-select-selector {
              border-radius: 8px !important;
              min-height: 28px !important;
              padding-top: 0px !important;
              padding-bottom: 0px !important;
              align-items: center;
            }
            .custom-multi-select .ant-select-selection-item {
              background: #f1f5f9 !important;
              border: 1px solid #e2e8f0 !important;
              border-radius: 4px !important;
              font-size: 10px !important;
              line-height: 18px !important;
              height: 20px !important;
              margin-top: 0px !important;
            }

            /* Hide Popover arrow for a cleaner dark card */
            .ant-popover-arrow { display: none !important; }

            /* Scrollbar */
            .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; border: 2px solid #f8fafc; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

            .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      </div>
    </ConfigProvider>
  )
}
