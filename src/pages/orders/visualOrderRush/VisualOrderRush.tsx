import React, { useState } from 'react'
import {
  Calendar,
  Card,
  Tag,
  Button,
  Popover,
  Tooltip,
  Progress,
  Segmented,
  Avatar,
  message,
  Space
} from 'antd'
import {
  Zap,
  Activity,
  Calendar as CalendarIcon,
  LayoutGrid,
  AlertTriangle,
  Clock,
  Info,
  ArrowUpToLine,
  Search
} from 'lucide-react'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

// --- 型別定義 ---
type PriorityType = 'Urgent' | 'High' | 'Medium' | 'Low'
type RiskLevel = 'safe' | 'warning' | 'critical'

interface OrderItem {
  id: string
  orderId: string
  customer: string
  priority: PriorityType
  progress: number
  deliveryDate: string
  isRush: boolean
  risk: RiskLevel
  machineId: string
}

// interface StatCardProps {
//   title: string;
//   value: string | number;
//   unit: string;
//   icon: React.ElementType;
//   color: string;
//   bg: string;
//   iconColor: string;
//   trend?: string;
//   isAlert?: boolean;
// }

// --- 模擬數據生成 ---
const currentMonth = dayjs().format('YYYY-MM')
const generateCalendarData = (): OrderItem[] => {
  const customers = [
    'Tesla',
    'Apple',
    'SpaceX',
    'TSMC',
    'NVIDIA',
    'Amazon',
    'Google',
    'Meta'
  ]
  const data: OrderItem[] = []

  for (let i = 0; i < 40; i++) {
    const day = Math.floor(Math.random() * 28) + 1
    const isRush = i < 3
    data.push({
      id: `idx-${i}`,
      orderId: `ORD-26-${(i + 1).toString().padStart(3, '0')}`,
      customer: customers[Math.floor(Math.random() * customers.length)],
      priority: isRush ? 'Urgent' : 'Medium',
      progress: Math.floor(Math.random() * 60),
      deliveryDate: `${currentMonth}-${day.toString().padStart(2, '0')}`,
      isRush: isRush,
      risk: isRush ? 'safe' : Math.random() > 0.8 ? 'critical' : 'safe',
      machineId: `Line-${['A', 'B', 'C'][Math.floor(Math.random() * 3)]}`
    })
  }
  return data
}

