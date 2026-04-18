import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Table,
  Input,
  Button,
  ConfigProvider,
  Card,
  Popover,
  Badge,
  Tooltip,
  Dropdown,
  Space,
  DatePicker
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import type { InputRef } from 'antd'
import {
  Search,
  Download,
  AlertCircle,
  ChevronDown,
  Activity,
  Plus,
  MoreVertical,
  RefreshCw,
  Settings,
  PackageOpen,
  Archive,
  Database,
  Tag as TagIcon,
  UploadCloud,
  Layers,
  Network,
  Info,
  Zap,
  Edit,
  Trash2,
  CalendarDays
} from 'lucide-react'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

dayjs.extend(isBetween)
const { RangePicker } = DatePicker

/**
 * 樣式合併工具函數 (Project Standard)
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- TypeScript 型別定義 ---
export type ProductStatus = '已上市' | '開發中' | '已停產'
export type ProductCategory =
  | '伺服器成品'
  | '工控主機'
  | 'PCBA總成'
  | '散熱模組'
  | '線材配件'
export type BomStatus = '已發布' | '草稿' | '未建立'

export interface ProductMasterType {
  key: string
  sku: string
  productName: string
  specification: string
  category: ProductCategory
  uom: string // Unit of Measure (e.g., PCS, SET)
  leadTimeDays: number // 標準前置時間
  safetyStock: number // 安全庫存
  bomStatus: BomStatus
  status: ProductStatus
  lastUpdated: string
}

// --- 擬真數據產生器 ---
const generateProductData = (count: number): ProductMasterType[] => {
  const categories: ProductCategory[] = [
    '伺服器成品',
    '工控主機',
    'PCBA總成',
    '散熱模組',
    '線材配件'
  ]
  const statuses: ProductStatus[] = [
    '已上市',
    '已上市',
    '已上市',
    '開發中',
    '已停產'
  ]
  const uoms = ['PCS', 'SET', 'EA']

  const prefixes: Record<ProductCategory, string> = {
    伺服器成品: 'SVR-',
    工控主機: 'IND-',
    PCBA總成: 'MB-',
    散熱模組: 'CL-',
    線材配件: 'CBL-'
  }

  return Array.from({ length: count }).map((_, idx) => {
    const category = categories[Math.floor(Math.random() * categories.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const uom = uoms[Math.floor(Math.random() * uoms.length)]
    const prefix = prefixes[category]
    const seq = String(idx + 1).padStart(4, '0')
    const sku = `${prefix}26X${seq}`

    let bomStatus: BomStatus = '已發布'
    if (status === '開發中') {
      bomStatus = Math.random() > 0.5 ? '草稿' : '未建立'
    } else if (status === '已停產') {
      bomStatus = '已發布'
    } else {
      bomStatus = Math.random() > 0.9 ? '草稿' : '已發布'
    }

    const randomDayOffset = Math.floor(Math.random() * 60)
    const baseDate = dayjs().subtract(randomDayOffset, 'day')

    return {
      key: sku,
      sku,
      productName: `${category} - 標準型 ${seq}`,
      specification: `Rev.${Math.floor(Math.random() * 3) + 1}.0 / RoHS 兼容`,
      category,
      uom,
      leadTimeDays: Math.floor(Math.random() * 21) + 3, // 3 to 24 days
      safetyStock: Math.floor(Math.random() * 500) + 50,
      bomStatus,
      status,
      lastUpdated: baseDate.format('YYYY-MM-DD HH:mm')
    }
  })
}

// --- 子組件：統計卡片 ---
const StatCard: React.FC<{
  title: string
  value: string | number
  unit: string
  icon: React.ElementType
  colorClass: string
  bgClass: string
  iconColorClass: string
  trend?: string
  isAlert?: boolean
}> = ({
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
      'bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md cursor-default min-w-[160px]',
      isAlert && 'ring-1 ring-rose-100 bg-rose-50/30 border-transparent'
    )}
  >
    <div>
      <p className='text-slate-500 text-[11px] font-bold tracking-wide mb-0.5'>
        {title}
      </p>
      <div className='flex items-baseline gap-1'>
        <span
          className={cn(
            'text-xl font-black tracking-tight',
            isAlert ? 'text-rose-600' : 'text-slate-800'
          )}
        >
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

// --- 主元件 ---
export default function ProductList() {
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const searchInputRef = useRef<InputRef>(null)
  const data = useMemo(() => generateProductData(450), [])

  useEffect(() => {
    // 模擬載入時間
    const timer = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(
    () => ({
      active: data.filter(d => d.status === '已上市').length,
      missingBom: data.filter(d => d.bomStatus === '未建立').length,
      avgLeadTime: Math.round(
        data.reduce((acc, c) => acc + c.leadTimeDays, 0) / data.length
      ),
      total: data.length
    }),
    [data]
  )

  // --- 搜尋過濾邏輯 ---
  const getSearchProps = (
    dataIndex: keyof ProductMasterType,
    title: string
  ) => ({
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
          className='!mb-3 rounded-lg h-9 border-slate-200'
          prefix={<Search size={14} className='text-slate-400' />}
        />
        <div className='flex justify-between'>
          <Button
            type='text'
            size='small'
            onClick={() => {
              clearFilters?.()
              confirm()
            }}
            className='text-[10px] font-bold text-slate-400'
          >
            重置
          </Button>
          <Button
            type='primary'
            size='small'
            onClick={() => confirm()}
            className='text-[10px] font-bold px-4 text-white border-none bg-blue-600 rounded-lg'
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
    onFilter: (value: any, record: ProductMasterType): boolean => {
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
  const getDateFilterProps = (
    dataIndex: keyof ProductMasterType,
    title: string
  ) => ({
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
    onFilter: (value: any, record: ProductMasterType): boolean => {
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

  // --- Popover KPI ---
  const statsContent = (
    <div className='w-full max-w-120 py-1'>
      <div className='flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5'>
        <Database size={16} className='text-indigo-600' />
        <span className='font-bold text-slate-800'>商品主檔庫存指標</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='有效上市商品'
          value={stats.active}
          unit='件'
          icon={PackageOpen}
          colorClass='text-blue-600'
          bgClass='bg-blue-50'
          iconColorClass='text-blue-500'
          trend='排程可用料號'
        />
        <StatCard
          title='未建立 BOM 警告'
          value={stats.missingBom}
          unit='件'
          icon={AlertCircle}
          colorClass='text-rose-600'
          bgClass='bg-rose-100/80'
          iconColorClass='text-rose-500'
          isAlert={true}
          trend='無法進行 MRP 展開'
        />
        <StatCard
          title='平均前置時間 (L/T)'
          value={stats.avgLeadTime}
          unit='天'
          icon={Activity}
          colorClass='text-emerald-600'
          bgClass='bg-emerald-50'
          iconColorClass='text-emerald-500'
        />
        <StatCard
          title='商品總數'
          value={stats.total}
          unit='件'
          icon={Archive}
          colorClass='text-purple-600'
          bgClass='bg-purple-50'
          iconColorClass='text-purple-500'
        />
      </div>
    </div>
  )

  // --- 表格欄位定義 ---
  const columns: ColumnsType<ProductMasterType> = [
    {
      title: '商品代號',
      dataIndex: 'sku',
      key: 'sku',
      width: 160,
      fixed: 'left',
      sorter: (a, b) => a.sku.localeCompare(b.sku),
      ...getSearchProps('sku', '商品代號'),
      render: text => (
        <div className='flex items-center gap-2 group'>
          <div className='w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors'>
            <PackageOpen
              size={12}
              className='text-slate-400 group-hover:text-blue-500'
            />
          </div>
          <span className='font-bold text-blue-600 group-hover:underline cursor-pointer tracking-tight font-mono'>
            {text}
          </span>
        </div>
      )
    },
    {
      title: '商品名稱與規格',
      dataIndex: 'productName',
      key: 'productName',
      width: 260,
      sorter: (a, b) => a.productName.localeCompare(b.productName),
      ...getSearchProps('productName', '商品名稱'),
      render: (text, record) => (
        <div className='flex flex-col py-1'>
          <span
            className='font-bold text-slate-700 text-sm truncate max-w-[240px]'
            title={text}
          >
            {text}
          </span>
          <span
            className='text-[11px] font-medium text-slate-400 truncate max-w-[240px]'
            title={record.specification}
          >
            {record.specification}
          </span>
        </div>
      )
    },
    {
      title: '商品分類',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      sorter: (a, b) => a.category.localeCompare(b.category),
      filters: [
        { text: '伺服器成品', value: '伺服器成品' },
        { text: '工控主機', value: '工控主機' },
        { text: 'PCBA總成', value: 'PCBA總成' },
        { text: '散熱模組', value: '散熱模組' },
        { text: '線材配件', value: '線材配件' }
      ],
      onFilter: (value, record) => record.category === value,
      render: (cat: ProductCategory) => {
        const colors: Record<ProductCategory, string> = {
          伺服器成品: 'bg-indigo-50 text-indigo-600 border-indigo-100',
          工控主機: 'bg-blue-50 text-blue-600 border-blue-100',
          PCBA總成: 'bg-cyan-50 text-cyan-600 border-cyan-100',
          散熱模組: 'bg-orange-50 text-orange-600 border-orange-100',
          線材配件: 'bg-slate-100 text-slate-600 border-slate-200'
        }
        return (
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border',
              colors[cat]
            )}
          >
            <TagIcon size={12} />
            {cat}
          </div>
        )
      }
    },
    {
      title: 'BOM 狀態',
      dataIndex: 'bomStatus',
      key: 'bomStatus',
      width: 130,
      sorter: (a, b) => a.bomStatus.localeCompare(b.bomStatus),
      filters: [
        { text: '已發布', value: '已發布' },
        { text: '草稿', value: '草稿' },
        { text: '未建立', value: '未建立' }
      ],
      onFilter: (value, record) => record.bomStatus === value,
      render: (status: BomStatus) => {
        return (
          <div className='flex items-center gap-1.5'>
            {status === '已發布' ? (
              <Network size={14} className='text-emerald-500' />
            ) : status === '草稿' ? (
              <Layers size={14} className='text-amber-500' />
            ) : (
              <AlertCircle size={14} className='text-rose-500' />
            )}
            <span
              className={cn(
                'text-xs font-bold',
                status === '已發布'
                  ? 'text-emerald-600'
                  : status === '草稿'
                    ? 'text-amber-600'
                    : 'text-rose-600'
              )}
            >
              {status}
            </span>
          </div>
        )
      }
    },
    {
      title: 'L/T (天)',
      dataIndex: 'leadTimeDays',
      key: 'leadTimeDays',
      width: 120,
      sorter: (a, b) => a.leadTimeDays - b.leadTimeDays,
      ...getSearchProps('leadTimeDays', '前置時間'),
      render: days => (
        <span className='font-mono font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100'>
          {days}
        </span>
      )
    },
    {
      title: '商品狀態',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      sorter: (a, b) => a.status.localeCompare(b.status),
      filters: [
        { text: '已上市', value: '已上市' },
        { text: '開發中', value: '開發中' },
        { text: '已停產', value: '已停產' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: ProductStatus) => (
        <Badge
          status={
            status === '已上市'
              ? 'processing'
              : status === '開發中'
                ? 'warning'
                : 'default'
          }
          text={
            <span
              className={cn(
                'font-bold text-xs',
                status === '已上市'
                  ? 'text-blue-600'
                  : status === '開發中'
                    ? 'text-amber-600'
                    : 'text-slate-400'
              )}
            >
              {status}
            </span>
          }
        />
      )
    },
    {
      title: '最後更新',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      width: 140,
      sorter: (a, b) =>
        dayjs(a.lastUpdated).valueOf() - dayjs(b.lastUpdated).valueOf(),
      ...getDateFilterProps('lastUpdated', '最後更新'),
      render: date => (
        <div className='flex flex-col'>
          <span className='text-slate-600 font-medium text-[11px]'>
            {date.split(' ')[0]}
          </span>
          <span className='text-slate-400 font-mono text-[10px]'>
            {date.split(' ')[1]}
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
                label: '編輯商品',
                icon: <Edit size={14} className='text-blue-500' />
              },
              {
                key: '2',
                label: 'BOM 結構表',
                icon: <Network size={14} className='text-indigo-500' />
              },
              { key: '3', type: 'divider' },
              {
                key: '4',
                label: '停用商品',
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

  const rowSelection: TableProps<ProductMasterType>['rowSelection'] = {
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
          }
        }
      }}
    >
      <div className='w-full min-h-screen bg-[#f8fafc] p-4 font-sans'>
        <div className='mx-auto px-2 pt-2 pb-8 space-y-4 animate-fade-in relative max-w-400'>
          {/* 全域 Loading 遮罩 */}
          {loading && (
            <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-110 flex items-center justify-center rounded-[28px] mt-[60px]'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin' />
                <span className='text-xs font-black text-blue-600 tracking-widest uppercase'>
                  Fetching Master Data...
                </span>
              </div>
            </div>
          )}

          {/* 神級改版：玻璃透視頂部導航列 (Design Tokens) */}
          <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/50 py-2 rounded-xl sticky top-0 z-20 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='bg-blue-600 p-1.5 rounded-lg shadow-blue-200 shadow-lg'>
                <Database size={18} className='text-white' />
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
                      商品庫存指標
                    </span>
                    <div className='flex gap-1'>
                      <Badge
                        count={stats.active}
                        style={{
                          backgroundColor: '#3b82f6',
                          fontSize: '10px',
                          boxShadow: 'none'
                        }}
                      />
                      <Badge
                        count={stats.missingBom}
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
              <Tooltip title='重新整理'>
                <Button
                  type='text'
                  icon={<RefreshCw size={16} />}
                  className='text-slate-400 hover:bg-slate-100 rounded-xl font-medium h-10 w-10 flex items-center justify-center'
                />
              </Tooltip>
              <Tooltip title='批量匯入商品'>
                <Button
                  icon={<UploadCloud size={16} />}
                  className='rounded-xl font-medium h-10 flex items-center justify-center border-slate-200 text-slate-600'
                >
                  <span className='hidden lg:inline ml-1 text-xs'>
                    匯入資料
                  </span>
                </Button>
              </Tooltip>
              <Tooltip title='導出 Excel 報表'>
                <Button
                  icon={<Download size={16} />}
                  className='rounded-xl font-medium h-10 flex items-center justify-center border-slate-200 text-slate-600'
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
                <span className='hidden sm:inline ml-1 text-xs'>新增商品</span>
              </Button>
            </div>
          </div>

          <Card
            className='shadow-xl shadow-slate-200/50 border-none rounded-[32px] overflow-hidden bg-white'
            styles={{ body: { padding: 0 } }}
          >
            {/* 批量操作浮動條 (當有選取時) */}
            {selectedRowKeys.length > 0 && (
              <div className='mx-4 mt-4 bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2 duration-300'>
                <div className='flex items-center gap-2 text-blue-700'>
                  <Zap size={16} className='fill-blue-700' />
                  <span className='text-sm font-bold text-blue-700'>
                    已選取 {selectedRowKeys.length} 項商品資料
                  </span>
                </div>
                <Space>
                  <Button
                    size='small'
                    icon={<Layers size={14} />}
                    className='rounded-lg font-bold text-xs bg-white text-slate-700 border-slate-200 shadow-sm'
                  >
                    變更分類
                  </Button>
                  <Button
                    size='small'
                    icon={<Archive size={14} />}
                    danger
                    className='rounded-lg font-bold text-xs bg-white shadow-sm'
                  >
                    批量停用
                  </Button>
                  <Button
                    type='text'
                    size='small'
                    onClick={() => setSelectedRowKeys([])}
                    className='text-slate-400 text-xs hover:text-slate-600'
                  >
                    取消選取
                  </Button>
                </Space>
              </div>
            )}

            <div className='bg-slate-50/50 p-5 border-b border-slate-100 flex items-center justify-between'>
              <div className='flex items-center gap-3 text-slate-500 text-[11px] font-black uppercase tracking-widest'>
                <Settings size={14} />
                主檔資料清單展示 ({data.length} 筆項目)
              </div>
              <div className='flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm'>
                <Info size={14} className='text-blue-500' />
                <span className='text-[10px] text-slate-400 font-bold uppercase tracking-tight'>
                  提示：未建立 BOM 之商品無法參與 MRP 物料需求展開
                </span>
              </div>
            </div>

            <div className='p-4 pt-0'>
              <Table<ProductMasterType>
                rowSelection={rowSelection}
                columns={columns}
                dataSource={data}
                loading={false} // Loading 改由上方的全域遮罩接管
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
