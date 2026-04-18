import React, { useState, useEffect, useMemo } from 'react'
import {
  Table,
  Tag,
  Space,
  Button,
  Card,
  Progress,
  Badge,
  Dropdown,
  DatePicker,
  Popover,
  Tooltip,
  Modal,
  Steps,
  message,
  Timeline,
  Radio,
  ConfigProvider
} from 'antd'
import {
  MoreVertical,
  CheckCircle2,
  Clock,
  ChevronDown,
  Zap,
  Info,
  ArrowUpToLine,
  Activity,
  History,
  TrendingDown,
  TrendingUp,
  Filter,
  CalendarDays,
  AlertTriangle,
  Wand2,
  BarChart2,
  Settings2,
  GitMerge
} from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

// 輕量版 cn 函數
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

// --- 型別定義 ---
type PriorityType = 'Urgent' | 'High' | 'Medium' | 'Low'
type OrderStatusType = 'In Production' | 'Pending' | 'Completed' | 'Delayed'

interface OrderItem {
  key: string
  orderId: string
  customer: string
  orderDate: string
  originalDelivery: string
  adjustedDelivery: string
  priority: PriorityType
  status: OrderStatusType
  progress: number
  impactScore: number // 0-100
  isRush: boolean
}

interface StatCardProps {
  title: string
  value: string | number
  unit: string
  icon: React.ElementType
  colorClass: string
  bgClass: string
  iconColorClass: string
  trend?: string
  isAlert?: boolean
}

// --- 假資料生成器 ---
const generateRushMockData = (count: number): OrderItem[] => {
  const customers = [
    'Tesla Giga',
    'Apple Inc.',
    'SpaceX',
    'TSMC',
    'NVIDIA',
    'Amazon'
  ]
  const priorities: PriorityType[] = ['High', 'Medium', 'Low']
  const statuses: OrderStatusType[] = ['In Production', 'Pending']

  return Array.from({ length: count }).map((_, i) => {
    const id = i + 1
    const isRush = Math.random() > 0.85
    const status = isRush
      ? 'In Production'
      : statuses[Math.floor(Math.random() * statuses.length)]
    const priority = isRush
      ? 'Urgent'
      : priorities[Math.floor(Math.random() * priorities.length)]

    const date = new Date('2026-04-10') // 基於當前 APS 時間軸
    date.setDate(date.getDate() + Math.floor(Math.random() * 30))
    const originalDelivery = date.toISOString().split('T')[0]

    return {
      key: id.toString(),
      orderId: `ORD-2026-${id.toString().padStart(3, '0')}`,
      customer: customers[Math.floor(Math.random() * customers.length)],
      orderDate: '2026-03-01',
      originalDelivery,
      adjustedDelivery: originalDelivery,
      priority,
      status,
      progress: Math.floor(Math.random() * 60),
      impactScore: Math.floor(Math.random() * 100),
      isRush
    }
  })
}

const initialRushData = generateRushMockData(150)

