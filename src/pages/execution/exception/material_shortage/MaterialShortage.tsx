import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  ConfigProvider,
  Card,
  Popover,
  Badge,
  Tooltip,
  Button,
  Modal,
  Form,
  Select,
  message,
  Table,
  Tag,
  Input,
  Steps,
  Divider,
  Alert
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { InputRef } from 'antd'
import {
  Search,
  ChevronDown,
  RefreshCw,
  Clock,
  Activity,
  CheckCircle2,
  Factory,
  Timer,
  CheckSquare,
  PackageX,
  Truck,
  Layers,
  BoxSelect,
  AlertOctagon,
  ScanLine
} from 'lucide-react'
import dayjs from 'dayjs'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 樣式合併工具函數
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- TypeScript 型別定義 ---
export type ShortageUrgency = '一般預警' | '安全庫存極低' | '已斷料停線'
export type ShortageStatus = '待處理' | '揀料中' | '配送中' | '已解除'

export interface MaterialShortageTicket {
  id: string
  workCenter: string
  materialCode: string
  materialName: string
  requiredQty: number
  urgency: ShortageUrgency
  status: ShortageStatus
  reporter: string
  reportTime: string
  handler?: string // 負責倉管員
  estimatedDeliveryTime?: string
  actualResolvedTime?: string
}

// --- 擬真數據產生器 ---
const generateShortages = (count: number): MaterialShortageTicket[] => {
  const urgencies: ShortageUrgency[] = [
    '一般預警',
    '一般預警',
    '安全庫存極低',
    '已斷料停線'
  ]
  const statuses: ShortageStatus[] = ['待處理', '揀料中', '配送中', '已解除']
  const equipments = [
    'SMT-LINE-01',
    'SMT-LINE-02',
    'DIP-LINE-01',
    'ASSY-LINE-A',
    'PKG-01'
  ]
  const materials = [
    { code: 'CAP-0402-106K', name: '10uF 0402 積層陶瓷電容' },
    { code: 'IC-MCU-STM32', name: 'STM32 微控制器' },
    { code: 'RES-0603-10K', name: '10K 0603 貼片電阻' },
    { code: 'PCB-MAIN-V2', name: '主機板裸板 V2.0' },
    { code: 'CON-USB-C', name: 'Type-C 連接器母座' }
  ]
  const handlers = ['王倉管', '李物管', '張發料員', '陳組長']

  return Array.from({ length: count })
    .map((_, idx) => {
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const urgency =
        status === '已解除'
          ? '一般預警'
          : urgencies[Math.floor(Math.random() * urgencies.length)]
      const reportTime = dayjs()
        .subtract(Math.floor(Math.random() * 24), 'hour')
        .subtract(Math.floor(Math.random() * 60), 'minute')
      const mat = materials[Math.floor(Math.random() * materials.length)]

      let handler
      let estimatedDeliveryTime
      let actualResolvedTime

      if (status !== '待處理') {
        handler = handlers[Math.floor(Math.random() * handlers.length)]
        estimatedDeliveryTime = reportTime
          .add(Math.floor(Math.random() * 2) + 1, 'hour')
          .format('YYYY-MM-DD HH:mm')
      }

      if (status === '已解除') {
        actualResolvedTime = reportTime
          .add(Math.floor(Math.random() * 120) + 30, 'minute')
          .format('YYYY-MM-DD HH:mm')
      }

      return {
        id: `MS-${dayjs().format('MMDD')}-${String(idx + 1).padStart(4, '0')}`,
        workCenter: equipments[Math.floor(Math.random() * equipments.length)],
        materialCode: mat.code,
        materialName: mat.name,
        requiredQty: Math.floor(Math.random() * 5000) + 500,
        urgency,
        status,
        reporter: '產線發料員',
        reportTime: reportTime.format('YYYY-MM-DD HH:mm'),
        handler,
        estimatedDeliveryTime,
        actualResolvedTime
      }
    })
    .sort(
      (a, b) => dayjs(b.reportTime).valueOf() - dayjs(a.reportTime).valueOf()
    )
}

const mockShortagesData: MaterialShortageTicket[] = generateShortages(28)

