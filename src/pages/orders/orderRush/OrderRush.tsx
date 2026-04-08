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
  Steps
} from 'antd'
import {
  MoreVertical,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  Zap,
  Info,
  ArrowUpToLine,
  Activity,
  History,
  TrendingDown
} from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合併 Tailwind 類名的工具函數
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

    const date = new Date()
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

const rushMockData = generateRushMockData(150)

// --- 子組件：統計卡片 (使用 clsx) ---
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
      isAlert && 'ring-1 ring-amber-100 bg-amber-50/10'
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

const OrderRush: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(
    () => ({
      rushCount: rushMockData.filter(d => d.isRush).length,
      impacted: 12,
      efficiencyLoss: '-2.4%',
      capacity: '92%'
    }),
    []
  )

  const statsContent = (
    <div className='w-full max-w-[480px] p-1'>
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
          isAlert
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
      render: (text, record) => (
        <Space size={6}>
          <span className='font-mono font-bold text-blue-600'>{text}</span>
          {record.isRush && (
            <Tooltip title='急單處理中'>
              <div className='w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]' />
            </Tooltip>
          )}
        </Space>
      ),
      width: 150
    },
    {
      title: '客戶名稱',
      dataIndex: 'customer',
      key: 'customer',
      ellipsis: true,
      minWidth: 160
    },
    {
      title: '優先級',
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
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
      render: score => {
        const color =
          score > 70 ? '#ef4444' : score > 40 ? '#f59e0b' : '#10b981'
        return (
          <div className='flex flex-col gap-1 w-full max-w-[100px]'>
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
      title: '交期',
      dataIndex: 'originalDelivery',
      key: 'originalDelivery',
      width: 120,
      render: date => <span className='text-slate-600 font-medium'>{date}</span>
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'rush',
                label: '執行插單',
                icon: <ArrowUpToLine size={14} className='text-amber-500' />,
                onClick: () => setIsModalOpen(true)
              },
              {
                key: 'analyze',
                label: '衝擊分析',
                icon: <Activity size={14} className='text-indigo-500' />
              },
              {
                key: 'history',
                label: '變更紀錄',
                icon: <History size={14} className='text-slate-500' />
              },
              { type: 'divider' },
              {
                key: 'cancel',
                label: '移除急單',
                danger: true,
                disabled: !record.isRush
              }
            ]
          }}
          trigger={['click']}
          placement='bottomRight'
        >
          <Button
            variant='text'
            color='default'
            size='small'
            icon={<MoreVertical size={18} />}
            classNames={{
              root: 'text-slate-400 flex items-center justify-center hover:bg-slate-100'
            }}
          />
        </Dropdown>
      )
    }
  ]

  return (
    <div className='px-2 pt-2 pb-8 space-y-4 animate-fade-in relative'>
      {/* 全域 Loading 遮罩 */}
      {loading && (
        <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-[110] flex items-center justify-center rounded-2xl'>
          <div className='flex flex-col items-center gap-3'>
            <div className='w-10 h-10 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin' />
            <span className='text-xs font-black text-amber-600 tracking-widest uppercase'>
              Calculating Impacts...
            </span>
          </div>
        </div>
      )}

      {/* 頂部導航列 */}
      <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/50 py-2 rounded-xl sticky top-0 z-20 backdrop-blur-sm'>
        <div className='flex items-center gap-3'>
          <div className='bg-amber-500 p-1.5 rounded-lg shadow-amber-200 shadow-lg'>
            <Zap size={18} className='text-white fill-white' />
          </div>
          <Popover
            content={statsContent}
            trigger='click'
            placement='bottomLeft'
            classNames={{ root: 'custom-stats-popover' }}
          >
            <div className='flex items-center gap-2 cursor-pointer hover:bg-white px-2 sm:px-3 py-1.5 rounded-full transition-all group border border-transparent hover:border-amber-100'>
              <span className='text-sm font-bold text-slate-600 group-hover:text-amber-600 whitespace-nowrap'>
                插單監控
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
            variant='outlined'
            color='default'
            icon={<Activity size={16} />}
            classNames={{
              root: 'rounded-xl border-slate-200 font-medium h-10'
            }}
          >
            <span className='hidden lg:inline ml-1 text-xs'>整線優化</span>
          </Button>
          <Button
            variant='solid'
            color='primary'
            icon={<Zap size={16} />}
            classNames={{
              root: 'rounded-xl bg-amber-500 shadow-md shadow-amber-100 font-bold border-none h-10'
            }}
          >
            <span className='hidden sm:inline ml-1 text-xs'>批量插單</span>
          </Button>
        </div>
      </div>

      <Card
        className='shadow-sm border-none rounded-2xl overflow-hidden p-0'
        styles={{ body: { padding: 0 } }}
      >
        <div className='flex flex-col'>
          <div className='flex flex-wrap items-center justify-between gap-4 py-4 px-4 border-b border-slate-50'>
            <div className='flex flex-wrap items-center gap-3 flex-1'>
              <RangePicker
                classNames={{
                  root: 'rounded-xl h-10 border-slate-200 w-full sm:w-auto'
                }}
              />
              <div className='text-amber-600 text-[11px] flex items-center gap-1.5 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100'>
                <AlertTriangle size={14} />
                <span>
                  插單模式：系統將重新調配資源，請留意非急單之逾期風險。
                </span>
              </div>
            </div>
          </div>

          <div className='overflow-x-auto'>
            <Table
              rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
              columns={columns}
              dataSource={rushMockData}
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: total => `待處理排程：${total} 筆`,
                className: 'px-4 pb-4'
              }}
              scroll={{ x: 'max-content' }}
              className='order-rush-table'
            />
          </div>
        </div>
      </Card>

      {/* 插單確認彈窗 */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
        centered
        classNames={{ container: 'rush-confirm-modal-content' }}
      >
        <div className='p-2 pt-4'>
          <div className='flex items-center gap-4 mb-8'>
            <div className='w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm'>
              <ArrowUpToLine size={28} />
            </div>
            <div>
              <h3 className='text-xl font-bold text-slate-800 m-0 leading-tight'>
                確認執行緊急插單
              </h3>
              <p className='text-slate-400 text-xs mt-1'>
                此操作將觸發產能重分佈演算法，優先保障該訂單交期
              </p>
            </div>
          </div>

          <Steps
            direction='vertical'
            size='small'
            current={1}
            items={[
              {
                title: '訂單驗證',
                description: '檢查 BOM 物料與庫存可用量狀態',
                status: 'finish'
              },
              {
                title: '衝擊模擬',
                description: '預計導致其餘 3 筆一般訂單延遲 1-2 天',
                status: 'process'
              },
              {
                title: '同步看板',
                description: '推送更新至現場工段看板與機台 PLC'
              }
            ]}
            className='mb-10 px-4'
          />

          <div className='flex justify-end gap-3 pt-4 border-t border-slate-50'>
            <Button
              variant='outlined'
              color='default'
              onClick={() => setIsModalOpen(false)}
              classNames={{ root: 'rounded-lg px-6' }}
            >
              暫不執行
            </Button>
            <Button
              variant='solid'
              color='primary'
              classNames={{
                root: 'rounded-lg bg-amber-500 border-none px-8 font-bold'
              }}
            >
              確認插單
            </Button>
          </div>
        </div>
      </Modal>

      <style>{`
        .order-rush-table .ant-table-thead > tr > th {
          background: #fdfaf6 !important;
          color: #92400e !important;
          font-weight: 700 !important;
          border-bottom: 1px solid #fef3c7 !important;
        }
        .order-rush-table .ant-table-tbody > tr:hover > td {
          background: #fffbeb !important;
        }
        .custom-stats-popover .ant-popover-inner {
          border-radius: 16px !important;
          padding: 16px !important;
          border: 1px solid #fef3c7;
        }
        .rush-confirm-modal-content {
          border-radius: 24px !important;
          padding: 32px !important;
        }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

export default OrderRush
