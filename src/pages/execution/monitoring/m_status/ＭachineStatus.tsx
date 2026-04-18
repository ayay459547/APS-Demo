import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  ConfigProvider,
  Card,
  Popover,
  Badge,
  Tooltip,
  Button,
  Modal,
  message,
  Table,
  Tag,
  Input,
  Alert
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { InputRef } from 'antd'
import {
  Search,
  ChevronDown,
  RefreshCw,
  Info,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Flame,
  ArrowRight,
  Wrench,
  PackageX,
  Activity,
  BellRing,
  Crown,
  FastForward,
  SplitSquareHorizontal,
  CalendarClock,
  BrainCircuit,
  Bot
} from 'lucide-react'
import dayjs from 'dayjs'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 樣式合併工具函數 (Project Standard)
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- TypeScript 型別定義 ---
export type WarningLevel = '嚴重' | '高' | '中'
export type DelayReason =
  | '設備故障'
  | '缺料等待'
  | '產能壅塞'
  | '品質異常'
  | '前製程延遲'
export type ResolveStatus = '未處理' | '處理中' | '已排除'

export interface DelayWarning {
  id: string
  woId: string
  customer: string
  isVip: boolean
  productName: string
  warningLevel: WarningLevel
  reason: DelayReason
  affectedStage: string
  originalDueDate: string
  estimatedDate: string
  delayDays: number
  status: ResolveStatus
  createdAt: string
}

// --- 擬真數據產生器 ---
const generateWarnings = (count: number): DelayWarning[] => {
  const levels: WarningLevel[] = ['嚴重', '高', '高', '中', '中', '中']
  const reasons: DelayReason[] = [
    '設備故障',
    '缺料等待',
    '產能壅塞',
    '品質異常',
    '前製程延遲'
  ]
  const customers = [
    'Apple Inc.',
    'Tesla',
    'NVIDIA',
    'ASUS',
    'Advantech',
    'Garmin',
    'Dell'
  ]
  const stages = [
    'SMT-LINE-01',
    'DIP-LINE-02',
    'CNC-MC-12',
    'ASSY-LINE-A',
    'TEST-ST-05'
  ]

  return Array.from({ length: count }).map((_, idx) => {
    const warningLevel = levels[Math.floor(Math.random() * levels.length)]
    const reason = reasons[Math.floor(Math.random() * reasons.length)]
    const customer = customers[Math.floor(Math.random() * customers.length)]
    const isVip = ['Apple Inc.', 'Tesla', 'NVIDIA'].includes(customer)

    const delayDays =
      warningLevel === '嚴重'
        ? Math.floor(Math.random() * 5) + 5
        : warningLevel === '高'
          ? Math.floor(Math.random() * 3) + 2
          : Math.floor(Math.random() * 2) + 1

    const originalDueDate = dayjs()
      .add(Math.floor(Math.random() * 14) + 1, 'day')
      .format('YYYY-MM-DD')
    const estimatedDate = dayjs(originalDueDate)
      .add(delayDays, 'day')
      .format('YYYY-MM-DD')

    // 80% 未處理，20% 處理中
    const status = Math.random() > 0.2 ? '未處理' : '處理中'

    return {
      id: `ALR-${dayjs().format('MMDD')}-${String(idx + 1).padStart(4, '0')}`,
      woId: `WO-26X${String(Math.floor(Math.random() * 9000) + 1000)}`,
      customer,
      isVip,
      productName: '高階工業運算主機板',
      warningLevel,
      reason,
      affectedStage: stages[Math.floor(Math.random() * stages.length)],
      originalDueDate,
      estimatedDate,
      delayDays,
      status,
      createdAt: dayjs()
        .subtract(Math.floor(Math.random() * 48), 'hour')
        .format('YYYY-MM-DD HH:mm')
    }
  })
}

const mockWarningsData: DelayWarning[] = generateWarnings(45)

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

