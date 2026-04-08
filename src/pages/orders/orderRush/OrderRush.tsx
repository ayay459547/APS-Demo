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
import './OrderRush.scss'

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
  impactScore: number // 0-100, 數值越高表示對排程衝擊越大
  isRush: boolean
}

interface StatCardProps {
  title: string
  value: string | number
  unit: string
  icon: React.ElementType
  color: string
  bg: string
  iconColor: string
  trend?: string
  isAlert?: boolean
}

// --- 假資料生成器 (針對插單場景優化) ---
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

// --- 子組件：統計卡片 ---
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  color,
  bg,
  iconColor,
  trend,
  isAlert
}) => (
  <div
    className={`bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center justify-between ${isAlert ? 'ring-1 ring-amber-100' : ''}`}
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
        <div className={`mt-1 text-[10px] font-bold ${color}`}>{trend}</div>
      )}
    </div>
    <div className={`p-2 rounded-lg ${bg}`}>
      <Icon size={18} className={iconColor} />
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
      <div className='flex items-center gap-2 mb-4 border-b pb-2'>
        <Activity size={16} className='text-indigo-600' />
        <span className='font-bold text-slate-800'>插單分析看板 (模擬值)</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='當前插單數'
          value={stats.rushCount}
          unit='筆'
          icon={Zap}
          color='text-amber-600'
          bg='bg-amber-50'
          iconColor='text-amber-500'
        />
        <StatCard
          title='受影響訂單'
          value={stats.impacted}
          unit='筆'
          icon={TrendingDown}
          color='text-rose-600'
          bg='bg-rose-50'
          iconColor='text-rose-500'
          trend='高風險'
          isAlert
        />
        <StatCard
          title='效率變動'
          value={stats.efficiencyLoss}
          unit='OEE'
          icon={Clock}
          color='text-slate-600'
          bg='bg-slate-50'
          iconColor='text-slate-500'
        />
        <StatCard
          title='產能負荷'
          value={stats.capacity}
          unit='Capacity'
          icon={CheckCircle2}
          color='text-emerald-600'
          bg='bg-emerald-50'
          iconColor='text-emerald-500'
        />
      </div>
      <div className='mt-4 bg-indigo-50 p-2 rounded-lg text-[11px] text-indigo-600 flex items-center gap-2'>
        <Info size={12} />
        插單後系統會自動重算 GANTT 圖，請注意「受影響訂單」的交期變化。
      </div>
    </div>
  )

  const columns: ColumnsType<OrderItem> = [
    {
      title: '訂單編號',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (text, record) => (
        <Space size={4}>
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
      title: '當前優先級',
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
            className='rounded-full px-3 border-none font-medium'
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
        let color = '#10b981'
        if (score > 70) color = '#ef4444'
        else if (score > 40) color = '#f59e0b'
        return (
          <div className='flex flex-col gap-1'>
            <Progress
              percent={score}
              size='small'
              strokeColor={color}
              showInfo={false}
            />
            <span className='text-[10px] text-slate-400 font-medium'>
              {score > 70
                ? '高風險延誤'
                : score > 40
                  ? '中度受衝擊'
                  : '穩定排程中'}
            </span>
          </div>
        )
      }
    },
    {
      title: '預計交期',
      dataIndex: 'originalDelivery',
      key: 'originalDelivery',
      width: 120,
      render: date => <span className='text-slate-600 font-medium'>{date}</span>
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
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
              { key: 'divider', type: 'divider' },
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
            type='text'
            size='small'
            icon={<MoreVertical size={18} />}
            className='text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-colors'
          />
        </Dropdown>
      )
    }
  ]

  return (
    <div className='space-y-4 animate-fade-in pb-8'>
      {/* 頂部導航列 */}
      <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/50 py-2 rounded-xl sticky top-0 z-10 backdrop-blur-sm'>
        <div className='flex items-center gap-3'>
          <div className='bg-amber-500 p-1.5 rounded-lg shadow-amber-200 shadow-lg'>
            <Zap size={18} className='text-white fill-white' />
          </div>
          <div className='flex items-center'>
            <Popover
              content={statsContent}
              trigger='click'
              placement='bottomLeft'
              overlayClassName='custom-stats-popover'
            >
              <div className='flex items-center gap-2 cursor-pointer hover:bg-white px-2 sm:px-3 py-1.5 rounded-full transition-colors group shadow-sm border border-transparent hover:border-amber-100'>
                <span className='text-sm font-bold text-slate-600 group-hover:text-amber-600 whitespace-nowrap'>
                  插單決策監控
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
        </div>

        <div className='flex items-center gap-2'>
          <Button
            icon={<Activity size={16} />}
            className='rounded-xl border-slate-200 font-medium h-10 flex items-center justify-center'
          >
            <span className='hidden lg:inline ml-1 text-xs'>整線優化</span>
          </Button>
          <Button
            type='primary'
            icon={<Zap size={16} />}
            className='rounded-xl bg-amber-500 shadow-md shadow-amber-100 font-bold border-none hover:bg-amber-600 h-10 flex items-center justify-center'
          >
            <span className='hidden sm:inline ml-1 text-xs'>批量插單</span>
          </Button>
        </div>
      </div>

      <Card
        className='shadow-sm border-none rounded-2xl overflow-hidden p-0'
        bodyStyle={{ padding: 0 }}
      >
        <div className='flex flex-col'>
          <div className='flex flex-wrap items-center justify-between gap-4 py-4 px-4 border-b border-slate-50'>
            <div className='flex flex-wrap items-center gap-3 flex-1'>
              <RangePicker className='rounded-xl h-10 border-slate-200 w-full sm:w-auto' />
              <div className='text-amber-600 text-[11px] flex items-center gap-1.5 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100'>
                <AlertTriangle size={14} />
                <span>
                  插單模式：系統將鎖定部分工序以騰出機台產能，請注意其餘訂單延誤風險。
                </span>
              </div>
            </div>
          </div>

          <div className='overflow-x-auto'>
            <Table
              rowSelection={{
                selectedRowKeys,
                onChange: keys => setSelectedRowKeys(keys)
              }}
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

      {/* 插單操作彈窗 */}
      <Modal
        title={null}
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
        centered
        className='rush-confirm-modal'
      >
        <div className='p-2'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center'>
              <ArrowUpToLine className='text-amber-600' />
            </div>
            <div>
              <h3 className='text-lg font-bold text-slate-800 m-0'>
                執行緊急插單
              </h3>
              <p className='text-slate-400 text-xs'>
                此動作將重新分配機台 A-04 至 B-12 的生產順序
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
                description: '檢查物料清單與庫存狀態',
                status: 'finish'
              },
              {
                title: '衝擊模擬',
                description: '預計導致其餘 3 筆訂單延遲 1-2 天',
                status: 'process'
              },
              { title: '執行排程', description: '推送更新至現場看板' }
            ]}
          />

          <div className='mt-8 flex justify-end gap-3'>
            <Button
              onClick={() => setIsModalOpen(false)}
              className='rounded-lg'
            >
              暫不執行
            </Button>
            <Button
              type='primary'
              className='rounded-lg bg-amber-500 border-none px-8 font-bold'
            >
              確認插單
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default OrderRush
