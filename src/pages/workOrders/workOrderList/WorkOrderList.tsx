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
  Popover
} from 'antd'
import {
  Plus,
  MoreVertical,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  ChevronDown,
  BarChart3,
  FileText,
  PlayCircle,
  PauseCircle,
  Printer,
  Activity,
  Filter
} from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'

// 輕量版 cn 函數，確保預覽環境 100% 可運行
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
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

  return Array.from({ length: count }).map((_, i) => {
    const id = i + 1
    const item = items[Math.floor(Math.random() * items.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const plannedQty = Math.floor(Math.random() * 500) + 100
    const actualQty =
      status === 'Completed'
        ? plannedQty
        : Math.floor(Math.random() * plannedQty)

    return {
      key: id.toString(),
      woId: `MO-2026-${id.toString().padStart(4, '0')}`,
      itemCode: item.code,
      itemName: item.name,
      plannedQty,
      actualQty,
      startDate: '2026-04-01',
      endDate: '2026-04-10',
      machine: machines[Math.floor(Math.random() * machines.length)],
      operator: operators[Math.floor(Math.random() * operators.length)],
      status,
      yieldRate: 95 + Math.random() * 4.9
    }
  })
}

const allMockData = generateWOMockData(300)

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
      isAlert && 'ring-1 ring-rose-100'
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
    <div className={cn('p-2 rounded-lg', bgClass)}>
      <Icon size={18} className={iconColorClass} />
    </div>
  </div>
)

export default function WorkOrderList() {
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(
    () => ({
      running: allMockData.filter(d => d.status === 'In Progress').length,
      abnormal: allMockData.filter(d => d.status === 'Abnormal').length,
      avgYield: '98.2%',
      todayTarget: '12,400'
    }),
    []
  )

  // --- 生成篩選選單資料 ---
  const itemFilters = useMemo(() => {
    const uniqueItems = Array.from(new Set(allMockData.map(d => d.itemCode)))
    return uniqueItems.map(code => {
      const name = allMockData.find(d => d.itemCode === code)?.itemName
      return { text: `${code} ${name}`, value: code }
    })
  }, [])

  const woIdFilters = useMemo(() => {
    return allMockData.map(d => ({ text: d.woId, value: d.woId }))
  }, [])

  const statsContent = (
    <div className='w-full max-w-[480px] p-1'>
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
          isAlert
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
      render: text => (
        <span className='font-mono font-bold text-slate-700'>{text}</span>
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
        <div>
          <div className='text-blue-600 font-bold text-xs'>{code}</div>
          <div className='text-slate-500 text-xs font-medium truncate max-w-[150px]'>
            {record.itemName}
          </div>
        </div>
      )
    },
    {
      title: '進度 (實際/計畫)',
      key: 'progress',
      width: 180,
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
              <span className='text-[10px] font-mono font-bold text-slate-500'>
                {record.actualQty} / {record.plannedQty}
              </span>
              <span className='text-[10px] font-bold text-blue-600'>
                {percent}%
              </span>
            </div>
            <Progress
              percent={percent}
              size='small'
              strokeColor={record.status === 'Abnormal' ? '#ef4444' : '#3b82f6'}
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
            icon: <AlertTriangle size={10} className='mr-1 inline' />
          }
        }
        const config = statusMap[status]
        return (
          <Tag
            color={config.color}
            className='rounded-full px-2 border-none flex items-center font-medium'
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
      render: () => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'details',
                label: '報工明細',
                icon: <FileText size={14} className='text-blue-500' />
              },
              { key: 'stop', label: '強制結案', danger: true }
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
    <div className='min-h-screen bg-slate-50/50 p-4'>
      <div className='max-w-[1200px] mx-auto px-2 pt-2 pb-8 space-y-4 animate-fade-in relative'>
        {/* 全域 Loading 遮罩 */}
        {loading && (
          <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-[110] flex items-center justify-center rounded-2xl'>
            <div className='flex flex-col items-center gap-3'>
              <div className='w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin' />
              <span className='text-xs font-black text-indigo-600 tracking-widest uppercase'>
                Fetching Orders...
              </span>
            </div>
          </div>
        )}

        {/* 頂部導航列 */}
        <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/50 py-2 rounded-xl sticky top-0 z-20 backdrop-blur-sm'>
          <div className='flex items-center gap-3'>
            <div className='bg-indigo-600 p-1.5 rounded-lg shadow-indigo-200 shadow-lg'>
              <ClipboardCheck size={18} className='text-white' />
            </div>
            <Popover
              content={statsContent}
              trigger='click'
              placement='bottomLeft'
              rootClassName='custom-stats-popover'
            >
              <div className='flex items-center gap-2 cursor-pointer hover:bg-white px-3 py-1.5 rounded-full transition-all group border border-transparent hover:border-indigo-100'>
                <span className='text-sm font-bold text-slate-600 group-hover:text-indigo-600 whitespace-nowrap'>
                  生產執行概覽
                </span>
                <div className='flex gap-1'>
                  <Badge
                    count={stats.running}
                    style={{
                      backgroundColor: '#1677ff',
                      fontSize: '10px',
                      boxShadow: 'none'
                    }}
                  />
                  <Badge
                    count={stats.abnormal}
                    style={{
                      backgroundColor: '#f5222d',
                      fontSize: '10px',
                      boxShadow: 'none'
                    }}
                  />
                </div>
                <ChevronDown
                  size={14}
                  className='text-slate-400 group-hover:text-indigo-600'
                />
              </div>
            </Popover>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              icon={<Printer size={16} />}
              className='rounded-xl h-10 font-medium'
            >
              <span className='hidden lg:inline ml-1 text-xs'>批次列印</span>
            </Button>
            <Button
              type='primary'
              icon={<Plus size={16} />}
              className='rounded-xl bg-indigo-600 h-10 font-bold border-none shadow-md shadow-indigo-200 hover:!bg-indigo-500'
            >
              <span className='hidden sm:inline ml-1 text-xs'>手動開單</span>
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
                <RangePicker className='rounded-xl h-10 border-slate-200 w-full sm:w-auto' />
                <div className='text-indigo-600 text-[11px] flex items-center gap-1.5 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100'>
                  <Filter size={14} className='text-indigo-500' />
                  <span>
                    篩選提示：點擊表頭漏斗，快速過濾出「異常」或指定產品的工單。
                  </span>
                </div>
              </div>
            </div>

            <div className='overflow-x-auto'>
              <Table
                rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
                columns={columns}
                dataSource={allMockData}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: total => `共 ${total} 筆工單`,
                  className: 'px-4 pb-4'
                }}
                scroll={{ x: 'max-content' }}
                className='work-order-table'
              />
            </div>
          </div>
        </Card>

        <style>{`
          .work-order-table .ant-table-thead > tr > th {
            background: #f8faff !important;
            color: #475569 !important;
            font-weight: 700 !important;
          }
          .custom-stats-popover .ant-popover-inner {
            border-radius: 16px !important;
            padding: 16px !important;
            border: 1px solid #e0e7ff;
            box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.1) !important;
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
