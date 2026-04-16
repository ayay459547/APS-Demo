import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  ConfigProvider,
  Card,
  Popover,
  Badge,
  Tooltip,
  Button,
  Modal,
  Table,
  Tag,
  Input,
  Progress,
  Steps,
  Divider,
  message
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { InputRef } from 'antd'
import {
  Search,
  ChevronDown,
  RefreshCw,
  Info,
  Factory,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Target,
  TrendingUp,
  Package,
  Layers,
  Crosshair,
  BarChart3,
  Timer,
  PieChart
} from 'lucide-react'
import dayjs from 'dayjs'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import * as echarts from 'echarts'

/**
 * 樣式合併工具函數 (Project Standard)
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- TypeScript 型別定義 ---
export type WOStatus = '待生產' | '生產中' | '進度落後' | '已完工'
export type RoutingStageStatus = 'wait' | 'process' | 'finish'

export interface RoutingStage {
  title: string
  workCenter: string
  status: RoutingStageStatus
  completedQty: number
}

export interface WorkOrderProgress {
  id: string
  woId: string
  partNumber: string
  productName: string
  customer: string
  targetQty: number
  goodQty: number
  scrapQty: number
  status: WOStatus
  dueDate: string
  priority: '一般' | '急件' | '特急'
  currentStage: string
  routingSteps: RoutingStage[]
  lastUpdated: string
}

// --- 擬真數據產生器 ---
const generateWorkOrders = (count: number): WorkOrderProgress[] => {
  const customers = [
    'Apple Inc.',
    'Tesla',
    'NVIDIA',
    'ASUS',
    'Advantech',
    'Garmin'
  ]
  const products = [
    '高階伺服器主機板',
    '工控運算核心模組',
    '車載資訊娛樂主機',
    '醫療影像辨識板'
  ]

  return Array.from({ length: count }).map((_, idx) => {
    const rand = Math.random()
    let status: WOStatus = '生產中'
    if (rand < 0.15) status = '待生產'
    else if (rand < 0.35) status = '進度落後'
    else if (rand < 0.5) status = '已完工'

    const targetQty = Math.floor(Math.random() * 4500) + 500
    let goodQty = 0
    let scrapQty = 0
    let currentStage = '未開工'
    let priority: '一般' | '急件' | '特急' = '一般'

    if (Math.random() > 0.8) priority = '急件'
    if (status === '進度落後') priority = '特急'

    const steps: RoutingStage[] = [
      {
        title: 'SMT 表面黏著',
        workCenter: 'SMT-LINE-01',
        status: 'wait',
        completedQty: 0
      },
      {
        title: 'DIP 插件波焊',
        workCenter: 'DIP-LINE-02',
        status: 'wait',
        completedQty: 0
      },
      {
        title: '組裝與測試',
        workCenter: 'ASSY-TEST-01',
        status: 'wait',
        completedQty: 0
      },
      {
        title: '包裝入庫',
        workCenter: 'PKG-01',
        status: 'wait',
        completedQty: 0
      }
    ]

    if (status === '已完工') {
      goodQty = targetQty - Math.floor(Math.random() * 20)
      scrapQty = targetQty - goodQty
      currentStage = '全線完工'
      steps.forEach(s => {
        s.status = 'finish'
        s.completedQty = targetQty
      })
    } else if (status === '待生產') {
      goodQty = 0
      scrapQty = 0
      currentStage = '備料中'
    } else {
      const progressRatio =
        status === '進度落後'
          ? Math.random() * 0.4 + 0.1
          : Math.random() * 0.8 + 0.1
      goodQty = Math.floor(targetQty * progressRatio)
      scrapQty = Math.floor(goodQty * (Math.random() * 0.05))

      let currentStepIdx = 0
      if (progressRatio > 0.75) currentStepIdx = 2
      else if (progressRatio > 0.4) currentStepIdx = 1

      steps.forEach((s, i) => {
        if (i < currentStepIdx) {
          s.status = 'finish'
          s.completedQty = goodQty + Math.floor(Math.random() * 50)
        } else if (i === currentStepIdx) {
          s.status = 'process'
          s.completedQty = goodQty
          currentStage = s.title
        } else {
          s.status = 'wait'
          s.completedQty = 0
        }
      })
    }

    const delayDays =
      status === '進度落後' ? Math.floor(Math.random() * 5) + 1 : 0
    const dueDate = dayjs()
      .add(Math.floor(Math.random() * 14) - delayDays, 'day')
      .format('YYYY-MM-DD')

    return {
      id: `WO-${dayjs().format('YYYYMM')}-${String(idx + 1).padStart(4, '0')}`,
      woId: `WO-26X${String(Math.floor(Math.random() * 90000) + 10000)}`,
      partNumber: `PN-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      productName: products[Math.floor(Math.random() * products.length)],
      customer: customers[Math.floor(Math.random() * customers.length)],
      targetQty,
      goodQty,
      scrapQty,
      status,
      dueDate,
      priority,
      currentStage,
      routingSteps: steps,
      lastUpdated: dayjs()
        .subtract(Math.floor(Math.random() * 120), 'minute')
        .format('YYYY-MM-DD HH:mm')
    }
  })
}

const mockWoData: WorkOrderProgress[] = generateWorkOrders(48)

// --- ECharts 封裝組件 ---
const ReactECharts = ({
  option,
  style
}: {
  option: any
  style?: React.CSSProperties
}) => {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chartRef.current) {
      const chart = echarts.init(chartRef.current)
      chart.setOption(option)

      const handleResize = () => chart.resize()
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        chart.dispose()
      }
    }
  }, [option])

  return (
    <div ref={chartRef} style={{ width: '100%', height: '100%', ...style }} />
  )
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
      'bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md cursor-default min-w-[160px]',
      isAlert && 'ring-1 ring-rose-100 bg-rose-50/30 border-transparent'
    )}
  >
    <div>
      <p className='text-slate-500 text-[11px] font-bold tracking-wide mb-0.5'>
        {title}
      </p>
      <div className='flex items-baseline gap-1'>
        <span
          className={cn(
            'text-xl font-black tracking-tight',
            isAlert ? 'text-rose-600' : 'text-slate-800'
          )}
        >
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
    <div className={cn('p-2 rounded-lg', bgClass)}>
      <Icon size={18} className={iconColorClass} />
    </div>
  </div>
)

// --- 主元件 ---
export default function WorkOrderProgressView() {
  const [loading, setLoading] = useState<boolean>(true)
  const [woList] = useState<WorkOrderProgress[]>(mockWoData)

  // 剖析 Modal 狀態
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [activeWO, setActiveWO] = useState<WorkOrderProgress | null>(null)

  // 總覽圖表 Modal 狀態
  const [isChartModalVisible, setIsChartModalVisible] = useState(false)

  const searchInputRef = useRef<InputRef>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(() => {
    const total = woList.length
    const active = woList.filter(
      d => d.status === '生產中' || d.status === '進度落後'
    ).length
    const completed = woList.filter(d => d.status === '已完工').length
    const delayed = woList.filter(d => d.status === '進度落後').length

    const totalTarget = woList.reduce((sum, w) => sum + w.targetQty, 0)
    const totalGood = woList.reduce((sum, w) => sum + w.goodQty, 0)
    const totalProgress =
      totalTarget > 0 ? ((totalGood / totalTarget) * 100).toFixed(1) : '0'

    return { total, active, completed, delayed, totalProgress }
  }, [woList])

  // ECharts 圖表設定
  const statusChartOption = useMemo(() => {
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: '0%', left: 'center', icon: 'circle', itemGap: 20 },
      series: [
        {
          name: '工單狀態',
          type: 'pie',
          radius: ['45%', '75%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: 20, fontWeight: 'bold' }
          },
          labelLine: { show: false },
          data: [
            {
              value: stats.completed,
              name: '已完工',
              itemStyle: { color: '#10b981' }
            }, // Emerald 500
            {
              value: woList.filter(d => d.status === '生產中').length,
              name: '生產中',
              itemStyle: { color: '#3b82f6' }
            }, // Blue 500
            {
              value: stats.delayed,
              name: '進度落後',
              itemStyle: { color: '#f43f5e' }
            }, // Rose 500
            {
              value: woList.filter(d => d.status === '待生產').length,
              name: '待生產',
              itemStyle: { color: '#cbd5e1' }
            } // Slate 300
          ]
        }
      ]
    }
  }, [stats, woList])

  const customerChartOption = useMemo(() => {
    const map: Record<string, { total: number; good: number }> = {}
    woList.forEach(wo => {
      if (!map[wo.customer]) map[wo.customer] = { total: 0, good: 0 }
      map[wo.customer].total += wo.targetQty
      map[wo.customer].good += wo.goodQty
    })

    const chartData = Object.keys(map)
      .map(k => ({
        customer: k,
        percent:
          map[k].total === 0
            ? 0
            : Math.round((map[k].good / map[k].total) * 100)
      }))
      .sort((a, b) => a.percent - b.percent) // 升序排列以適應橫向長條圖

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
      yAxis: { type: 'category', data: chartData.map(d => d.customer) },
      series: [
        {
          name: '整體達成率',
          type: 'bar',
          data: chartData.map(d => ({
            value: d.percent,
            itemStyle: {
              color:
                d.percent < 50
                  ? '#f43f5e'
                  : d.percent === 100
                    ? '#10b981'
                    : '#6366f1',
              borderRadius: [0, 4, 4, 0]
            }
          })),
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
            fontWeight: 'bold',
            color: '#64748b'
          },
          barWidth: '50%'
        }
      ]
    }
  }, [woList])

  // --- 操作處理函式 ---
  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success({
        content: '工單進度已同步至最新狀態！',
        className: 'custom-message'
      })
    }, 600)
  }

  const openDetailModal = (wo: WorkOrderProgress) => {
    setActiveWO(wo)
    setIsDetailModalVisible(true)
  }

  // --- 搜尋過濾邏輯 ---
  const getSearchProps = (
    dataIndex: keyof WorkOrderProgress,
    title: string
  ) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters
    }: any) => (
      <div
        className='p-3 w-64 shadow-2xl border border-slate-100 rounded-2xl bg-white'
        onKeyDown={e => e.stopPropagation()}
      >
        <Input
          ref={searchInputRef}
          placeholder={`搜尋 ${title}...`}
          value={selectedKeys[0]}
          onChange={e =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => confirm()}
          className='!mb-3 rounded-lg h-9 border-slate-200'
          prefix={<Search size={14} className='text-slate-400' />}
        />
        <div className='flex justify-between'>
          <Button
            type='text'
            size='small'
            onClick={() => {
              clearFilters?.()
              confirm()
            }}
            className='text-[10px] font-bold text-slate-400'
          >
            重置
          </Button>
          <Button
            type='primary'
            size='small'
            onClick={() => confirm()}
            className='text-[10px] font-bold px-4 text-white border-none bg-indigo-600 rounded-lg'
          >
            篩選
          </Button>
        </div>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <Search
        size={14}
        className={filtered ? 'text-indigo-500' : 'text-slate-300'}
      />
    ),
    onFilter: (value: any, record: WorkOrderProgress): boolean => {
      const targetValue = record[dataIndex]
      if (targetValue === null || targetValue === undefined) return false
      return targetValue
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase())
    }
  })

  // --- Popover KPI 內容 ---
  const statsContent = (
    <div className='w-full max-w-[480px] py-1'>
      <div className='flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5'>
        <Target size={16} className='text-indigo-600' />
        <span className='font-bold text-slate-800'>全廠工單達成目標概覽</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='總體產出達成率'
          value={stats.totalProgress}
          unit='%'
          icon={TrendingUp}
          colorClass='text-indigo-600'
          bgClass='bg-indigo-50'
          iconColorClass='text-indigo-500'
          trend='基於所有派工數量'
        />
        <StatCard
          title='活躍生產中'
          value={stats.active}
          unit='張'
          icon={Activity}
          colorClass='text-blue-600'
          bgClass='bg-blue-50'
          iconColorClass='text-blue-500'
        />
        <StatCard
          title='進度落後預警'
          value={stats.delayed}
          unit='張'
          icon={AlertTriangle}
          colorClass='text-rose-600'
          bgClass='bg-rose-100/80'
          iconColorClass='text-rose-500'
          isAlert={stats.delayed > 0}
          trend='需重點跟催'
        />
        <StatCard
          title='本期已完工'
          value={stats.completed}
          unit='張'
          icon={CheckCircle2}
          colorClass='text-emerald-600'
          bgClass='bg-emerald-50'
          iconColorClass='text-emerald-500'
        />
      </div>
    </div>
  )

  // --- 表格欄位定義 (List View) ---
  const columns: ColumnsType<WorkOrderProgress> = [
    {
      title: '工單號碼 / 產品',
      key: 'woInfo',
      width: 260,
      fixed: 'left',
      ...getSearchProps('woId', '工單號'),
      render: (_, record) => (
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <span
              className='font-mono font-black text-indigo-700 text-[14px] cursor-pointer hover:underline'
              onClick={() => openDetailModal(record)}
            >
              {record.woId}
            </span>
            {record.priority === '特急' && (
              <Tag
                color='error'
                className='m-0 text-[10px] font-black border-none px-1 py-0'
              >
                特急件
              </Tag>
            )}
            {record.priority === '急件' && (
              <Tag
                color='warning'
                className='m-0 text-[10px] font-black border-none px-1 py-0'
              >
                急件
              </Tag>
            )}
          </div>
          <div className='flex flex-col'>
            <span
              className='text-[11px] font-bold text-slate-700 truncate max-w-[200px]'
              title={record.productName}
            >
              {record.productName}
            </span>
            <span className='text-[10px] text-slate-400 font-mono'>
              {record.partNumber}
            </span>
          </div>
        </div>
      )
    },
    {
      title: '客戶',
      dataIndex: 'customer',
      key: 'customer',
      width: 140,
      filters: [
        { text: 'Apple Inc.', value: 'Apple Inc.' },
        { text: 'Tesla', value: 'Tesla' },
        { text: 'NVIDIA', value: 'NVIDIA' }
      ],
      onFilter: (value, record) => record.customer === value,
      render: text => (
        <span className='font-bold text-slate-600 text-xs'>{text}</span>
      )
    },
    {
      title: '工單狀態',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      sorter: (a, b) => a.status.localeCompare(b.status),
      filters: [
        { text: '待生產', value: '待生產' },
        { text: '生產中', value: '生產中' },
        { text: '進度落後', value: '進度落後' },
        { text: '已完工', value: '已完工' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: WOStatus) => {
        let colorClass = ''
        let bgClass = ''
        switch (status) {
          case '生產中':
            colorClass = 'text-blue-600'
            bgClass = 'bg-blue-50 border-blue-200'
            break
          case '待生產':
            colorClass = 'text-slate-500'
            bgClass = 'bg-slate-100 border-slate-200'
            break
          case '進度落後':
            colorClass = 'text-rose-600'
            bgClass =
              'bg-rose-50 border-rose-200 shadow-sm shadow-rose-100 animate-pulse'
            break
          case '已完工':
            colorClass = 'text-emerald-600'
            bgClass = 'bg-emerald-50 border-emerald-200'
            break
        }
        return (
          <div
            className={cn(
              'inline-flex items-center justify-center px-2 py-1 rounded-md text-[11px] font-bold border w-fit',
              bgClass,
              colorClass
            )}
          >
            {status}
          </div>
        )
      }
    },
    {
      title: '當前站點',
      dataIndex: 'currentStage',
      key: 'currentStage',
      width: 140,
      render: (text, record) => (
        <span
          className={cn(
            'text-xs font-bold flex items-center gap-1.5',
            record.status === '已完工' ? 'text-emerald-600' : 'text-slate-600'
          )}
        >
          {record.status === '已完工' ? (
            <CheckCircle2 size={14} />
          ) : (
            <Layers size={14} className='text-slate-400' />
          )}
          {text}
        </span>
      )
    },
    {
      title: '產出進度 (良品 / 目標)',
      key: 'progress',
      width: 240,
      render: (_, record) => {
        const percent =
          record.targetQty === 0
            ? 0
            : Math.round((record.goodQty / record.targetQty) * 100)
        const isDelayed = record.status === '進度落後'
        return (
          <div className='w-full pr-4'>
            <div className='flex justify-between text-[10px] font-black mb-1'>
              <span
                className={cn(isDelayed ? 'text-rose-600' : 'text-indigo-600')}
              >
                {record.goodQty.toLocaleString()}{' '}
                <span className='font-normal text-slate-400'>
                  / {record.targetQty.toLocaleString()}
                </span>
              </span>
              <span
                className={cn(isDelayed ? 'text-rose-500' : 'text-slate-500')}
              >
                {percent}%
              </span>
            </div>
            <Progress
              percent={percent}
              size='small'
              showInfo={false}
              strokeColor={
                isDelayed ? '#f43f5e' : percent === 100 ? '#10b981' : '#4f46e5'
              }
              status={
                isDelayed ? 'exception' : percent === 100 ? 'success' : 'normal'
              }
            />
          </div>
        )
      }
    },
    {
      title: '預計交期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      sorter: (a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf(),
      render: (text, record) => {
        const isOverdue = record.status === '進度落後'
        return (
          <span
            className={cn(
              'font-mono text-xs font-bold px-2 py-1 rounded w-fit inline-block',
              isOverdue ? 'bg-rose-100 text-rose-700' : 'text-slate-600'
            )}
          >
            {text}
          </span>
        )
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Tooltip title='查看進度剖析'>
          <Button
            type='text'
            size='small'
            className='text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 rounded-md flex items-center justify-center w-8 h-8 p-0 mx-auto'
            onClick={() => openDetailModal(record)}
          >
            <BarChart3 size={16} />
          </Button>
        </Tooltip>
      )
    }
  ]

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#4f46e5', borderRadius: 12, borderRadiusSM: 6 } // Indigo 600 base
      }}
    >
      <div className='w-full min-h-screen bg-[#f8fafc] p-4 font-sans'>
        <div className='mx-auto px-2 pt-2 pb-8 space-y-6 animate-fade-in relative max-w-[1600px]'>
          {loading && (
            <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-[110] flex items-center justify-center rounded-[28px] mt-[60px]'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin' />
                <span className='text-xs font-black text-indigo-600 tracking-widest uppercase'>
                  Loading Progress Data...
                </span>
              </div>
            </div>
          )}

          {/* 玻璃透視頂部導航列 */}
          <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/50 py-2 rounded-xl sticky top-0 z-20 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='bg-indigo-600 p-1.5 rounded-lg shadow-indigo-200 shadow-lg'>
                <Target size={18} className='text-white' />
              </div>
              <div className='flex items-center'>
                <Popover
                  content={statsContent}
                  trigger='click'
                  placement='bottomLeft'
                  rootClassName='custom-stats-popover'
                >
                  <div className='flex items-center gap-2 cursor-pointer hover:bg-white px-2 sm:px-3 py-1.5 rounded-full transition-all group border border-transparent hover:border-slate-100'>
                    <span className='text-sm font-bold text-slate-600 group-hover:text-indigo-600 whitespace-nowrap'>
                      工單達成進度
                    </span>
                    <div className='flex gap-1'>
                      <Badge
                        count={stats.active}
                        style={{
                          backgroundColor: '#3b82f6',
                          fontSize: '10px',
                          boxShadow: 'none'
                        }}
                      />
                      {stats.delayed > 0 && (
                        <Badge
                          count={`${stats.delayed} 延誤`}
                          style={{
                            backgroundColor: '#f43f5e',
                            fontSize: '10px',
                            boxShadow: 'none'
                          }}
                        />
                      )}
                    </div>
                    <ChevronDown
                      size={14}
                      className='text-slate-400 group-hover:text-indigo-600'
                    />
                  </div>
                </Popover>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Tooltip title='進度總覽圖表'>
                <Button
                  type='text'
                  icon={<PieChart size={16} />}
                  className='text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl h-10 w-10 flex items-center justify-center transition-colors'
                  onClick={() => setIsChartModalVisible(true)}
                />
              </Tooltip>
              <Tooltip title='重新獲取 ERP/MES 最新進度'>
                <Button
                  type='text'
                  icon={
                    <RefreshCw
                      size={16}
                      className={loading ? 'animate-spin' : ''}
                    />
                  }
                  className='text-slate-400 hover:bg-slate-100 rounded-xl h-10 w-10 flex items-center justify-center'
                  onClick={handleRefresh}
                />
              </Tooltip>
            </div>
          </div>

          <Card
            className='shadow-xl shadow-slate-200/50 border-none rounded-[32px] overflow-hidden bg-transparent'
            styles={{ body: { padding: 0 } }}
          >
            <div className='bg-white/80 p-5 border-b border-slate-100 flex items-center justify-between rounded-t-[32px]'>
              <div className='flex items-center gap-3 text-slate-500 text-[11px] font-black uppercase tracking-widest'>
                <Package size={14} />
                全廠生產工單庫 (Work Order Tracking)
              </div>
              <div className='flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm'>
                <Info size={14} className='text-indigo-500' />
                <span className='text-[10px] text-slate-400 font-bold uppercase tracking-tight'>
                  提示：點擊工單號碼或檢視按鈕，可開啟單筆工單的「生產履歷與工序剖析」。
                </span>
              </div>
            </div>

            <div className='bg-white/50 backdrop-blur-md pb-4 pt-4 px-4'>
              <Table<WorkOrderProgress>
                columns={columns}
                dataSource={woList}
                loading={false}
                scroll={{ x: 1200 }}
                rowKey='id'
                pagination={{
                  pageSize: 15,
                  showSizeChanger: true,
                  pageSizeOptions: ['15', '30', '50'],
                  className: 'mt-4 !px-4 pb-2'
                }}
                className='aps-monitor-table'
              />
            </div>
          </Card>

          {/* --- 進度總覽圖表 Modal (ECharts) --- */}
          <Modal
            title={null}
            open={isChartModalVisible}
            onCancel={() => setIsChartModalVisible(false)}
            footer={null}
            className='custom-hmi-modal'
            width={900}
          >
            <div className='flex flex-col h-[600px]'>
              <div className='flex items-center gap-3 text-slate-800 border-b border-slate-100 pb-4 mb-6'>
                <div className='bg-indigo-600 p-2.5 rounded-xl shadow-md shadow-indigo-200'>
                  <PieChart size={24} className='text-white' />
                </div>
                <div className='flex flex-col'>
                  <span className='font-black text-2xl tracking-tight'>
                    工單進度總覽面板 (Overview Dashboard)
                  </span>
                  <span className='text-xs font-bold text-slate-500'>
                    視覺化全廠生產狀態與客戶達成率
                  </span>
                </div>
              </div>

              <div className='flex-1 grid grid-cols-5 gap-6'>
                {/* 左側：工單狀態環形圖 */}
                <div className='col-span-2 bg-slate-50 rounded-2xl border border-slate-100 p-4 flex flex-col'>
                  <h4 className='text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5'>
                    <Activity size={16} className='text-indigo-500' />{' '}
                    工單狀態分佈
                  </h4>
                  <div className='flex-1 relative w-full min-h-[300px]'>
                    <ReactECharts option={statusChartOption} />
                  </div>
                </div>

                {/* 右側：客戶別達成率長條圖 */}
                <div className='col-span-3 bg-slate-50 rounded-2xl border border-slate-100 p-4 flex flex-col'>
                  <h4 className='text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5'>
                    <TrendingUp size={16} className='text-indigo-500' />{' '}
                    客戶別達成率排行
                  </h4>
                  <div className='flex-1 relative w-full min-h-[300px]'>
                    <ReactECharts option={customerChartOption} />
                  </div>
                </div>
              </div>
            </div>
          </Modal>

          {/* --- 工單進度剖析 Modal (Deep-dive) --- */}
          <Modal
            title={null}
            open={isDetailModalVisible}
            onCancel={() => setIsDetailModalVisible(false)}
            footer={null}
            className='custom-hmi-modal'
            width={850}
          >
            {activeWO &&
              (() => {
                const isDelayed = activeWO.status === '進度落後'
                const isDone = activeWO.status === '已完工'
                const percent =
                  activeWO.targetQty === 0
                    ? 0
                    : Math.round((activeWO.goodQty / activeWO.targetQty) * 100)
                const scrapRate =
                  activeWO.goodQty + activeWO.scrapQty === 0
                    ? 0
                    : (
                        (activeWO.scrapQty /
                          (activeWO.goodQty + activeWO.scrapQty)) *
                        100
                      ).toFixed(1)

                return (
                  <div className='flex flex-col'>
                    {/* Header */}
                    <div className='flex items-center gap-3 text-slate-800 border-b border-slate-100 pb-5 mb-5'>
                      <div
                        className={cn(
                          'p-3 rounded-xl shadow-md',
                          isDelayed
                            ? 'bg-rose-600 shadow-rose-200'
                            : 'bg-indigo-600 shadow-indigo-200'
                        )}
                      >
                        <BarChart3 size={24} className='text-white' />
                      </div>
                      <div className='flex flex-col'>
                        <span className='font-black text-2xl tracking-tight'>
                          工單進度剖析 (Progress Analysis)
                        </span>
                        <div className='flex items-center gap-2 mt-1'>
                          <span
                            className={cn(
                              'text-sm font-mono font-black',
                              isDelayed ? 'text-rose-600' : 'text-indigo-600'
                            )}
                          >
                            {activeWO.woId}
                          </span>
                          <span className='text-[10px] text-slate-400'>|</span>
                          <span className='text-xs font-bold text-slate-500'>
                            {activeWO.customer}
                          </span>
                          <Tag
                            className={cn(
                              'm-0 border-none font-bold text-[10px] px-2 py-0.5 ml-2',
                              isDelayed
                                ? 'bg-rose-100 text-rose-700'
                                : isDone
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-blue-100 text-blue-700'
                            )}
                          >
                            {activeWO.status}
                          </Tag>
                        </div>
                      </div>
                    </div>

                    {/* Summary Metric Cards */}
                    <div className='grid grid-cols-4 gap-4 mb-8'>
                      <div className='bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center'>
                        <span className='text-xs font-bold text-slate-400 mb-1'>
                          目標數量 (Target)
                        </span>
                        <span className='text-2xl font-black text-slate-700 font-mono'>
                          {activeWO.targetQty.toLocaleString()}
                        </span>
                      </div>
                      <div className='bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center'>
                        <span className='text-xs font-bold text-emerald-600 mb-1'>
                          累計良品 (Good)
                        </span>
                        <span className='text-2xl font-black text-emerald-600 font-mono'>
                          {activeWO.goodQty.toLocaleString()}
                        </span>
                      </div>
                      <div className='bg-rose-50/50 p-4 rounded-2xl border border-rose-100 flex flex-col items-center justify-center'>
                        <span className='text-xs font-bold text-rose-600 mb-1'>
                          不良/廢品 (Scrap)
                        </span>
                        <span className='text-2xl font-black text-rose-600 font-mono'>
                          {activeWO.scrapQty.toLocaleString()}{' '}
                          <span className='text-[10px] font-bold text-rose-400 ml-1'>
                            ({scrapRate}%)
                          </span>
                        </span>
                      </div>
                      <div className='bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden'>
                        <span className='text-xs font-bold text-slate-400 mb-1'>
                          預定交期
                        </span>
                        <span
                          className={cn(
                            'text-lg font-black font-mono relative z-10',
                            isDelayed ? 'text-rose-600' : 'text-slate-700'
                          )}
                        >
                          {activeWO.dueDate}
                        </span>
                        {isDelayed && (
                          <div className='absolute inset-0 border-2 border-rose-400 rounded-2xl animate-pulse pointer-events-none'></div>
                        )}
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className='mb-8'>
                      <div className='flex justify-between items-end mb-2'>
                        <span className='font-bold text-slate-700 text-sm flex items-center gap-1.5'>
                          <Crosshair size={16} className='text-indigo-500' />{' '}
                          整體達成進度
                        </span>
                        <span
                          className={cn(
                            'text-xl font-black',
                            isDelayed ? 'text-rose-600' : 'text-indigo-600'
                          )}
                        >
                          {percent}%
                        </span>
                      </div>
                      <Progress
                        percent={percent}
                        strokeColor={
                          isDelayed
                            ? '#f43f5e'
                            : isDone
                              ? '#10b981'
                              : { '0%': '#818cf8', '100%': '#4f46e5' }
                        }
                        strokeWidth={16}
                        showInfo={false}
                        className='drop-shadow-sm'
                      />
                    </div>

                    <Divider className='border-slate-100 my-0 mb-6' />

                    {/* Routing Stages Timeline */}
                    <div>
                      <span className='font-bold text-slate-700 text-sm flex items-center gap-1.5 mb-6'>
                        <Layers size={16} className='text-indigo-500' />{' '}
                        工序站點實時狀態 (Routing Traceability)
                      </span>

                      <div className='px-4'>
                        <Steps
                          orientation='vertical'
                          size='small'
                          current={activeWO.routingSteps.findIndex(
                            s => s.status === 'process'
                          )}
                          items={activeWO.routingSteps.map(step => {
                            const isProcess = step.status === 'process'
                            const isFinish = step.status === 'finish'
                            const stepPercent =
                              activeWO.targetQty > 0
                                ? Math.round(
                                    (step.completedQty / activeWO.targetQty) *
                                      100
                                  )
                                : 0

                            return {
                              title: (
                                <div className='flex items-center justify-between w-[500px] mb-1'>
                                  <span
                                    className={cn(
                                      'font-bold text-sm',
                                      isProcess
                                        ? 'text-blue-600'
                                        : isFinish
                                          ? 'text-slate-700'
                                          : 'text-slate-400'
                                    )}
                                  >
                                    {step.title}
                                  </span>
                                  <Tag className='m-0 text-[10px] font-mono border-slate-200 text-slate-500'>
                                    <Factory
                                      size={10}
                                      className='inline mr-1'
                                    />
                                    {step.workCenter}
                                  </Tag>
                                </div>
                              ),
                              description: (
                                <div className='flex flex-col gap-2 pb-6 pt-1 w-[500px]'>
                                  <div className='flex justify-between text-[11px] font-bold'>
                                    <span className='text-slate-400'>
                                      已通過:{' '}
                                      {step.completedQty.toLocaleString()} PCS
                                    </span>
                                    <span
                                      className={
                                        isProcess
                                          ? 'text-blue-500'
                                          : 'text-slate-400'
                                      }
                                    >
                                      {stepPercent}%
                                    </span>
                                  </div>
                                  <Progress
                                    percent={stepPercent}
                                    size='small'
                                    showInfo={false}
                                    strokeColor={
                                      isFinish
                                        ? '#10b981'
                                        : isProcess
                                          ? '#3b82f6'
                                          : '#cbd5e1'
                                    }
                                    trailColor='#f1f5f9'
                                  />
                                </div>
                              ),
                              status: step.status,
                              icon: isProcess ? (
                                <Timer
                                  size={18}
                                  className='text-blue-500 animate-spin-slow'
                                />
                              ) : undefined
                            }
                          })}
                        />
                      </div>
                    </div>

                    <div className='mt-4 flex justify-end'>
                      <Button
                        size='large'
                        className='h-12 rounded-xl font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 px-8'
                        onClick={() => setIsDetailModalVisible(false)}
                      >
                        關閉剖析視窗
                      </Button>
                    </div>
                  </div>
                )
              })()}
          </Modal>

          <style>{`
            .aps-monitor-table .ant-table-thead > tr > th {
              background: #ffffff !important;
              color: #64748b !important;
              font-weight: 700 !important;
              border-bottom: 1px solid #f1f5f9 !important;
              white-space: nowrap;
              padding-top: 20px !important;
            }
            .aps-monitor-table .ant-table-tbody > tr:hover > td {
              background: #f8fafc !important;
            }

            /* 自定義 Modal 樣式 */
            .custom-hmi-modal .ant-modal-content {
              border-radius: 28px;
              padding: 32px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
              border: 1px solid #f1f5f9;
            }
            .custom-hmi-modal .ant-modal-header {
              background: transparent;
              margin-bottom: 0;
            }

            /* 呼吸燈動畫 */
            .animate-pulse-slow {
              animation: pulseSlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            @keyframes pulseSlow {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.8; box-shadow: 0 0 15px rgba(225, 29, 72, 0.4); }
            }
            .animate-spin-slow {
              animation: spin 3s linear infinite;
            }

            .custom-message .ant-message-notice-content {
              border-radius: 12px;
              padding: 12px 24px;
              font-weight: bold;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }

            .custom-stats-popover .ant-popover-inner {
              border-radius: 16px !important;
              padding: 16px !important;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
              border: 1px solid #e0e7ff;
            }
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
