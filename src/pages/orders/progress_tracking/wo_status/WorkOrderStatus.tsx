import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Table,
  Tag,
  Progress,
  Input,
  DatePicker,
  Button,
  ConfigProvider,
  Card,
  Popover,
  Tooltip,
  Dropdown
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import type { InputRef } from 'antd'
import {
  Search,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  PlayCircle,
  MoreVertical,
  TrendingUp,
  ChevronDown,
  Plus,
  ClipboardList,
  Info,
  Zap,
  FileText,
  Edit,
  Trash2,
  CalendarDays,
  LayoutDashboard,
  X
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'

// 註冊 dayjs 插件
dayjs.extend(isBetween)

const { RangePicker } = DatePicker

// --- 工具函式 ---
const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

// --- 定義 TypeScript 型別 ---
export type PriorityType = '特急' | '急單' | '一般'
export type StatusType = '進行中' | '異常延遲' | '已完成' | '未開始'

export interface WorkOrder {
  key: string
  woId: string
  priority: PriorityType
  productName: string
  productCode: string
  targetQty: number
  completedQty: number
  currentOp: string
  progress: number
  status: StatusType
  startDate: string
  estEndDate: string
  abnormalMsg: string | null
}

// --- 模擬數據產生器 ---
const generateMockData = (count: number): WorkOrder[] => {
  const products = [
    { name: '高階伺服器主機板', code: 'MB-SVR-X99' },
    { name: '工控主機外殼', code: 'CHAS-IND-01' },
    { name: '散熱模組 (水冷)', code: 'CL-WTR-200' },
    { name: '電源供應器 850W', code: 'PSU-850G' },
    { name: '邊緣運算閘道器', code: 'GW-EDG-5G' },
    { name: 'AI 運算加速卡', code: 'GPU-AI-A100' },
    { name: '工業級網路交換器', code: 'SW-IND-24P' }
  ]
  const priorities: PriorityType[] = ['特急', '急單', '一般']
  const statuses: StatusType[] = ['進行中', '異常延遲', '已完成', '未開始']
  const operations = [
    'SMT 表面接合',
    'CNC 金屬切削',
    '包裝入庫',
    '等待備料',
    'PCBA 測試',
    '組裝線 A',
    '品質檢驗'
  ]

  return Array.from({ length: count }).map((_, idx) => {
    const product = products[Math.floor(Math.random() * products.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const priority = priorities[Math.floor(Math.random() * priorities.length)]
    const targetQty = Math.floor(Math.random() * 2000) + 100
    const progress =
      status === '已完成'
        ? 100
        : status === '未開始'
          ? 0
          : Math.floor(Math.random() * 90) + 5

    const randomDayOffset = Math.floor(Math.random() * 30) - 5
    const baseDate = dayjs().add(randomDayOffset, 'day')

    return {
      key: String(idx + 1),
      woId: `WO-202604${(idx + 1).toString().padStart(4, '0')}`,
      priority,
      productName: product.name,
      productCode: product.code,
      targetQty,
      completedQty: Math.floor(targetQty * (progress / 100)),
      currentOp: operations[Math.floor(Math.random() * operations.length)],
      progress,
      status,
      startDate: baseDate.subtract(3, 'day').format('YYYY-MM-DD 08:00'),
      estEndDate: baseDate.format('YYYY-MM-DD 18:00'),
      abnormalMsg: status === '異常延遲' ? '缺料：電感組件供應延遲' : null
    }
  })
}

// --- 子組件：統計卡片 ---
interface StatCardProps {
  label: string
  value: string | number
  unit: string
  color: string
  icon: React.ElementType
  alert?: boolean
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  color,
  icon: Icon,
  alert
}) => (
  <div
    className={cn(
      'flex items-center justify-between p-4 rounded-xl min-w-[200px] transition-all',
      alert
        ? 'bg-rose-50 ring-1 ring-rose-100'
        : 'bg-white border border-slate-100'
    )}
  >
    <div>
      <p className='text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1'>
        {label}
      </p>
      <div className='flex items-baseline gap-1'>
        <span
          className={cn(
            'text-xl font-black',
            alert ? 'text-rose-600' : 'text-slate-800'
          )}
        >
          {value}
        </span>
        <span className='text-[10px] text-slate-400 font-medium'>{unit}</span>
      </div>
    </div>
    <div
      className={cn(
        'p-2 rounded-lg',
        alert
          ? 'bg-rose-100 text-rose-500'
          : `bg-${color}-100 text-${color}-500`
      )}
    >
      <Icon size={16} />
    </div>
  </div>
)

// --- 子組件：狀態標籤 ---
interface StatusTagProps {
  status: StatusType
  op: string
}

const StatusTag: React.FC<StatusTagProps> = ({ status, op }) => {
  const config: Record<StatusType, { color: string; icon: React.ElementType }> =
    {
      進行中: { color: 'processing', icon: PlayCircle },
      異常延遲: { color: 'error', icon: AlertCircle },
      已完成: { color: 'success', icon: CheckCircle2 },
      未開始: { color: 'default', icon: Clock }
    }
  const { color, icon: Icon } = config[status]
  return (
    <div className='flex flex-col gap-1'>
      <Tag
        color={color}
        className='flex items-center gap-1 w-fit m-0 border-0 px-2 py-0.5 rounded-full font-medium'
      >
        <Icon size={12} className='inline' /> {status}
      </Tag>
      <span className='text-[10px] text-slate-400 font-medium px-1'>{op}</span>
    </div>
  )
}

// --- 主組件 ---
export default function App() {
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const searchInputRef = useRef<InputRef>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const mockData = useMemo(() => generateMockData(500), [])

  const stats = useMemo(
    () => ({
      processing: mockData.filter(d => d.status === '進行中').length,
      delayed: mockData.filter(d => d.status === '異常延遲').length,
      completed: mockData.filter(d => d.status === '已完成').length,
      total: mockData.length
    }),
    [mockData]
  )

  // --- 搜尋過濾邏輯 ---
  const getSearchProps = (dataIndex: keyof WorkOrder, title: string) => ({
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
          className='!mb-3 rounded-lg'
        />
        <div className='flex justify-end gap-2'>
          <Button
            type='text'
            size='small'
            onClick={() => {
              clearFilters?.()
              confirm()
            }}
            className='text-xs text-slate-400'
          >
            重置
          </Button>
          <Button
            type='primary'
            size='small'
            onClick={() => confirm()}
            className='text-xs rounded-lg px-4'
          >
            篩選
          </Button>
        </div>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <Search
        size={14}
        className={filtered ? 'text-blue-500' : 'text-slate-300'}
      />
    ),
    onFilter: (value: any, record: WorkOrder): boolean => {
      const targetValue = record[dataIndex]
      if (targetValue === null || targetValue === undefined) return false
      return targetValue
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase())
    },
    onFilterDropdownOpenChange: (visible: boolean) => {
      if (visible) setTimeout(() => searchInputRef.current?.select(), 100)
    }
  })

  // --- 日期區間過濾邏輯 ---
  const getDateFilterProps = (dataIndex: keyof WorkOrder, title: string) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters
    }: any) => (
      <div
        className='p-3 w-72 shadow-2xl border border-slate-100 rounded-2xl bg-white'
        onKeyDown={e => e.stopPropagation()}
      >
        <div className='mb-3 font-bold text-slate-700 flex items-center gap-2'>
          <CalendarDays size={14} className='text-blue-500' />
          篩選{title}
        </div>
        <RangePicker
          value={selectedKeys[0]}
          onChange={dates => setSelectedKeys(dates ? [dates] : [])}
          className='!mb-3 w-full rounded-lg'
          allowClear
        />
        <div className='flex justify-end gap-2'>
          <Button
            type='text'
            size='small'
            onClick={() => {
              clearFilters?.()
              confirm()
            }}
            className='text-xs text-slate-400'
          >
            重置
          </Button>
          <Button
            type='primary'
            size='small'
            onClick={() => confirm()}
            className='text-xs rounded-lg px-4'
          >
            確定
          </Button>
        </div>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <CalendarDays
        size={14}
        className={filtered ? 'text-blue-500' : 'text-slate-300'}
      />
    ),
    onFilter: (value: any, record: WorkOrder): boolean => {
      if (!value || value.length !== 2) return true
      const [start, end] = value
      const dateString = record[dataIndex] as string
      if (!dateString) return false
      const recordDate = dayjs(dateString)
      return recordDate.isBetween(
        start.startOf('day'),
        end.endOf('day'),
        null,
        '[]'
      )
    }
  })

  // --- KPI 概覽內容 ---
  const DashboardContent = (
    <div className='p-2 space-y-4'>
      <div className='flex items-center gap-2 mb-2 pb-2 border-b border-slate-100'>
        <TrendingUp size={16} className='text-blue-600' />
        <span className='font-bold text-slate-700'>生產效率指標</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          label='執行中'
          value={stats.processing}
          unit='張'
          color='blue'
          icon={PlayCircle}
        />
        <StatCard
          label='已完工'
          value={stats.completed}
          unit='張'
          color='emerald'
          icon={CheckCircle2}
        />
        <StatCard
          label='異常預警'
          value={stats.delayed}
          unit='張'
          color='rose'
          icon={AlertCircle}
          alert
        />
        <StatCard
          label='總工單'
          value={stats.total}
          unit='張'
          color='indigo'
          icon={ClipboardList}
        />
      </div>
      <div className='bg-blue-50/50 p-3 rounded-xl text-[11px] text-blue-600 flex items-start gap-2'>
        <Info size={14} className='mt-0.5 shrink-0' />
        <span>當前系統負載穩定，平均達交率 96.4%。</span>
      </div>
    </div>
  )

  const columns: ColumnsType<WorkOrder> = [
    {
      title: '工單 ID',
      dataIndex: 'woId',
      key: 'woId',
      width: 160,
      fixed: 'left',
      ...getSearchProps('woId', '工單編號'),
      render: (text: string, record: WorkOrder) => (
        <div className='flex flex-col group'>
          <span className='font-bold text-blue-600 group-hover:underline cursor-pointer'>
            {text}
          </span>
          <span className='text-[10px] text-slate-400 font-mono'>
            {record.startDate.split(' ')[0]} 建立
          </span>
        </div>
      )
    },
    {
      title: '優先級',
      dataIndex: 'priority',
      width: 100,
      filters: [
        { text: '特急', value: '特急' },
        { text: '急單', value: '急單' },
        { text: '一般', value: '一般' }
      ],
      onFilter: (v, r): boolean => r.priority === v,
      render: (p: PriorityType) => (
        <Tag
          color={p === '特急' ? 'error' : p === '急單' ? 'warning' : 'default'}
          className='rounded-md border-0 font-bold px-2 m-0'
        >
          {p}
        </Tag>
      )
    },
    {
      title: '產品與規格',
      dataIndex: 'productName',
      width: 240,
      ...getSearchProps('productName', '產品名稱'),
      render: (name: string, r: WorkOrder) => (
        <div className='flex flex-col'>
          <span
            className='text-slate-700 font-semibold truncate max-w-[200px]'
            title={name}
          >
            {name}
          </span>
          <span className='text-[11px] text-slate-400 font-mono'>
            {r.productCode}
          </span>
        </div>
      )
    },
    {
      title: '狀態',
      dataIndex: 'status',
      width: 140,
      filters: [
        { text: '進行中', value: '進行中' },
        { text: '異常', value: '異常延遲' },
        { text: '完成', value: '已完成' }
      ],
      onFilter: (v, r): boolean => r.status === v,
      render: (s: StatusType, r: WorkOrder) => (
        <StatusTag status={s} op={r.currentOp} />
      )
    },
    {
      title: '進度回報',
      dataIndex: 'progress',
      width: 200,
      sorter: (a, b) => a.progress - b.progress,
      render: (p: number, r: WorkOrder) => (
        <div className='flex flex-col gap-1 pr-4'>
          <div className='flex justify-between text-[10px] font-bold'>
            <span className='text-slate-400'>
              {r.completedQty} / {r.targetQty}
            </span>
            <span className='text-slate-700'>{p}%</span>
          </div>
          <Progress
            percent={p}
            size='small'
            showInfo={false}
            status={r.status === '異常延遲' ? 'exception' : 'active'}
            strokeColor={r.status === '進行中' ? '#3b82f6' : undefined}
          />
          {r.abnormalMsg && (
            <span
              className='text-[9px] text-rose-500 truncate font-medium'
              title={r.abnormalMsg}
            >
              {r.abnormalMsg}
            </span>
          )}
        </div>
      )
    },
    {
      title: '預計交期',
      dataIndex: 'estEndDate',
      width: 140,
      sorter: (a, b) =>
        dayjs(a.estEndDate).valueOf() - dayjs(b.estEndDate).valueOf(),
      ...getDateFilterProps('estEndDate', '交期範圍'),
      render: (d: string) => (
        <div className='flex flex-col'>
          <span className='text-slate-600 font-medium'>
            {dayjs(d).format('YYYY-MM-DD')}
          </span>
          <span className='text-slate-400 text-[10px] font-mono'>
            {dayjs(d).format('HH:mm')}
          </span>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 70,
      fixed: 'right',
      align: 'center',
      render: () => (
        <Dropdown
          menu={{
            items: [
              { key: '1', label: '詳細日誌', icon: <FileText size={14} /> },
              { key: '2', label: '編輯參數', icon: <Edit size={14} /> },
              { key: '3', type: 'divider' },
              {
                key: '4',
                label: '暫停工單',
                danger: true,
                icon: <Trash2 size={14} />
              }
            ]
          }}
          trigger={['click']}
        >
          <Button
            type='text'
            size='small'
            icon={<MoreVertical size={16} className='text-slate-400' />}
          />
        </Dropdown>
      )
    }
  ]

  const rowSelection: TableProps<WorkOrder>['rowSelection'] = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    columnWidth: 48
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#3b82f6',
          borderRadius: 12,
          borderRadiusSM: 4
        },
        components: {
          Table: {
            headerBg: '#ffffff',
            headerColor: '#94a3b8',
            headerSplitColor: 'transparent',
            rowHoverBg: '#f8fafc'
          },
          Checkbox: {
            borderRadiusSM: 4
          }
        }
      }}
    >
      <div className='w-full h-full bg-[#f8fafc] font-sans'>
        {/* 整行懸浮工具列 (霧面玻璃效果) */}
        <header className='sticky top-0 z-[100] w-full px-6 py-4 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between transition-all'>
          <div className='flex items-center gap-3'>
            <Popover
              content={DashboardContent}
              trigger='click'
              placement='bottomLeft'
              overlayClassName='dashboard-popover'
            >
              <Button
                icon={<LayoutDashboard size={18} />}
                className='flex items-center gap-2 font-bold h-11 px-5 border-none bg-blue-600/5 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all'
              >
                數據概覽
                <ChevronDown size={14} />
                {stats.delayed > 0 && (
                  <span className='flex h-2 w-2 ml-1'>
                    <span className='animate-ping absolute inline-flex h-2 w-2 rounded-full bg-rose-400 opacity-75'></span>
                    <span className='relative inline-flex rounded-full h-2 w-2 bg-rose-500'></span>
                  </span>
                )}
              </Button>
            </Popover>

            <div className='h-6 w-[1px] bg-slate-200 mx-2'></div>

            <Tooltip title='導出 Excel'>
              <Button
                type='text'
                className='text-slate-400 hover:text-slate-600'
                icon={<Download size={20} />}
              />
            </Tooltip>
          </div>

          <div className='flex items-center gap-3'>
            <Button
              type='primary'
              icon={<Plus size={18} />}
              className='h-11 px-6 rounded-2xl font-bold bg-blue-600 shadow-xl shadow-blue-200 border-none flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all'
            >
              建立新工單
            </Button>
          </div>
        </header>

        <div className='p-4 lg:p-6'>
          <Card
            className='max-w-[1400px] mx-auto shadow-xl shadow-slate-200/50 border-none rounded-[28px] overflow-hidden bg-white'
            styles={{ body: { padding: 0 } }}
          >
            {/* 批量操作浮動條 (當有選取時) */}
            {selectedRowKeys.length > 0 && (
              <div className='mx-6 mt-6 p-3 bg-slate-900 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300'>
                <div className='flex items-center gap-3 text-white px-2'>
                  <Zap size={16} className='text-yellow-400 fill-yellow-400' />
                  <span className='text-sm font-bold tracking-tight'>
                    已選取 {selectedRowKeys.length} 筆生產任務
                  </span>
                </div>
                <div className='flex gap-2'>
                  <Button
                    size='small'
                    className='rounded-xl border-none font-bold bg-white text-slate-900'
                  >
                    批量下發
                  </Button>
                  <Button
                    size='small'
                    type='text'
                    onClick={() => setSelectedRowKeys([])}
                    className='text-white/50 hover:text-white'
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            )}

            <div className='p-4'>
              <Table<WorkOrder>
                rowSelection={rowSelection}
                columns={columns}
                dataSource={mockData}
                loading={loading}
                scroll={{ x: 1200 }}
                pagination={{
                  pageSize: 12,
                  showSizeChanger: true,
                  className: 'mt-4 !px-4 pb-2'
                }}
                className='aps-monitor-table'
              />
            </div>
          </Card>
        </div>
      </div>
    </ConfigProvider>
  )
}
