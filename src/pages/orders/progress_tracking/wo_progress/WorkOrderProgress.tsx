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
  PlayCircle,
  TrendingUp,
  ChevronDown,
  Activity,
  BoxSelect,
  ShieldCheck,
  Cpu,
  Filter,
  FileText,
  Edit,
  Trash2,
  CalendarDays,
  Info,
  Plus,
  MoreVertical
} from 'lucide-react'
import dayjs from 'dayjs'

// 引入 clsx 與 tailwind-merge
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// --- 建立 cn 工具函式 ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- 定義 TypeScript 型別 ---
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

// --- 擬真數據產生器 ---
const generateProgressData = (count: number): WorkOrderProgressType[] => {
  const products = [
    {
      name: '高階伺服器主機板',
      code: 'MB-SVR-X99',
      defaultSteps: ['SMT 表面接合', 'DIP 插件', 'PCBA 測試', '包裝入庫']
    },
    {
      name: '工控主機外殼',
      code: 'CHAS-IND-01',
      defaultSteps: ['CNC 切削', '表面拋光', '陽極處理', '品檢入庫']
    },
    {
      name: 'AI 運算加速卡',
      code: 'GPU-AI-A100',
      defaultSteps: [
        'SMT 表面接合',
        '晶片打線',
        '散熱模組組裝',
        '燒機測試',
        '出貨包裝'
      ]
    }
  ]
  const priorities: PriorityType[] = ['特急', '急單', '一般', '一般']
  const statuses: StatusType[] = [
    '進行中',
    '進行中',
    '進行中',
    '異常延遲',
    '已完成'
  ]

  return Array.from({ length: count }).map((_, idx) => {
    const product = products[Math.floor(Math.random() * products.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const targetQty = Math.floor(Math.random() * 1000) + 200
    const startDateStr = `2026-04-${String(Math.max(1, 14 - Math.floor(Math.random() * 5))).padStart(2, '0')} 08:00`

    let totalCompleted = 0
    let totalDefect = 0
    let currentStepName = ''

    let prevStepStatus: StepStatusType = 'finish'
    let currentTimeline = dayjs(startDateStr).valueOf()

    const routings: RoutingStep[] = product.defaultSteps.map(
      (stepName, stepIdx) => {
        let stepStatus: StepStatusType = 'wait'
        let completed = 0
        let wip = 0
        let defect = 0

        if (status === '已完成') {
          stepStatus = 'finish'
          completed = targetQty
        } else {
          const rand = Math.random()
          if (stepIdx === 0 || rand > 0.6) {
            stepStatus = 'finish'
            completed = targetQty - Math.floor(Math.random() * 5)
            defect = targetQty - completed
          } else if (rand > 0.2) {
            stepStatus =
              status === '異常延遲' && rand > 0.4 ? 'error' : 'process'
            completed = Math.floor(targetQty * 0.4)
            wip = Math.floor(targetQty * 0.3)
            defect = Math.floor(Math.random() * 10)
            currentStepName = stepName
          } else {
            stepStatus = 'wait'
          }
        }

        if (
          stepIdx > 0 &&
          prevStepStatus !== 'finish' &&
          prevStepStatus !== 'process'
        ) {
          stepStatus = 'wait'
          completed = 0
          wip = 0
          defect = 0
        }

        prevStepStatus = stepStatus
        totalDefect += defect

        // 模擬工序耗時 (小時)
        const durationHours = Math.floor(Math.random() * 24) + 6 // 拉長一點視覺效果更好
        const stepStartTime = currentTimeline
        const stepEndTime = currentTimeline + durationHours * 60 * 60 * 1000

        // 下一站點加上間隔時間
        currentTimeline =
          stepEndTime + Math.floor(Math.random() * 12) * 60 * 60 * 1000

        return {
          id: `STP-${idx}-${stepIdx}`,
          stepName,
          status: stepStatus,
          targetQty,
          completedQty: completed,
          wipQty: wip,
          defectQty: defect,
          machine: `EQ-${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`,
          startTime: stepStartTime,
          endTime: stepEndTime
        }
      }
    )

    const lastFinishStep = [...routings]
      .reverse()
      .find(r => r.status === 'finish')
    if (lastFinishStep) totalCompleted = lastFinishStep.completedQty
    if (!currentStepName)
      currentStepName = lastFinishStep ? '即將入庫' : product.defaultSteps[0]
    if (status === '已完成') currentStepName = '已完工入庫'

    const yieldRate =
      targetQty > 0
        ? Number((((targetQty - totalDefect) / targetQty) * 100).toFixed(1))
        : 100

    return {
      key: String(idx + 1),
      woId: `WO-202604${(idx + 1).toString().padStart(4, '0')}`,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      productName: product.name,
      productCode: product.code,
      targetQty,
      totalCompletedQty: totalCompleted,
      yieldRate: Math.min(100, Math.max(0, yieldRate)),
      status,
      startDate: startDateStr,
      currentStepName,
      routings
    }
  })
}

export default function WorkOrderProgress() {
  const [loading, setLoading] = useState<boolean>(true)
  const [searchText, setSearchText] = useState<string>('')

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const mockData = useMemo(() => generateProgressData(200), [])

  const filteredData = useMemo(() => {
    if (!searchText) return mockData
    const lower = searchText.toLowerCase()
    return mockData.filter(
      d =>
        d.woId.toLowerCase().includes(lower) ||
        d.productName.toLowerCase().includes(lower) ||
        d.productCode.toLowerCase().includes(lower)
    )
  }, [mockData, searchText])

  const stats = useMemo(() => {
    const totalYields = mockData.reduce((acc, curr) => acc + curr.yieldRate, 0)
    return {
      avgYield: (totalYields / mockData.length).toFixed(1),
      processing: mockData.filter(d => d.status === '進行中').length,
      errors: mockData.filter(d => d.routings.some(r => r.status === 'error'))
        .length
    }
  }, [mockData])

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

  // --- Ant Design Table 欄位定義 ---
  const columns: ColumnsType<WorkOrderProgressType> = [
    {
      title: '工單號碼',
      dataIndex: 'woId',
      key: 'woId',
      width: 180,
      fixed: 'left',
      sorter: (a, b) => a.woId.localeCompare(b.woId),
      render: (text: string, record: WorkOrderProgressType) => (
        <div className='flex flex-col'>
          <div className='flex items-center gap-2'>
            <span className='font-semibold text-blue-600 hover:text-blue-800 cursor-pointer'>
              {text}
            </span>
          </div>
          <div className='flex gap-1 mt-1'>
            {record.priority === '特急' && (
              <Tag
                color='error'
                className='m-0 border-0 text-[10px] font-bold px-1 pb-0.5 leading-none'
              >
                特急
              </Tag>
            )}
            {record.priority === '急單' && (
              <Tag
                color='warning'
                className='m-0 border-0 text-[10px] px-1 pb-0.5 leading-none'
              >
                急單
              </Tag>
            )}
          </div>
        </div>
      )
    },
    {
      title: '生產產品',
      dataIndex: 'productName',
      key: 'productName',
      width: 200,
      render: (text: string, record: WorkOrderProgressType) => (
        <div className='flex flex-col'>
          <span className='text-slate-700 font-medium text-sm'>{text}</span>
          <span className='text-[11px] text-slate-400 font-mono mt-0.5'>
            {record.productCode}
          </span>
        </div>
      )
    },
    {
      title: '當前所在工序',
      key: 'currentStep',
      width: 160,
      render: (_, record: WorkOrderProgressType) => {
        const isError = record.routings.some(r => r.status === 'error')
        return (
          <div className='flex items-center gap-2'>
            <Badge
              status={
                isError
                  ? 'error'
                  : record.status === '已完成'
                    ? 'success'
                    : 'processing'
              }
            />
            <span
              className={cn(
                'text-xs font-bold px-2 py-1 rounded-md border',
                isError
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : record.status === '已完成'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
              )}
            >
              {record.currentStepName}
            </span>
          </div>
        )
      }
    },
    {
      title: '整體進度 (總產出)',
      key: 'overallProgress',
      width: 220,
      sorter: (a, b) =>
        a.totalCompletedQty / a.targetQty - b.totalCompletedQty / b.targetQty,
      render: (_, record: WorkOrderProgressType) => {
        const percent = Math.floor(
          (record.totalCompletedQty / record.targetQty) * 100
        )
        return (
          <div className='flex flex-col gap-1 w-full pr-4'>
            <div className='flex justify-between text-[11px] mb-0.5'>
              <span className='text-slate-400'>
                已產:{' '}
                <strong className='text-slate-600'>
                  {record.totalCompletedQty}
                </strong>{' '}
                / {record.targetQty}
              </span>
              <span className='font-bold text-slate-700'>{percent}%</span>
            </div>
            <Progress
              percent={percent}
              showInfo={false}
              size='small'
              strokeColor={percent === 100 ? '#10b981' : '#3b82f6'}
              className='m-0'
            />
          </div>
        )
      }
    },
    {
      title: '直通良率 (FPY)',
      key: 'yieldRate',
      width: 140,
      sorter: (a, b) => a.yieldRate - b.yieldRate,
      render: (_, record: WorkOrderProgressType) => {
        let color = 'text-emerald-600 bg-emerald-50 border-emerald-200'
        if (record.yieldRate < 95)
          color = 'text-rose-600 bg-rose-50 border-rose-200'
        else if (record.yieldRate < 98)
          color = 'text-amber-600 bg-amber-50 border-amber-200'

        return (
          <Tooltip title='目標良率: 98%'>
            <div
              className={cn(
                'inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded border',
                color
              )}
            >
              <ShieldCheck size={12} />
              {record.yieldRate}%
            </div>
          </Tooltip>
        )
      }
    },
    {
      title: '開工日',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (text: string) => (
        <span className='text-slate-600 text-xs font-medium'>
          {text.split(' ')[0]}
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
              {
                key: 'details',
                label: '工單詳情',
                icon: <FileText size={14} className='text-blue-500' />
              },
              {
                key: 'edit',
                label: '修改參數',
                icon: <Edit size={14} className='text-slate-500' />
              },
              {
                key: 'schedule',
                label: '優先級調整',
                icon: <CalendarDays size={14} className='text-indigo-500' />
              },
              { key: 'divider', type: 'divider' },
              {
                key: 'delete',
                label: '暫停 / 取消',
                danger: true,
                icon: <Trash2 size={14} />
              }
            ]
          }}
          trigger={['click']}
          placement='bottomRight'
        >
          <Button
            type='text'
            size='small'
            icon={<MoreVertical size={18} />}
            className='text-slate-400 hover:bg-slate-100 flex items-center justify-center'
          />
        </Dropdown>
      )
    }
  ]

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#3b82f6',
          borderRadius: 8,
          fontFamily: 'Inter, "Noto Sans TC", sans-serif'
        }
      }}
    >
      <div className='w-full h-full bg-[#f8fafc] font-sans pb-16'>
        <div className='mx-auto px-4 sm:px-6 pt-4 space-y-4 relative animate-fade-in'>
          {loading && (
            <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-[110] flex items-center justify-center rounded-2xl'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin' />
                <span className='text-xs font-black text-blue-600 tracking-widest uppercase'>
                  Loading Routings...
                </span>
              </div>
            </div>
          )}

          {/* 上方區塊完美懸浮與防穿透遮罩 */}
          <div className='sticky top-0 z-40 -mt-4 pt-4 pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 bg-[#f8fafc]/95 backdrop-blur-md'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/90 shadow-sm border border-slate-200/80 px-5 py-3 rounded-2xl transition-all'>
              <div className='flex flex-wrap items-center gap-3'>
                <Tooltip title='生產進度：追蹤各工單在不同工序站點的即時狀況'>
                  <div className='bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-2 rounded-xl shadow-sm shadow-indigo-200 flex items-center justify-center'>
                    <Activity size={20} />
                  </div>
                </Tooltip>

                <Popover
                  content={statsContent}
                  trigger='click'
                  placement='bottomLeft'
                  rootClassName='custom-stats-popover'
                >
                  <div className='flex items-center gap-2 bg-white border border-slate-200 shadow-sm px-2.5 py-1.5 rounded-full cursor-pointer hover:border-indigo-300 hover:shadow transition-all group'>
                    <TrendingUp size={14} className='text-indigo-600' />
                    <span className='text-xs font-bold text-slate-600 group-hover:text-indigo-600'>
                      製程 KPI
                    </span>
                    <div className='h-3 w-[1px] bg-slate-200 mx-0.5'></div>
                    <span className='text-[11px] font-bold text-rose-600 flex items-center gap-1.5'>
                      <span className='relative flex h-1.5 w-1.5'>
                        <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75'></span>
                        <span className='relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500'></span>
                      </span>
                      {stats.errors} 站點異常
                    </span>
                    <ChevronDown
                      size={14}
                      className='text-slate-400 group-hover:text-indigo-500 ml-0.5 transition-colors'
                    />
                  </div>
                </Popover>
              </div>

              <div className='flex items-center gap-3'>
                <Button
                  icon={<Download size={16} />}
                  className='font-medium h-9 border-slate-300 text-slate-600 rounded-xl flex items-center justify-center'
                >
                  <span className='hidden lg:inline ml-1 text-xs'>
                    匯出進度
                  </span>
                </Button>
                <Button
                  type='primary'
                  icon={<Plus size={16} />}
                  className='bg-blue-600 shadow-sm shadow-blue-200 font-bold h-9 rounded-xl border-none flex items-center justify-center'
                >
                  <span className='hidden sm:inline ml-1 text-xs'>
                    新增工單
                  </span>
                </Button>
              </div>
            </div>
          </div>

          {/* 核心內容區 */}
          <Card
            className='shadow-sm border-slate-200 rounded-2xl overflow-hidden relative z-10'
            styles={{ body: { padding: 0 } }}
          >
            <div className='p-4 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4'>
              <div className='flex flex-wrap items-center gap-3 flex-1'>
                <Input
                  placeholder='搜尋工單 / 品號'
                  prefix={<Search size={16} className='text-slate-400' />}
                  className='w-full sm:w-64 rounded-xl border-slate-200 h-9'
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  allowClear
                />
                <div className='text-slate-400 text-[11px] hidden md:flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100'>
                  <Info size={14} className='text-indigo-400' />
                  <span>
                    提示：點擊列表左側的{' '}
                    <b className='font-mono text-slate-500'>+</b>{' '}
                    展開查看完整工序的甘特圖 (Gantt Chart) 與良率細節
                  </span>
                </div>
              </div>
              <Button
                icon={<Filter size={16} />}
                type='text'
                className='text-slate-500 hover:bg-slate-100 h-9 font-medium text-xs'
              >
                進階篩選
              </Button>
            </div>

            <div className='overflow-x-auto pt-1'>
              <Table<WorkOrderProgressType>
                columns={columns}
                dataSource={filteredData}
                loading={loading}
                expandable={{
                  expandedRowRender,
                  expandRowByClick: true,
                  columnWidth: 48
                }}
                scroll={{ x: 1000 }}
                pagination={{
                  defaultPageSize: 20,
                  showSizeChanger: true,
                  pageSizeOptions: ['20', '50', '100'],
                  showTotal: total => `共計 ${total} 筆`,
                  className: 'px-4 py-3 border-t border-slate-100 m-0'
                }}
                className='progress-manage-table'
              />
            </div>
          </Card>

          <style>{`
            .progress-manage-table .ant-table-thead > tr > th {
              background: #f8fafc !important;
              color: #64748b !important;
              font-weight: 700 !important;
              border-bottom: 1px solid #f1f5f9 !important;
              white-space: nowrap;
            }
            .progress-manage-table .ant-table-tbody > tr:hover > td {
              background: #f8fafc !important;
              cursor: pointer;
            }
            .progress-manage-table .ant-table-expanded-row > td,
            .progress-manage-table .ant-table-expanded-row:hover > td {
              background: #f8fafc !important;
              padding: 0 !important;
            }
            .custom-stats-popover .ant-popover-inner {
              border-radius: 16px !important;
              padding: 16px !important;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
              border: 1px solid #e0e7ff;
            }
            .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
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
