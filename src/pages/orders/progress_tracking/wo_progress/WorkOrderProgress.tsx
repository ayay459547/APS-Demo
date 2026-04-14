import React, { useState, useEffect, useMemo } from 'react'
import {
  Table,
  Tag,
  Progress,
  Input,
  Button,
  ConfigProvider,
  Card,
  Popover,
  Badge,
  Tooltip,
  Dropdown
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  Search,
  Download,
  AlertCircle,
  Clock,
  ChevronDown,
  Activity,
  GanttChart,
  BoxSelect,
  ShieldCheck,
  Cpu,
  FileText,
  PlayCircle,
  Info,
  Plus,
  MoreVertical,
  RefreshCw,
  Settings
} from 'lucide-react'
import dayjs from 'dayjs'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 樣式合併工具函數 (Project Standard)
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- TypeScript 型別定義 ---
export type PriorityType = '特急' | '急單' | '一般'
export type StatusType = '進行中' | '異常延遲' | '已完成' | '未開始'
export type StepStatusType = 'wait' | 'process' | 'finish' | 'error'

export interface RoutingStep {
  id: string
  stepName: string
  status: StepStatusType
  targetQty: number
  completedQty: number
  wipQty: number
  defectQty: number
  machine: string
  startTime: number
  endTime: number
}

export interface WorkOrderProgressType {
  key: string
  woId: string
  priority: PriorityType
  productName: string
  productCode: string
  targetQty: number
  totalCompletedQty: number
  yieldRate: number
  status: StatusType
  startDate: string
  currentStepName: string
  routings: RoutingStep[]
}