// --- 輔助函數：取得延誤原因圖示 ---
const getReasonMeta = (reason: DelayReason) => {
  switch (reason) {
    case '設備故障':
      return { icon: Wrench, color: 'text-rose-500', bg: 'bg-rose-50' }
    case '缺料等待':
      return { icon: PackageX, color: 'text-amber-500', bg: 'bg-amber-50' }
    case '產能壅塞':
      return { icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50' }
    case '品質異常':
      return { icon: ShieldAlert, color: 'text-orange-500', bg: 'bg-orange-50' }
    case '前製程延遲':
      return { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' }
    default:
      return { icon: AlertTriangle, color: 'text-slate-500', bg: 'bg-slate-50' }
  }
}

// --- 主元件 ---
export default function DelayWarningCenter() {
  const [loading, setLoading] = useState<boolean>(true)
  const [warnings, setWarnings] = useState<DelayWarning[]>(mockWarningsData)

  // AI 處置 Modal 狀態
  const [isResolveModalVisible, setIsResolveModalVisible] = useState(false)
  const [activeWarning, setActiveWarning] = useState<DelayWarning | null>(null)
  const [resolving, setResolving] = useState(false)

  const searchInputRef = useRef<InputRef>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(() => {
    const unresolved = warnings.filter(d => d.status === '未處理')
    const totalPending = unresolved.length
    const critical = unresolved.filter(d => d.warningLevel === '嚴重').length
    const vipAffected = unresolved.filter(d => d.isVip).length

    const avgDays =
      unresolved.length > 0
        ? (
            unresolved.reduce((sum, curr) => sum + curr.delayDays, 0) /
            unresolved.length
          ).toFixed(1)
        : '0.0'

    return { totalPending, critical, vipAffected, avgDays }
  }, [warnings])

  // --- 操作處理函式 ---
  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success({
        content: '預警資料已同步至最新狀態！',
        className: 'custom-message'
      })
    }, 600)
  }

  const openResolveModal = (warning: DelayWarning) => {
    setActiveWarning(warning)
    setIsResolveModalVisible(true)
  }

  const handleApplySolution = (solutionName: string) => {
    setResolving(true)
    setTimeout(() => {
      setWarnings(prev => prev.filter(w => w.id !== activeWarning?.id))
      setResolving(false)
      setIsResolveModalVisible(false)
      message.success({
        content: `已成功套用方案：${solutionName}，系統正在重新排程...`,
        className: 'custom-message'
      })
    }, 1200)
  }

  // --- 搜尋過濾邏輯 ---
  const getSearchProps = (dataIndex: keyof DelayWarning, title: string) => ({
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
            className='text-[10px] font-bold px-4 text-white border-none bg-rose-600 rounded-lg'
          >
            篩選
          </Button>
        </div>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <Search
        size={14}
        className={filtered ? 'text-rose-500' : 'text-slate-300'}
      />
    ),
    onFilter: (value: any, record: DelayWarning): boolean => {
      const targetValue = record[dataIndex]
      if (targetValue === null || targetValue === undefined) return false
      return targetValue
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase())
    }
  })

  // --- Popover KPI 內容 ---
  const statsContent = (
    <div className='w-full max-w-120 py-1'>
      <div className='flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5'>
        <BellRing size={16} className='text-rose-600' />
        <span className='font-bold text-slate-800'>全廠延誤預警監控</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='嚴重延誤預警'
          value={stats.critical}
          unit='件'
          icon={Flame}
          colorClass='text-rose-600'
          bgClass='bg-rose-100/80'
          iconColorClass='text-rose-600'
          isAlert={stats.critical > 0}
          trend='交期偏移 > 5 天'
        />
        <StatCard
          title='受影響 VIP 訂單'
          value={stats.vipAffected}
          unit='件'
          icon={Crown}
          colorClass='text-amber-600'
          bgClass='bg-amber-50'
          iconColorClass='text-amber-500'
          trend='需優先調度排除'
        />
        <StatCard
          title='未處理預警總數'
          value={stats.totalPending}
          unit='件'
          icon={AlertTriangle}
          colorClass='text-orange-600'
          bgClass='bg-orange-50'
          iconColorClass='text-orange-500'
        />
        <StatCard
          title='平均延遲天數'
          value={stats.avgDays}
          unit='天'
          icon={CalendarClock}
          colorClass='text-slate-500'
          bgClass='bg-slate-50'
          iconColorClass='text-slate-400'
        />
      </div>
    </div>
  )

  // --- 表格欄位定義 ---
  const columns: ColumnsType<DelayWarning> = [
    {
      title: '預警等級 / 工單',
      key: 'levelAndWo',
      width: 220,
      fixed: 'left',
      sorter: (a, b) => {
        const order = { 嚴重: 3, 高: 2, 中: 1 }
        return order[b.warningLevel] - order[a.warningLevel]
      },
      ...getSearchProps('woId', '工單號'),
      render: (_, record) => {
        let badgeClass = ''
        if (record.warningLevel === '嚴重')
          badgeClass =
            'bg-rose-500 text-white shadow-rose-200 animate-pulse-slow ring-2 ring-rose-500/30'
        else if (record.warningLevel === '高')
          badgeClass = 'bg-orange-500 text-white shadow-orange-200'
        else badgeClass = 'bg-amber-400 text-white shadow-amber-200'

        return (
          <div className='flex items-center gap-3'>
            <div
              className={cn(
                'px-2 py-0.5 rounded-md text-[10px] font-black shadow-md shrink-0 w-[42px] text-center tracking-widest',
                badgeClass
              )}
            >
              {record.warningLevel}
            </div>
            <div className='flex flex-col gap-0.5'>
              <span className='font-mono font-black text-slate-800 text-[14px] hover:text-blue-600 cursor-pointer transition-colors'>
                {record.woId}
              </span>
              <span
                className='text-[10px] text-slate-400 truncate max-w-[120px]'
                title={record.id}
              >
                {record.id}
              </span>
            </div>
          </div>
        )
      }
    },
    {
      title: '客戶 / 產品',
      key: 'customerInfo',
      width: 180,
      filters: [
        { text: 'Apple Inc.', value: 'Apple Inc.' },
        { text: 'Tesla', value: 'Tesla' },
        { text: 'NVIDIA', value: 'NVIDIA' }
      ],
      onFilter: (value, record) => record.customer === value,
      render: (_, record) => (
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-1.5'>
            {record.isVip && (
              <Crown
                size={12}
                className='text-amber-500 fill-amber-500 shrink-0'
              />
            )}
            <span
              className={cn(
                'font-bold text-xs truncate',
                record.isVip ? 'text-amber-600' : 'text-slate-700'
              )}
            >
              {record.customer}
            </span>
          </div>
          <span
            className='text-[11px] text-slate-500 truncate max-w-37.5'
            title={record.productName}
          >
            {record.productName}
          </span>
        </div>
      )
    },
    {
      title: '延誤原因 / 卡關站點',
      key: 'reasonInfo',
      width: 180,
      filters: [
        { text: '設備故障', value: '設備故障' },
        { text: '缺料等待', value: '缺料等待' },
        { text: '產能壅塞', value: '產能壅塞' }
      ],
      onFilter: (value, record) => record.reason === value,
      render: (_, record) => {
        const meta = getReasonMeta(record.reason)
        const ReasonIcon = meta.icon
        return (
          <div className='flex flex-col gap-1.5'>
            <Tag
              className={cn(
                'm-0 border-none font-bold text-[11px] flex items-center gap-1 w-fit px-2 py-0.5',
                meta.bg,
                meta.color
              )}
            >
              <ReasonIcon size={12} className='inline' /> {record.reason}
            </Tag>
            <span className='text-[10px] font-mono text-slate-500 pl-1'>
              @ {record.affectedStage}
            </span>
          </div>
        )
      }
    },
    {
      title: '交期偏移可視化 (Timeline Slip)',
      key: 'timeline',
      width: 280,
      sorter: (a, b) => a.delayDays - b.delayDays,
      render: (_, record) => {
        // 視覺化邏輯：計算延遲天數的比例，最大顯示 10 天
        const maxDays = 10
        const slipPercent = Math.min(100, (record.delayDays / maxDays) * 100)

        return (
          <div className='w-full pr-4 flex flex-col gap-1.5'>
            <div className='flex justify-between items-end'>
              <div className='flex flex-col'>
                <span className='text-[9px] font-bold text-slate-400'>
                  原訂交期
                </span>
                <span className='text-[11px] font-mono font-bold text-emerald-600'>
                  {record.originalDueDate}
                </span>
              </div>
              <div className='flex flex-col items-end'>
                <span className='text-[9px] font-bold text-rose-400'>
                  預估延至 (+{record.delayDays}天)
                </span>
                <span className='text-[11px] font-mono font-black text-rose-600'>
                  {record.estimatedDate}
                </span>
              </div>
            </div>

            {/* 交期偏移進度條 */}
            <div className='w-full h-2 bg-emerald-100 rounded-full flex relative mt-1'>
              <div
                className='absolute left-0 top-0 h-full bg-emerald-500 rounded-l-full'
                style={{ width: '50%' }}
              ></div>
              <div
                className='absolute left-[50%] top-0 h-full bg-rose-500 rounded-r-full transition-all duration-500 ease-out'
                style={{ width: `${slipPercent / 2}%` }}
              ></div>
              {/* 基準線 */}
              <div className='absolute left-[50%] -top-1 h-4 w-0.5 bg-slate-300'></div>
            </div>
          </div>
        )
      }
    },
    {
      title: '處置狀態',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: [
        { text: '未處理', value: '未處理' },
        { text: '處理中', value: '處理中' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: ResolveStatus) => {
        return (
          <div
            className={cn(
              'inline-flex items-center justify-center px-2 py-1 rounded-md text-[10px] font-bold w-[56px]',
              status === '未處理'
                ? 'bg-slate-100 text-slate-500'
                : 'bg-blue-50 text-blue-600 border border-blue-200'
            )}
          >
            {status}
          </div>
        )
      }
    },
    {
      title: '智慧決策',
      key: 'action',
      width: 100,
      fixed: 'right',
      align: 'center',
      render: (_, record) => {
        return (
          <Tooltip title='開啟 AI 調度建議'>
            <Button
              type='primary'
              size='small'
              className='bg-rose-600 hover:bg-rose-500 border-none rounded-lg shadow-md shadow-rose-200 flex items-center justify-center h-8 px-3 mx-auto group'
              onClick={() => openResolveModal(record)}
            >
              <BrainCircuit size={14} className='group-hover:animate-pulse' />
              <span className='text-xs font-bold ml-1'>處置</span>
            </Button>
          </Tooltip>
        )
      }
    }
  ]

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#e11d48', borderRadius: 12, borderRadiusSM: 6 } // Rose 600 base
      }}
    >
      <div className='w-full min-h-screen bg-[#f8fafc] p-4 font-sans'>
        <div className='mx-auto px-2 pt-2 pb-8 space-y-6 animate-fade-in relative max-w-400'>
          {loading && (
            <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-110 flex items-center justify-center rounded-[28px] mt-[60px]'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-10 h-10 border-4 border-rose-100 border-t-rose-600 rounded-full animate-spin' />
                <span className='text-xs font-black text-rose-600 tracking-widest uppercase'>
                  Analyzing Risks...
                </span>
              </div>
            </div>
          )}

          {/* 玻璃透視頂部導航列 */}
          <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/50 py-2 rounded-xl sticky top-0 z-20 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='bg-linear-to-br from-rose-500 to-orange-500 p-1.5 rounded-lg shadow-rose-200 shadow-lg'>
                <BellRing size={18} className='text-white' />
              </div>
              <div className='flex items-center'>
                <Popover
                  content={statsContent}
                  trigger='click'
                  placement='bottomLeft'
                  rootClassName='custom-stats-popover'
                >
                  <div className='flex items-center gap-2 cursor-pointer hover:bg-white px-2 sm:px-3 py-1.5 rounded-full transition-all group border border-transparent hover:border-slate-100'>
                    <span className='text-sm font-bold text-slate-600 group-hover:text-rose-600 whitespace-nowrap'>
                      延誤預警監控
                    </span>
                    <div className='flex gap-1'>
                      <Badge
                        count={stats.critical}
                        style={{
                          backgroundColor: '#e11d48',
                          fontSize: '10px',
                          boxShadow: 'none'
                        }}
                      />
                      {stats.vipAffected > 0 && (
                        <Badge
                          count='VIP受影響'
                          style={{
                            backgroundColor: '#f59e0b',
                            fontSize: '10px',
                            boxShadow: 'none'
                          }}
                        />
                      )}
                    </div>
                    <ChevronDown
                      size={14}
                      className='text-slate-400 group-hover:text-rose-600'
                    />
                  </div>
                </Popover>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Tooltip title='重新評估所有訂單風險'>
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
                icon={<Bot size={16} />}
                className='rounded-xl bg-slate-800 shadow-md shadow-slate-300 font-bold border-none h-10 flex items-center justify-center hover:bg-slate-700'
                onClick={() => message.info('正在啟動全局 AI 自動排程優化...')}
              >
                <span className='hidden sm:inline ml-1 text-xs'>
                  一鍵全局優化
                </span>
              </Button>
            </div>
          </div>

          <Card
            className='shadow-xl shadow-slate-200/50 border-none rounded-[32px] overflow-hidden bg-white'
            styles={{ body: { padding: 0 } }}
          >
            <div className='bg-slate-50/50 p-5 border-b border-slate-100 flex items-center justify-between'>
              <div className='flex items-center gap-3 text-slate-500 text-[11px] font-black uppercase tracking-widest'>
                <AlertTriangle size={14} />
                工單延誤預警清單 (Delay Warnings)
              </div>
              <div className='flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm'>
                <Info size={14} className='text-rose-500' />
                <span className='text-[10px] text-slate-400 font-bold uppercase tracking-tight'>
                  提示：紅色脈衝燈號代表「嚴重延誤」，請優先點擊「處置」進行排程調整。
                </span>
              </div>
            </div>

            <div className='p-4 pt-0'>
              <Table<DelayWarning>
                columns={columns}
                dataSource={warnings}
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

          {/* --- AI 處置面板 Modal --- */}
          <Modal
            title={null}
            open={isResolveModalVisible}
            onCancel={() => !resolving && setIsResolveModalVisible(false)}
            footer={null}
            className='custom-hmi-modal'
            width={720}
            mask={{ closable: !resolving }}
          >
            <div className='flex items-center gap-3 text-slate-800 border-b border-slate-100 pb-4 mb-4 mt-2'>
              <div className='bg-gradient-to-r from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-md shadow-blue-200'>
                <BrainCircuit size={24} className='text-white' />
              </div>
              <div className='flex flex-col'>
                <span className='font-black text-xl tracking-tight'>
                  AI 智能調度決策 (AI Resolution)
                </span>
                <div className='flex items-center gap-2 mt-0.5'>
                  <span className='text-xs font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded'>
                    {activeWarning?.woId}
                  </span>
                  <span className='text-[11px] font-bold text-slate-500'>
                    {activeWarning?.customer}{' '}
                    {activeWarning?.isVip && (
                      <Crown
                        size={10}
                        className='inline text-amber-500 mb-0.5'
                      />
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* 異常情境分析 */}
            <Alert
              message={
                <span className='font-bold text-rose-700'>延誤情境分析</span>
              }
              description={
                <div className='text-sm mt-1 text-rose-600 font-medium'>
                  系統預測此工單將因{' '}
                  <span className='font-black bg-rose-200/50 px-1 rounded'>
                    {activeWarning?.reason}
                  </span>{' '}
                  導致於 <b>{activeWarning?.affectedStage}</b> 發生瓶頸。
                  <br />
                  若不進行干預，預計交期將從 {
                    activeWarning?.originalDueDate
                  }{' '}
                  延遲至{' '}
                  <span className='font-black underline decoration-rose-400 decoration-2 underline-offset-2'>
                    {activeWarning?.estimatedDate} (延誤{' '}
                    {activeWarning?.delayDays} 天)
                  </span>
                  。
                </div>
              }
              type='error'
              showIcon
              icon={<AlertTriangle className='mt-1' />}
              className='rounded-2xl border-rose-200 bg-rose-50 mb-6'
            />

            <h4 className='text-sm font-black text-slate-700 my-4 flex items-center gap-2'>
              <Bot size={16} className='text-indigo-500' />
              系統運算建議方案 (Select a Solution)
            </h4>

            {/* 方案選項區塊 */}
            <div className='flex flex-col gap-3 relative'>
              {resolving && (
                <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-xl'>
                  <div className='w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-3'></div>
                  <span className='font-black text-indigo-600 tracking-widest text-sm'>
                    執行排程重算中...
                  </span>
                </div>
              )}

              {/* Option A */}
              <div
                className='group border-2 border-indigo-100 hover:border-indigo-500 bg-white rounded-2xl p-4 transition-all hover:shadow-lg hover:shadow-indigo-100 flex items-center justify-between cursor-pointer'
                onClick={() =>
                  !resolving && handleApplySolution('平行擴充生產線')
                }
              >
                <div className='flex gap-4 items-center'>
                  <div className='w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition-colors'>
                    <SplitSquareHorizontal
                      size={20}
                      className='text-indigo-600 group-hover:text-white'
                    />
                  </div>
                  <div className='flex flex-col'>
                    <div className='flex items-center gap-2'>
                      <span className='font-black text-slate-800 text-base'>
                        平行擴充生產線 (Split Order)
                      </span>
                      <Tag
                        color='success'
                        className='m-0 font-bold border-none'
                      >
                        最佳推薦
                      </Tag>
                    </div>
                    <span className='text-xs text-slate-500 mt-1'>
                      將 50% 批量分流至備用機台{' '}
                      <span className='font-mono font-bold text-slate-600'>
                        SMT-LINE-02
                      </span>{' '}
                      進行同步生產。
                    </span>
                    <span className='text-[11px] font-bold text-emerald-600 mt-1.5 flex items-center gap-1'>
                      <ArrowRight size={12} /> 預計可追回交期：
                      <span className='text-sm'>
                        {activeWarning?.delayDays} 天 (準時交貨)
                      </span>
                    </span>
                  </div>
                </div>
                <Button
                  type='primary'
                  shape='round'
                  className='bg-indigo-600 border-none font-bold shadow-md shadow-indigo-200'
                >
                  套用此方案
                </Button>
              </div>

              {/* Option B */}
              <div
                className='group border-2 border-slate-100 hover:border-blue-400 bg-white rounded-2xl p-4 transition-all hover:shadow-lg hover:shadow-blue-50 flex items-center justify-between cursor-pointer'
                onClick={() =>
                  !resolving && handleApplySolution('申請週末加班')
                }
              >
                <div className='flex gap-4 items-center'>
                  <div className='w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-blue-500 transition-colors'>
                    <FastForward
                      size={20}
                      className='text-slate-500 group-hover:text-white'
                    />
                  </div>
                  <div className='flex flex-col'>
                    <span className='font-black text-slate-800 text-base'>
                      申請週末加班 (Add Overtime)
                    </span>
                    <span className='text-xs text-slate-500 mt-1'>
                      於本週末為 {activeWarning?.affectedStage} 增加 2 個班別
                      (16hr) 的產能。
                    </span>
                    <span className='text-[11px] font-bold text-blue-600 mt-1.5 flex items-center gap-1'>
                      <ArrowRight size={12} /> 預計可追回交期：
                      <span className='text-sm'>
                        {Math.max(1, (activeWarning?.delayDays || 2) - 1)} 天
                      </span>
                    </span>
                  </div>
                </div>
                <Button
                  type='default'
                  shape='round'
                  className='font-bold text-slate-600 border-slate-300 group-hover:border-blue-400 group-hover:text-blue-600'
                >
                  套用此方案
                </Button>
              </div>
            </div>

            <div className='mt-6 flex justify-end border-t border-slate-100 pt-4'>
              <Button
                size='large'
                className='h-10 rounded-xl font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 px-6'
                onClick={() => setIsResolveModalVisible(false)}
                disabled={resolving}
              >
                稍後手動處理
              </Button>
            </div>
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

            /* 呼吸燈動畫 (嚴重延誤專用) */
            .animate-pulse-slow {
              animation: pulseRed 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            @keyframes pulseRed {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.8; box-shadow: 0 0 15px rgba(225, 29, 72, 0.6); }
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
