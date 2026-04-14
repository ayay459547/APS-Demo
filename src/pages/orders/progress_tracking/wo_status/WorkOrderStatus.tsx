import React, { useState, useEffect, useMemo } from 'react'
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
  Space,
  Dropdown
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
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
  CalendarDays
} from 'lucide-react'

// 引入 clsx 與 tailwind-merge
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

const { RangePicker } = DatePicker

// --- 建立 cn 工具函式 ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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

// --- 子組件：統計卡片 ---
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

// --- 擬真數據產生器 (生成 count 筆) ---
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
  const priorities: PriorityType[] = ['特急', '急單', '一般', '一般', '一般']
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
  const abnormalMsgs = [
    '刀具磨損更換，預計延遲 2 小時',
    '缺料等待中，聯絡供應商',
    '機台參數異常，校正中',
    '測試良率偏低，工程師排查中'
  ]

  return Array.from({ length: count }).map((_, idx) => {
    const product = products[Math.floor(Math.random() * products.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const priority = priorities[Math.floor(Math.random() * priorities.length)]
    const targetQty = Math.floor(Math.random() * 2000) + 100

    let progress = 0
    let completedQty = 0
    let currentOp = operations[Math.floor(Math.random() * operations.length)]
    let abnormalMsg: string | null = null

    if (status === '已完成') {
      progress = 100
      completedQty = targetQty
      currentOp = '包裝入庫'
    } else if (status === '未開始') {
      progress = 0
      completedQty = 0
      currentOp = '等待備料'
    } else {
      progress = Math.floor(Math.random() * 99) + 1
      completedQty = Math.floor(targetQty * (progress / 100))
      if (status === '異常延遲') {
        abnormalMsg =
          abnormalMsgs[Math.floor(Math.random() * abnormalMsgs.length)]
      }
    }

    const startDay = Math.max(1, 14 - Math.floor(Math.random() * 10))
    const endDay = 14 + Math.floor(Math.random() * 15)

    return {
      key: String(idx + 1),
      woId: `WO-202604${(idx + 1).toString().padStart(4, '0')}`,
      priority,
      productName: product.name,
      productCode: product.code,
      targetQty,
      completedQty,
      currentOp,
      progress,
      status,
      startDate: `2026-04-${startDay.toString().padStart(2, '0')} 08:00`,
      estEndDate: `2026-04-${endDay.toString().padStart(2, '0')} 18:00`,
      abnormalMsg
    }
  })
}

export default function WorkOrderStatus() {
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // 模擬網路延遲載入效果
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // 初始化 1000 筆數據
  const mockData = useMemo(() => generateMockData(1000), [])

  const stats = useMemo(
    () => ({
      processing: mockData.filter(d => d.status === '進行中').length,
      delayed: mockData.filter(d => d.status === '異常延遲').length,
      completed: mockData.filter(d => d.status === '已完成').length
    }),
    [mockData]
  )

  // --- Popover KPI 內容 ---
  const statsContent = (
    <div className='w-full max-w-[500px] py-1'>
      <div className='flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5'>
        <TrendingUp size={16} className='text-blue-600' />
        <span className='font-bold text-slate-800'>廠區生產指標詳情</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='執行中工單'
          value={stats.processing}
          unit='張'
          icon={PlayCircle}
          colorClass='text-blue-600'
          bgClass='bg-blue-50'
          iconColorClass='text-blue-500'
        />
        <StatCard
          title='今日預計完工'
          value={28}
          unit='張'
          icon={CheckCircle2}
          colorClass='text-emerald-600'
          bgClass='bg-emerald-50'
          iconColorClass='text-emerald-500'
          trend='+12% 較昨日'
        />
        <StatCard
          title='異常延遲風險'
          value={stats.delayed}
          unit='張'
          icon={AlertCircle}
          colorClass='text-rose-600'
          bgClass='bg-rose-50'
          iconColorClass='text-rose-500'
          isAlert={true}
          trend='需立即排查'
        />
        <StatCard
          title='平均達交率'
          value={'94.5'}
          unit='%'
          icon={ClipboardList}
          colorClass='text-purple-600'
          bgClass='bg-purple-50'
          iconColorClass='text-purple-500'
          trend='近 30 日'
        />
      </div>
      <div className='mt-4 bg-slate-50 p-2.5 rounded-lg text-[11px] text-slate-400 flex items-start gap-2'>
        <Info size={14} className='shrink-0 mt-0.5' />
        <span>數據每 5 分鐘自動更新，當前顯示為 MES 系統即時計算結果。</span>
      </div>
    </div>
  )

  // --- 表頭客製化搜尋過濾器 (字串) ---
  const getColumnSearchProps = (
    dataIndex: keyof WorkOrder,
    placeholder: string
  ) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters
    }: any) => (
      <div className='p-2' onKeyDown={e => e.stopPropagation()}>
        <Input
          placeholder={placeholder}
          value={selectedKeys[0]}
          onChange={e =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => confirm()}
          classNames={{ root: '!mb-2 block rounded-lg border-slate-200' }}
        />
        <Space>
          <Button
            type='primary'
            onClick={() => confirm()}
            icon={<Search size={14} />}
            size='small'
            className='w-20 bg-blue-600 flex items-center justify-center text-xs'
          >
            搜尋
          </Button>
          <Button
            onClick={() => {
              if (typeof clearFilters === 'function') {
                clearFilters()
              }
              confirm()
            }}
            size='small'
            className='w-20 flex items-center justify-center text-xs'
          >
            重置
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <Search
        size={14}
        className={filtered ? 'text-blue-600' : 'text-slate-400'}
      />
    ),
    onFilter: (value: any, record: WorkOrder) => {
      // 支援多欄位搜尋 (例如搜產品名或品號)
      if (dataIndex === 'productName') {
        return (
          record.productName
            .toLowerCase()
            .includes((value as string).toLowerCase()) ||
          record.productCode
            .toLowerCase()
            .includes((value as string).toLowerCase())
        )
      }

      const recordValue = record[dataIndex]
      // TypeScript 可能 null 的檢查
      if (recordValue === null || recordValue === undefined) {
        return false
      }
      return recordValue
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase())
    }
  })

  // --- 表頭客製化日期區間過濾器 ---
  const getDateRangeFilterProps = () => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters
    }: any) => (
      <div className='p-2' onKeyDown={e => e.stopPropagation()}>
        <RangePicker
          value={selectedKeys[0]}
          onChange={dates => setSelectedKeys(dates ? [dates] : [])}
          className='!mb-2 !flex rounded-lg border-slate-200'
        />
        <Space>
          <Button
            type='primary'
            onClick={() => confirm()}
            icon={<Search size={14} />}
            size='small'
            className='w-20 bg-blue-600 flex items-center justify-center text-xs'
          >
            篩選
          </Button>
          <Button
            onClick={() => {
              if (typeof clearFilters === 'function') {
                clearFilters()
              }
              confirm()
            }}
            size='small'
            className='w-20 flex items-center justify-center text-xs'
          >
            重置
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <CalendarDays
        size={14}
        className={filtered ? 'text-blue-600' : 'text-slate-400'}
      />
    ),
    onFilter: (value: any, record: WorkOrder) => {
      if (!value || value.length !== 2) return true
      const recordDate = new Date(record.estEndDate).getTime()
      const start = value[0].startOf('day').valueOf()
      const end = value[1].endOf('day').valueOf()
      return recordDate >= start && recordDate <= end
    }
  })

  // --- Ant Design Table 欄位定義 ---
  const columns: ColumnsType<WorkOrder> = [
    {
      title: '工單資訊',
      dataIndex: 'woId',
      key: 'woId',
      width: 200,
      fixed: 'left',
      sorter: (a, b) => a.woId.localeCompare(b.woId),
      ...getColumnSearchProps('woId', '搜尋工單編號'),
      render: (text: string, record: WorkOrder) => (
        <div className='flex flex-col'>
          <div className='flex items-center gap-2'>
            <span className='font-semibold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors'>
              {text}
            </span>
            {record.priority === '特急' && (
              <Tag
                color='error'
                className='m-0 border-0 text-xs font-bold px-1.5'
              >
                特急
              </Tag>
            )}
            {record.priority === '急單' && (
              <Tag color='warning' className='m-0 border-0 text-xs px-1.5'>
                急單
              </Tag>
            )}
          </div>
          <span className='text-[11px] text-slate-400 mt-1'>
            {record.startDate.split(' ')[0]} 立帳
          </span>
        </div>
      )
    },
    {
      title: '產品名稱 / 品號',
      dataIndex: 'productName',
      key: 'productName',
      width: 220,
      sorter: (a, b) => a.productName.localeCompare(b.productName),
      ...getColumnSearchProps('productName', '搜尋品名或品號'),
      render: (text: string, record: WorkOrder) => (
        <div className='flex flex-col'>
          <span className='text-slate-700 font-medium'>{text}</span>
          <span className='text-[11px] text-slate-400 font-mono mt-0.5'>
            {record.productCode}
          </span>
        </div>
      )
    },
    {
      title: '當前狀態 / 工序',
      key: 'status',
      width: 160,
      filters: [
        { text: '進行中', value: '進行中' },
        { text: '異常延遲', value: '異常延遲' },
        { text: '已完成', value: '已完成' },
        { text: '未開始', value: '未開始' }
      ],
      onFilter: (value, record) => record.status === (value as StatusType),
      render: (_, record: WorkOrder) => {
        let tagColor = 'default'
        let Icon = Clock
        if (record.status === '進行中') {
          tagColor = 'processing'
          Icon = PlayCircle
        }
        if (record.status === '異常延遲') {
          tagColor = 'error'
          Icon = AlertCircle
        }
        if (record.status === '已完成') {
          tagColor = 'success'
          Icon = CheckCircle2
        }
        return (
          <div className='flex flex-col items-start gap-1.5'>
            <Tag
              color={tagColor}
              className='!flex !items-center !gap-1 py-0.5 px-2 rounded-md border-0 m-0'
            >
              <Icon size={12} className='inline-block' />
              <span className='font-medium'>{record.status}</span>
            </Tag>
            <span className='text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded'>
              {record.currentOp}
            </span>
          </div>
        )
      }
    },
    {
      title: '生產進度',
      key: 'progress',
      width: 240,
      sorter: (a, b) => a.progress - b.progress,
      render: (_, record: WorkOrder) => (
        <div className='flex flex-col gap-1 w-full pr-4'>
          <div className='flex justify-between text-[11px] mb-0.5'>
            <span className='text-slate-400'>
              已產:{' '}
              <strong className='text-slate-600'>{record.completedQty}</strong>{' '}
              / {record.targetQty}
            </span>
            <span className='font-bold text-slate-700'>{record.progress}%</span>
          </div>
          <Progress
            percent={record.progress}
            showInfo={false}
            size='small'
            status={
              record.status === '異常延遲'
                ? 'exception'
                : record.progress === 100
                  ? 'success'
                  : 'active'
            }
            strokeColor={record.status === '進行中' ? '#3b82f6' : undefined}
          />
          {record.abnormalMsg && (
            <div className='flex items-center gap-1 text-[10px] text-red-500 mt-0.5'>
              <AlertCircle size={10} className='flex-shrink-0' />
              <span className='truncate' title={record.abnormalMsg}>
                {record.abnormalMsg}
              </span>
            </div>
          )}
        </div>
      )
    },
    {
      title: '預計完工時間',
      dataIndex: 'estEndDate',
      key: 'estEndDate',
      width: 160,
      sorter: (a, b) =>
        new Date(a.estEndDate).getTime() - new Date(b.estEndDate).getTime(),
      ...getDateRangeFilterProps(),
      render: (text: string) => (
        <div className='flex flex-col'>
          <span className='text-slate-600 font-medium'>
            {text.split(' ')[0]}
          </span>
          <span className='text-slate-400 text-[11px]'>
            {text.split(' ')[1]}
          </span>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      fixed: 'right',
      align: 'center',
      render: () => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'details',
                label: '工單詳情',
                icon: <FileText size={14} className='text-blue-500' />
              },
              {
                key: 'edit',
                label: '修改參數',
                icon: <Edit size={14} className='text-slate-500' />
              },
              {
                key: 'schedule',
                label: '優先級調整',
                icon: <CalendarDays size={14} className='text-indigo-500' />
              },
              { key: 'divider', type: 'divider' },
              {
                key: 'delete',
                label: '暫停 / 取消',
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
            className='text-slate-400 hover:bg-slate-100 flex items-center justify-center'
          />
        </Dropdown>
      )
    }
  ]

  // --- 列表核取狀態 ---
  const rowSelection: TableProps<WorkOrder>['rowSelection'] = {
    selectedRowKeys,
    onChange: keys => setSelectedRowKeys(keys),
    fixed: 'left' // 將核取方塊固定在左側
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#3b82f6',
          borderRadius: 8,
          fontFamily: 'Inter, "Noto Sans TC", sans-serif'
        }
      }}
    >
      {/* 為了發揮 sticky 效用，外層容器允許原生滾動 */}
      <div className='w-full min-h-screen bg-[#f8fafc] font-sans pb-16'>
        <div className='mx-auto px-4 sm:px-6 pt-4 space-y-4 relative animate-fade-in'>
          {/* 全域 Loading 遮罩 */}
          {loading && (
            <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-[110] flex items-center justify-center rounded-2xl'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin' />
                <span className='text-xs font-black text-blue-600 tracking-widest uppercase'>
                  Fetching WorkOrder...
                </span>
              </div>
            </div>
          )}

          {/* 上方區塊完美懸浮與防穿透遮罩 (Mask Wrapper) */}
          <div className='sticky top-0 z-40 -mt-4 pt-4 pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 bg-[#f8fafc]/95 backdrop-blur-md'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/90 shadow-sm border border-slate-200/80 px-5 py-3 rounded-2xl transition-all'>
              <div className='flex flex-wrap items-center gap-3'>
                {/* 使用 Icon 代替文字標題以節省空間 */}
                <Tooltip title='工單狀態：即時監控廠區執行進度'>
                  <div className='bg-gradient-to-br from-blue-500 to-blue-600 text-white p-2 rounded-xl shadow-sm shadow-blue-200 flex items-center justify-center'>
                    <ClipboardList size={20} />
                  </div>
                </Tooltip>

                {/* 完美融合於 Title 旁的極簡 KPI 膠囊 */}
                <Popover
                  content={statsContent}
                  trigger='click'
                  placement='bottomLeft'
                  rootClassName='custom-stats-popover'
                >
                  <div className='flex items-center gap-2 bg-white border border-slate-200 shadow-sm px-2.5 py-1.5 rounded-full cursor-pointer hover:border-blue-300 hover:shadow transition-all group'>
                    <TrendingUp size={14} className='text-blue-600' />
                    <span className='text-xs font-bold text-slate-600 group-hover:text-blue-600'>
                      KPI 總覽
                    </span>
                    <div className='h-3 w-[1px] bg-slate-200 mx-0.5'></div>
                    <span className='text-[11px] font-bold text-rose-600 flex items-center gap-1.5'>
                      <span className='relative flex h-1.5 w-1.5'>
                        <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75'></span>
                        <span className='relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500'></span>
                      </span>
                      {stats.delayed} 筆異常
                    </span>
                    <ChevronDown
                      size={14}
                      className='text-slate-400 group-hover:text-blue-500 ml-0.5 transition-colors'
                    />
                  </div>
                </Popover>
              </div>

              <div className='flex items-center gap-3'>
                <Tooltip title='導出 Excel 報表'>
                  <Button
                    icon={<Download size={16} />}
                    className='font-medium h-9 border-slate-300 text-slate-600 rounded-xl flex items-center justify-center'
                  >
                    <span className='hidden lg:inline ml-1 text-xs'>匯出</span>
                  </Button>
                </Tooltip>
                <Button
                  type='primary'
                  icon={<Plus size={16} />}
                  className='bg-blue-600 shadow-sm shadow-blue-200 font-bold h-9 rounded-xl border-none flex items-center justify-center'
                >
                  <span className='hidden sm:inline ml-1 text-xs'>
                    新增工單
                  </span>
                </Button>
              </div>
            </div>
          </div>

          {/* 核心內容區 (Card 容器包覆表格，移除獨立過濾器區塊) */}
          <Card
            className='shadow-sm border-slate-200 rounded-2xl overflow-hidden relative z-10'
            styles={{ body: { padding: 0 } }}
          >
            {/* 批量操作列 (當有勾選時顯示) */}
            {selectedRowKeys.length > 0 && (
              <div className='mx-4 my-4 bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2 duration-300'>
                <div className='flex items-center gap-2 text-blue-700'>
                  <Zap size={16} className='fill-blue-700' />
                  <span className='text-sm font-bold text-blue-700'>
                    已選擇 {selectedRowKeys.length} 筆工單
                  </span>
                </div>
                <Space>
                  <Button
                    type='primary'
                    size='small'
                    className='rounded-lg font-bold text-xs'
                  >
                    批量派工
                  </Button>
                  <Button
                    danger
                    size='small'
                    className='rounded-lg font-bold text-xs'
                  >
                    批量暫停
                  </Button>
                  <Button
                    type='text'
                    size='small'
                    onClick={() => setSelectedRowKeys([])}
                    className='text-slate-400 text-xs hover:bg-slate-200/50'
                  >
                    取消
                  </Button>
                </Space>
              </div>
            )}

            {/* 表格區域 */}
            <div className='overflow-x-auto pt-2'>
              <Table<WorkOrder>
                rowSelection={rowSelection}
                columns={columns}
                dataSource={mockData}
                loading={loading}
                scroll={{ x: 1000 }} // 移除 Y 軸限制，讓外層視窗捲動，發揮 sticky 懸浮效果
                pagination={{
                  defaultPageSize: 20, // 更新：單頁顯示 20 筆資料
                  showSizeChanger: true,
                  pageSizeOptions: ['20', '50', '100'],
                  showTotal: total => `共計 ${total} 筆`,
                  className: 'px-4 py-3 border-t border-slate-100 m-0'
                }}
                className='order-manage-table'
              />
            </div>
          </Card>

          {/* 注入 SaaS 風格的客製化 CSS */}
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
    </ConfigProvider>
  )
}