const VisualOrderRush: React.FC = () => {
  const [orders, setOrders] = useState<OrderItem[]>(generateCalendarData())
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [isSimulating, setIsSimulating] = useState(false)

  // 執行插單模擬
  const handleRushSimulate = (orderId: string) => {
    setIsSimulating(true)
    message.loading({ content: '正在模擬排程衝擊...', key: 'rush_sim' })

    setTimeout(() => {
      setOrders(prev =>
        prev.map(o => {
          if (o.orderId === orderId) {
            return { ...o, isRush: true, priority: 'Urgent', risk: 'safe' }
          }
          if (!o.isRush && Math.random() > 0.6) {
            return {
              ...o,
              risk: o.risk === 'critical' ? 'critical' : 'warning'
            }
          }
          return o
        })
      )
      setIsSimulating(false)
      message.success({
        content: '插單排程已更新，請注意紅字延誤風險',
        key: 'rush_sim',
        duration: 3
      })
    }, 1200)
  }

  // 日曆單元格渲染邏輯
  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD')
    const dayOrders = orders.filter(o => o.deliveryDate === dateStr)

    return (
      <ul className='m-0 p-0 list-none'>
        {dayOrders.map(item => (
          <li key={item.id} className='mb-1'>
            <Popover
              content={
                <OrderQuickDetail
                  order={item}
                  onRush={() => handleRushSimulate(item.orderId)}
                  loading={isSimulating}
                />
              }
              title={
                <div className='font-bold border-b pb-2 flex items-center gap-2'>
                  <Search size={14} /> 訂單摘要
                </div>
              }
              trigger='click'
              placement='right'
              overlayClassName='custom-stats-popover'
            >
              <div
                className={`
                px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-all border
                flex items-center justify-between group
                ${
                  item.isRush
                    ? 'bg-amber-50 border-amber-200 text-amber-700 font-bold'
                    : item.risk === 'critical'
                      ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
                      : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-blue-50 hover:border-blue-200'
                }
              `}
              >
                <span className='truncate max-w-[60px]'>{item.customer}</span>
                {item.isRush && (
                  <div className='w-1.5 h-1.5 bg-amber-500 rounded-full' />
                )}
                {item.risk === 'critical' && (
                  <AlertTriangle size={10} className='text-rose-500' />
                )}
              </div>
            </Popover>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className='space-y-4 animate-fade-in max-w-[1400px] mx-auto p-4'>
      {/* 緊湊型頂部控制列 */}
      <div className='flex flex-wrap items-center justify-between gap-3 bg-white/80 p-2.5 px-4 rounded-2xl border border-white backdrop-blur-xl shadow-sm sticky top-0 z-20'>
        <div className='flex items-center gap-3'>
          <div className='bg-amber-500 p-1.5 rounded-xl shadow-md shadow-amber-200/50'>
            <Zap size={18} className='text-white fill-white' />
          </div>
          <div>
            <h2 className='text-base font-bold text-slate-800 m-0 tracking-tight leading-tight'>
              視覺化插單看板
            </h2>
            <div className='flex items-center gap-1.5 mt-0.5 leading-none'>
              <div className='w-1 h-1 bg-amber-400 rounded-full animate-pulse' />
              <span className='text-[10px] text-slate-400 font-bold uppercase tracking-wider'>
                Time-Based Dispatching
              </span>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <Segmented
            size='small'
            options={[
              {
                label: '日曆模式',
                value: 'calendar',
                icon: <CalendarIcon size={16} className='inline-block pb-1' />
              },
              {
                label: '卡片模式',
                value: 'list',
                icon: <LayoutGrid size={16} className='inline-block pb-1' />
              }
            ]}
            value={viewMode}
            onChange={val => setViewMode(val as any)}
            className='p-0.5 rounded-lg bg-slate-100'
          />
          <div className='h-6 w-[1px] bg-slate-200' />
          <Tooltip title='當前排程健康度'>
            <div className='flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 transition-colors hover:bg-emerald-100/50 cursor-default'>
              <Activity size={14} className='text-emerald-500' />
              <span className='text-xs font-bold text-emerald-700 whitespace-nowrap'>
                88% 達成率
              </span>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* 主呈現區域 */}
      {viewMode === 'calendar' ? (
        <Card
          className='rounded-2xl border-none shadow-sm overflow-hidden p-0 bg-white'
          styles={{ body: { padding: '8px' } }}
        >
          <Calendar
            fullscreen={true}
            cellRender={dateCellRender}
            className='custom-aps-calendar'
            headerRender={({ value, onChange }) => {
              return (
                <div className='px-4 py-3 flex items-center justify-between border-b mb-2'>
                  <h3 className='text-base font-bold text-slate-700 m-0 flex items-center gap-2'>
                    {value.format('YYYY年 MM月')}
                    <span className='text-slate-300 font-medium text-xs px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100'>
                      生產排程表
                    </span>
                  </h3>
                  <div className='flex gap-1.5'>
                    <Button
                      size='small'
                      variant='text'
                      color='default'
                      className='text-xs'
                      onClick={() => onChange(value.subtract(1, 'month'))}
                    >
                      上月
                    </Button>
                    <Button
                      size='small'
                      type='primary'
                      ghost
                      className='text-xs border-blue-200'
                      onClick={() => onChange(dayjs())}
                    >
                      今天
                    </Button>
                    <Button
                      size='small'
                      variant='text'
                      color='default'
                      className='text-xs'
                      onClick={() => onChange(value.add(1, 'month'))}
                    >
                      下月
                    </Button>
                  </div>
                </div>
              )
            }}
          />
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {orders.map((order, idx) => (
            <ProductionCard
              key={order.id}
              order={order}
              index={idx}
              onRush={() => handleRushSimulate(order.orderId)}
              loading={isSimulating}
            />
          ))}
        </div>
      )}

      {/* 底部說明 */}
      <div className='bg-blue-50/40 border border-blue-100 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <div className='w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm border border-blue-50 text-blue-500'>
            <Info size={18} />
          </div>
          <div>
            <p className='text-xs text-blue-800 font-bold m-0 leading-tight'>
              排程智能提示
            </p>
            <p className='text-[11px] text-blue-600/70 m-0'>
              在日曆中點擊訂單可彈出「快速插單選單」，系統會即時標示潛在延誤日。
            </p>
          </div>
        </div>
        <div className='flex gap-4 px-2'>
          <LegendItem color='bg-amber-500' label='緊急/插單' />
          <LegendItem color='bg-rose-500' label='延誤風險' />
          <LegendItem color='bg-slate-300' label='正常排程' />
        </div>
      </div>

      <style>{`
        .custom-aps-calendar .ant-picker-calendar-date-content {
          height: 80px !important;
          overflow-y: auto;
        }
        .custom-aps-calendar .ant-picker-cell-selected .ant-picker-calendar-date {
          background: #f0f7ff !important;
          border-top: 2px solid #1677ff;
        }
        .custom-aps-calendar .ant-picker-calendar-date {
          border-top: 2px solid #f8fafc;
          margin: 1px !important;
          transition: all 0.3s;
        }
        .custom-aps-calendar .ant-picker-calendar-date:hover {
          background: #f8fafc;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
      `}</style>
    </div>
  )
}

// --- 子組件：Popover 內部的訂單快速詳情 ---
const OrderQuickDetail: React.FC<{
  order: OrderItem
  onRush: () => void
  loading: boolean
}> = ({ order, onRush, loading }) => (
  <div className='w-64 p-1'>
    <div className='flex items-center gap-3 mb-4'>
      <Avatar className='bg-slate-800 font-black'>{order.customer[0]}</Avatar>
      <div>
        <div className='text-xs font-black text-slate-700'>
          {order.customer}
        </div>
        <div className='text-[10px] text-slate-400 font-mono'>
          #{order.orderId}
        </div>
      </div>
      <div className='ml-auto'>
        <Tag
          color={order.risk === 'critical' ? 'red' : 'blue'}
          className='m-0 border-none rounded-md text-[10px] font-bold uppercase'
        >
          {order.machineId}
        </Tag>
      </div>
    </div>

    <div className='space-y-3'>
      <div>
        <div className='flex justify-between text-[10px] mb-1 font-bold text-slate-500 uppercase tracking-tighter'>
          <span>Production Progress</span>
          <span>{order.progress}%</span>
        </div>
        <Progress
          percent={order.progress}
          size='small'
          strokeColor={order.isRush ? '#f59e0b' : '#1677ff'}
        />
      </div>

      <div className='bg-slate-50 p-2 rounded-lg flex items-center justify-between border border-slate-100'>
        <div className='flex items-center gap-2 text-slate-500'>
          <Clock size={12} />
          <span className='text-[10px] font-bold'>
            交期: {order.deliveryDate}
          </span>
        </div>
        {order.risk === 'critical' && (
          <span className='text-[9px] text-rose-500 font-black animate-pulse'>
            !! 嚴重延誤警告
          </span>
        )}
      </div>

      <Button
        type='primary'
        block
        disabled={order.isRush}
        loading={loading}
        icon={<ArrowUpToLine size={16} />}
        onClick={e => {
          e.stopPropagation()
          onRush()
        }}
        className={`h-9 rounded-lg font-bold border-none ${order.isRush ? 'bg-emerald-500' : 'bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-100'}`}
      >
        {order.isRush ? '已在加速路徑' : '執行緊急插單'}
      </Button>
    </div>
  </div>
)

// --- 子組件：卡片模式下的生產卡片 ---
const ProductionCard: React.FC<{
  order: OrderItem
  index: number
  onRush: () => void
  loading: boolean
}> = ({ order, onRush, loading }) => (
  <Card
    className={`rounded-2xl transition-all duration-500 border-none shadow-sm hover:shadow-xl group relative overflow-hidden bg-white ${order.isRush ? 'ring-2 ring-amber-500 ring-offset-2' : ''}`}
    styles={{ body: { padding: '20px' } }}
  >
    <div className='relative z-10'>
      <div className='flex justify-between items-start mb-4'>
        <Space size={10}>
          <Avatar
            size='default'
            className='bg-slate-100 text-slate-800 font-bold border border-slate-200'
          >
            {order.customer[0]}
          </Avatar>
          <div>
            <div className='text-xs font-black text-slate-800'>
              {order.customer}
            </div>
            <div className='text-[9px] text-slate-400 font-mono font-bold tracking-widest leading-none'>
              #{order.orderId}
            </div>
          </div>
        </Space>
        {order.isRush ? (
          <div className='bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1'>
            <Zap size={10} fill='currentColor' /> RUSH
          </div>
        ) : (
          <Tag className='rounded-md m-0 border-none text-[9px] font-bold uppercase'>
            {order.machineId}
          </Tag>
        )}
      </div>

      <div className='space-y-4'>
        <div>
          <div className='flex justify-between items-end mb-1.5'>
            <span className='text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider'>
              Progress
            </span>
            <span className='text-[10px] font-black text-slate-800'>
              {order.progress}%
            </span>
          </div>
          <Progress
            percent={order.progress}
            size='small'
            strokeColor={order.isRush ? '#f59e0b' : '#3b82f6'}
            trailColor='#f1f5f9'
          />
        </div>

        <div className='pt-3 flex items-center justify-between border-t border-slate-50'>
          <div>
            <div className='text-[9px] text-slate-400 font-bold uppercase mb-0.5'>
              Delivery Date
            </div>
            <div
              className={`text-xs font-bold ${order.risk === 'critical' ? 'text-rose-500 underline decoration-rose-200 decoration-2 underline-offset-4' : 'text-slate-700'}`}
            >
              {order.deliveryDate}
            </div>
          </div>
          <Button
            shape='circle'
            size='middle'
            icon={<ArrowUpToLine size={16} />}
            loading={loading}
            onClick={onRush}
            disabled={order.isRush}
            className={`flex items-center justify-center border-none shadow-md ${order.isRush ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-900 text-white hover:bg-amber-500'}`}
          />
        </div>
      </div>
    </div>
  </Card>
)

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div className='flex items-center gap-1.5'>
    <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
    <span className='text-[10px] font-bold text-slate-500 uppercase tracking-tighter'>
      {label}
    </span>
  </div>
)

export default VisualOrderRush
