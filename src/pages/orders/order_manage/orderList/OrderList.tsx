import React, { useState, useEffect, useMemo } from 'react'
import {
  Table,
  Tag,
  Button,
  Card,
  Progress,
  Badge,
  Dropdown,
  DatePicker,
  Popover,
  Tooltip,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Steps
} from 'antd'
import {
  Plus,
  Download,
  MoreVertical,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ClipboardList,
  ChevronDown,
  BarChart3,
  Zap,
  Info,
  FileText,
  Edit,
  Trash2,
  CalendarDays,
  PlayCircle,
  Package
} from 'lucide-react'
import type { ColumnsType, TableProps } from 'antd/es/table'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import dayjs from 'dayjs'

// 輕量版 cn 函數
function cn(...classes: (string | undefined | null | false)[]) {
  return twMerge(clsx(classes))
}

// const { RangePicker } = DatePicker

// --- 型別定義 ---
type PriorityType = 'Urgent' | 'High' | 'Medium' | 'Low'
type OrderStatusType = 'In Production' | 'Pending' | 'Completed' | 'Delayed'

interface OrderItem {
  key: string
  orderId: string
  customer: string
  orderDate: string
  deliveryDate: string
  priority: PriorityType
  status: OrderStatusType
  progress: number
  amount: number
  items: number
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
const generateMockData = (count: number): OrderItem[] => {
  const customers = [
    'Tesla Giga Factory',
    'Apple Inc.',
    'SpaceX',
    'TSMC',
    'NVIDIA',
    'Intel Corp',
    'Samsung Electronics',
    'Amazon Robotics',
    'Microsoft Hardware',
    'Google Data Center'
  ]
  const priorities: PriorityType[] = ['Urgent', 'High', 'Medium', 'Low']
  const statuses: OrderStatusType[] = [
    'In Production',
    'Pending',
    'Completed',
    'Delayed'
  ]

  return Array.from({ length: count }).map((_, i) => {
    const id = i + 1
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const priority = priorities[Math.floor(Math.random() * priorities.length)]

    let progress = 0
    if (status === 'Completed') progress = 100
    else if (status === 'In Production' || status === 'Delayed')
      progress = Math.floor(Math.random() * 90) + 5

    const date = new Date('2026-04-10')
    date.setDate(date.getDate() + Math.floor(Math.random() * 60) - 10)
    const deliveryDate = date.toISOString().split('T')[0]

    return {
      key: id.toString(),
      orderId: `ORD-2026-${id.toString().padStart(3, '0')}`,
      customer: customers[Math.floor(Math.random() * customers.length)],
      orderDate: '2026-03-01',
      deliveryDate: deliveryDate,
      priority,
      status,
      progress,
      amount: Math.floor(Math.random() * 1000000) + 10000,
      items: Math.floor(Math.random() * 500) + 1
    }
  })
}

const initialMockData = generateMockData(150)

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

export default function OrderList() {
  const [loading, setLoading] = useState<boolean>(true)
  const [orders, setOrders] = useState<OrderItem[]>(initialMockData)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // Modal 狀態管理
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<OrderItem | null>(null)
  const [detailOrder, setDetailOrder] = useState<OrderItem | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(
    () => ({
      pending: orders.filter(d => d.status === 'Pending').length,
      production: orders.filter(d => d.status === 'In Production').length,
      delayed: orders.filter(d => d.status === 'Delayed').length,
      completed: orders.filter(d => d.status === 'Completed').length
    }),
    [orders]
  )

  const customerFilters = useMemo(() => {
    const uniqueCustomers = Array.from(new Set(orders.map(d => d.customer)))
    return uniqueCustomers.map(c => ({ text: c, value: c }))
  }, [orders])

  const orderIdFilters = useMemo(() => {
    return orders
      .map(d => ({ text: d.orderId, value: d.orderId }))
      .slice(0, 100) // 限制數量避免效能問題
  }, [orders])

  // --- 操作邏輯處理 ---
  const handleDelete = (record: OrderItem) => {
    Modal.confirm({
      title: '確認刪除訂單',
      content: `確定要刪除訂單 ${record.orderId} (${record.customer}) 嗎？此操作無法還原。`,
      okText: '確認刪除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        setOrders(prev => prev.filter(o => o.key !== record.key))
        message.success(`已成功刪除訂單 ${record.orderId}`)
      }
    })
  }

