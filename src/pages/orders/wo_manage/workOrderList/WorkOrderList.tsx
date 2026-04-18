import React, { useState, useEffect, useMemo } from 'react'
import {
  ConfigProvider,
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
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Timeline,
  Steps,
  Divider
} from 'antd'
import {
  Plus,
  MoreVertical,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  BarChart3,
  FileText,
  PlayCircle,
  PauseCircle,
  Printer,
  Activity,
  Filter,
  CalendarDays,
  Edit,
  Package,
  UserCheck,
  ArrowRight,
  ArrowUpToLine,
  History,
  TrendingDown
} from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// 輕量版 cn 函數
function cn(...classes: (string | undefined | null | false)[]) {
  return twMerge(clsx(classes))
}

const { RangePicker } = DatePicker

// --- 型別定義 ---
type WorkOrderStatus =
  | 'Planned'
  | 'Scheduled'
  | 'In Progress'
  | 'Paused'
  | 'Completed'
  | 'Abnormal'

interface WorkOrderItem {
  key: string
  woId: string
  itemCode: string
  itemName: string
  plannedQty: number
  actualQty: number
  startDate: string
  endDate: string
  machine: string
  operator: string
  status: WorkOrderStatus
  yieldRate: number
  impactScore?: number
  isRush?: boolean
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
const generateWOMockData = (count: number): WorkOrderItem[] => {
  const items = [
    { code: 'IC-7022', name: 'M3 Pro Mainboard' },
    { code: 'PN-4500', name: 'Power Module X1' },
    { code: 'CH-9921', name: 'Aluminum Chassis v4' },
    { code: 'BT-1020', name: 'Lithium Battery Pack' },
    { code: 'DS-3301', name: 'OLED Display Unit' }
  ]
  const machines = ['CNC-01', 'CNC-05', 'SMT-A2', 'ASM-L1', 'Tst-Z9']
  const operators = ['Zhang W.', 'Li S.', 'Chen M.', 'Wang J.', 'Hsieh K.']
  const statuses: WorkOrderStatus[] = [
    'Planned',
    'In Progress',
    'Paused',
    'Completed',
    'Abnormal'
  ]

  return Array.from({ length: count })
    .map((_, i) => {
      const id = i + 1
      const item = items[Math.floor(Math.random() * items.length)]
      const isRush = Math.random() > 0.85
      const status = isRush
        ? 'In Progress'
        : statuses[Math.floor(Math.random() * statuses.length)]
      const plannedQty = Math.floor(Math.random() * 500) + 100
      const actualQty =
        status === 'Completed'
          ? plannedQty
          : Math.floor(Math.random() * plannedQty)

      const sDate = dayjs().add(Math.floor(Math.random() * 20) - 5, 'day')
      const eDate = sDate.add(Math.floor(Math.random() * 10) + 1, 'day')

      return {
        key: id.toString(),
        woId: `MO-2026-${id.toString().padStart(4, '0')}`,
        itemCode: item.code,
        itemName: item.name,
        plannedQty,
        actualQty,
        startDate: sDate.format('YYYY-MM-DD'),
        endDate: eDate.format('YYYY-MM-DD'),
        machine: machines[Math.floor(Math.random() * machines.length)],
        operator: operators[Math.floor(Math.random() * operators.length)],
        status,
        yieldRate: 95 + Math.random() * 4.9,
        impactScore: Math.floor(Math.random() * 100),
        isRush
      }
    })
    .sort((a, b) => dayjs(b.startDate).valueOf() - dayjs(a.startDate).valueOf())
}

const initialMockData = generateWOMockData(150)

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
      isAlert && 'ring-1 ring-rose-200 bg-rose-50/20'
    )}
  >
    <div>
      <p className='text-[12px] text-slate-500 mb-0.5 font-bold'>{title}</p>
      <div className='flex items-baseline gap-1.5'>
        <span className='text-xl font-black text-slate-800 tracking-tight font-mono'>
          {value}
        </span>
        <span className='text-[10px] text-slate-400 font-bold'>{unit}</span>
      </div>
      {trend && (
        <div className={cn('mt-1 text-[10px] font-bold', colorClass)}>
          {trend}
        </div>
      )}
    </div>
    <div
      className={cn('p-2.5 rounded-xl', bgClass, isAlert && 'animate-pulse')}
    >
      <Icon size={20} className={iconColorClass} />
    </div>
  </div>
)

