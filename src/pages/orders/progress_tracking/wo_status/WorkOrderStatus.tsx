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
  Dropdown,
  Badge,
  Space
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
  Activity
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
      'flex items-center justify-between p-3.5 rounded-xl transition-all hover:shadow-md cursor-default min-w-[160px]',
      alert
        ? 'bg-rose-50/30 ring-1 ring-rose-100 border border-transparent'
        : 'bg-white border border-slate-100 shadow-sm'
    )}
  >
    <div>
      <p className='text-slate-500 text-[11px] font-bold tracking-wide mb-0.5'>
        {label}
      </p>
      <div className='flex items-baseline gap-1'>
        <span
          className={cn(
            'text-xl font-black tracking-tight',
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
          ? 'bg-rose-100/80 text-rose-500'
          : `bg-${color}-50 text-${color}-500`
      )}
    >
      <Icon size={18} />
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
export default function WorkOrderStatus() {
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
            className='text-xs rounded-lg px-4 bg-blue-600'
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
            className='text-xs rounded-lg px-4 bg-blue-600'
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
    <div className='w-full max-w-[420px] py-1'>
      <div className='flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5'>
        <TrendingUp size={16} className='text-blue-600' />
        <span className='font-bold text-slate-800'>生產效率指標</span>
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
      <div className='mt-4 bg-slate-50 p-2.5 rounded-lg text-[11px] text-slate-500 flex items-start gap-2'>
        <Info size={14} className='mt-0.5 shrink-0 text-blue-500' />
        <span>當前系統負載穩定，平均達交率 96.4%，所有機台運轉正常。</span>
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
          className='rounded-full border-0 font-bold px-3 m-0'
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
              {
                key: '1',
                label: '詳細日誌',
                icon: <FileText size={14} className='text-blue-500' />
              },
              {
                key: '2',
                label: '編輯參數',
                icon: <Edit size={14} className='text-slate-500' />
              },
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

  const rowSelection: TableProps<WorkOrder>['rowSelection'] = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    columnWidth: 48,
    fixed: 'left'
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
      <div className='w-full h-full bg-slate-50/50 p-4 font-sans'>
        <div className='mx-auto px-2 pt-2 pb-8 space-y-4 animate-fade-in relative'>
          {/* 全域 Loading 遮罩同步帶入 */}
          {loading && (
            <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-[110] flex items-center justify-center rounded-2xl'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin' />
                <span className='text-xs font-black text-blue-600 tracking-widest uppercase'>
                  Syncing Work Orders...
                </span>
              </div>
            </div>
          )}

          {/* 神級改版：玻璃透視頂部導航列 (Design Tokens) */}
          <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/50 py-2 rounded-xl sticky top-0 z-20 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='bg-blue-600 p-1.5 rounded-lg shadow-blue-200 shadow-lg'>
                <Activity size={18} className='text-white' />
              </div>
              <div className='flex items-center'>
                <Popover
                  content={DashboardContent}
                  trigger='click'
                  placement='bottomLeft'
                  rootClassName='custom-stats-popover'
                >
                  <div className='flex items-center gap-2 cursor-pointer hover:bg-white px-2 sm:px-3 py-1.5 rounded-full transition-all group border border-transparent hover:border-slate-100'>
                    <span className='text-sm font-bold text-slate-600 group-hover:text-blue-600 whitespace-nowrap'>
                      數據概覽
                    </span>
                    <div className='flex gap-1'>
                      <Badge
                        count={stats.processing}
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
                  <span className='hidden lg:inline ml-1 text-xs'>
                    匯出報表
                  </span>
                </Button>
              </Tooltip>
              <Button
                type='primary'
                icon={<Plus size={16} />}
                className='rounded-xl bg-blue-600 shadow-md shadow-blue-100 font-bold border-none h-10 flex items-center justify-center'
              >
                <span className='hidden sm:inline ml-1 text-xs'>建立工單</span>
              </Button>
            </div>
          </div>

          <Card
            className='shadow-xl shadow-slate-200/50 border-none rounded-[28px] overflow-hidden bg-white'
            styles={{ body: { padding: 0 } }}
          >
            {/* 批量操作浮動條 (當有選取時) */}
            {selectedRowKeys.length > 0 && (
              <div className='mx-4 mt-4 bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2 duration-300'>
                <div className='flex items-center gap-2 text-blue-700'>
                  <Zap size={16} className='fill-blue-700' />
                  <span className='text-sm font-bold text-blue-700'>
                    已選取 {selectedRowKeys.length} 筆生產任務
                  </span>
                </div>
                <Space>
                  <Button
                    type='primary'
                    size='small'
                    className='rounded-lg font-bold text-xs bg-blue-600'
                  >
                    批量下發
                  </Button>
                  <Button
                    type='text'
                    size='small'
                    onClick={() => setSelectedRowKeys([])}
                    className='text-slate-400 text-xs hover:text-slate-600'
                  >
                    取消
                  </Button>
                </Space>
              </div>
            )}

            <div className='p-4'>
              <Table<WorkOrder>
                rowSelection={rowSelection}
                columns={columns}
                dataSource={mockData}
                loading={false} // Loading 改由上方的全域遮罩接管，避免雙層 Loading 視覺衝突
                scroll={{ x: 1200 }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  className: 'mt-4 !px-4 pb-2'
                }}
                className='aps-monitor-table'
              />
            </div>
          </Card>

          <style>{`
            .aps-monitor-table .ant-table-thead > tr > th {
              background: #f8fafc !important;
              color: #64748b !important;
              font-weight: 700 !important;
              border-bottom: 1px solid #f1f5f9 !important;
              white-space: nowrap;
            }
            .aps-monitor-table .ant-table-tbody > tr:hover > td {
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
    </ConfigProvider>
  )
}
