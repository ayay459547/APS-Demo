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
  Space
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
  CalendarDays
} from 'lucide-react'
import type { ColumnsType, TableProps } from 'antd/es/table'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// 輕量版 cn 函數，確保預覽環境 100% 可運行
function cn(...classes: (string | undefined | null | false)[]) {
  return twMerge(clsx(classes))
}

const { RangePicker } = DatePicker

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

// --- 假資料生成器 (500 筆) ---
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

const allMockData = generateMockData(500)

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
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(
    () => ({
      pending: allMockData.filter(d => d.status === 'Pending').length,
      production: allMockData.filter(d => d.status === 'In Production').length,
      delayed: allMockData.filter(d => d.status === 'Delayed').length,
      completed: allMockData.filter(d => d.status === 'Completed').length
    }),
    []
  )

  const customerFilters = useMemo(() => {
    const uniqueCustomers = Array.from(
      new Set(allMockData.map(d => d.customer))
    )
    return uniqueCustomers.map(c => ({ text: c, value: c }))
  }, [])

  const orderIdFilters = useMemo(() => {
    return allMockData.map(d => ({ text: d.orderId, value: d.orderId }))
  }, [])

  const statsContent = (
    <div className='w-full max-w-[480px] py-1'>
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
          isAlert={true}
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
      render: (text: string) => (
        <span className='font-mono font-bold text-blue-600'>{text}</span>
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
      width: 100,
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
      width: 130,
      sorter: (a, b) =>
        new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime(),
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
      fixed: 'right', // --- 新增：將操作欄位固定在右側 ---
      render: () => (
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
                icon: <CalendarDays size={14} className='text-indigo-500' />
              },
              { key: 'divider', type: 'divider' },
              {
                key: 'delete',
                label: '取消訂單',
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
            className='text-slate-400 flex items-center justify-center hover:bg-slate-100'
          />
        </Dropdown>
      )
    }
  ]

  const rowSelection: TableProps<OrderItem>['rowSelection'] = {
    selectedRowKeys,
    onChange: keys => setSelectedRowKeys(keys),
    fixed: 'left' // --- 新增：將核取方塊固定在左側 ---
  }

  return (
    <div className='w-full h-full bg-slate-50/50 p-4'>
      <div className='mx-auto px-2 pt-2 pb-8 space-y-4 animate-fade-in relative'>
        {/* 全域 Loading 遮罩 */}
        {loading && (
          <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-[110] flex items-center justify-center rounded-2xl'>
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
                <RangePicker className='rounded-xl h-10 border-slate-200 w-full sm:w-auto' />
                <div className='text-slate-400 text-[11px] flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100'>
                  <Info size={14} className='text-blue-400' />
                  <span>提示：點擊各欄位表頭可進行精確篩選或排序</span>
                </div>
              </div>
            </div>

            {/* 批量操作提示 */}
            {selectedRowKeys.length > 0 && (
              <div className='mx-4 mt-4 bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2 duration-300'>
                <div className='flex items-center gap-2 text-blue-700'>
                  <Zap size={16} className='fill-blue-700' />
                  <span className='text-sm font-bold text-blue-700'>
                    已選擇 {selectedRowKeys.length} 筆訂單
                  </span>
                </div>
                <Space>
                  <Button
                    type='primary'
                    size='small'
                    className='rounded-lg font-bold text-xs'
                  >
                    批量排產
                  </Button>
                  <Button
                    danger
                    size='small'
                    className='rounded-lg font-bold text-xs'
                  >
                    批量取消
                  </Button>
                  <Button
                    type='text'
                    size='small'
                    onClick={() => setSelectedRowKeys([])}
                    className='text-slate-400 text-xs'
                  >
                    取消
                  </Button>
                </Space>
              </div>
            )}

            <div className='overflow-x-auto'>
              <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={allMockData}
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: total => `共計 ${total} 筆`,
                  className: 'px-4 pb-4'
                }}
                scroll={{
                  x: 1000
                }} /* 新增：設定明確的 x 軸滾動寬度，確保固定欄位完美運作 */
                className='order-manage-table'
              />
            </div>
          </div>
        </Card>

        <style>{`
          .order-manage-table .ant-table-thead > tr > th {
            background: #f8fafc !important;
            color: #64748b !important;
            font-weight: 700 !important;
            border-bottom: 1px solid #f1f5f9 !important;
            white-space: nowrap;
          }
          .order-manage-table .ant-table-tbody > tr:hover > td {
            background: #f1f7ff !important;
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
  )
}