export default function WorkOrderList() {
  const [loading, setLoading] = useState<boolean>(true)
  const [orders, setOrders] = useState<WorkOrderItem[]>(initialMockData)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // Modal 狀態管理
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<WorkOrderItem | null>(null)
  const [detailOrder, setDetailOrder] = useState<WorkOrderItem | null>(null)

  // 額外的 Modal
  const [isRushModalOpen, setIsRushModalOpen] = useState(false)
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

  const [form] = Form.useForm()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(
    () => ({
      running: orders.filter(d => d.status === 'In Progress').length,
      abnormal: orders.filter(d => d.status === 'Abnormal').length,
      avgYield: '98.2%',
      todayTarget: '12,400'
    }),
    [orders]
  )

  // --- 生成篩選選單資料 ---
  const itemFilters = useMemo(() => {
    const uniqueItems = Array.from(new Set(orders.map(d => d.itemCode)))
    return uniqueItems.map(code => {
      const name = orders.find(d => d.itemCode === code)?.itemName
      return { text: `${code} ${name}`, value: code }
    })
  }, [orders])

  const woIdFilters = useMemo(() => {
    return orders.slice(0, 100).map(d => ({ text: d.woId, value: d.woId }))
  }, [orders])

  // --- 操作邏輯處理 ---
  const handleOpenEdit = (record?: WorkOrderItem) => {
    setEditingOrder(record || null)
    if (record) {
      form.setFieldsValue({
        ...record,
        dateRange: [dayjs(record.startDate), dayjs(record.endDate)]
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        status: 'Planned',
        plannedQty: 1000,
        actualQty: 0,
        yieldRate: 100,
        dateRange: [dayjs(), dayjs().add(3, 'day')]
      })
    }
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields()
      const formattedValues = {
        ...values,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD')
      }
      delete formattedValues.dateRange

      if (editingOrder) {
        setOrders(prev =>
          prev.map(o =>
            o.key === editingOrder.key ? { ...o, ...formattedValues } : o
          )
        )
        message.success(`工單 ${editingOrder.woId} 更新成功`)
      } else {
        const newId = `MO-2026-${(orders.length + 1).toString().padStart(4, '0')}`
        const newOrder: WorkOrderItem = {
          ...formattedValues,
          key: Date.now().toString(),
          woId: newId,
          itemName: 'Custom Custom Item', // 簡化處理
          actualQty: formattedValues.actualQty || 0,
          yieldRate: formattedValues.yieldRate || 100,
          impactScore: 20,
          isRush: false
        }
        setOrders([newOrder, ...orders])
        message.success(`新工單 ${newId} 建立成功`)
      }
      setIsEditModalOpen(false)
    } catch (e) {
      console.log('Validation Failed:', e)
    }
  }

  const handleStopWO = (record: WorkOrderItem) => {
    Modal.confirm({
      title: '確認強制結案',
      content: `確定要將工單 ${record.woId} 提早結案嗎？未完成的數量將轉為差異。`,
      okText: '強制結案',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        setOrders(prev =>
          prev.map(o =>
            o.key === record.key ? { ...o, status: 'Completed' } : o
          )
        )
        message.success(`工單 ${record.woId} 已強制結案`)
      }
    })
  }

  const handleTogglePause = (record: WorkOrderItem) => {
    const newStatus = record.status === 'Paused' ? 'In Progress' : 'Paused'
    setOrders(prev =>
      prev.map(o => (o.key === record.key ? { ...o, status: newStatus } : o))
    )
    message.success(
      `工單 ${record.woId} 已${newStatus === 'Paused' ? '暫停' : '恢復生產'}`
    )
  }

  const handleBatchStart = () => {
    message.loading({ content: '批量下發工單至機台...', key: 'batchStart' })
    setTimeout(() => {
      setOrders(prev =>
        prev.map(o => {
          if (selectedRowKeys.includes(o.key)) {
            return { ...o, status: 'In Progress' }
          }
          return o
        })
      )
      message.success({
        content: `已成功發放 ${selectedRowKeys.length} 筆工單至現場！`,
        key: 'batchStart'
      })
      setSelectedRowKeys([])
    }, 1000)
  }

  const handleBatchPause = () => {
    setOrders(prev =>
      prev.map(o => {
        if (selectedRowKeys.includes(o.key)) return { ...o, status: 'Paused' }
        return o
      })
    )
    message.warning(`已暫停選定的 ${selectedRowKeys.length} 筆工單`)
    setSelectedRowKeys([])
  }

  // 插單與分析 Handler
  const handleOpenRushConfirm = (record: WorkOrderItem) => {
    setDetailOrder(record)
    setIsRushModalOpen(true)
  }

  const handleConfirmRush = () => {
    if (!detailOrder) return
    setIsRushModalOpen(false)
    message.loading({ content: '重新分配產能與物料中...', key: 'rush' })

    setTimeout(() => {
      setOrders(prev =>
        prev.map(o => {
          if (o.key === detailOrder.key) {
            return {
              ...o,
              isRush: true,
              status: 'In Progress',
              actualQty: Math.max(o.actualQty, 5),
              impactScore: 85
            }
          }
          return o
        })
      )
      message.success({
        content: `訂單 ${detailOrder.woId} 已成功插排，優先級提升為「特急」！`,
        key: 'rush'
      })
    }, 1500)
  }

  const handleCancelRush = (record: WorkOrderItem) => {
    Modal.confirm({
      title: '確認移除急單優先權',
      content: `移除後 ${record.woId} 將恢復一般排程優先級，是否確認？`,
      okText: '確認移除',
      okType: 'danger',
      cancelText: '保留',
      onOk: () => {
        setOrders(prev =>
          prev.map(o => {
            if (o.key === record.key) {
              return { ...o, isRush: false, impactScore: 20 }
            }
            return o
          })
        )
        message.success(`已解除 ${record.woId} 的急單狀態`)
      }
    })
  }

  const handleOpenAnalyze = (record: WorkOrderItem) => {
    setDetailOrder(record)
    setIsAnalyzeModalOpen(true)
  }

  const handleOpenHistory = (record: WorkOrderItem) => {
    setDetailOrder(record)
    setIsHistoryModalOpen(true)
  }

  const handleMenuClick = (key: string, record: WorkOrderItem) => {
    if (key === 'details') {
      setDetailOrder(record)
      setIsDetailModalOpen(true)
    }
    if (key === 'edit') handleOpenEdit(record)
    if (key === 'pause_resume') handleTogglePause(record)
    if (key === 'stop') handleStopWO(record)
    if (key === 'rush') handleOpenRushConfirm(record)
    if (key === 'analyze') handleOpenAnalyze(record)
    if (key === 'history') handleOpenHistory(record)
    if (key === 'cancel_rush') handleCancelRush(record)
  }

  // --- UI 元件 ---
  const statsContent = (
    <div className='w-full max-w-120 p-1'>
      <div className='flex items-center gap-2 mb-4 border-b pb-2'>
        <Activity size={16} className='text-indigo-600' />
        <span className='font-bold text-slate-800'>生產現場即時看板</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='執行中工單'
          value={stats.running}
          unit='筆'
          icon={PlayCircle}
          colorClass='text-blue-600'
          bgClass='bg-blue-50'
          iconColorClass='text-blue-500'
        />
        <StatCard
          title='現場異常報工'
          value={stats.abnormal}
          unit='筆'
          icon={AlertTriangle}
          colorClass='text-rose-600'
          bgClass='bg-rose-50'
          iconColorClass='text-rose-500'
          trend='需立即處理'
          isAlert={stats.abnormal > 0}
        />
        <StatCard
          title='平均良率'
          value={stats.avgYield}
          unit='%'
          icon={CheckCircle2}
          colorClass='text-emerald-600'
          bgClass='bg-emerald-50'
          iconColorClass='text-emerald-500'
        />
        <StatCard
          title='今日計畫產出'
          value={stats.todayTarget}
          unit='PCS'
          icon={BarChart3}
          colorClass='text-slate-600'
          bgClass='bg-slate-50'
          iconColorClass='text-slate-500'
        />
      </div>
    </div>
  )

  const columns: ColumnsType<WorkOrderItem> = [
    {
      title: '工單編號',
      dataIndex: 'woId',
      key: 'woId',
      render: (text, record) => (
        <Space size={6}>
          <span
            className='font-mono font-black text-indigo-600 cursor-pointer hover:underline'
            onClick={() => {
              setDetailOrder(record)
              setIsDetailModalOpen(true)
            }}
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
      fixed: 'left',
      sorter: (a, b) => a.woId.localeCompare(b.woId),
      filters: woIdFilters,
      filterSearch: true,
      onFilter: (value, record) => record.woId === value
    },
    {
      title: '產品資訊',
      dataIndex: 'itemCode',
      key: 'itemInfo',
      minWidth: 200,
      sorter: (a, b) => a.itemCode.localeCompare(b.itemCode),
      filters: itemFilters,
      filterSearch: true,
      onFilter: (value, record) => record.itemCode === value,
      render: (code, record) => (
        <div className='flex items-center gap-2.5'>
          <div className='p-1.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-400 shrink-0'>
            <Package size={14} />
          </div>
          <div className='flex flex-col'>
            <span className='text-slate-800 font-black text-xs font-mono'>
              {code}
            </span>
            <span className='text-slate-500 text-[11px] font-bold truncate max-w-37.5'>
              {record.itemName}
            </span>
          </div>
        </div>
      )
    },
    {
      title: '計畫期間',
      key: 'dateRange',
      width: 190,
      sorter: (a, b) =>
        dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf(),
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters
      }: any) => (
        <div
          className='p-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100 w-[320px]'
          onKeyDown={e => e.stopPropagation()}
        >
          <div className='mb-3'>
            <span className='text-xs font-black text-slate-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider'>
              <CalendarDays size={14} /> 篩選計畫區間
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
              className='w-full rounded-xl border-slate-200 h-10'
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
              className='text-xs font-bold bg-indigo-600 border-none rounded-lg px-5 h-8 shadow-md shadow-indigo-200'
            >
              套用篩選
            </Button>
          </div>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <CalendarDays
          size={14}
          className={
            filtered
              ? 'text-indigo-600'
              : 'text-slate-400 hover:text-indigo-600'
          }
        />
      ),
      onFilter: (value: any, record) => {
        if (!value || value.length !== 2) return true
        const recordStart = dayjs(record.startDate).valueOf()
        const recordEnd = dayjs(record.endDate).valueOf()
        const filterStart = dayjs(value[0]).startOf('day').valueOf()
        const filterEnd = dayjs(value[1]).endOf('day').valueOf()
        // 只要工單區間與篩選區間有交集就算
        return recordStart <= filterEnd && recordEnd >= filterStart
      },
      render: (_, record) => (
        <div className='flex items-center gap-1.5 text-xs font-bold text-slate-600 font-mono'>
          <span>{dayjs(record.startDate).format('MM/DD')}</span>
          <ArrowRight size={10} className='text-slate-300' />
          <span>{dayjs(record.endDate).format('MM/DD')}</span>
        </div>
      )
    },
    {
      title: '生產進度',
      key: 'progress',
      width: 170,
      sorter: (a, b) => {
        const percentA = a.actualQty / a.plannedQty
        const percentB = b.actualQty / b.plannedQty
        return percentA - percentB
      },
      render: (_, record) => {
        const percent = Math.floor((record.actualQty / record.plannedQty) * 100)
        return (
          <div className='w-full pr-4'>
            <div className='flex justify-between items-end mb-1'>
              <span className='text-[10px] font-mono font-black text-slate-500'>
                <span
                  className={cn(
                    percent === 100 ? 'text-emerald-600' : 'text-slate-800'
                  )}
                >
                  {record.actualQty}
                </span>{' '}
                <span className='text-slate-300 mx-0.5'>/</span>{' '}
                {record.plannedQty}
              </span>
              <span
                className={cn(
                  'text-[10px] font-black',
                  record.status === 'Abnormal'
                    ? 'text-rose-500'
                    : 'text-indigo-600'
                )}
              >
                {percent}%
              </span>
            </div>
            <Progress
              percent={percent}
              size='small'
              status={record.status === 'Abnormal' ? 'exception' : 'active'}
              strokeColor={
                record.status === 'Completed' || percent === 100
                  ? '#10b981'
                  : '#4f46e5'
              }
              showInfo={false}
            />
          </div>
        )
      }
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      sorter: (a, b) => {
        const weight: Record<WorkOrderStatus, number> = {
          Abnormal: 6,
          'In Progress': 5,
          Paused: 4,
          Scheduled: 3,
          Planned: 2,
          Completed: 1
        }
        return weight[a.status] - weight[b.status]
      },
      filters: [
        { text: '異常 (Abnormal)', value: 'Abnormal' },
        { text: '生產中 (In Progress)', value: 'In Progress' },
        { text: '暫停 (Paused)', value: 'Paused' },
        { text: '已排產 (Scheduled)', value: 'Scheduled' },
        { text: '計畫中 (Planned)', value: 'Planned' },
        { text: '已完工 (Completed)', value: 'Completed' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: WorkOrderStatus) => {
        const statusMap: Record<
          WorkOrderStatus,
          { color: string; text: string; icon: any }
        > = {
          'In Progress': {
            color: 'processing',
            text: '生產中',
            icon: <PlayCircle size={10} className='mr-1 inline' />
          },
          Planned: {
            color: 'default',
            text: '計畫中',
            icon: <Clock size={10} className='mr-1 inline' />
          },
          Scheduled: {
            color: 'warning',
            text: '已排產',
            icon: <Clock size={10} className='mr-1 inline' />
          },
          Paused: {
            color: 'warning',
            text: '暫停',
            icon: <PauseCircle size={10} className='mr-1 inline' />
          },
          Completed: {
            color: 'success',
            text: '已完工',
            icon: <CheckCircle2 size={10} className='mr-1 inline' />
          },
          Abnormal: {
            color: 'error',
            text: '異常',
            icon: (
              <AlertTriangle size={10} className='mr-1 inline animate-pulse' />
            )
          }
        }
        const config = statusMap[status]
        return (
          <Tag
            color={config.color}
            className='rounded-full px-2.5 py-0.5 border-none flex items-center font-bold w-fit shadow-sm'
          >
            {config.icon} {config.text}
          </Tag>
        )
      }
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
                key: 'details',
                label: '報工明細',
                icon: <FileText size={14} className='text-indigo-500' />
              },
              {
                key: 'edit',
                label: '修改工單',
                icon: <Edit size={14} className='text-slate-500' />
              },
              {
                key: 'pause_resume',
                label: record.status === 'Paused' ? '恢復生產' : '暫停生產',
                icon:
                  record.status === 'Paused' ? (
                    <PlayCircle size={14} className='text-emerald-500' />
                  ) : (
                    <PauseCircle size={14} className='text-amber-500' />
                  ),
                disabled:
                  record.status === 'Completed' || record.status === 'Planned'
              },
              { type: 'divider' },
              {
                key: 'rush',
                label: '標記為急單',
                icon: <ArrowUpToLine size={14} className='text-amber-500' />,
                disabled: record.isRush
              },
              {
                key: 'analyze',
                label: '插單衝擊分析',
                icon: <Activity size={14} className='text-indigo-500' />
              },
              {
                key: 'history',
                label: '變更紀錄',
                icon: <History size={14} className='text-slate-500' />
              },
              {
                key: 'cancel_rush',
                label: '移除急單標籤',
                danger: true,
                disabled: !record.isRush
              },
              { type: 'divider' },
              {
                key: 'stop',
                label: '強制結案',
                danger: true,
                icon: <CheckCircle2 size={14} />,
                disabled: record.status === 'Completed'
              }
            ],
            onClick: ({ key }) => handleMenuClick(key, record)
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
      <div className='w-full min-h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-x-hidden'>
        <div className='mx-auto px-4 pt-4 pb-12 max-w-400 animate-fade-in'>
          {/* 全域 Loading 遮罩 */}
          {loading && (
            <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-110 flex items-center justify-center rounded-2xl'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin' />
                <span className='text-xs font-black text-indigo-600 tracking-widest uppercase'>
                  Fetching Work Orders...
                </span>
              </div>
            </div>
          )}

          {/* 玻璃透視頂部導航列 (Sticky Floating Header) */}
          <div className='flex flex-wrap items-center justify-between gap-y-4 bg-white/70 py-4 px-6 rounded-3xl sticky top-4 z-50 backdrop-blur-xl shadow-lg shadow-slate-200/50 border border-white/80 mb-6 transition-all'>
            <div className='flex items-center gap-4'>
              <div className='bg-linear-to-br from-indigo-500 to-indigo-700 p-3 rounded-2xl shadow-lg shadow-indigo-200/50 text-white shrink-0 hidden sm:block'>
                <ClipboardCheck size={28} />
              </div>
              <div className='flex gap-4 flex-wrap'>
                <p className='text-xs sm:text-sm font-bold text-slate-500 mt-1 m-0'>
                  即時監控工單進度與良率，並進行{' '}
                  <span className='text-indigo-500 mx-1'>分派、暫停、結案</span>{' '}
                  等現場操作。
                </p>
                <Popover
                  content={statsContent}
                  trigger='click'
                  placement='bottomLeft'
                  rootClassName='custom-stats-popover'
                >
                  <Badge
                    count={stats.abnormal}
                    offset={[10, 0]}
                    className='cursor-pointer hover:opacity-80 transition-opacity'
                  >
                    <Tag
                      color='error'
                      className='m-0 border-none font-black text-[10px] px-2 py-0.5 rounded items-center gap-1 cursor-pointer'
                    >
                      <AlertTriangle size={12} className='inline' />{' '}
                      {stats.abnormal} 異常
                    </Tag>
                  </Badge>
                </Popover>
              </div>
            </div>
            <div className='flex gap-2 ml-auto'>
              <Tooltip title='導出現場報表'>
                <Button
                  icon={<Printer size={16} />}
                  className='rounded-xl font-bold text-slate-600 h-11 px-4 border-slate-200 hover:text-indigo-600 hidden md:flex items-center justify-center'
                >
                  <span className='ml-1 text-sm'>列印派工單</span>
                </Button>
              </Tooltip>
              <Button
                type='primary'
                icon={<Plus size={16} />}
                className='bg-indigo-600 hover:bg-indigo-500 border-none shadow-md shadow-indigo-200 rounded-xl font-bold h-11 px-5 transition-transform active:scale-95 text-[14px]'
                onClick={() => handleOpenEdit()}
              >
                <span className='hidden sm:inline'>手動開立工單</span>
                <span className='sm:hidden'>開單</span>
              </Button>
            </div>
          </div>

          <Card
            className='shadow-xl shadow-slate-200/40 border-none rounded-3xl overflow-hidden p-0'
            styles={{ body: { padding: 0 } }}
          >
            <div className='flex flex-col'>
              {/* 批量操作提示列 */}
              {selectedRowKeys.length > 0 ? (
                <div className='bg-indigo-50/80 border-b border-indigo-100 p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300'>
                  <div className='flex items-center gap-2 text-indigo-700'>
                    <CheckCircle2
                      size={18}
                      className='text-indigo-600 shrink-0'
                    />
                    <span className='text-[15px] font-black tracking-tight'>
                      已選擇 {selectedRowKeys.length} 筆工單
                    </span>
                  </div>
                  <Space wrap>
                    <Button
                      type='primary'
                      size='middle'
                      className='rounded-xl font-bold text-xs bg-indigo-600 border-none shadow-md shadow-indigo-200'
                      onClick={handleBatchStart}
                    >
                      <PlayCircle size={14} className='mr-1 inline' />{' '}
                      批量發放至機台
                    </Button>
                    <Button
                      size='middle'
                      className='rounded-xl font-bold text-xs text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100'
                      onClick={handleBatchPause}
                    >
                      <PauseCircle size={14} className='mr-1 inline' />{' '}
                      批量暫停生產
                    </Button>
                    <Button
                      type='text'
                      size='middle'
                      onClick={() => setSelectedRowKeys([])}
                      className='text-slate-400 font-bold text-xs hover:bg-indigo-100 rounded-xl'
                    >
                      清除選取
                    </Button>
                  </Space>
                </div>
              ) : (
                <div className='flex flex-wrap items-center justify-between gap-4 py-4 px-6 border-b border-slate-50 bg-slate-50/50'>
                  <div className='text-slate-500 text-xs font-bold flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm'>
                    <Filter size={16} className='text-indigo-500 shrink-0' />
                    <span>
                      提示：點擊「計畫期間」表頭的日曆圖示，可自訂時間區間過濾工單。
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

          {/* --- Modal: 新增/編輯工單 --- */}
          <Modal
            title={
              <div className='flex items-center gap-2 border-b border-slate-100 pb-4 mb-2 mt-1 text-slate-800'>
                <div className='bg-indigo-100 p-2 rounded-xl text-indigo-600 shadow-inner shadow-indigo-200/50'>
                  <Edit size={20} />
                </div>
                <span className='font-black text-xl tracking-tight'>
                  {editingOrder
                    ? `修改工單: ${editingOrder.woId}`
                    : '建立新生產工單'}
                </span>
              </div>
            }
            open={isEditModalOpen}
            onOk={handleSaveEdit}
            onCancel={() => setIsEditModalOpen(false)}
            okText='儲存工單'
            cancelText='取消'
            okButtonProps={{
              className:
                'bg-indigo-600 hover:bg-indigo-500 border-none shadow-md shadow-indigo-200 rounded-xl font-bold px-8 h-11'
            }}
            cancelButtonProps={{
              className:
                'rounded-xl font-bold text-slate-500 border-slate-200 px-6 h-11 hover:bg-slate-50'
            }}
            className='custom-edit-modal top-6'
            width={720}
            destroyOnClose
          >
            <Form form={form} layout='vertical' className='mt-4 mb-2'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2'>
                <Form.Item
                  name='itemCode'
                  label={
                    <span className='font-bold text-slate-700 text-xs'>
                      生產產品 (Item)
                    </span>
                  }
                  rules={[{ required: true, message: '必填' }]}
                  className='col-span-1 sm:col-span-2'
                >
                  <Select
                    className='h-11 rounded-xl font-mono text-sm'
                    placeholder='選擇生產料號'
                    showSearch
                  >
                    <Select.Option value='IC-7022'>
                      IC-7022 - M3 Pro Mainboard
                    </Select.Option>
                    <Select.Option value='PN-4500'>
                      PN-4500 - Power Module X1
                    </Select.Option>
                    <Select.Option value='CH-9921'>
                      CH-9921 - Aluminum Chassis v4
                    </Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name='plannedQty'
                  label={
                    <span className='font-bold text-slate-700 text-xs'>
                      計畫生產數量 (PCS)
                    </span>
                  }
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    min={1}
                    className='h-11 rounded-xl border-slate-300 w-full pt-1.5 font-mono text-sm'
                  />
                </Form.Item>

                <Form.Item
                  name='status'
                  label={
                    <span className='font-bold text-slate-700 text-xs'>
                      初始狀態
                    </span>
                  }
                  rules={[{ required: true }]}
                >
                  <Select className='h-11 rounded-xl font-bold'>
                    <Select.Option value='Planned'>
                      計畫中 (Planned)
                    </Select.Option>
                    <Select.Option value='Scheduled'>
                      已排產 (Scheduled)
                    </Select.Option>
                    <Select.Option value='In Progress'>
                      生產中 (In Progress)
                    </Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name='dateRange'
                  label={
                    <span className='font-bold text-slate-700 text-xs'>
                      計畫生產區間 (Start - End)
                    </span>
                  }
                  rules={[{ required: true }]}
                  className='col-span-1 sm:col-span-2'
                >
                  <RangePicker className='h-11 rounded-xl border-slate-300 w-full font-mono text-sm' />
                </Form.Item>

                <Divider className='col-span-1 sm:col-span-2 border-slate-100 my-2' />

                <Form.Item
                  name='machine'
                  label={
                    <span className='font-bold text-slate-700 text-xs'>
                      指定設備/產線
                    </span>
                  }
                >
                  <Select
                    className='h-11 rounded-xl'
                    placeholder='選擇機台 (選填)'
                  >
                    <Select.Option value='CNC-01'>CNC-01</Select.Option>
                    <Select.Option value='SMT-A2'>SMT-A2</Select.Option>
                    <Select.Option value='ASM-L1'>
                      ASM-L1 (組裝線)
                    </Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name='operator'
                  label={
                    <span className='font-bold text-slate-700 text-xs'>
                      負責人員/班別
                    </span>
                  }
                >
                  <Input
                    className='h-11 rounded-xl border-slate-300'
                    placeholder='輸入作業員名稱或工號'
                  />
                </Form.Item>

                {editingOrder && (
                  <>
                    <Form.Item
                      name='actualQty'
                      label={
                        <span className='font-bold text-slate-700 text-xs'>
                          已完工數量 (手動校正)
                        </span>
                      }
                    >
                      <InputNumber
                        min={0}
                        className='h-11 rounded-xl border-slate-300 w-full pt-1.5 font-mono text-sm'
                      />
                    </Form.Item>
                    <Form.Item
                      name='yieldRate'
                      label={
                        <span className='font-bold text-slate-700 text-xs'>
                          當前良率 (%)
                        </span>
                      }
                    >
                      <InputNumber
                        min={0}
                        max={100}
                        step={0.1}
                        className='h-11 rounded-xl border-slate-300 w-full pt-1.5 font-mono text-sm'
                      />
                    </Form.Item>
                  </>
                )}
              </div>
            </Form>
          </Modal>

          {/* --- Modal: 工單明細履歷 (Details) --- */}
          <Modal
            title={null}
            open={isDetailModalOpen}
            onCancel={() => setIsDetailModalOpen(false)}
            footer={null}
            className='custom-edit-modal top-6'
            width={760}
          >
            {detailOrder &&
              (() => {
                const percent = Math.floor(
                  (detailOrder.actualQty / detailOrder.plannedQty) * 100
                )
                const isDone = detailOrder.status === 'Completed'
                const isAbnormal = detailOrder.status === 'Abnormal'

                return (
                  <div className='flex flex-col'>
                    {/* Header */}
                    <div className='flex items-start justify-between border-b border-slate-100 pb-5 mb-6 mt-2'>
                      <div className='flex items-center gap-4'>
                        <div
                          className={cn(
                            'p-3.5 rounded-2xl shadow-lg',
                            isAbnormal
                              ? 'bg-rose-500 shadow-rose-200'
                              : isDone
                                ? 'bg-emerald-500 shadow-emerald-200'
                                : 'bg-indigo-600 shadow-indigo-200'
                          )}
                        >
                          <FileText size={28} className='text-white' />
                        </div>
                        <div className='flex flex-col'>
                          <span className='font-black text-2xl tracking-tight text-slate-800 m-0 leading-none mb-2'>
                            現場報工與履歷
                          </span>
                          <div className='flex items-center gap-2'>
                            <span className='text-sm font-mono font-black text-indigo-600'>
                              {detailOrder.woId}
                            </span>
                            <Tag
                              className={cn(
                                'border-none font-bold rounded-md px-2 m-0',
                                isAbnormal
                                  ? 'bg-rose-100 text-rose-600'
                                  : isDone
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : 'bg-slate-100 text-slate-600'
                              )}
                            >
                              {detailOrder.status}
                            </Tag>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* KPIs Summary */}
                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6'>
                      <div className='bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-1.5'>
                        <span className='text-[10px] font-black uppercase text-slate-400 flex items-center gap-1'>
                          <Package size={12} /> 生產產品
                        </span>
                        <span
                          className='text-sm font-mono font-black text-slate-800 truncate'
                          title={detailOrder.itemCode}
                        >
                          {detailOrder.itemCode}
                        </span>
                      </div>
                      <div className='bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-1.5'>
                        <span className='text-[10px] font-black uppercase text-slate-400 flex items-center gap-1'>
                          <UserCheck size={12} /> 負責人員/機台
                        </span>
                        <span className='text-sm font-bold text-slate-700 truncate'>
                          {detailOrder.operator} @ {detailOrder.machine}
                        </span>
                      </div>
                      <div className='bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-1.5 col-span-2'>
                        <span className='text-[10px] font-black uppercase text-slate-400 flex items-center justify-between'>
                          <span>
                            <Activity size={12} className='inline mr-1' />{' '}
                            總體進度與良率
                          </span>
                          <span
                            className={cn(
                              'font-bold text-xs',
                              isAbnormal ? 'text-rose-500' : 'text-emerald-500'
                            )}
                          >
                            Yield: {detailOrder.yieldRate.toFixed(1)}%
                          </span>
                        </span>
                        <div className='flex items-end gap-2 mt-1'>
                          <span
                            className={cn(
                              'text-xl font-mono font-black leading-none',
                              percent === 100
                                ? 'text-emerald-600'
                                : 'text-indigo-600'
                            )}
                          >
                            {detailOrder.actualQty}
                          </span>
                          <span className='text-xs font-bold text-slate-400 leading-none mb-0.5'>
                            / {detailOrder.plannedQty} PCS
                          </span>
                        </div>
                        <Progress
                          percent={percent}
                          size='small'
                          showInfo={false}
                          strokeColor={
                            percent === 100
                              ? '#10b981'
                              : isAbnormal
                                ? '#ef4444'
                                : '#4f46e5'
                          }
                          className='mt-1'
                        />
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className='px-2'>
                      <h3 className='font-black text-sm text-slate-700 mb-5 flex items-center gap-2'>
                        <History size={16} className='text-indigo-500' />{' '}
                        報工與執行歷程
                      </h3>
                      <Timeline
                        items={[
                          {
                            color: 'green',
                            children: (
                              <div className='flex flex-col mb-3'>
                                <span className='text-sm font-black text-slate-700'>
                                  工單下發與機台就緒 (Release)
                                </span>
                                <span className='text-xs font-mono text-slate-400 mt-1'>
                                  {detailOrder.startDate} 08:00:00 | System
                                </span>
                              </div>
                            )
                          },
                          {
                            color: detailOrder.actualQty > 0 ? 'blue' : 'gray',
                            children: (
                              <div className='flex flex-col mb-3'>
                                <span
                                  className={cn(
                                    'text-sm font-black',
                                    detailOrder.actualQty > 0
                                      ? 'text-slate-700'
                                      : 'text-slate-400'
                                  )}
                                >
                                  首件檢查 (FAI) 與持續生產
                                </span>
                                {detailOrder.actualQty > 0 && (
                                  <span className='text-xs font-bold text-indigo-500 mt-1 bg-indigo-50 px-2 py-1 rounded w-fit'>
                                    已回報產出: {detailOrder.actualQty} PCS
                                  </span>
                                )}
                              </div>
                            )
                          },
                          ...(isAbnormal
                            ? [
                                {
                                  color: 'red',
                                  dot: (
                                    <AlertTriangle
                                      size={14}
                                      className='text-rose-500'
                                    />
                                  ),
                                  children: (
                                    <div className='flex flex-col mb-3'>
                                      <span className='text-sm font-black text-rose-600'>
                                        機台異常警報觸發 (Alarm)
                                      </span>
                                      <span className='text-xs font-bold text-rose-400 mt-1'>
                                        主軸溫度過高，設備已互鎖暫停
                                      </span>
                                    </div>
                                  )
                                }
                              ]
                            : []),
                          {
                            color: isDone ? 'green' : 'gray',
                            children: (
                              <div className='flex flex-col'>
                                <span
                                  className={cn(
                                    'text-sm font-black',
                                    isDone ? 'text-slate-700' : 'text-slate-400'
                                  )}
                                >
                                  工單結案入庫 (Complete)
                                </span>
                                <span className='text-xs font-mono text-slate-400 mt-1'>
                                  Expected: {detailOrder.endDate}
                                </span>
                              </div>
                            )
                          }
                        ]}
                      />
                    </div>

                    <div className='mt-8 flex justify-end gap-3'>
                      <Button
                        size='large'
                        className='h-11 rounded-xl font-bold text-slate-500 bg-white border-slate-200 hover:bg-slate-50 px-8'
                        onClick={() => setIsDetailModalOpen(false)}
                      >
                        關閉
                      </Button>
                    </div>
                  </div>
                )
              })()}
          </Modal>

          {/* --- Modal: 插單確認彈窗 --- */}
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
                    {detailOrder ? '確認執行緊急插單' : '全局插單排程引擎'}
                  </h3>
                  <p className='text-slate-500 font-bold text-xs mt-1 m-0'>
                    {detailOrder
                      ? `目標工單：${detailOrder.woId}`
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
                  確認標記為急單
                </Button>
              </div>
            </div>
          </Modal>

          {/* --- Modal: 衝擊分析彈窗 --- */}
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
            {detailOrder && (
              <div className='flex flex-col gap-4 mt-2'>
                <div className='bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between'>
                  <div>
                    <span className='text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1'>
                      Target Work Order
                    </span>
                    <span className='text-lg font-black text-slate-800 font-mono'>
                      {detailOrder.woId}
                    </span>
                  </div>
                  <Tag
                    color='volcano'
                    className='border-none font-bold rounded px-3 py-1 m-0 shadow-sm'
                  >
                    若標記為急單
                  </Tag>
                </div>

                <div className='mb-2'>
                  <span className='text-sm font-black text-slate-700 flex items-center gap-2 mb-3'>
                    <TrendingDown size={16} className='text-rose-500' />{' '}
                    預測受排擠而延遲之工單
                  </span>
                  <div className='bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm'>
                    <Table
                      size='small'
                      pagination={false}
                      dataSource={[
                        { key: '1', id: 'MO-2026-0042', delay: 2 },
                        { key: '2', id: 'MO-2026-0088', delay: 1 },
                        { key: '3', id: 'MO-2026-0105', delay: 3 }
                      ]}
                      columns={[
                        {
                          title: '工單編號',
                          dataIndex: 'id',
                          render: t => (
                            <span className='font-mono text-xs font-bold text-slate-600'>
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
                      該插單將導致 3
                      筆一般工單延遲交貨，建議安排週末加班以消化溢出的產能需求。
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Modal>

          {/* --- Modal: 變更紀錄彈窗 --- */}
          <Modal
            title={
              <div className='flex items-center gap-2 border-b border-slate-100 pb-4 mb-2 mt-1'>
                <div className='bg-slate-100 p-2 rounded-xl text-slate-600'>
                  <History size={20} />
                </div>
                <span className='font-black text-xl tracking-tight'>
                  工單變更紀錄 (Audit Trail)
                </span>
              </div>
            }
            open={isHistoryModalOpen}
            onCancel={() => setIsHistoryModalOpen(false)}
            footer={null}
            width={520}
            className='custom-edit-modal'
          >
            {detailOrder && (
              <div className='mt-6 px-4'>
                <Timeline
                  items={[
                    {
                      color: 'green',
                      children: (
                        <div className='flex flex-col mb-4'>
                          <span className='text-xs font-bold text-slate-700'>
                            工單建檔，進入 APS 排程
                          </span>
                          <span className='text-[10px] font-mono text-slate-400 mt-1'>
                            {detailOrder.startDate} 09:12:45
                          </span>
                        </div>
                      )
                    },
                    {
                      color: 'blue',
                      children: (
                        <div className='flex flex-col mb-4'>
                          <span className='text-xs font-bold text-slate-700'>
                            系統自動計算機台載荷
                          </span>
                          <span className='text-[10px] font-mono text-slate-400 mt-1'>
                            {detailOrder.startDate} 10:05:22
                          </span>
                        </div>
                      )
                    },
                    ...(detailOrder.isRush
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
                                  生管介入：手動標記為急單
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
              border: 1px solid #e0e7ff;
              box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.1) !important;
            }

            /* Custom Modal Styles */
            .custom-edit-modal .ant-modal-content {
              border-radius: 24px !important;
              padding: 28px !important;
              border: 1px solid #f1f5f9;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
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