// --- 擬真數據產生器 ---
const generateProgressData = (count: number): WorkOrderProgressType[] => {
  const products = [
    {
      name: '高階伺服器主機板',
      code: 'MB-SVR-X99',
      steps: ['SMT 貼片', 'DIP 插件', 'PCBA 測試', '包裝入庫']
    },
    {
      name: '工控主機外殼',
      code: 'CHAS-IND-01',
      steps: ['CNC 切削', '表面拋光', '陽極處理', '品檢入庫']
    },
    {
      name: 'AI 運算加速卡',
      code: 'GPU-AI-A100',
      steps: ['SMT', '晶片打線', '組裝', '燒機', '包裝']
    }
  ]
  const priorities: PriorityType[] = ['特急', '急單', '一般', '一般']
  const statuses: StatusType[] = ['進行中', '進行中', '異常延遲', '已完成']

  return Array.from({ length: count }).map((_, idx) => {
    const product = products[Math.floor(Math.random() * products.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const targetQty = Math.floor(Math.random() * 1000) + 200
    const startDateStr = `2026-04-${String(Math.max(1, 14 - Math.floor(Math.random() * 5))).padStart(2, '0')} 08:00`

    let currentTimeline = dayjs(startDateStr).valueOf()
    const routings: RoutingStep[] = product.steps.map((stepName, stepIdx) => {
      let stepStatus: StepStatusType = status === '已完成' ? 'finish' : 'wait'
      let completed = status === '已完成' ? targetQty : 0

      if (status !== '已完成') {
        if (stepIdx === 0) {
          stepStatus = 'finish'
          completed = targetQty - 2
        } else if (stepIdx === 1) {
          stepStatus = status === '異常延遲' ? 'error' : 'process'
          completed = Math.floor(targetQty * 0.5)
        }
      }

      const durationHours = Math.floor(Math.random() * 12) + 6
      const startTime = currentTimeline
      const endTime = startTime + durationHours * 3600000
      currentTimeline = endTime + 4 * 3600000

      return {
        id: `STP-${idx}-${stepIdx}`,
        stepName,
        status: stepStatus,
        targetQty,
        completedQty: completed,
        wipQty: stepStatus === 'process' ? Math.floor(targetQty * 0.2) : 0,
        defectQty: Math.floor(Math.random() * 8),
        machine: `EQ-${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`,
        startTime,
        endTime
      }
    })

    const currentStep =
      routings.find(r => r.status === 'process' || r.status === 'error') ||
      (status === '已完成' ? routings[routings.length - 1] : routings[0])

    return {
      key: String(idx + 1),
      woId: `WO-2604${(idx + 1).toString().padStart(4, '0')}`,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      productName: product.name,
      productCode: product.code,
      targetQty,
      totalCompletedQty:
        status === '已完成' ? targetQty : Math.floor(targetQty * 0.4),
      yieldRate: 98 + Math.random() * 1.5,
      status,
      startDate: startDateStr,
      currentStepName: currentStep.stepName,
      routings
    }
  })
}

// --- 子組件：統計卡片 ---
const StatCard: React.FC<{
  title: string
  value: string | number
  unit: string
  icon: React.ElementType
  colorClass: string
  bgClass: string
  iconColorClass: string
  trend?: string
  isAlert?: boolean
}> = ({
  title,
  value,
  unit,
  icon: Icon,
  colorClass,
  bgClass,
  iconColorClass,
  trend,
  isAlert
}) => (
  <div
    className={cn(
      'bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md',
      isAlert && 'ring-1 ring-rose-100 bg-rose-50/10'
    )}
  >
    <div>
      <p className='text-[12px] text-slate-500 mb-0.5 font-medium'>{title}</p>
      <div className='flex items-baseline gap-1.5'>
        <span className='text-xl font-bold text-slate-800 tracking-tight'>
          {value}
        </span>
        <span className='text-[10px] text-slate-400 font-medium'>{unit}</span>
      </div>
      {trend && (
        <div className={cn('mt-1 text-[10px] font-bold', colorClass)}>
          {trend}
        </div>
      )}
    </div>
    <div className={cn('p-2.5 rounded-lg', bgClass)}>
      <Icon size={18} className={iconColorClass} />
    </div>
  </div>
)

// --- 主元件 ---
export default function App() {
  const [loading, setLoading] = useState<boolean>(true)
  const data = useMemo(() => generateProgressData(300), [])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(
    () => ({
      avgYield: (
        data.reduce((acc, c) => acc + c.yieldRate, 0) / (data.length || 1)
      ).toFixed(2),
      processing: data.filter(d => d.status === '進行中').length,
      errors: data.filter(d => d.status === '異常延遲').length
    }),
    [data]
  )

  // --- Popover KPI ---
  const statsContent = (
    <div className='w-full max-w-[500px] py-1'>
      <div className='flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5'>
        <Activity size={16} className='text-indigo-600' />
        <span className='font-bold text-slate-800'>廠區製程即時指標</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='平均直通良率 (FPY)'
          value={stats.avgYield}
          unit='%'
          icon={ShieldCheck}
          colorClass='text-emerald-600'
          bgClass='bg-emerald-50'
          iconColorClass='text-emerald-500'
          trend='高於目標 98%'
        />
        <StatCard
          title='生產中工單'
          value={stats.processing}
          unit='張'
          icon={Cpu}
          colorClass='text-blue-600'
          bgClass='bg-blue-50'
          iconColorClass='text-blue-500'
        />
        <StatCard
          title='製程異常警告'
          value={stats.errors}
          unit='站'
          icon={AlertCircle}
          colorClass='text-rose-600'
          bgClass='bg-rose-50'
          iconColorClass='text-rose-500'
          isAlert={true}
          trend='含設備與品質異常'
        />
        <StatCard
          title='在線機台數'
          value={42}
          unit='台'
          icon={PlayCircle}
          colorClass='text-purple-600'
          bgClass='bg-purple-50'
          iconColorClass='text-purple-500'
        />
      </div>
    </div>
  )

  // --- Popover 內容：Gantt 節點 KPI 儀表板 ---
  const renderGanttPopover = (step: RoutingStep) => {
    const percent = Math.round((step.completedQty / step.targetQty) * 100) || 0
    return (
      <div className='w-64 p-1 z-[100]'>
        <div className='flex justify-between items-center mb-2 border-b border-slate-100 pb-2'>
          <div className='font-bold text-slate-700 text-sm flex items-center gap-1.5'>
            {step.status === 'error' ? (
              <AlertCircle size={14} className='text-rose-500' />
            ) : (
              <Clock size={14} className='text-blue-500' />
            )}
            {step.stepName}
          </div>
          <Tag className='m-0 text-[10px] font-mono border-slate-200'>
            {step.machine}
          </Tag>
        </div>

        <div className='mb-3'>
          <div className='flex justify-between text-[11px] mb-1'>
            <span className='text-slate-500'>工序進度</span>
            <span className='font-bold text-blue-600'>{percent}%</span>
          </div>
          <Progress
            percent={percent}
            size='small'
            showInfo={false}
            status={step.status === 'error' ? 'exception' : 'normal'}
            strokeColor={step.status === 'finish' ? '#10b981' : undefined}
          />
        </div>

        <div className='grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100'>
          <div className='flex flex-col'>
            <span className='text-[10px] text-slate-400'>目標產量</span>
            <span className='font-bold text-slate-700 text-xs'>
              {step.targetQty}
            </span>
          </div>
          <div className='flex flex-col'>
            <span className='text-[10px] text-slate-400'>已完成</span>
            <span className='font-bold text-emerald-600 text-xs'>
              {step.completedQty}
            </span>
          </div>
          <div className='flex flex-col'>
            <span className='text-[10px] text-slate-400'>在製品 (WIP)</span>
            <span className='font-bold text-blue-600 text-xs'>
              {step.wipQty}
            </span>
          </div>
          <div className='flex flex-col'>
            <span className='text-[10px] text-slate-400'>不良品數</span>
            <span
              className={cn(
                'font-bold text-xs',
                step.defectQty > 0 ? 'text-rose-600' : 'text-slate-700'
              )}
            >
              {step.defectQty}
            </span>
          </div>
        </div>

        <div className='mt-3 bg-slate-100/50 p-2 rounded border border-slate-100 text-[10px] text-slate-500 flex flex-col gap-1 font-mono'>
          <div className='flex justify-between'>
            <span>開始時間:</span>{' '}
            <span className='font-semibold text-slate-700'>
              {dayjs(step.startTime).format('MM/DD HH:mm')}
            </span>
          </div>
          <div className='flex justify-between'>
            <span>預計結束:</span>{' '}
            <span className='font-semibold text-slate-700'>
              {dayjs(step.endTime).format('MM/DD HH:mm')}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // --- 表格擴展區：固定比例網格 Gantt Chart ---
  const expandedRowRender = (record: WorkOrderProgressType) => {
    // 找出所有節點時間，並給予前後一小時的 Buffer
    const times = record.routings.map(r => [r.startTime, r.endTime]).flat()
    const rawMinTime = Math.min(...times)
    const rawMaxTime = Math.max(...times)

    const minTime =
      dayjs(rawMinTime).startOf('hour').valueOf() - 1 * 3600 * 1000
    const maxTime = dayjs(rawMaxTime).endOf('hour').valueOf() + 1 * 3600 * 1000
    const totalHours = Math.ceil((maxTime - minTime) / (3600 * 1000))

    const PIXELS_PER_HOUR = 30 // 固定比例：每 1 小時佔 30px
    const ganttWidth = totalHours * PIXELS_PER_HOUR

    // 產生時間標籤 (每 6 小時一個大網格/標籤)
    const ticks = []
    for (let i = 0; i <= totalHours; i += 6) {
      ticks.push(minTime + i * 3600 * 1000)
    }

    return (
      <div className='py-4 px-0 bg-slate-50 border-y border-blue-200/50 shadow-inner shadow-blue-100/50'>
        <div className='flex items-center gap-2 mb-3 px-6'>
          <BoxSelect size={16} className='text-blue-600' />
          <span className='font-bold text-slate-700 text-[13px]'>
            生產工序甘特圖追蹤 (Routing Gantt View)
          </span>
        </div>

        <div className='bg-white border-y border-slate-200 shadow-sm overflow-x-auto flex custom-scrollbar relative'>
          {/* 左側凍結區 (Sticky) : 工序名稱 */}
          <div className='w-[160px] shrink-0 border-r border-slate-200 bg-white z-20 sticky left-0 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.05)]'>
            <div className='h-8 border-b border-slate-200 bg-slate-50 flex items-center justify-end pr-3'>
              <span className='text-[10px] font-bold text-slate-400'>
                工序站點
              </span>
            </div>
            <div className='flex flex-col gap-3 py-3'>
              {record.routings.map(step => (
                <div
                  key={`name-${step.id}`}
                  className='h-8 flex items-center justify-end pr-3'
                >
                  <span
                    className='text-[11px] font-bold text-slate-600 truncate'
                    title={step.stepName}
                  >
                    {step.stepName}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 右側甘特圖滾動區 */}
          <div className='relative pb-4 pt-0 min-w-max'>
            {/* 甘特圖表頭 (時間軸) */}
            <div
              className='h-8 border-b border-slate-200 relative bg-slate-50'
              style={{ width: ganttWidth }}
            >
              {ticks.map((tickTime, i) => (
                <div
                  key={i}
                  className='absolute top-0 h-full text-[10px] font-bold text-slate-500 flex items-center justify-center -translate-x-1/2'
                  style={{
                    left:
                      ((tickTime - minTime) / (3600 * 1000)) * PIXELS_PER_HOUR
                  }}
                >
                  {dayjs(tickTime).format('MM/DD HH:mm')}
                </div>
              ))}
            </div>

            {/* 甘特圖條列區塊與明顯網格 */}
            <div
              className='relative py-3 flex flex-col gap-3'
              style={{ width: ganttWidth }}
            >
              {/* 明顯的小時細網格 (淺灰色) */}
              <div
                className='absolute inset-0 pointer-events-none'
                style={{
                  backgroundImage: `linear-gradient(to right, #f1f5f9 1px, transparent 1px)`,
                  backgroundSize: `${PIXELS_PER_HOUR}px 100%`
                }}
              />

              {/* 明顯的 6 小時大網格 (較深的灰色，對齊標籤) */}
              <div
                className='absolute inset-0 pointer-events-none'
                style={{
                  backgroundImage: `linear-gradient(to right, #cbd5e1 1px, transparent 1px)`,
                  backgroundSize: `${PIXELS_PER_HOUR * 6}px 100%`
                }}
              />

              {record.routings.map(step => {
                const leftPx =
                  ((step.startTime - minTime) / (3600 * 1000)) * PIXELS_PER_HOUR
                const widthPx =
                  ((step.endTime - step.startTime) / (3600 * 1000)) *
                  PIXELS_PER_HOUR

                let barColor =
                  'bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-600'
                if (step.status === 'finish') {
                  barColor =
                    'bg-emerald-500 hover:bg-emerald-400 border-emerald-600 text-white shadow-sm shadow-emerald-200'
                } else if (step.status === 'process') {
                  barColor =
                    'bg-blue-500 hover:bg-blue-400 border-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                } else if (step.status === 'error') {
                  barColor =
                    'bg-rose-500 hover:bg-rose-400 border-rose-600 text-white animate-pulse shadow-rose-200 shadow-md'
                }

                const percent =
                  Math.round((step.completedQty / step.targetQty) * 100) || 0

                return (
                  <div key={step.id} className='h-8 relative z-10 w-full group'>
                    <Popover
                      content={renderGanttPopover(step)}
                      trigger='hover'
                      placement='top'
                      mouseEnterDelay={0.1}
                    >
                      <div
                        className={cn(
                          'absolute top-0 h-full rounded border flex items-center px-2 cursor-pointer transition-all overflow-hidden',
                          barColor
                        )}
                        style={{
                          left: leftPx,
                          width: widthPx,
                          minWidth: '40px'
                        }}
                      >
                        <span className='text-[10px] font-bold truncate'>
                          {widthPx > 40 ? `${percent}%` : ''}
                        </span>
                      </div>
                    </Popover>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- 表格欄位定義 (整合 Filter 與良率修正) ---
  const columns: ColumnsType<WorkOrderProgressType> = [
    {
      title: '工單編號',
      dataIndex: 'woId',
      key: 'woId',
      width: 150,
      fixed: 'left',
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters
      }) => (
        <div className='p-3 bg-white rounded-xl shadow-2xl border border-slate-100 w-64'>
          <Input
            placeholder='搜尋單號...'
            prefix={<Search size={14} className='text-slate-400' />}
            value={selectedKeys[0]}
            onChange={e =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            className='mb-3 rounded-lg h-9 border-slate-200'
          />
          <div className='flex justify-between'>
            <Button
              size='small'
              type='text'
              onClick={() => clearFilters && clearFilters()}
              className='text-[10px] font-bold text-slate-400'
            >
              重置
            </Button>
            <Button
              size='small'
              type='primary'
              onClick={() => confirm()}
              className='text-[10px] font-bold px-4 text-white border-none bg-blue-600'
            >
              篩選
            </Button>
          </div>
        </div>
      ),
      filterIcon: filtered => (
        <Search
          size={14}
          className={filtered ? 'text-blue-500' : 'text-slate-400'}
        />
      ),
      render: (text, record) => (
        <div className='flex flex-col'>
          <span className='font-bold text-blue-600 hover:underline cursor-pointer tracking-tight'>
            {text}
          </span>
          <div className='mt-1 flex gap-1'>
            {record.priority === '特急' && (
              <Tag
                color='volcano'
                className='m-0 border-none text-[9px] font-black rounded-md px-1.5 leading-5 uppercase'
              >
                Urgent
              </Tag>
            )}
            {record.priority === '急單' && (
              <Tag
                color='orange'
                className='m-0 border-none text-[9px] font-black rounded-md px-1.5 leading-5 uppercase'
              >
                Rush
              </Tag>
            )}
          </div>
        </div>
      )
    },
    {
      title: '產品資訊',
      dataIndex: 'productName',
      key: 'product',
      width: 200,
      render: (text, record) => (
        <div className='flex flex-col'>
          <span className='font-bold text-slate-700 text-sm truncate max-w-[160px]'>
            {text}
          </span>
          <span className='text-[10px] font-mono font-bold text-slate-400 tracking-tighter uppercase'>
            {record.productCode}
          </span>
        </div>
      )
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      filters: [
        { text: '進行中', value: '進行中' },
        { text: '異常延遲', value: '異常延遲' },
        { text: '已完成', value: '已完成' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status, record) => (
        <div className='flex items-center gap-2'>
          <Badge
            status={
              status === '異常延遲'
                ? 'error'
                : status === '已完成'
                  ? 'success'
                  : 'processing'
            }
          />
          <span
            className={cn(
              'text-xs font-bold px-2 py-1 rounded-md border',
              status === '異常延遲'
                ? 'bg-rose-50 border-rose-100 text-rose-600'
                : status === '已完成'
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                  : 'bg-blue-50 border-blue-100 text-blue-600'
            )}
          >
            {record.currentStepName}
          </span>
        </div>
      )
    },
    {
      title: '總體進度',
      key: 'totalProgress',
      width: 180,
      render: (_, record) => {
        const percent = Math.round(
          (record.totalCompletedQty / record.targetQty) * 100
        )
        return (
          <div className='w-full pr-4'>
            <div className='flex justify-between text-[10px] font-black mb-1'>
              <span className='text-slate-400 uppercase tracking-tighter'>
                {record.totalCompletedQty} / {record.targetQty} PCS
              </span>
              <span className='text-slate-700'>{percent}%</span>
            </div>
            <Progress
              percent={percent}
              size='small'
              showInfo={false}
              strokeColor={percent === 100 ? '#10b981' : '#3b82f6'}
            />
          </div>
        )
      }
    },
    {
      title: '直通良率', // 修正：精確至小數點兩位
      dataIndex: 'yieldRate',
      key: 'yield',
      width: 120,
      sorter: (a, b) => a.yieldRate - b.yieldRate,
      render: rate => (
        <div
          className={cn(
            'inline-flex items-center gap-1.5 font-black text-xs px-2.5 py-0.5 rounded-full border shadow-sm',
            rate > 99
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : 'bg-amber-50 text-amber-600 border-amber-100'
          )}
        >
          <ShieldCheck size={12} /> {rate.toFixed(2)}%
        </div>
      )
    },
    {
      title: '開工日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 130,
      render: date => (
        <span className='text-slate-500 font-mono text-[11px] font-bold'>
          {date.split(' ')[0]}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      fixed: 'right',
      align: 'center',
      render: () => (
        <Dropdown
          menu={{
            items: [
              { key: '1', label: '工單詳情', icon: <FileText size={14} /> },
              { key: '2', label: '報工紀錄', icon: <Activity size={14} /> }
            ]
          }}
          trigger={['click']}
          placement='bottomRight'
        >
          <Button
            type='text'
            size='small'
            icon={<MoreVertical size={18} className='text-slate-400' />}
          />
        </Dropdown>
      )
    }
  ]

  return (
    <ConfigProvider
      theme={{ token: { colorPrimary: '#3b82f6', borderRadius: 12 } }}
    >
      <div className='w-full h-full bg-[#f8fafc] font-sans pb-10'>
        {/* Header Section */}
        <header className='sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm px-6 py-4'>
          <div className='max-w-[1600px] mx-auto flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center text-white'>
                <GanttChart size={20} />
              </div>
              <div>
                <Popover
                  content={statsContent}
                  trigger='click'
                  placement='bottomLeft'
                  rootClassName='custom-stats-popover'
                >
                  <Button className='flex items-center gap-2 font-bold h-11 px-5 border-none bg-blue-600/5 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all'>
                    數據概覽
                    <ChevronDown size={14} />
                    <span className='flex h-2 w-2 ml-1'>
                      <span className='animate-ping absolute inline-flex h-2 w-2 rounded-full bg-rose-400 opacity-75'></span>
                      <span className='relative inline-flex rounded-full h-2 w-2 bg-rose-500'></span>
                    </span>
                  </Button>
                </Popover>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <Tooltip title='同步報工數據'>
                <Button
                  variant='text'
                  icon={<RefreshCw size={16} className='text-slate-400' />}
                  className='rounded-xl h-10 w-10 flex items-center justify-center'
                />
              </Tooltip>
              <Button
                icon={<Download size={16} />}
                className='rounded-xl h-10 border-slate-200 font-black text-xs px-4'
              >
                匯出報表
              </Button>
              <Button
                type='primary'
                icon={<Plus size={16} />}
                className='rounded-xl bg-blue-600 shadow-md shadow-blue-100 font-black text-xs border-none h-10 px-6 text-white'
              >
                新增工單
              </Button>
            </div>
          </div>
        </header>

        <main className='max-w-[1600px] mx-auto p-6'>
          <Card
            className='shadow-sm border-none rounded-[32px] overflow-hidden'
            styles={{ body: { padding: 0 } }}
          >
            <div className='bg-slate-50/50 p-5 border-b border-slate-100 flex items-center justify-between'>
              <div className='flex items-center gap-3 text-slate-500 text-[11px] font-black uppercase tracking-widest'>
                <Settings size={14} />
                工單追蹤清單展示 (300 筆數據項目)
              </div>
              <div className='flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm'>
                <Info size={14} className='text-blue-500' />
                <span className='text-[10px] text-slate-400 font-bold uppercase tracking-tight'>
                  提示：點擊列表列可展開查看「強化型」工序甘特圖
                </span>
              </div>
            </div>

            <Table<WorkOrderProgressType>
              columns={columns}
              dataSource={data}
              loading={loading}
              expandable={{
                expandedRowRender,
                expandRowByClick: true,
                columnWidth: 48
              }}
              scroll={{ x: 1300 }}
              pagination={{
                pageSize: 15,
                showSizeChanger: true,
                className: '!px-8 py-5 m-0 border-t border-slate-50'
              }}
            />
          </Card>
        </main>
      </div>
    </ConfigProvider>
  )
}