// --- 子組件：統計卡片 (套用紫紅主題) ---
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
      'bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md cursor-default',
      isAlert &&
        'ring-2 ring-fuchsia-300 bg-fuchsia-50/40 border-transparent shadow-fuchsia-100'
    )}
  >
    <div>
      <p className='text-slate-500 text-xs font-bold tracking-wide mb-1'>
        {title}
      </p>
      <div className='flex items-baseline gap-1'>
        <span
          className={cn(
            'text-2xl font-black tracking-tight font-mono',
            isAlert ? 'text-fuchsia-600' : 'text-slate-800'
          )}
        >
          {value}
        </span>
        <span className='text-[11px] text-slate-400 font-medium'>{unit}</span>
      </div>
      {trend && (
        <div
          className={cn(
            'mt-1.5 text-[11px] font-bold flex items-center gap-1',
            colorClass
          )}
        >
          {trend}
        </div>
      )}
    </div>
    <div className={cn('p-3 rounded-xl', bgClass, isAlert && 'animate-pulse')}>
      <Icon size={24} className={iconColorClass} />
    </div>
  </div>
)

// --- 主元件 ---
export default function App() {
  const [loading, setLoading] = useState<boolean>(true)
  const [shortages, setShortages] =
    useState<MaterialShortageTicket[]>(mockShortagesData)

  // Modal 狀態
  const [isReportModalVisible, setIsReportModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [activeTicket, setActiveTicket] =
    useState<MaterialShortageTicket | null>(null)

  const [reportForm] = Form.useForm()
  const searchInputRef = useRef<InputRef>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(() => {
    const activeTickets = shortages.filter(t => t.status !== '已解除')
    const lineDown = activeTickets.filter(
      t => t.urgency === '已斷料停線'
    ).length
    const picking = activeTickets.filter(t => t.status === '揀料中').length
    const delivering = activeTickets.filter(t => t.status === '配送中').length
    const pending = activeTickets.filter(t => t.status === '待處理').length
    return {
      active: activeTickets.length,
      lineDown,
      picking,
      delivering,
      pending
    }
  }, [shortages])

  const activeShortages = shortages.filter(
    s => s.urgency === '已斷料停線' && s.status !== '已解除'
  )

  // --- Popover KPI 內容 ---
  const statsContent = (
    <div className='w-full max-w-[520px] py-1'>
      <div className='flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5'>
        <Layers size={16} className='text-fuchsia-600' />
        <span className='font-bold text-slate-800'>物料供應 KPI 概覽</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='已斷料停線機台'
          value={stats.lineDown}
          unit='線'
          icon={AlertOctagon}
          colorClass='text-rose-600'
          bgClass='bg-rose-100/80'
          iconColorClass='text-rose-600'
          isAlert={stats.lineDown > 0}
          trend='需啟動緊急補料'
        />
        <StatCard
          title='揀料/備料進行中'
          value={stats.picking}
          unit='件'
          icon={BoxSelect}
          colorClass='text-fuchsia-600'
          bgClass='bg-fuchsia-50'
          iconColorClass='text-fuchsia-500'
          trend='倉管作業中'
        />
        <StatCard
          title='物流配送中'
          value={stats.delivering}
          unit='件'
          icon={Truck}
          colorClass='text-blue-600'
          bgClass='bg-blue-50'
          iconColorClass='text-blue-500'
          trend='AGV/人員運送中'
        />
        <StatCard
          title='平均補料前置時間 (LT)'
          value='45'
          unit='min'
          icon={Timer}
          colorClass='text-emerald-600'
          bgClass='bg-slate-50'
          iconColorClass='text-emerald-500'
          trend='達標 (目標 < 60min)'
        />
      </div>
    </div>
  )

  // --- 操作處理函式 ---
  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success({
        content: '缺料數據已同步至最新狀態！',
        className: 'custom-message'
      })
    }, 600)
  }

  const openReportModal = () => {
    reportForm.resetFields()
    reportForm.setFieldsValue({ urgency: '一般預警' })
    setIsReportModalVisible(true)
  }

  const submitReport = async () => {
    try {
      const values = await reportForm.validateFields()
      const newTicket: MaterialShortageTicket = {
        id: `MS-${dayjs().format('MMDD')}-${String(Math.floor(Math.random() * 900) + 100)}`,
        workCenter: values.workCenter,
        materialCode: values.materialCode,
        materialName: values.materialName,
        requiredQty: values.requiredQty,
        urgency: values.urgency,
        status: '待處理',
        reporter: '現場線長 (Current User)',
        reportTime: dayjs().format('YYYY-MM-DD HH:mm')
      }
      setShortages([newTicket, ...shortages])
      setIsReportModalVisible(false)
      message.success({
        content: `已發出 ${values.workCenter} 的缺料請求！`,
        className: 'custom-message'
      })
    } catch (error) {
      console.log('Validation Failed:', error)
    }
  }

  const openDetailModal = (ticket: MaterialShortageTicket) => {
    setActiveTicket(ticket)
    setIsDetailModalVisible(true)
  }

  // --- 搜尋過濾邏輯 ---
  const getSearchProps = (
    dataIndex: keyof MaterialShortageTicket,
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
            className='text-[10px] font-bold px-4 text-white border-none bg-fuchsia-600 rounded-lg'
          >
            篩選
          </Button>
        </div>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <Search
        size={14}
        className={filtered ? 'text-fuchsia-500' : 'text-slate-300'}
      />
    ),
    onFilter: (value: any, record: MaterialShortageTicket): boolean => {
      const targetValue = record[dataIndex]
      if (targetValue === null || targetValue === undefined) return false
      return targetValue
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase())
    }
  })

  // --- 表格欄位定義 ---
  const columns: ColumnsType<MaterialShortageTicket> = [
    {
      title: '請求單號 / 需求機台',
      key: 'idAndWo',
      width: 220,
      fixed: 'left',
      ...getSearchProps('workCenter', '機台名稱'),
      render: (_, record) => (
        <div className='flex items-center gap-3'>
          <div className='flex flex-col gap-0.5'>
            <span
              className='font-mono font-black text-slate-800 text-[14px] hover:text-fuchsia-600 cursor-pointer transition-colors'
              onClick={() => openDetailModal(record)}
            >
              {record.id}
            </span>
            <span className='text-[11px] font-bold text-indigo-600 flex items-center gap-1 mt-0.5'>
              <Factory size={10} /> {record.workCenter}
            </span>
          </div>
        </div>
      )
    },
    {
      title: '短缺料號 / 品名',
      key: 'material',
      width: 280,
      ...getSearchProps('materialCode', '料號'),
      render: (_, record) => (
        <div className='flex flex-col gap-0.5'>
          <span className='text-xs font-bold text-slate-800 flex items-center gap-1'>
            <ScanLine size={12} className='text-slate-400' />{' '}
            {record.materialCode}
          </span>
          <span
            className='text-[10px] font-bold text-slate-500 truncate'
            title={record.materialName}
          >
            {record.materialName}
          </span>
        </div>
      )
    },
    {
      title: '需求數量',
      dataIndex: 'requiredQty',
      key: 'requiredQty',
      width: 100,
      align: 'right',
      render: val => (
        <span className='font-mono text-xs font-bold text-slate-700'>
          {val.toLocaleString()}
        </span>
      )
    },
    {
      title: '緊急程度',
      dataIndex: 'urgency',
      key: 'urgency',
      width: 130,
      filters: [
        { text: '一般預警', value: '一般預警' },
        { text: '安全庫存極低', value: '安全庫存極低' },
        { text: '已斷料停線', value: '已斷料停線' }
      ],
      onFilter: (value, record) => record.urgency === value,
      render: (urgency: ShortageUrgency) => {
        let badgeClass = ''
        if (urgency === '已斷料停線')
          badgeClass =
            'bg-rose-500 text-white shadow-rose-200 animate-pulse-slow ring-2 ring-rose-500/30'
        else if (urgency === '安全庫存極低')
          badgeClass = 'bg-amber-500 text-white shadow-amber-200'
        else badgeClass = 'bg-slate-100 text-slate-600'

        return (
          <div
            className={cn(
              'px-2 py-0.5 rounded-md text-[10px] font-black w-fit tracking-widest',
              badgeClass
            )}
          >
            {urgency}
          </div>
        )
      }
    },
    {
      title: '處理狀態',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: '待處理', value: '待處理' },
        { text: '揀料中', value: '揀料中' },
        { text: '配送中', value: '配送中' },
        { text: '已解除', value: '已解除' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: ShortageStatus) => {
        let colorClass = ''
        let bgClass = ''
        let IconComponent = PackageX
        switch (status) {
          case '待處理':
            colorClass = 'text-slate-600'
            bgClass = 'bg-slate-100 border-slate-200'
            IconComponent = Clock
            break
          case '揀料中':
            colorClass = 'text-fuchsia-600'
            bgClass =
              'bg-fuchsia-50 border-fuchsia-200 shadow-sm shadow-fuchsia-100'
            IconComponent = BoxSelect
            break
          case '配送中':
            colorClass = 'text-blue-600'
            bgClass = 'bg-blue-50 border-blue-200 shadow-sm shadow-blue-100'
            IconComponent = Truck
            break
          case '已解除':
            colorClass = 'text-emerald-600'
            bgClass = 'bg-emerald-50 border-emerald-200'
            IconComponent = CheckCircle2
            break
        }
        return (
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border w-fit',
              bgClass,
              colorClass
            )}
          >
            <IconComponent size={12} />
            {status}
          </div>
        )
      }
    },
    {
      title: '通報時間',
      dataIndex: 'reportTime',
      key: 'reportTime',
      width: 140,
      sorter: (a, b) =>
        dayjs(a.reportTime).valueOf() - dayjs(b.reportTime).valueOf(),
      render: text => (
        <span className='font-mono text-[11px] text-slate-500'>{text}</span>
      )
    },
    {
      title: '負責倉管/物管',
      dataIndex: 'handler',
      key: 'handler',
      width: 130,
      render: text =>
        text ? (
          <span className='text-xs font-bold text-slate-600 flex items-center gap-1.5'>
            <Layers size={14} className='text-fuchsia-400' /> {text}
          </span>
        ) : (
          <span className='text-xs font-bold text-slate-300'>- 尚未接單 -</span>
        )
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      align: 'center',
      render: (_, record) => {
        return (
          <Tooltip title='查看補料進度'>
            <Button
              type='primary'
              size='small'
              className={cn(
                'border-none rounded-lg shadow-md flex items-center justify-center h-8 px-3 mx-auto transition-all',
                record.status === '已解除'
                  ? 'bg-emerald-500 shadow-emerald-200 hover:bg-emerald-400'
                  : 'bg-fuchsia-600 shadow-fuchsia-200 hover:bg-fuchsia-500'
              )}
              onClick={() => openDetailModal(record)}
            >
              {record.status === '已解除' ? (
                <CheckSquare size={14} />
              ) : (
                <Activity size={14} />
              )}
              <span className='text-xs font-bold ml-1'>追蹤</span>
            </Button>
          </Tooltip>
        )
      }
    }
  ]

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#c026d3', borderRadius: 12, borderRadiusSM: 6 } // Fuchsia 600 base
      }}
    >
      <div className='w-full min-h-screen bg-[#f8fafc] p-4 font-sans'>
        <div className='mx-auto px-2 pt-2 pb-8 space-y-6 animate-fade-in relative max-w-400'>
          {loading && (
            <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-110 flex items-center justify-center rounded-[28px] mt-[60px]'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-10 h-10 border-4 border-fuchsia-100 border-t-fuchsia-600 rounded-full animate-spin' />
                <span className='text-xs font-black text-fuchsia-600 tracking-widest uppercase'>
                  Loading Shortage Data...
                </span>
              </div>
            </div>
          )}

          {/* 玻璃透視頂部導航列 */}
          <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/50 py-2.5 rounded-2xl sticky top-0 z-20 backdrop-blur-md shadow-sm border border-white'>
            <div className='flex items-center gap-3 ml-2'>
              <div className='bg-linear-to-br from-fuchsia-500 to-purple-600 p-2 rounded-xl shadow-fuchsia-200 shadow-lg'>
                <PackageX size={20} className='text-white' />
              </div>
              <div className='flex items-center'>
                <Popover
                  content={statsContent}
                  trigger='click'
                  placement='bottomLeft'
                  rootClassName='custom-stats-popover'
                >
                  <div className='flex items-center gap-2 cursor-pointer hover:bg-white px-2 sm:px-3 py-1.5 rounded-full transition-all group border border-transparent hover:border-slate-100'>
                    <span className='text-sm font-bold text-slate-600 group-hover:text-fuchsia-600 whitespace-nowrap'>
                      產線缺料警告中心
                    </span>
                    <div className='flex gap-1'>
                      {stats.lineDown > 0 && (
                        <Badge
                          count={`${stats.lineDown} 停線`}
                          style={{
                            backgroundColor: '#e11d48',
                            fontSize: '10px',
                            boxShadow: 'none'
                          }}
                        />
                      )}
                      {stats.pending > 0 && (
                        <Badge
                          count={`${stats.pending} 待處理`}
                          style={{
                            backgroundColor: '#64748b',
                            fontSize: '10px',
                            boxShadow: 'none'
                          }}
                        />
                      )}
                    </div>
                    <ChevronDown
                      size={14}
                      className='text-slate-400 group-hover:text-fuchsia-600'
                    />
                  </div>
                </Popover>
              </div>
            </div>

            <div className='flex items-center gap-2 sm:gap-3 mr-2'>
              <Tooltip title='重新整理數據'>
                <Button
                  type='text'
                  icon={
                    <RefreshCw
                      size={16}
                      className={loading ? 'animate-spin' : ''}
                    />
                  }
                  className='text-slate-400 hover:bg-slate-100 rounded-xl h-10 w-10 flex items-center justify-center'
                  onClick={handleRefresh}
                />
              </Tooltip>
              <Button
                type='primary'
                className='rounded-xl bg-fuchsia-600 shadow-md shadow-fuchsia-200 font-bold border-none h-10 flex items-center justify-center hover:bg-fuchsia-500 px-4 sm:px-5 transition-transform active:scale-95'
                onClick={openReportModal}
              >
                <AlertOctagon size={16} />
                <span className='hidden sm:inline ml-1.5 text-sm'>
                  觸發缺料警報
                </span>
              </Button>
            </div>
          </div>

          {/* --- 已斷料停線 警告橫幅 (Sticky Banner) --- */}
          {activeShortages.length > 0 && (
            <div className='bg-gradient-to-r from-rose-500 to-red-600 rounded-2xl p-[1.5px] shadow-lg shadow-rose-200/50 animate-fade-in -mt-2 relative z-10 overflow-hidden group'>
              <div className='absolute inset-0 bg-white/20 blur-md group-hover:bg-white/30 transition-all duration-500'></div>
              <div className='bg-white/95 backdrop-blur-md rounded-[14px] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-20'>
                <div className='flex items-center gap-3'>
                  <div className='bg-rose-100 p-2.5 rounded-xl shadow-inner shadow-rose-200/50 flex shrink-0'>
                    <AlertOctagon
                      size={22}
                      className='text-rose-600 animate-pulse'
                    />
                  </div>
                  <div className='flex flex-col'>
                    <span className='font-black text-rose-700 text-[15px] flex items-center gap-2 tracking-tight'>
                      嚴重警告：部分產線已因缺料停機！
                      <Badge
                        count={`${activeShortages.length} 筆嚴重`}
                        style={{
                          backgroundColor: '#be123c',
                          boxShadow: 'none',
                          fontSize: '10px'
                        }}
                      />
                    </span>
                    <span className='text-xs font-bold text-slate-500 mt-0.5 line-clamp-1'>
                      受影響機台：
                      {activeShortages
                        .map(s => `${s.workCenter} [缺 ${s.materialName}]`)
                        .join('、')}
                    </span>
                  </div>
                </div>
                <Button
                  type='primary'
                  className='bg-rose-600 hover:bg-rose-500 border-none rounded-xl font-bold shadow-md shadow-rose-200 h-9 px-6 whitespace-nowrap'
                  onClick={() =>
                    message.warning({
                      content: '已向物料課發送二次催繳警報廣播！',
                      className: 'custom-message'
                    })
                  }
                >
                  一鍵催料廣播
                </Button>
              </div>
            </div>
          )}

          <Card
            className='shadow-xl shadow-slate-200/50 border-none rounded-3xl overflow-hidden bg-white mt-4'
            styles={{ body: { padding: 0 } }}
          >
            <div className='bg-slate-50/50 p-5 border-b border-slate-100 flex items-center justify-between'>
              <div className='flex items-center gap-3 text-slate-500 text-[11px] font-black uppercase tracking-widest'>
                <PackageX size={14} />
                全廠缺料呼叫紀錄 (Material Shortage Requests)
              </div>
            </div>

            <div className='p-4 pt-0'>
              <Table<MaterialShortageTicket>
                columns={columns}
                dataSource={shortages}
                loading={false}
                scroll={{ x: 1000 }}
                rowKey='id'
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                  className: 'mt-4 !px-4 pb-2'
                }}
                className='aps-monitor-table'
              />
            </div>
          </Card>

          {/* --- 新增缺料警報 Modal --- */}
          <Modal
            title={
              <div className='flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3'>
                <div className='bg-fuchsia-100 p-1.5 rounded-lg shadow-inner shadow-fuchsia-200/50'>
                  <PackageX size={18} className='text-fuchsia-600' />
                </div>
                <span className='font-black text-lg tracking-tight'>
                  觸發產線缺料警報
                </span>
              </div>
            }
            open={isReportModalVisible}
            onOk={submitReport}
            onCancel={() => setIsReportModalVisible(false)}
            okText='確認送出警報'
            cancelText='取消'
            okButtonProps={{
              className:
                'bg-fuchsia-600 hover:bg-fuchsia-500 border-none shadow-md shadow-fuchsia-200 rounded-xl font-bold h-10 px-6'
            }}
            cancelButtonProps={{
              className:
                'rounded-xl font-bold text-slate-500 border-slate-200 h-10 px-6 hover:bg-slate-50'
            }}
            className='custom-edit-modal top-10'
            width={640}
          >
            <Form form={reportForm} layout='vertical' className='mt-4 mb-0'>
              <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
                <Form.Item
                  name='workCenter'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      缺料機台 / 產線
                    </span>
                  }
                  rules={[{ required: true, message: '請選擇機台' }]}
                >
                  <Select
                    className='h-10 rounded-xl text-xs font-mono'
                    placeholder='請選擇缺料機台'
                  >
                    <Select.Option value='SMT-LINE-01'>
                      SMT-LINE-01
                    </Select.Option>
                    <Select.Option value='SMT-LINE-02'>
                      SMT-LINE-02
                    </Select.Option>
                    <Select.Option value='DIP-LINE-01'>
                      DIP-LINE-01
                    </Select.Option>
                    <Select.Option value='ASSY-LINE-A'>
                      ASSY-LINE-A
                    </Select.Option>
                    <Select.Option value='PKG-01'>PKG-01</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name='urgency'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      緊急程度
                    </span>
                  }
                  rules={[{ required: true }]}
                >
                  <Select className='h-10 rounded-xl text-xs font-bold'>
                    <Select.Option value='一般預警'>
                      一般預警 (尚有庫存可撐1小時)
                    </Select.Option>
                    <Select.Option value='安全庫存極低'>
                      <span className='text-amber-600'>
                        安全庫存極低 (即將斷線)
                      </span>
                    </Select.Option>
                    <Select.Option value='已斷料停線'>
                      <span className='text-rose-600'>
                        已斷料停線 (立即處理)
                      </span>
                    </Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name='materialCode'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      短缺料號 (Part No.)
                    </span>
                  }
                  rules={[{ required: true, message: '請輸入料號' }]}
                >
                  <Input
                    className='h-10 rounded-xl font-mono text-sm border-slate-300'
                    placeholder='掃描或輸入料號 (如: CAP-0402-106K)'
                  />
                </Form.Item>

                <Form.Item
                  name='materialName'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      品名規格 (Description)
                    </span>
                  }
                  rules={[{ required: true, message: '請輸入品名' }]}
                >
                  <Input
                    className='h-10 rounded-xl text-sm border-slate-300'
                    placeholder='例如: 10uF 0402 電容'
                  />
                </Form.Item>

                <Form.Item
                  name='requiredQty'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      請求補料數量
                    </span>
                  }
                  rules={[{ required: true, message: '請輸入數量' }]}
                  className='col-span-2'
                >
                  <Input
                    type='number'
                    className='h-10 rounded-xl text-sm border-slate-300 w-1/2'
                    placeholder='輸入所需數量 (PCS)'
                  />
                </Form.Item>
              </div>
              <Alert
                message='送出後將自動派工至 WMS 系統，並通知負責物管人員與 AGV 派車系統。'
                type='info'
                showIcon
                className='rounded-xl border-indigo-100 bg-indigo-50 text-indigo-700 text-xs font-bold mt-2'
              />
            </Form>
          </Modal>

          {/* --- 補料進度追蹤 Modal --- */}
          <Modal
            title={null}
            open={isDetailModalVisible}
            onCancel={() => setIsDetailModalVisible(false)}
            footer={null}
            className='custom-hmi-modal top-6'
            width={720}
          >
            {activeTicket &&
              (() => {
                const isDone = activeTicket.status === '已解除'
                const isCritical = activeTicket.urgency === '已斷料停線'

                // 根據狀態決定 Steps 的 current index
                let stepCurrent = 0
                if (activeTicket.status === '揀料中') stepCurrent = 1
                if (activeTicket.status === '配送中') stepCurrent = 2
                if (activeTicket.status === '已解除') stepCurrent = 3

                return (
                  <div className='flex flex-col'>
                    {/* Header */}
                    <div className='flex items-center gap-3 text-slate-800 border-b border-slate-100 pb-5 mb-5 mt-2'>
                      <div
                        className={cn(
                          'p-3 rounded-xl shadow-md',
                          isDone
                            ? 'bg-emerald-500 shadow-emerald-200'
                            : 'bg-fuchsia-600 shadow-fuchsia-200'
                        )}
                      >
                        <Layers size={24} className='text-white' />
                      </div>
                      <div className='flex flex-col'>
                        <span className='font-black text-xl tracking-tight'>
                          補料進度與物流追蹤 (Replenishment)
                        </span>
                        <div className='flex items-center gap-2 mt-1'>
                          <span className='text-sm font-mono font-black text-fuchsia-600'>
                            {activeTicket.id}
                          </span>
                          <span className='text-[10px] text-slate-400'>|</span>
                          <span className='text-xs font-bold text-slate-500 flex items-center gap-1 font-mono'>
                            <Factory size={12} /> {activeTicket.workCenter}
                          </span>
                          <Tag
                            className={cn(
                              'm-0 border-none font-bold text-[10px] px-2 py-0.5 ml-1',
                              isCritical
                                ? 'bg-rose-100 text-rose-700'
                                : activeTicket.urgency === '安全庫存極低'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                            )}
                          >
                            {activeTicket.urgency}
                          </Tag>
                        </div>
                      </div>
                    </div>

                    {/* Material Highlight */}
                    <div className='bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 flex items-center justify-between gap-4'>
                      <div className='flex flex-col gap-1 w-2/3'>
                        <span className='text-[10px] font-bold text-slate-400'>
                          短缺物料資訊
                        </span>
                        <span className='text-sm font-black text-slate-800 font-mono'>
                          {activeTicket.materialCode}
                        </span>
                        <span className='text-xs font-bold text-slate-600'>
                          {activeTicket.materialName}
                        </span>
                      </div>
                      <div className='flex flex-col items-end gap-1 w-1/3 border-l border-slate-200 pl-4'>
                        <span className='text-[10px] font-bold text-slate-400'>
                          需求數量
                        </span>
                        <span className='text-xl font-black text-fuchsia-600 font-mono'>
                          {activeTicket.requiredQty.toLocaleString()}{' '}
                          <span className='text-xs font-bold text-slate-500'>
                            PCS
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Handler Info */}
                    <div className='grid grid-cols-2 gap-4 mb-6'>
                      <div className='bg-white border border-slate-100 shadow-sm p-4 rounded-2xl flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-full bg-fuchsia-50 flex items-center justify-center'>
                          <BoxSelect size={20} className='text-fuchsia-600' />
                        </div>
                        <div className='flex flex-col'>
                          <span className='text-[10px] font-bold text-slate-400'>
                            負責倉管/發料員
                          </span>
                          <span className='text-sm font-black text-slate-700'>
                            {activeTicket.handler || '系統自動派單中...'}
                          </span>
                        </div>
                      </div>
                      <div className='bg-white border border-slate-100 shadow-sm p-4 rounded-2xl flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center'>
                          <Clock size={20} className='text-emerald-600' />
                        </div>
                        <div className='flex flex-col'>
                          <span className='text-[10px] font-bold text-slate-400'>
                            預計送達/解除時間
                          </span>
                          <span className='text-xs font-black text-slate-700 font-mono'>
                            {activeTicket.actualResolvedTime ||
                              activeTicket.estimatedDeliveryTime ||
                              '計算中...'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Divider className='border-slate-100 my-0 mb-6' />

                    {/* Timeline Steps (Logistics Workflow) */}
                    <div>
                      <span className='font-bold text-slate-700 text-sm flex items-center gap-1.5 mb-6'>
                        <Activity size={16} className='text-fuchsia-500' />{' '}
                        物流配送節點 (Logistics Workflow)
                      </span>

                      <div className='px-4'>
                        <Steps
                          direction='vertical'
                          size='small'
                          current={stepCurrent}
                          items={[
                            {
                              title: (
                                <span className='font-bold text-sm text-slate-700'>
                                  產線送出缺料警報
                                </span>
                              ),
                              description: (
                                <span className='text-[11px] font-mono text-slate-400 pb-4 block mt-1'>
                                  {activeTicket.reportTime} | 通報人:{' '}
                                  {activeTicket.reporter}
                                </span>
                              )
                            },
                            {
                              title: (
                                <span
                                  className={cn(
                                    'font-bold text-sm',
                                    stepCurrent >= 1
                                      ? 'text-slate-700'
                                      : 'text-slate-400'
                                  )}
                                >
                                  倉管接單與揀料 (Picking)
                                </span>
                              ),
                              description: (
                                <span className='text-[11px] font-mono text-slate-400 pb-4 block mt-1'>
                                  {stepCurrent >= 1
                                    ? `已自自動倉儲 (AS/RS) 取出 ${activeTicket.requiredQty} PCS`
                                    : '等待倉管接單...'}
                                </span>
                              ),
                              icon:
                                stepCurrent === 1 ? (
                                  <Timer
                                    size={18}
                                    className='text-fuchsia-500 animate-spin-slow'
                                  />
                                ) : undefined
                            },
                            {
                              title: (
                                <span
                                  className={cn(
                                    'font-bold text-sm',
                                    stepCurrent >= 2
                                      ? 'text-slate-700'
                                      : 'text-slate-400'
                                  )}
                                >
                                  AGV/物流車配送中 (Delivering)
                                </span>
                              ),
                              description: (
                                <span className='text-[11px] font-mono text-slate-400 pb-4 block mt-1'>
                                  {stepCurrent >= 2
                                    ? '物料運送至產線上料區'
                                    : ''}
                                </span>
                              ),
                              icon:
                                stepCurrent === 2 ? (
                                  <Truck
                                    size={18}
                                    className='text-blue-500 animate-pulse'
                                  />
                                ) : undefined
                            },
                            {
                              title: (
                                <span
                                  className={cn(
                                    'font-bold text-sm',
                                    stepCurrent >= 3
                                      ? 'text-emerald-600'
                                      : 'text-slate-400'
                                  )}
                                >
                                  產線接收，警報解除 (Resolved)
                                </span>
                              ),
                              description: (
                                <span className='text-[11px] font-mono text-slate-400 block mt-1'>
                                  {stepCurrent >= 3
                                    ? `物料已上機，恢復正常生產 (${activeTicket.actualResolvedTime})`
                                    : ''}
                                </span>
                              ),
                              icon:
                                stepCurrent === 3 ? (
                                  <CheckCircle2
                                    size={18}
                                    className='text-emerald-500'
                                  />
                                ) : undefined
                            }
                          ]}
                        />
                      </div>
                    </div>

                    <div className='mt-6 flex justify-end gap-3'>
                      <Button
                        size='large'
                        className='h-12 rounded-xl font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 px-8'
                        onClick={() => setIsDetailModalVisible(false)}
                      >
                        關閉
                      </Button>
                    </div>
                  </div>
                )
              })()}
          </Modal>

          <style>{`
            /* 自定義 Modal 樣式 */
            .custom-hmi-modal .ant-modal-content {
              border-radius: 28px;
              padding: 28px 32px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
              border: 1px solid #f1f5f9;
            }
            .custom-hmi-modal .ant-modal-header {
              background: transparent;
              margin-bottom: 0;
            }

            .custom-edit-modal .ant-modal-content {
              border-radius: 24px;
              padding: 24px;
              border: 1px solid #f1f5f9;
            }

            /* 呼吸燈動畫 */
            .animate-pulse-slow {
              animation: pulseRed 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            @keyframes pulseRed {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.8; box-shadow: 0 0 15px rgba(225, 29, 72, 0.6); }
            }
            .animate-spin-slow {
              animation: spin 3s linear infinite;
            }

            .custom-message .ant-message-notice-content {
              border-radius: 12px;
              padding: 12px 24px;
              font-weight: bold;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }

            .custom-stats-popover .ant-popover-inner {
              border-radius: 16px !important;
              padding: 16px !important;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
              border: 1px solid #fae8ff; /* fuchsia 100 border */
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