  const handleBatchDelete = () => {
    Modal.confirm({
      title: '確認批量取消訂單',
      content: `確定要取消選中的 ${selectedRowKeys.length} 筆訂單嗎？此操作無法還原。`,
      okText: '確認取消',
      okType: 'danger',
      cancelText: '保留',
      onOk: () => {
        setOrders(prev => prev.filter(o => !selectedRowKeys.includes(o.key)))
        setSelectedRowKeys([])
        message.success(`已成功批量取消 ${selectedRowKeys.length} 筆訂單`)
      }
    })
  }

  const handleBatchSchedule = () => {
    message.loading({
      content: 'APS 引擎批量排產運算中...',
      key: 'batchSchedule'
    })
    setTimeout(() => {
      setOrders(prev =>
        prev.map(o => {
          if (selectedRowKeys.includes(o.key)) {
            return {
              ...o,
              status: 'In Production',
              priority: 'High',
              progress: 5
            }
          }
          return o
        })
      )
      message.success({
        content: `已將 ${selectedRowKeys.length} 筆訂單排入生產計畫！`,
        key: 'batchSchedule'
      })
      setSelectedRowKeys([])
    }, 1500)
  }

  const handleSchedule = (record: OrderItem) => {
    message.loading({
      content: `正在為 ${record.orderId} 尋找最佳插單空檔...`,
      key: 'schedule'
    })
    setTimeout(() => {
      setOrders(prev =>
        prev.map(o =>
          o.key === record.key
            ? {
                ...o,
                status: 'In Production',
                priority: 'Urgent',
                progress: Math.max(o.progress, 5)
              }
            : o
        )
      )
      message.success({
        content: `訂單 ${record.orderId} 插排成功，優先級已提升為特急！`,
        key: 'schedule'
      })
    }, 1000)
  }