// --- 子組件：統計卡片 ---
const StatCard: React.FC<StatCardProps> = ({
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
      isAlert && 'ring-1 ring-amber-200 bg-amber-50/20'
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

export default function OrderRush() {
  const [loading, setLoading] = useState<boolean>(true)
  const [orders, setOrders] = useState<OrderItem[]>(initialRushData)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // Modals State
  const [isRushModalOpen, setIsRushModalOpen] = useState(false)
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [activeRecord, setActiveRecord] = useState<OrderItem | null>(null)

  // 整線優化 State
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationDone, setOptimizationDone] = useState(false)
  const [optStrategy, setOptStrategy] = useState('setup')

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(
    () => ({
      rushCount: orders.filter(d => d.isRush).length,
      impacted: orders.filter(d => d.impactScore > 70).length,
      efficiencyLoss: '-2.4%',
      capacity: '92%'
    }),
    [orders]
  )

  // --- 生成篩選選單資料 ---
  const customerFilters = useMemo(() => {
    const uniqueCustomers = Array.from(new Set(orders.map(d => d.customer)))
    return uniqueCustomers.map(c => ({ text: c, value: c }))
  }, [orders])

  const orderIdFilters = useMemo(() => {
    return orders
      .slice(0, 100)
      .map(d => ({ text: d.orderId, value: d.orderId }))
  }, [orders])

  // --- 操作邏輯 Handler ---
  const handleOpenRushConfirm = (record: OrderItem) => {
    setActiveRecord(record)
    setIsRushModalOpen(true)
  }

  const handleConfirmRush = () => {
    if (!activeRecord) return
    setIsRushModalOpen(false)
    message.loading({ content: '重新分配產能與物料中...', key: 'rush' })

    setTimeout(() => {
      setOrders(prev =>
        prev.map(o => {
          if (o.key === activeRecord.key) {
            return {
              ...o,
              isRush: true,
              priority: 'Urgent',
              status: 'In Production',
              progress: Math.max(o.progress, 5),
              impactScore: 85
            }
          }
          return o
        })
      )
      message.success({
        content: `訂單 ${activeRecord.orderId} 已成功插排，優先級提升為「特急」！`,
        key: 'rush'
      })
    }, 1500)
  }

  const handleCancelRush = (record: OrderItem) => {
    Modal.confirm({
      title: '確認移除急單優先權',
      content: `移除後 ${record.orderId} 將恢復一般排程優先級，是否確認？`,
      okText: '確認移除',
      okType: 'danger',
      cancelText: '保留',
      onOk: () => {
        setOrders(prev =>
          prev.map(o => {
            if (o.key === record.key) {
              return {
                ...o,
                isRush: false,
                priority: 'Medium',
                impactScore: 20
              }
            }
            return o
          })
        )
        message.success(`已解除 ${record.orderId} 的急單狀態`)
      }
    })
  }

  const handleBatchRush = () => {
    message.loading({ content: '批量插單分析運算中...', key: 'batchRush' })
    setTimeout(() => {
      setOrders(prev =>
        prev.map(o => {
          if (selectedRowKeys.includes(o.key)) {
            return {
              ...o,
              isRush: true,
              priority: 'Urgent',
              status: 'In Production',
              impactScore: 90
            }
          }
          return o
        })
      )
      message.success({
        content: `已成功將 ${selectedRowKeys.length} 筆訂單轉為急單排入產線！`,
        key: 'batchRush'
      })
      setSelectedRowKeys([])
    }, 1500)
  }

  const handleBatchCancelRush = () => {
    setOrders(prev =>
      prev.map(o => {
        if (selectedRowKeys.includes(o.key)) {
          return { ...o, isRush: false, priority: 'Medium', impactScore: 30 }
        }
        return o
      })
    )
    message.success(`已將選中的 ${selectedRowKeys.length} 筆訂單移除急單標籤`)
    setSelectedRowKeys([])
  }

  const handleOpenAnalyze = (record: OrderItem) => {
    setActiveRecord(record)
    setIsAnalyzeModalOpen(true)
  }

  const handleOpenHistory = (record: OrderItem) => {
    setActiveRecord(record)
    setIsHistoryModalOpen(true)
  }

  // 整線優化 Handler
  const handleStartOptimization = () => {
    setIsOptimizing(true)
    setTimeout(() => {
      setIsOptimizing(false)
      setOptimizationDone(true)
      message.success({
        content: '整線優化完成，產能分佈與換線計畫已重構！',
        className: 'custom-message'
      })
    }, 2500)
  }

  const handleApplyOptimization = () => {
    setIsOptimizeModalOpen(false)
    setOptimizationDone(false)
    // 假裝更新資料
    setOrders(prev => [...prev].sort((a, b) => a.impactScore - b.impactScore))
    message.success({
      content: '已將優化方案套用至正式生產排程！',
      className: 'custom-message'
    })
  }

  const statsContent = (
    <div className='w-full max-w-120 p-1'>
      <div className='flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5'>
        <Activity size={16} className='text-indigo-600' />
        <span className='font-bold text-slate-800'>插單決策分析看板</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='當前插單數'
          value={stats.rushCount}
          unit='筆'
          icon={Zap}
          colorClass='text-amber-600'
          bgClass='bg-amber-50'
          iconColorClass='text-amber-500'
        />
        <StatCard
          title='受影響訂單'
          value={stats.impacted}
          unit='筆'
          icon={TrendingDown}
          colorClass='text-rose-600'
          bgClass='bg-rose-50'
          iconColorClass='text-rose-500'
          trend='高風險'
          isAlert={stats.impacted > 0}
        />
        <StatCard
          title='效率變動'
          value={stats.efficiencyLoss}
          unit='OEE'
          icon={Clock}
          colorClass='text-slate-600'
          bgClass='bg-slate-50'
          iconColorClass='text-slate-500'
        />
        <StatCard
          title='產能負荷'
          value={stats.capacity}
          unit='Cap'
          icon={CheckCircle2}
          colorClass='text-emerald-600'
          bgClass='bg-emerald-50'
          iconColorClass='text-emerald-500'
        />
      </div>
      <div className='mt-4 bg-indigo-50 p-2.5 rounded-lg text-[11px] text-indigo-600 flex items-start gap-2'>
        <Info size={14} className='shrink-0 mt-0.5' />
        <span>
          插單後系統會自動重算 GANTT 圖與產線順序，請密切注意受影響訂單。
        </span>
      </div>
    </div>
  )

  const columns: ColumnsType<OrderItem> = [
    {
      title: '訂單編號',
      dataIndex: 'orderId',
      key: 'orderId',
      fixed: 'left',
      render: (text, record) => (
        <Space size={6}>
          <span
            className='font-mono font-bold text-blue-600 cursor-pointer hover:underline'
            onClick={() => handleOpenHistory(record)}
          >
            {text}
          </span>
          {record.isRush && (
            <Tooltip title='急單處理中'>
              <div className='w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]' />
            </Tooltip>
          )}
        </Space>
      ),
      width: 150,
      filters: orderIdFilters,
      filterSearch: true,
      onFilter: (value, record) => record.orderId === value,
      sorter: (a, b) => a.orderId.localeCompare(b.orderId)
    },
    {
      title: '客戶名稱',
      dataIndex: 'customer',
      key: 'customer',
      ellipsis: true,
      minWidth: 160,
      filters: customerFilters,
      filterSearch: true,
      onFilter: (value, record) => record.customer === value,
      sorter: (a, b) => a.customer.localeCompare(b.customer)
    },
    {
      title: '優先級',
      dataIndex: 'priority',
      key: 'priority',
      width: 130,
      filters: [
        { text: '特急 (Urgent)', value: 'Urgent' },
        { text: '高 (High)', value: 'High' },
        { text: '一般 (Medium)', value: 'Medium' },
        { text: '低 (Low)', value: 'Low' }
      ],
      onFilter: (value, record) => record.priority === value,
      sorter: (a, b) => {
        const weight: Record<PriorityType, number> = {
          Urgent: 4,
          High: 3,
          Medium: 2,
          Low: 1
        }
        return weight[a.priority] - weight[b.priority]
      },
      render: priority => {
        const config = {
          Urgent: { color: 'volcano', label: '特急' },
          High: { color: 'orange', label: '高' },
          Medium: { color: 'blue', label: '一般' },
          Low: { color: 'default', label: '低' }
        }
        const { color, label } = config[priority as PriorityType]
        return (
          <Tag
            color={color}
            className='rounded-full px-3 border-none font-medium m-0'
          >
            {label}
          </Tag>
        )
      }
    },
    {
      title: '延誤風險',
      dataIndex: 'impactScore',
      key: 'impactScore',
      width: 130,
      filters: [
        { text: '高風險 (High Risk)', value: 'high' },
        { text: '中度風險 (Moderate)', value: 'moderate' },
        { text: '穩定可控 (Stable)', value: 'stable' }
      ],
      onFilter: (value, record) => {
        if (value === 'high') return record.impactScore > 70
        if (value === 'moderate')
          return record.impactScore > 40 && record.impactScore <= 70
        if (value === 'stable') return record.impactScore <= 40
        return true
      },
      sorter: (a, b) => a.impactScore - b.impactScore,
      render: score => {
        const color =
          score > 70 ? '#ef4444' : score > 40 ? '#f59e0b' : '#10b981'
        return (
          <div className='flex flex-col gap-1 w-full max-w-25'>
            <Progress
              percent={score}
              size='small'
              strokeColor={color}
              showInfo={false}
            />
            <span
              className={cn(
                'text-[9px] font-bold uppercase',
                score > 70
                  ? 'text-rose-500'
                  : score > 40
                    ? 'text-amber-500'
                    : 'text-emerald-500'
              )}
            >
              {score > 70 ? 'High Risk' : score > 40 ? 'Moderate' : 'Stable'}
            </span>
          </div>
        )
      }
    },
    {
      title: '原定交期',
      dataIndex: 'originalDelivery',
      key: 'originalDelivery',
      width: 170,
      sorter: (a, b) =>
        dayjs(a.originalDelivery).valueOf() -
        dayjs(b.originalDelivery).valueOf(),
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters
      }: any) => (
        <div
          className='p-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100 w-75'
          onKeyDown={e => e.stopPropagation()}
        >
          <div className='mb-3'>
            <span className='text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5'>
              <CalendarDays size={14} /> 選擇交期區間
            </span>
            <DatePicker.RangePicker
              value={
                selectedKeys[0]
                  ? [
                      dayjs((selectedKeys[0] as string[])[0]),
                      dayjs((selectedKeys[0] as string[])[1])
                    ]
                  : null
              }
              onChange={(dates, dateStrings) =>
                setSelectedKeys(dates ? [dateStrings] : [])
              }
              className='w-full rounded-xl border-slate-200'
            />
          </div>
          <div className='flex justify-between items-center mt-2'>
            <Button
              type='text'
              size='small'
              onClick={() => {
                clearFilters?.()
                confirm()
              }}
              className='text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            >
              重置
            </Button>
            <Button
              type='primary'
              size='small'
              onClick={() => confirm()}
              className='text-xs font-bold bg-amber-500 border-none rounded-lg px-4 shadow-md shadow-amber-200'
            >
              篩選交期
            </Button>
          </div>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <Filter
          size={14}
          className={
            filtered ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
          }
        />
      ),
      onFilter: (value: any, record) => {
        if (!value || value.length !== 2) return true
        const recordTime = dayjs(record.originalDelivery).valueOf()
        const startTime = dayjs(value[0]).startOf('day').valueOf()
        const endTime = dayjs(value[1]).endOf('day').valueOf()
        return recordTime >= startTime && recordTime <= endTime
      },
      render: (date, record) => (
        <span
          className={cn(
            'font-mono font-medium',
            record.isRush ? 'text-amber-600' : 'text-slate-600'
          )}
        >
          {date}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'rush',
                label: '標記為急單',
                icon: <ArrowUpToLine size={14} className='text-amber-500' />,
                disabled: record.isRush,
                onClick: () => handleOpenRushConfirm(record)
              },
              {
                key: 'analyze',
                label: '衝擊分析',
                icon: <Activity size={14} className='text-indigo-500' />,
                onClick: () => handleOpenAnalyze(record)
              },
              {
                key: 'history',
                label: '變更紀錄',
                icon: <History size={14} className='text-slate-500' />,
                onClick: () => handleOpenHistory(record)
              },
              { type: 'divider' },
              {
                key: 'cancel',
                label: '移除急單標籤',
                danger: true,
                disabled: !record.isRush,
                onClick: () => handleCancelRush(record)
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
            className='text-slate-400 flex items-center justify-center hover:bg-slate-100'
          />
        </Dropdown>
      )
    }
  ]

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          borderRadius: 12,
          borderRadiusSM: 6,
          fontFamily: 'Inter, Noto Sans TC, sans-serif'
        }
      }}
    >
      <div className='w-full h-full bg-slate-50/50 p-4 font-sans'>
        <div className='mx-auto px-2 pt-2 pb-8 space-y-4 animate-fade-in relative'>
          {/* 全域 Loading 遮罩 */}
          {loading && (
            <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-110 flex items-center justify-center rounded-3xl'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-10 h-10 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin' />
                <span className='text-xs font-black text-amber-600 tracking-widest uppercase'>
                  Calculating Impacts...
                </span>
              </div>
            </div>
          )}

          {/* 頂部導航列 (Glassmorphism Sticky Header) */}
          <div className='flex flex-wrap items-center justify-between px-4 gap-y-4 bg-white/70 py-3 rounded-2xl sticky top-2 z-20 backdrop-blur-xl shadow-sm border border-white'>
            <div className='flex items-center gap-3'>
              <div className='bg-linear-to-br from-amber-400 to-amber-600 p-2 rounded-xl shadow-amber-200 shadow-lg hidden sm:block'>
                <Zap size={20} className='text-white fill-white' />
              </div>
              <Popover
                content={statsContent}
                trigger='click'
                placement='bottomLeft'
                rootClassName='custom-stats-popover'
              >
                <div className='flex items-center gap-2 cursor-pointer hover:bg-white px-2 sm:px-3 py-1.5 rounded-xl transition-all group border border-transparent hover:border-amber-100'>
                  <span className='text-[15px] font-black text-slate-800 group-hover:text-amber-600 whitespace-nowrap tracking-tight'>
                    插單決策監控中心
                  </span>
                  <div className='flex gap-1'>
                    <Badge
                      count={stats.rushCount}
                      style={{
                        backgroundColor: '#f59e0b',
                        fontSize: '10px',
                        boxShadow: 'none'
                      }}
                    />
                    <Badge
                      count={stats.impacted}
                      style={{
                        backgroundColor: '#ef4444',
                        fontSize: '10px',
                        boxShadow: 'none'
                      }}
                    />
                  </div>
                  <ChevronDown
                    size={14}
                    className='text-slate-400 group-hover:text-amber-600'
                  />
                </div>
              </Popover>
            </div>

            <div className='flex items-center gap-2'>
              <Button
                onClick={() => {
                  setIsOptimizeModalOpen(true)
                  setOptimizationDone(false)
                }}
                icon={<Wand2 size={16} className='text-indigo-500' />}
                className='rounded-xl border-indigo-200 font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 h-10 transition-colors'
              >
                <span className='hidden lg:inline ml-1 text-xs'>
                  執行整線優化
                </span>
              </Button>
              <Button
                type='primary'
                icon={<Zap size={16} />}
                onClick={() => setIsRushModalOpen(true)}
                className='rounded-xl bg-amber-500 hover:bg-amber-400! shadow-md shadow-amber-200 font-black border-none h-10 px-5 transition-transform active:scale-95'
              >
                <span className='hidden sm:inline ml-1 text-sm'>觸發插單</span>
              </Button>
            </div>
          </div>

          <Card
            className='shadow-xl shadow-slate-200/40 border-none rounded-3xl overflow-hidden p-0'
            styles={{ body: { padding: 0 } }}
          >
            <div className='flex flex-col'>
              {/* 批量操作提示 */}
              {selectedRowKeys.length > 0 ? (
                <div className='bg-amber-50/80 border-b border-amber-100 p-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300'>
                  <div className='flex items-center gap-2 text-amber-700'>
                    <Zap
                      size={16}
                      className='fill-amber-500 text-amber-500 shrink-0'
                    />
                    <span className='text-sm font-black text-amber-700'>
                      已選擇 {selectedRowKeys.length} 筆訂單
                    </span>
                  </div>
                  <Space wrap>
                    <Button
                      type='primary'
                      size='small'
                      className='rounded-lg font-bold text-xs bg-amber-500 hover:bg-amber-400 border-none shadow-md shadow-amber-200 h-8 px-4'
                      onClick={handleBatchRush}
                    >
                      批量轉為急單
                    </Button>
                    <Button
                      danger
                      size='small'
                      className='rounded-lg font-bold text-xs h-8 px-4'
                      onClick={handleBatchCancelRush}
                    >
                      批量解除急單
                    </Button>
                    <Button
                      type='text'
                      size='small'
                      onClick={() => setSelectedRowKeys([])}
                      className='text-slate-400 font-bold text-xs hover:bg-amber-100'
                    >
                      清除選取
                    </Button>
                  </Space>
                </div>
              ) : (
                <div className='flex flex-wrap items-center justify-between gap-4 py-3 px-5 border-b border-slate-50 bg-slate-50/50'>
                  <div className='text-slate-400 text-[11px] font-bold flex items-center gap-2'>
                    <Info size={14} className='text-amber-500 shrink-0' />
                    <span>
                      提示：點擊「原定交期」表頭的漏斗圖示，可快速篩選特定交期區間的訂單。排程碎化時建議執行「整線優化」。
                    </span>
                  </div>
                </div>
              )}

              <div className='overflow-x-auto'>
                <Table
                  rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                    fixed: 'left'
                  }}
                  columns={columns}
                  dataSource={orders}
                  loading={loading}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: total => `當前列表共 ${total} 筆`,
                    className: '!px-4 pb-4'
                  }}
                  scroll={{ x: 1000 }}
                />
              </div>
            </div>
          </Card>

          {/* --- Modal: 整線優化引擎 (Line Balancing & Optimization) --- */}
          <Modal
            open={isOptimizeModalOpen}
            onCancel={() => !isOptimizing && setIsOptimizeModalOpen(false)}
            footer={null}
            width={680}
            centered
            destroyOnClose
            className='custom-edit-modal'
          >
            <div className='p-2'>
              <div className='flex items-center gap-4 mb-6 border-b border-slate-100 pb-5'>
                <div className='w-14 h-14 bg-linear-to-br from-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200/50'>
                  <Wand2 size={28} />
                </div>
                <div className='flex flex-col'>
                  <h3 className='text-xl font-black text-slate-800 m-0 tracking-tight'>
                    產線負載平衡與整線優化
                  </h3>
                  <p className='text-slate-500 font-bold text-xs mt-1 m-0'>
                    消除因頻繁插單導致的排程碎片化，降低無效換線時間。
                  </p>
                </div>
              </div>

              {!isOptimizing && !optimizationDone && (
                <div className='animate-fade-in'>
                  <div className='mb-6'>
                    <span className='text-xs font-black text-slate-500 uppercase tracking-widest mb-3 block'>
                      選擇最佳化目標演算法
                    </span>
                    <Radio.Group
                      onChange={e => setOptStrategy(e.target.value)}
                      value={optStrategy}
                      className='flex! flex-col! gap-3! w-full'
                    >
                      <Radio.Button
                        value='setup'
                        className='h-auto! p-4! rounded-2xl border border-slate-200 w-full text-left flex items-start gap-3 hover:bg-slate-50 transition-colors before:hidden'
                      >
                        <GitMerge
                          size={20}
                          className={cn(
                            'shrink-0 mt-0.5',
                            optStrategy === 'setup'
                              ? 'text-indigo-600'
                              : 'text-slate-400'
                          )}
                        />
                        <div className='flex flex-col flex-1'>
                          <span
                            className={cn(
                              'text-sm font-black',
                              optStrategy === 'setup'
                                ? 'text-indigo-700'
                                : 'text-slate-700'
                            )}
                          >
                            換線次數最少化 (Minimize Setup)
                          </span>
                          <span className='text-xs text-slate-500 font-medium mt-1'>
                            強制合併同料號工單，最大程度減少換線次數與設備閒置時間。
                          </span>
                        </div>
                      </Radio.Button>
                      <Radio.Button
                        value='otd'
                        className='h-auto! p-4! rounded-2xl border border-slate-200 w-full text-left flex items-start gap-3 hover:bg-slate-50 transition-colors before:hidden'
                      >
                        <CheckCircle2
                          size={20}
                          className={cn(
                            'shrink-0 mt-0.5',
                            optStrategy === 'otd'
                              ? 'text-indigo-600'
                              : 'text-slate-400'
                          )}
                        />
                        <div className='flex flex-col flex-1'>
                          <span
                            className={cn(
                              'text-sm font-black',
                              optStrategy === 'otd'
                                ? 'text-indigo-700'
                                : 'text-slate-700'
                            )}
                          >
                            訂單達交率優先 (Maximize OTD)
                          </span>
                          <span className='text-xs text-slate-500 font-medium mt-1'>
                            犧牲部分換線效率，嚴格按照客戶交期與優先級進行排產倒推。
                          </span>
                        </div>
                      </Radio.Button>
                      <Radio.Button
                        value='oee'
                        className='h-auto! p-4! rounded-2xl border border-slate-200 w-full text-left flex items-start gap-3 hover:bg-slate-50 transition-colors before:hidden'
                      >
                        <Activity
                          size={20}
                          className={cn(
                            'shrink-0 mt-0.5',
                            optStrategy === 'oee'
                              ? 'text-indigo-600'
                              : 'text-slate-400'
                          )}
                        />
                        <div className='flex flex-col flex-1'>
                          <span
                            className={cn(
                              'text-sm font-black',
                              optStrategy === 'oee'
                                ? 'text-indigo-700'
                                : 'text-slate-700'
                            )}
                          >
                            設備稼動率最大化 (Maximize OEE)
                          </span>
                          <span className='text-xs text-slate-500 font-medium mt-1'>
                            平衡各產線載荷，允許跨線生產支援，避免出現單一機台瓶頸。
                          </span>
                        </div>
                      </Radio.Button>
                    </Radio.Group>
                  </div>

                  <div className='flex justify-end gap-3 pt-4 border-t border-slate-100'>
                    <Button
                      onClick={() => setIsOptimizeModalOpen(false)}
                      className='rounded-xl font-bold px-6 h-10 border-slate-200 text-slate-500 hover:bg-slate-50'
                    >
                      取消
                    </Button>
                    <Button
                      type='primary'
                      className='rounded-xl bg-indigo-600 hover:bg-indigo-500! shadow-md shadow-indigo-200 border-none px-8 h-10 font-black transition-transform active:scale-95 flex items-center gap-1.5'
                      onClick={handleStartOptimization}
                    >
                      <Settings2 size={16} /> 啟動 APS 演算
                    </Button>
                  </div>
                </div>
              )}

              {isOptimizing && (
                <div className='py-12 flex flex-col items-center justify-center animate-fade-in'>
                  <div className='relative mb-6'>
                    <div className='w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin'></div>
                    <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-sm'>
                      <BarChart2
                        size={24}
                        className='text-indigo-500 animate-pulse'
                      />
                    </div>
                  </div>
                  <h3 className='text-xl font-black text-slate-800 tracking-tight'>
                    執行基因演算法優化中...
                  </h3>
                  <p className='text-sm font-bold text-slate-400 mt-2'>
                    重新分配工單載荷與梳理換線矩陣 (Heuristic Routing)
                  </p>
                  <Progress
                    percent={99}
                    status='active'
                    strokeColor='#4f46e5'
                    className='w-64 mt-6'
                    showInfo={false}
                  />
                </div>
              )}

              {optimizationDone && !isOptimizing && (
                <div className='animate-fade-in'>
                  <div className='bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 mb-6'>
                    <div className='flex items-center gap-2 mb-4'>
                      <CheckCircle2 size={20} className='text-emerald-500' />
                      <span className='font-black text-emerald-800'>
                        優化演算完成！以下為預期成效：
                      </span>
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                      <div className='bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex flex-col gap-1'>
                        <span className='text-[10px] font-bold text-slate-400'>
                          總換線時間
                        </span>
                        <div className='flex items-end gap-2 mt-1'>
                          <span className='text-lg font-black text-emerald-600 font-mono'>
                            32
                            <span className='text-[10px] text-emerald-400 ml-0.5'>
                              hrs
                            </span>
                          </span>
                          <span className='text-xs font-bold text-slate-400 line-through mb-1'>
                            48
                          </span>
                        </div>
                        <span className='text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded w-fit mt-1'>
                          -33% (節省)
                        </span>
                      </div>
                      <div className='bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex flex-col gap-1'>
                        <span className='text-[10px] font-bold text-slate-400'>
                          綜合 OEE
                        </span>
                        <div className='flex items-end gap-2 mt-1'>
                          <span className='text-lg font-black text-emerald-600 font-mono'>
                            85
                            <span className='text-[10px] text-emerald-400 ml-0.5'>
                              %
                            </span>
                          </span>
                          <span className='text-xs font-bold text-slate-400 line-through mb-1'>
                            78
                          </span>
                        </div>
                        <span className='text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded w-fit mt-1'>
                          <TrendingUp
                            size={10}
                            className='inline mr-0.5 mb-0.5'
                          />
                          +7% (提升)
                        </span>
                      </div>
                      <div className='bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex flex-col gap-1'>
                        <span className='text-[10px] font-bold text-slate-400'>
                          高風險延遲訂單
                        </span>
                        <div className='flex items-end gap-2 mt-1'>
                          <span className='text-lg font-black text-emerald-600 font-mono'>
                            8
                            <span className='text-[10px] text-emerald-400 ml-0.5'>
                              筆
                            </span>
                          </span>
                          <span className='text-xs font-bold text-slate-400 line-through mb-1'>
                            12
                          </span>
                        </div>
                        <span className='text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded w-fit mt-1'>
                          <TrendingDown
                            size={10}
                            className='inline mr-0.5 mb-0.5'
                          />
                          減少 4 筆
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='flex justify-end gap-3 pt-4 border-t border-slate-100'>
                    <Button
                      onClick={() => setIsOptimizeModalOpen(false)}
                      className='rounded-xl font-bold px-6 h-10 border-slate-200 text-slate-500 hover:bg-slate-50'
                    >
                      放棄套用
                    </Button>
                    <Button
                      type='primary'
                      className='rounded-xl bg-emerald-500 hover:bg-emerald-400! shadow-md shadow-emerald-200 border-none px-8 h-10 font-black transition-transform active:scale-95 flex items-center gap-1.5'
                      onClick={handleApplyOptimization}
                    >
                      <CheckCircle2 size={16} /> 套用至正式排程
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Modal>

          {/* --- Modal 1: 插單確認彈窗 --- */}
          <Modal
            open={isRushModalOpen}
            onCancel={() => setIsRushModalOpen(false)}
            footer={null}
            width={560}
            centered
            className='custom-edit-modal'
          >
            <div className='p-2 pt-2'>
              <div className='flex items-center gap-4 mb-6 border-b border-slate-100 pb-5'>
                <div className='w-14 h-14 bg-linear-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200'>
                  <ArrowUpToLine size={28} />
                </div>
                <div className='flex flex-col'>
                  <h3 className='text-xl font-black text-slate-800 m-0 tracking-tight'>
                    {activeRecord ? '確認執行緊急插單' : '全局插單排程引擎'}
                  </h3>
                  <p className='text-slate-500 font-bold text-xs mt-1 m-0'>
                    {activeRecord
                      ? `目標訂單：${activeRecord.orderId} (${activeRecord.customer})`
                      : '此操作將觸發產能重分佈演算法，優先保障該訂單交期'}
                  </p>
                </div>
              </div>

              <Steps
                orientation='vertical'
                size='small'
                current={1}
                items={[
                  {
                    title: (
                      <span className='font-bold text-slate-700 text-sm'>
                        訂單狀態與物料驗證
                      </span>
                    ),
                    description: (
                      <span className='text-[11px] text-slate-400'>
                        已確認 BOM 齊套，具備生產條件
                      </span>
                    ),
                    status: 'finish'
                  },
                  {
                    title: (
                      <span className='font-bold text-indigo-600 text-sm'>
                        APS 衝擊模擬分析中
                      </span>
                    ),
                    description: (
                      <span className='text-[11px] text-indigo-400'>
                        預計將導致 3 筆一般訂單延遲 1-2 天，OEE 影響微小
                      </span>
                    ),
                    status: 'process'
                  },
                  {
                    title: (
                      <span className='font-bold text-slate-400 text-sm'>
                        同步至現場數位看板
                      </span>
                    ),
                    description: (
                      <span className='text-[11px] text-slate-400'>
                        待確認插單後，系統將自動下發更新至機台 PLC
                      </span>
                    ),
                    status: 'wait'
                  }
                ]}
                className='mb-8 px-4'
              />

              <div className='flex justify-end gap-3 pt-4 border-t border-slate-100'>
                <Button
                  onClick={() => setIsRushModalOpen(false)}
                  className='rounded-xl font-bold px-6 h-10 border-slate-200 text-slate-500 hover:bg-slate-50'
                >
                  暫不執行
                </Button>
                <Button
                  type='primary'
                  className='rounded-xl bg-amber-500 hover:bg-amber-400! shadow-md shadow-amber-200 border-none px-8 h-10 font-black transition-transform active:scale-95'
                  onClick={handleConfirmRush}
                >
                  {activeRecord ? '確認標記為急單' : '啟動排程重算'}
                </Button>
              </div>
            </div>
          </Modal>

          {/* --- Modal 2: 衝擊分析彈窗 --- */}
          <Modal
            title={
              <div className='flex items-center gap-2 border-b border-slate-100 pb-4 mb-2 mt-1'>
                <div className='bg-indigo-100 p-2 rounded-xl shadow-inner shadow-indigo-200/50 text-indigo-600'>
                  <Activity size={20} />
                </div>
                <span className='font-black text-xl tracking-tight'>
                  插單衝擊分析 (Impact Analysis)
                </span>
              </div>
            }
            open={isAnalyzeModalOpen}
            onCancel={() => setIsAnalyzeModalOpen(false)}
            footer={null}
            width={680}
            className='custom-edit-modal'
          >
            {activeRecord && (
              <div className='flex flex-col gap-4 mt-2'>
                <div className='bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between'>
                  <div>
                    <span className='text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1'>
                      Target Order
                    </span>
                    <span className='text-lg font-black text-slate-800 font-mono'>
                      {activeRecord.orderId}
                    </span>
                  </div>
                  <Tag
                    color='volcano'
                    className='border-none font-bold rounded px-3 py-1 m-0 shadow-sm'
                  >
                    若標記為特急單
                  </Tag>
                </div>

                <div className='mb-2'>
                  <span className='text-sm font-black text-slate-700 flex items-center gap-2 mb-3'>
                    <TrendingDown size={16} className='text-rose-500' />{' '}
                    預測受排擠而延遲之訂單
                  </span>
                  <div className='bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm'>
                    <Table
                      size='small'
                      pagination={false}
                      dataSource={[
                        {
                          key: '1',
                          id: 'ORD-2026-042',
                          cus: 'Samsung',
                          delay: 2
                        },
                        {
                          key: '2',
                          id: 'ORD-2026-088',
                          cus: 'Intel Corp',
                          delay: 1
                        },
                        {
                          key: '3',
                          id: 'ORD-2026-105',
                          cus: 'SpaceX',
                          delay: 3
                        }
                      ]}
                      columns={[
                        {
                          title: '訂單編號',
                          dataIndex: 'id',
                          render: t => (
                            <span className='font-mono text-xs font-bold text-slate-600'>
                              {t}
                            </span>
                          )
                        },
                        {
                          title: '客戶',
                          dataIndex: 'cus',
                          render: t => (
                            <span className='text-xs font-bold text-slate-500'>
                              {t}
                            </span>
                          )
                        },
                        {
                          title: '預測延遲 (天)',
                          dataIndex: 'delay',
                          align: 'right',
                          render: t => (
                            <span className='text-xs font-black text-rose-500'>
                              +{t} Days
                            </span>
                          )
                        }
                      ]}
                    />
                  </div>
                </div>

                <div className='bg-amber-50/50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3'>
                  <AlertTriangle
                    size={18}
                    className='text-amber-500 shrink-0 mt-0.5'
                  />
                  <div className='flex flex-col'>
                    <span className='text-sm font-black text-amber-700'>
                      系統建議
                    </span>
                    <span className='text-xs font-bold text-amber-600/80 mt-1 leading-relaxed'>
                      該插單將導致 3 筆一般訂單延遲交貨，整體達交率下降
                      1.2%。建議安排週末加班以消化溢出的產能需求。
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Modal>

          {/* --- Modal 3: 變更紀錄彈窗 --- */}
          <Modal
            title={
              <div className='flex items-center gap-2 border-b border-slate-100 pb-4 mb-2 mt-1'>
                <div className='bg-slate-100 p-2 rounded-xl text-slate-600'>
                  <History size={20} />
                </div>
                <span className='font-black text-xl tracking-tight'>
                  訂單變更紀錄 (Audit Trail)
                </span>
              </div>
            }
            open={isHistoryModalOpen}
            onCancel={() => setIsHistoryModalOpen(false)}
            footer={null}
            width={520}
            className='custom-edit-modal'
          >
            {activeRecord && (
              <div className='mt-6 px-4'>
                <Timeline
                  items={[
                    {
                      color: 'green',
                      children: (
                        <div className='flex flex-col mb-4'>
                          <span className='text-xs font-bold text-slate-700'>
                            業務建檔，進入 APS 排程
                          </span>
                          <span className='text-[10px] font-mono text-slate-400 mt-1'>
                            {activeRecord.orderDate} 09:12:45
                          </span>
                        </div>
                      )
                    },
                    {
                      color: 'blue',
                      children: (
                        <div className='flex flex-col mb-4'>
                          <span className='text-xs font-bold text-slate-700'>
                            系統自動計算交期與載荷
                          </span>
                          <span className='text-[10px] font-mono text-slate-400 mt-1'>
                            {activeRecord.orderDate} 10:05:22
                          </span>
                        </div>
                      )
                    },
                    ...(activeRecord.isRush
                      ? [
                          {
                            color: 'red',
                            dot: (
                              <ArrowUpToLine
                                size={14}
                                className='text-amber-500'
                              />
                            ),
                            children: (
                              <div className='flex flex-col mb-2'>
                                <span className='text-xs font-black text-amber-600'>
                                  生管介入：手動標記為特急插單
                                </span>
                                <span className='text-[10px] font-mono text-amber-500/70 mt-1'>
                                  Today 14:35:10 | User: Admin
                                </span>
                              </div>
                            )
                          }
                        ]
                      : [])
                  ]}
                />
              </div>
            )}
          </Modal>

          <style>{`
            .custom-stats-popover .ant-popover-inner {
              border-radius: 16px !important;
              padding: 16px !important;
              border: 1px solid #fef3c7;
              box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.1) !important;
            }

            /* Custom Modals */
            .custom-edit-modal .ant-modal-content {
              border-radius: 24px !important;
              padding: 24px !important;
              border: 1px solid #e2e8f0;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            }

            /* Override Radio Button styles for Engine Selection */
            .ant-radio-group .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
              background-color: #f5f3ff;
              border-color: #6366f1;
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