  const openEditModal = (record?: OrderItem) => {
    setEditingOrder(record || null)
    if (record) {
      form.setFieldsValue({
        ...record,
        deliveryDate: dayjs(record.deliveryDate)
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        priority: 'Medium',
        status: 'Pending',
        progress: 0,
        deliveryDate: dayjs().add(14, 'day')
      })
    }
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields()
      const formattedValues = {
        ...values,
        deliveryDate: values.deliveryDate.format('YYYY-MM-DD')
      }

      if (editingOrder) {
        // Update
        setOrders(prev =>
          prev.map(o =>
            o.key === editingOrder.key ? { ...o, ...formattedValues } : o
          )
        )
        message.success(`訂單 ${editingOrder.orderId} 更新成功`)
      } else {
        // Create
        const newId = `ORD-2026-${(orders.length + 1).toString().padStart(3, '0')}`
        const newOrder: OrderItem = {
          ...formattedValues,
          key: Date.now().toString(),
          orderId: newId,
          orderDate: dayjs().format('YYYY-MM-DD'),
          items: values.items || Math.floor(Math.random() * 100) + 1,
          amount: values.amount || Math.floor(Math.random() * 500000) + 10000
        }
        setOrders([newOrder, ...orders])
        message.success(`新訂單 ${newId} 建立成功`)
      }
      setIsEditModalOpen(false)
    } catch (e) {
      console.log('Validation Failed:', e)
    }
  }

  const openDetailModal = (record: OrderItem) => {
    setDetailOrder(record)
    setIsDetailModalOpen(true)
  }

  // --- 菜單點擊路由 ---
  const handleMenuClick = (key: string, record: OrderItem) => {
    if (key === 'details') openDetailModal(record)
    if (key === 'edit') openEditModal(record)
    if (key === 'schedule') handleSchedule(record)
    if (key === 'delete') handleDelete(record)
  }

  const statsContent = (
    <div className='w-full max-w-120 py-1'>
      <div className='flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5'>
        <BarChart3 size={16} className='text-blue-600' />
        <span className='font-bold text-slate-800'>生產指標詳情</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='待處理訂單'
          value={stats.pending}
          unit='筆'
          icon={ClipboardList}
          colorClass='text-blue-600'
          bgClass='bg-blue-50'
          iconColorClass='text-blue-500'
        />
        <StatCard
          title='生產中訂單'
          value={stats.production}
          unit='筆'
          icon={Clock}
          colorClass='text-indigo-600'
          bgClass='bg-indigo-50'
          iconColorClass='text-indigo-500'
        />
        <StatCard
          title='逾期警告'
          value={stats.delayed}
          unit='筆'
          icon={AlertTriangle}
          colorClass='text-rose-600'
          bgClass='bg-rose-50'
          iconColorClass='text-rose-500'
          trend='+12% 較上月'
          isAlert={stats.delayed > 0}
        />
        <StatCard
          title='歷史已交付'
          value={stats.completed}
          unit='筆'
          icon={CheckCircle2}
          colorClass='text-emerald-600'
          bgClass='bg-emerald-50'
          iconColorClass='text-emerald-500'
          trend='+45 較上月'
        />
      </div>
      <div className='mt-4 bg-slate-50 p-2.5 rounded-lg text-[11px] text-slate-400 flex items-start gap-2'>
        <Info size={14} className='shrink-0 mt-0.5' />
        <span>數據每 5 分鐘自動更新，當前顯示為系統即時計算結果。</span>
      </div>
    </div>
  )

  const columns: ColumnsType<OrderItem> = [
    {
      title: '訂單編號',
      dataIndex: 'orderId',
      key: 'orderId',
      fixed: 'left',
      render: (text: string, record) => (
        <span
          className='font-mono font-bold text-blue-600 cursor-pointer hover:underline'
          onClick={() => openDetailModal(record)}
        >
          {text}
        </span>
      ),
      sorter: (a, b) => a.orderId.localeCompare(b.orderId),
      width: 150,
      filters: orderIdFilters,
      filterSearch: true,
      onFilter: (value, record) => record.orderId === value
    },
    {
      title: '客戶名稱',
      dataIndex: 'customer',
      key: 'customer',
      render: (text: string) => (
        <span className='text-slate-700 font-medium'>{text}</span>
      ),
      ellipsis: true,
      minWidth: 180,
      sorter: (a, b) => a.customer.localeCompare(b.customer),
      filters: customerFilters,
      filterSearch: true,
      onFilter: (value, record) => record.customer === value
    },
    {
      title: '優先級',
      dataIndex: 'priority',
      key: 'priority',
      width: 130,
      sorter: (a, b) => {
        const weight: Record<PriorityType, number> = {
          Urgent: 4,
          High: 3,
          Medium: 2,
          Low: 1
        }
        return weight[a.priority] - weight[b.priority]
      },
      filters: [
        { text: '特急', value: 'Urgent' },
        { text: '高', value: 'High' },
        { text: '一般', value: 'Medium' },
        { text: '低', value: 'Low' }
      ],
      onFilter: (value, record) => record.priority === value,
      render: (priority: PriorityType) => {
        const config = {
          Urgent: { color: 'volcano', label: '特急' },
          High: { color: 'orange', label: '高' },
          Medium: { color: 'blue', label: '一般' },
          Low: { color: 'default', label: '低' }
        }
        const { color, label } = config[priority]
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
      title: '生產進度',
      key: 'progress',
      width: 140,
      sorter: (a, b) => a.progress - b.progress,
      render: (_, record) => (
        <div className='w-full'>
          <Progress
            percent={record.progress}
            size='small'
            status={record.status === 'Delayed' ? 'exception' : 'active'}
            strokeColor={record.progress === 100 ? '#10b981' : ''}
          />
        </div>
      )
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      sorter: (a, b) => {
        const weight: Record<OrderStatusType, number> = {
          Delayed: 4,
          'In Production': 3,
          Pending: 2,
          Completed: 1
        }
        return weight[a.status] - weight[b.status]
      },
      filters: [
        { text: '生產中', value: 'In Production' },
        { text: '待排產', value: 'Pending' },
        { text: '已完工', value: 'Completed' },
        { text: '延遲中', value: 'Delayed' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: OrderStatusType) => {
        const statusMap: Record<
          OrderStatusType,
          {
            color: 'processing' | 'default' | 'success' | 'error'
            text: string
          }
        > = {
          'In Production': { color: 'processing', text: '生產中' },
          Pending: { color: 'default', text: '待排產' },
          Completed: { color: 'success', text: '已完工' },
          Delayed: { color: 'error', text: '延遲中' }
        }
        const config = statusMap[status]
        return (
          <Badge
            status={config.color}
            text={config.text}
            className='font-medium'
          />
        )
      }
    },
    {
      title: '預計交期',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      width: 170,
      sorter: (a, b) =>
        new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime(),
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters
      }: any) => (
        <div
          className='p-3 bg-white rounded-2xl shadow-xl border border-slate-100 w-75'
          onKeyDown={e => e.stopPropagation()}
        >
          <div className='mb-3'>
            <span className='text-xs font-bold text-slate-500 mb-1.5 block'>
              選擇交期區間
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
          <div className='flex justify-between items-center'>
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
              className='text-xs font-bold bg-blue-600 border-none rounded-lg px-4'
            >
              篩選
            </Button>
          </div>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <CalendarDays
          size={14}
          className={
            filtered ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }
        />
      ),
      onFilter: (value: any, record) => {
        if (!value || value.length !== 2) return true
        const recordTime = dayjs(record.deliveryDate).valueOf()
        const startTime = dayjs(value[0]).startOf('day').valueOf()
        const endTime = dayjs(value[1]).endOf('day').valueOf()
        return recordTime >= startTime && recordTime <= endTime
      },
      render: (date: string, record) => (
        <span
          className={cn(
            'font-medium',
            record.status === 'Delayed'
              ? 'text-rose-500 font-bold'
              : 'text-slate-600'
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
                key: 'details',
                label: '訂單詳情',
                icon: <FileText size={14} className='text-blue-500' />
              },
              {
                key: 'edit',
                label: '修改訂單',
                icon: <Edit size={14} className='text-slate-500' />
              },
              {
                key: 'schedule',
                label: '插單排程',
                icon: <CalendarDays size={14} className='text-indigo-500' />,
                disabled: record.status === 'Completed'
              },
              { key: 'divider', type: 'divider' },
              {
                key: 'delete',
                label: '取消訂單',
                danger: true,
                icon: <Trash2 size={14} />
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

  const rowSelection: TableProps<OrderItem>['rowSelection'] = {
    selectedRowKeys,
    onChange: keys => setSelectedRowKeys(keys),
    fixed: 'left'
  }

  return (
    <div className='w-full h-full bg-slate-50/50 p-4'>
      <div className='mx-auto px-2 pt-2 pb-8 space-y-4 animate-fade-in relative'>
        {/* 全域 Loading 遮罩 */}
        {loading && (
          <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-110 flex items-center justify-center rounded-2xl'>
            <div className='flex flex-col items-center gap-3'>
              <div className='w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin' />
              <span className='text-xs font-black text-blue-600 tracking-widest uppercase'>
                Fetching Order Data...
              </span>
            </div>
          </div>
        )}

        {/* 頂部導航列 */}
        <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/50 py-2 rounded-xl sticky top-0 z-20 backdrop-blur-sm'>
          <div className='flex items-center gap-3'>
            <div className='bg-blue-600 p-1.5 rounded-lg shadow-blue-200 shadow-lg'>
              <BarChart3 size={18} className='text-white' />
            </div>
            <div className='flex items-center'>
              <Popover
                content={statsContent}
                trigger='click'
                placement='bottomLeft'
                rootClassName='custom-stats-popover'
              >
                <div className='flex items-center gap-2 cursor-pointer hover:bg-white px-2 sm:px-3 py-1.5 rounded-full transition-all group border border-transparent hover:border-slate-100'>
                  <span className='text-sm font-bold text-slate-600 group-hover:text-blue-600 whitespace-nowrap'>
                    即時概覽
                  </span>
                  <div className='flex gap-1'>
                    <Badge
                      count={stats.pending}
                      style={{
                        backgroundColor: '#3b82f6',
                        fontSize: '10px',
                        boxShadow: 'none'
                      }}
                    />
                    <Badge
                      count={stats.delayed}
                      style={{
                        backgroundColor: '#f43f5e',
                        fontSize: '10px',
                        boxShadow: 'none'
                      }}
                    />
                  </div>
                  <ChevronDown
                    size={14}
                    className='text-slate-400 group-hover:text-blue-600'
                  />
                </div>
              </Popover>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Tooltip title='導出 Excel 報表'>
              <Button
                icon={<Download size={16} />}
                className='rounded-xl font-medium h-10 flex items-center justify-center'
              >
                <span className='hidden lg:inline ml-1 text-xs'>匯出報表</span>
              </Button>
            </Tooltip>
            <Button
              type='primary'
              icon={<Plus size={16} />}
              className='rounded-xl bg-blue-600 shadow-md shadow-blue-100 font-bold border-none h-10 flex items-center justify-center'
              onClick={() => openEditModal()}
            >
              <span className='hidden sm:inline ml-1 text-xs'>建立訂單</span>
            </Button>
          </div>
        </div>

        <Card
          className='shadow-sm border-none rounded-2xl overflow-hidden p-0'
          styles={{ body: { padding: 0 } }}
        >
          <div className='flex flex-col'>
            {/* 表格工具列 */}
            <div className='flex flex-wrap items-center justify-between gap-4 py-4 px-4 border-b border-slate-50'>
              <div className='flex flex-wrap items-center gap-3 flex-1'>
                <div className='text-slate-400 text-[11px] flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100'>
                  <Info size={14} className='text-blue-400 shrink-0' />
                  <span className='hidden sm:inline'>
                    提示：點擊各欄位表頭可進行精確篩選或排序。點選訂單編號可查看進度。
                  </span>
                  <span className='sm:hidden'>
                    點選表頭篩選，點編號看詳情。
                  </span>
                </div>
              </div>
            </div>

            {/* 批量操作提示 */}
            {selectedRowKeys.length > 0 && (
              <div className='mx-4 mt-4 bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300'>
                <div className='flex items-center gap-2 text-blue-700'>
                  <Zap size={16} className='fill-blue-700 shrink-0' />
                  <span className='text-sm font-bold text-blue-700'>
                    已選擇 {selectedRowKeys.length} 筆訂單
                  </span>
                </div>
                <Space wrap>
                  <Button
                    type='primary'
                    size='small'
                    className='rounded-lg font-bold text-xs bg-indigo-600 border-none shadow-md shadow-indigo-200'
                    onClick={handleBatchSchedule}
                  >
                    批量排產 (APS)
                  </Button>
                  <Button
                    danger
                    size='small'
                    className='rounded-lg font-bold text-xs'
                    onClick={handleBatchDelete}
                  >
                    批量取消
                  </Button>
                  <Button
                    type='text'
                    size='small'
                    onClick={() => setSelectedRowKeys([])}
                    className='text-slate-400 text-xs'
                  >
                    清除選取
                  </Button>
                </Space>
              </div>
            )}

            <div className='overflow-x-auto'>
              <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={orders}
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: total => `共計 ${total} 筆`,
                  className: '!px-4 pb-4'
                }}
                scroll={{ x: 1000 }}
              />
            </div>
          </div>
        </Card>

        {/* --- Modal: 新增/編輯訂單 --- */}
        <Modal
          title={
            <div className='flex items-center gap-2 border-b border-slate-100 pb-3 mb-1 text-slate-800'>
              <div className='bg-blue-100 p-1.5 rounded-lg text-blue-600'>
                <Edit size={18} />
              </div>
              <span className='font-black text-lg'>
                {editingOrder ? '修改訂單資料' : '建立新訂單'}
              </span>
            </div>
          }
          open={isEditModalOpen}
          onOk={handleSaveEdit}
          onCancel={() => setIsEditModalOpen(false)}
          okText='儲存設定'
          cancelText='取消'
          okButtonProps={{
            className:
              'bg-blue-600 hover:bg-blue-500 border-none shadow-md shadow-blue-200 rounded-xl font-bold px-6 h-10'
          }}
          cancelButtonProps={{
            className:
              'rounded-xl font-bold text-slate-500 border-slate-200 px-6 h-10 hover:bg-slate-50'
          }}
          className='custom-hmi-modal'
          width={600}
        >
          <Form form={form} layout='vertical' className='mt-4 mb-2'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1'>
              <Form.Item
                name='customer'
                label={
                  <span className='font-bold text-slate-600 text-xs'>
                    客戶名稱
                  </span>
                }
                rules={[{ required: true, message: '必填' }]}
                className='col-span-1 sm:col-span-2'
              >
                <Input
                  className='h-10 rounded-xl border-slate-300'
                  placeholder='輸入客戶名稱'
                />
              </Form.Item>
              <Form.Item
                name='priority'
                label={
                  <span className='font-bold text-slate-600 text-xs'>
                    緊急程度 (Priority)
                  </span>
                }
                rules={[{ required: true }]}
              >
                <Select className='h-10 rounded-xl font-bold'>
                  <Select.Option value='Urgent'>
                    <span className='text-rose-500'>特急 (Urgent)</span>
                  </Select.Option>
                  <Select.Option value='High'>
                    <span className='text-orange-500'>高 (High)</span>
                  </Select.Option>
                  <Select.Option value='Medium'>
                    <span className='text-blue-500'>一般 (Medium)</span>
                  </Select.Option>
                  <Select.Option value='Low'>低 (Low)</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name='status'
                label={
                  <span className='font-bold text-slate-600 text-xs'>
                    訂單狀態
                  </span>
                }
                rules={[{ required: true }]}
              >
                <Select className='h-10 rounded-xl font-bold'>
                  <Select.Option value='Pending'>待排產</Select.Option>
                  <Select.Option value='In Production'>生產中</Select.Option>
                  <Select.Option value='Delayed'>延遲中</Select.Option>
                  <Select.Option value='Completed'>已完工</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name='deliveryDate'
                label={
                  <span className='font-bold text-slate-600 text-xs'>
                    預計交期 (Delivery Date)
                  </span>
                }
                rules={[{ required: true }]}
              >
                <DatePicker className='h-10 rounded-xl border-slate-300 w-full font-mono text-sm' />
              </Form.Item>
              <Form.Item
                name='amount'
                label={
                  <span className='font-bold text-slate-600 text-xs'>
                    訂單金額 (USD)
                  </span>
                }
              >
                <InputNumber
                  className='h-10 rounded-xl border-slate-300 w-full pt-1 font-mono'
                  formatter={value =>
                    `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
              <Form.Item
                name='progress'
                label={
                  <span className='font-bold text-slate-600 text-xs'>
                    完工比例 (%)
                  </span>
                }
                className='col-span-1 sm:col-span-2 mb-0'
              >
                <InputNumber
                  min={0}
                  max={100}
                  className='h-10 rounded-xl border-slate-300 w-full sm:w-1/2 pt-1 font-mono'
                />
              </Form.Item>
            </div>
          </Form>
        </Modal>

        {/* --- Modal: 訂單詳情履歷 --- */}
        <Modal
          title={null}
          open={isDetailModalOpen}
          onCancel={() => setIsDetailModalOpen(false)}
          footer={null}
          className='custom-hmi-modal'
          width={720}
        >
          {detailOrder && (
            <div className='flex flex-col'>
              {/* Header */}
              <div className='flex items-start justify-between border-b border-slate-100 pb-5 mb-5 mt-2'>
                <div className='flex items-center gap-3'>
                  <div className='bg-blue-600 p-3 rounded-xl shadow-md shadow-blue-200'>
                    <Package size={24} className='text-white' />
                  </div>
                  <div className='flex flex-col'>
                    <span className='font-black text-xl tracking-tight text-slate-800'>
                      訂單履歷與進度追蹤
                    </span>
                    <div className='flex items-center gap-2 mt-1'>
                      <span className='text-sm font-mono font-black text-blue-600'>
                        {detailOrder.orderId}
                      </span>
                      <span className='text-slate-300'>|</span>
                      <span className='text-xs font-bold text-slate-500'>
                        {detailOrder.customer}
                      </span>
                    </div>
                  </div>
                </div>
                <Tag
                  color={
                    detailOrder.priority === 'Urgent'
                      ? 'volcano'
                      : detailOrder.priority === 'High'
                        ? 'orange'
                        : 'blue'
                  }
                  className='border-none font-bold rounded px-2 m-0 mt-1'
                >
                  {detailOrder.priority}
                </Tag>
              </div>

              {/* Data Summary */}
              <div className='bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4'>
                <div className='flex flex-col gap-1'>
                  <span className='text-[10px] font-bold text-slate-400'>
                    訂單日期
                  </span>
                  <span className='text-sm font-mono font-bold text-slate-700'>
                    {detailOrder.orderDate}
                  </span>
                </div>
                <div className='flex flex-col gap-1'>
                  <span className='text-[10px] font-bold text-slate-400'>
                    要求交期
                  </span>
                  <span
                    className={cn(
                      'text-sm font-mono font-bold',
                      detailOrder.status === 'Delayed'
                        ? 'text-rose-500'
                        : 'text-slate-700'
                    )}
                  >
                    {detailOrder.deliveryDate}
                  </span>
                </div>
                <div className='flex flex-col gap-1'>
                  <span className='text-[10px] font-bold text-slate-400'>
                    總數量 (PCS)
                  </span>
                  <span className='text-sm font-mono font-bold text-slate-700'>
                    {detailOrder.items.toLocaleString()}
                  </span>
                </div>
                <div className='flex flex-col gap-1'>
                  <span className='text-[10px] font-bold text-slate-400'>
                    總金額 (USD)
                  </span>
                  <span className='text-sm font-mono font-black text-blue-600'>
                    ${detailOrder.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Timeline Steps */}
              <div>
                <div className='flex items-center justify-between mb-5'>
                  <span className='font-bold text-slate-700 text-sm flex items-center gap-1.5'>
                    <PlayCircle size={16} className='text-blue-500' />{' '}
                    生產追蹤節點
                  </span>
                  <span className='text-xs font-bold text-slate-400 font-mono'>
                    Progress: {detailOrder.progress}%
                  </span>
                </div>
                <div className='px-4'>
                  <Steps
                    direction='vertical'
                    size='small'
                    current={
                      detailOrder.status === 'Pending'
                        ? 1
                        : detailOrder.status === 'In Production' ||
                            detailOrder.status === 'Delayed'
                          ? 2
                          : 3
                    }
                    status={
                      detailOrder.status === 'Delayed' ? 'error' : 'process'
                    }
                    items={[
                      {
                        title: (
                          <span className='font-bold text-sm text-slate-700'>
                            業務接單與建檔
                          </span>
                        ),
                        description: (
                          <span className='text-[11px] font-mono text-slate-400 pb-3 block mt-1'>
                            {detailOrder.orderDate} | 系統自動確認
                          </span>
                        )
                      },
                      {
                        title: (
                          <span
                            className={cn(
                              'font-bold text-sm',
                              detailOrder.status !== 'Pending'
                                ? 'text-slate-700'
                                : 'text-slate-400'
                            )}
                          >
                            APS 排程計畫確認
                          </span>
                        ),
                        description: (
                          <span className='text-[11px] font-mono text-slate-400 pb-3 block mt-1'>
                            {detailOrder.status === 'Pending'
                              ? '等待生管排入計畫...'
                              : '已分配至主力產線'}
                          </span>
                        )
                      },
                      {
                        title: (
                          <span
                            className={cn(
                              'font-bold text-sm',
                              detailOrder.status === 'In Production' ||
                                detailOrder.status === 'Delayed' ||
                                detailOrder.status === 'Completed'
                                ? detailOrder.status === 'Delayed'
                                  ? 'text-rose-500'
                                  : 'text-blue-600'
                                : 'text-slate-400'
                            )}
                          >
                            現場製造與檢驗
                          </span>
                        ),
                        description: (
                          <span className='text-[11px] font-mono text-slate-400 pb-3 block mt-1'>
                            {detailOrder.status === 'Delayed'
                              ? '遭遇異常，產能落後進度'
                              : detailOrder.status === 'Completed'
                                ? '生產完畢'
                                : detailOrder.status === 'In Production'
                                  ? `持續生產中 (完成 ${detailOrder.progress}%)`
                                  : ''}
                          </span>
                        )
                      },
                      {
                        title: (
                          <span
                            className={cn(
                              'font-bold text-sm',
                              detailOrder.status === 'Completed'
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                            )}
                          >
                            包裝與出貨達交
                          </span>
                        ),
                        description: (
                          <span className='text-[11px] font-mono text-slate-400 block mt-1'>
                            {detailOrder.status === 'Completed'
                              ? '已順利入庫準備交付客戶'
                              : '尚未到達此階段'}
                          </span>
                        )
                      }
                    ]}
                  />
                </div>
              </div>

              <div className='mt-6 flex justify-end gap-3'>
                <Button
                  size='large'
                  className='h-11 rounded-xl font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 px-8'
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  關閉
                </Button>
              </div>
            </div>
          )}
        </Modal>

        <style>{`
          .custom-stats-popover .ant-popover-inner {
            border-radius: 16px !important;
            padding: 16px !important;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
            border: 1px solid #e0e7ff;
          }

          /* Custom Modal Styles */
          .custom-hmi-modal .ant-modal-content {
            border-radius: 24px;
            padding: 24px 32px;
            border: 1px solid #f1f5f9;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          }
          .custom-hmi-modal .ant-modal-header { background: transparent; margin-bottom: 0; }
          .custom-hmi-modal .ant-modal-close { top: 20px; right: 20px; }

          .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .custom-message .ant-message-notice-content {
            border-radius: 12px;
            padding: 12px 24px;
            font-weight: bold;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          }
        `}</style>
      </div>
    </div>
  )
}
