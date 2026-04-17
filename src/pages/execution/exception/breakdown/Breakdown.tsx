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
  ShieldAlert,
  AlertTriangle,
  Clock,
  Wrench,
  Activity,
  CheckCircle2,
  Factory,
  PenTool,
  PhoneCall,
  HardHat,
  Timer,
  CheckSquare
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
export type UrgencyLevel = '一般' | '緊急' | '停線特急'
export type RepairStatus = '待派工' | '維修中' | '待驗證' | '已完工'

export interface RepairTicket {
  id: string
  workCenter: string
  issue: string
  urgency: UrgencyLevel
  status: RepairStatus
  reporter: string
  reportTime: string
  technician?: string
  estimatedFinishTime?: string
  actualFinishTime?: string
}

export interface EquipmentStatus {
  id: string
  name: string
  status: '運轉中' | '故障停機' | '保養中'
  oee: number
}

// --- 擬真數據產生器 ---
const mockEquipments: EquipmentStatus[] = [
  { id: 'EQ-001', name: 'SMT-LINE-01', status: '運轉中', oee: 88.5 },
  { id: 'EQ-002', name: 'SMT-LINE-02', status: '故障停機', oee: 45.2 },
  { id: 'EQ-003', name: 'DIP-LINE-01', status: '運轉中', oee: 92.1 },
  { id: 'EQ-004', name: 'CNC-MC-12', status: '故障停機', oee: 55.8 },
  { id: 'EQ-005', name: 'ASSY-LINE-A', status: '運轉中', oee: 85.0 },
  { id: 'EQ-006', name: 'TEST-ST-05', status: '保養中', oee: 70.4 }
]

const generateRepairTickets = (count: number): RepairTicket[] => {
  const urgencies: UrgencyLevel[] = ['一般', '一般', '緊急', '停線特急']
  const statuses: RepairStatus[] = ['待派工', '維修中', '待驗證', '已完工']
  const equipments = [
    'SMT-LINE-02',
    'CNC-MC-12',
    'ASSY-LINE-A',
    'TEST-ST-05',
    'PKG-01'
  ]
  const issues = [
    '貼片機吸嘴異常掉料',
    '主軸馬達異音',
    '輸送帶卡件',
    '測試治具感測器失靈',
    '控制面板黑屏'
  ]
  const techs = ['王技師', '李工程師', '張副理', '陳維修員']

  return Array.from({ length: count })
    .map((_, idx) => {
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const urgency =
        status === '已完工'
          ? '一般'
          : urgencies[Math.floor(Math.random() * urgencies.length)]
      const reportTime = dayjs()
        .subtract(Math.floor(Math.random() * 48), 'hour')
        .subtract(Math.floor(Math.random() * 60), 'minute')

      let technician
      let estimatedFinishTime
      let actualFinishTime

      if (status !== '待派工') {
        technician = techs[Math.floor(Math.random() * techs.length)]
        estimatedFinishTime = reportTime
          .add(Math.floor(Math.random() * 4) + 2, 'hour')
          .format('YYYY-MM-DD HH:mm')
      }

      if (status === '已完工' || status === '待驗證') {
        actualFinishTime = reportTime
          .add(Math.floor(Math.random() * 3) + 1, 'hour')
          .format('YYYY-MM-DD HH:mm')
      }

      return {
        id: `REP-${dayjs().format('MMDD')}-${String(idx + 1).padStart(4, '0')}`,
        workCenter: equipments[Math.floor(Math.random() * equipments.length)],
        issue: issues[Math.floor(Math.random() * issues.length)],
        urgency,
        status,
        reporter: '現場課長',
        reportTime: reportTime.format('YYYY-MM-DD HH:mm'),
        technician,
        estimatedFinishTime,
        actualFinishTime
      }
    })
    .sort(
      (a, b) => dayjs(b.reportTime).valueOf() - dayjs(a.reportTime).valueOf()
    )
}

const mockTicketsData: RepairTicket[] = generateRepairTickets(35)

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
      'bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md cursor-default',
      isAlert &&
        'ring-2 ring-rose-200 bg-rose-50/30 border-transparent shadow-rose-100'
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
            isAlert ? 'text-rose-600' : 'text-slate-800'
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
  const [tickets, setTickets] = useState<RepairTicket[]>(mockTicketsData)

  // Modal & Popover 狀態
  const [isReportModalVisible, setIsReportModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isEquipmentPopoverVisible, setIsEquipmentPopoverVisible] =
    useState(false)
  const [activeTicket, setActiveTicket] = useState<RepairTicket | null>(null)

  const [reportForm] = Form.useForm()
  const searchInputRef = useRef<InputRef>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(() => {
    const activeTickets = tickets.filter(t => t.status !== '已完工')
    const critical = activeTickets.filter(t => t.urgency === '停線特急').length
    const repairing = activeTickets.filter(t => t.status === '維修中').length
    const pending = activeTickets.filter(t => t.status === '待派工').length
    return { active: activeTickets.length, critical, repairing, pending }
  }, [tickets])

  // --- Popover KPI 內容 ---
  const statsContent = (
    <div className='w-full max-w-[480px] py-1'>
      <div className='flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5'>
        <Wrench size={16} className='text-rose-600' />
        <span className='font-bold text-slate-800'>設備維修 KPI 概覽</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='停線特急報修'
          value={stats.critical}
          unit='件'
          icon={ShieldAlert}
          colorClass='text-rose-600'
          bgClass='bg-rose-100/80'
          iconColorClass='text-rose-600'
          isAlert={stats.critical > 0}
          trend='需最高優先排除'
        />
        <StatCard
          title='維修進行中'
          value={stats.repairing}
          unit='件'
          icon={PenTool}
          colorClass='text-blue-600'
          bgClass='bg-blue-50'
          iconColorClass='text-blue-500'
          trend='工程師搶修中'
        />
        <StatCard
          title='未派工等待中'
          value={stats.pending}
          unit='件'
          icon={Clock}
          colorClass='text-amber-600'
          bgClass='bg-amber-50'
          iconColorClass='text-amber-500'
        />
        <StatCard
          title='本月平均修復時間 (MTTR)'
          value='2.4'
          unit='hr'
          icon={Timer}
          colorClass='text-emerald-600'
          bgClass='bg-slate-50'
          iconColorClass='text-emerald-500'
          trend='較上月縮短 0.5hr'
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
        content: '報修數據已同步至最新狀態！',
        className: 'custom-message'
      })
    }, 600)
  }

  const openReportModal = (equipmentName?: string) => {
    reportForm.resetFields()
    if (equipmentName) {
      reportForm.setFieldsValue({
        workCenter: equipmentName,
        urgency: '停線特急'
      })
    } else {
      reportForm.setFieldsValue({ urgency: '一般' })
    }
    setIsReportModalVisible(true)
  }

  const submitReport = async () => {
    try {
      const values = await reportForm.validateFields()
      const newTicket: RepairTicket = {
        id: `REP-${dayjs().format('MMDD')}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        workCenter: values.workCenter,
        issue: values.issue,
        urgency: values.urgency,
        status: '待派工',
        reporter: '現場操作員 (Current User)',
        reportTime: dayjs().format('YYYY-MM-DD HH:mm')
      }
      setTickets([newTicket, ...tickets])
      setIsReportModalVisible(false)
      message.success({
        content: `已成功通報 ${values.workCenter} 故障！`,
        className: 'custom-message'
      })
    } catch (error) {
      console.log('Validation Failed:', error)
    }
  }

  const openDetailModal = (ticket: RepairTicket) => {
    setActiveTicket(ticket)
    setIsDetailModalVisible(true)
  }

  // --- 搜尋過濾邏輯 ---
  const getSearchProps = (dataIndex: keyof RepairTicket, title: string) => ({
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
    onFilter: (value: any, record: RepairTicket): boolean => {
      const targetValue = record[dataIndex]
      if (targetValue === null || targetValue === undefined) return false
      return targetValue
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase())
    }
  })

  // --- 表格欄位定義 ---
  const columns: ColumnsType<RepairTicket> = [
    {
      title: '報修單號 / 機台',
      key: 'idAndWo',
      width: 220,
      fixed: 'left',
      ...getSearchProps('workCenter', '機台名稱'),
      render: (_, record) => (
        <div className='flex items-center gap-3'>
          <div className='flex flex-col gap-0.5'>
            <span
              className='font-mono font-black text-slate-800 text-[14px] hover:text-blue-600 cursor-pointer transition-colors'
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
      title: '故障現象描述',
      dataIndex: 'issue',
      key: 'issue',
      width: 280,
      render: text => (
        <div className='flex items-center gap-2 text-xs font-bold text-slate-700'>
          <AlertTriangle size={14} className='text-slate-400 shrink-0' />
          <span className='truncate' title={text}>
            {text}
          </span>
        </div>
      )
    },
    {
      title: '緊急程度',
      dataIndex: 'urgency',
      key: 'urgency',
      width: 120,
      filters: [
        { text: '一般', value: '一般' },
        { text: '緊急', value: '緊急' },
        { text: '停線特急', value: '停線特急' }
      ],
      onFilter: (value, record) => record.urgency === value,
      render: (urgency: UrgencyLevel) => {
        let badgeClass = ''
        if (urgency === '停線特急')
          badgeClass =
            'bg-rose-500 text-white shadow-rose-200 animate-pulse-slow ring-2 ring-rose-500/30'
        else if (urgency === '緊急')
          badgeClass = 'bg-orange-500 text-white shadow-orange-200'
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
      title: '維修狀態',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: '待派工', value: '待派工' },
        { text: '維修中', value: '維修中' },
        { text: '待驗證', value: '待驗證' },
        { text: '已完工', value: '已完工' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: RepairStatus) => {
        let colorClass = ''
        let bgClass = ''
        switch (status) {
          case '待派工':
            colorClass = 'text-rose-600'
            bgClass = 'bg-rose-50 border-rose-200'
            break
          case '維修中':
            colorClass = 'text-blue-600'
            bgClass = 'bg-blue-50 border-blue-200 shadow-sm shadow-blue-100'
            break
          case '待驗證':
            colorClass = 'text-amber-600'
            bgClass = 'bg-amber-50 border-amber-200'
            break
          case '已完工':
            colorClass = 'text-emerald-600'
            bgClass = 'bg-emerald-50 border-emerald-200'
            break
        }
        return (
          <div
            className={cn(
              'inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-bold border w-fit',
              bgClass,
              colorClass
            )}
          >
            {status}
          </div>
        )
      }
    },
    {
      title: '通報時間',
      dataIndex: 'reportTime',
      key: 'reportTime',
      width: 160,
      sorter: (a, b) =>
        dayjs(a.reportTime).valueOf() - dayjs(b.reportTime).valueOf(),
      render: text => (
        <span className='font-mono text-[11px] text-slate-500'>{text}</span>
      )
    },
    {
      title: '負責技師',
      dataIndex: 'technician',
      key: 'technician',
      width: 120,
      render: text =>
        text ? (
          <span className='text-xs font-bold text-slate-600 flex items-center gap-1.5'>
            <HardHat size={14} className='text-indigo-400' /> {text}
          </span>
        ) : (
          <span className='text-xs font-bold text-rose-400'>- 尚未指派 -</span>
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
          <Tooltip title='查看維修進度履歷'>
            <Button
              type='primary'
              size='small'
              className={cn(
                'border-none rounded-lg shadow-md flex items-center justify-center h-8 px-3 mx-auto',
                record.status === '已完工'
                  ? 'bg-emerald-500 shadow-emerald-200 hover:bg-emerald-400'
                  : 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-500'
              )}
              onClick={() => openDetailModal(record)}
            >
              {record.status === '已完工' ? (
                <CheckSquare size={14} />
              ) : (
                <Activity size={14} />
              )}
              <span className='text-xs font-bold ml-1'>進度</span>
            </Button>
          </Tooltip>
        )
      }
    }
  ]

  const hasDownEquipment = mockEquipments.some(eq => eq.status === '故障停機')

  // --- Popover 設備健康矩陣內容 ---
  const equipmentContent = (
    <div className='w-full max-w-[640px] py-1'>
      <div className='flex items-center justify-between gap-2 mb-4 border-b border-slate-100 pb-2.5'>
        <div className='flex items-center gap-2'>
          <Activity
            size={16}
            className={cn(
              'text-indigo-600',
              hasDownEquipment && 'text-rose-600'
            )}
          />
          <span className='font-bold text-slate-800'>
            即時設備健康矩陣 (Live Status)
          </span>
        </div>
        <span className='text-[10px] text-rose-500 font-bold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded'>
          點擊紅色機台可快速通報
        </span>
      </div>
      <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
        {mockEquipments.map(eq => {
          const isDown = eq.status === '故障停機'
          const isMaint = eq.status === '保養中'
          return (
            <div
              key={eq.id}
              className={cn(
                'bg-white rounded-xl p-3 border-2 transition-all cursor-pointer hover:shadow-md relative overflow-hidden group',
                isDown
                  ? 'border-rose-400 bg-rose-50/50 hover:border-rose-500'
                  : isMaint
                    ? 'border-amber-300 bg-amber-50/50'
                    : 'border-slate-100 hover:border-emerald-300'
              )}
              onClick={() => {
                if (isDown) {
                  openReportModal(eq.name)
                  setIsEquipmentPopoverVisible(false) // 點擊時關閉 Popover
                }
              }}
            >
              {isDown && (
                <div className='absolute inset-0 ring-4 ring-rose-500/20 animate-pulse pointer-events-none rounded-xl'></div>
              )}
              <div className='flex justify-between items-start mb-2 relative z-10'>
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                    isDown
                      ? 'bg-rose-100 text-rose-600'
                      : isMaint
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-slate-100 text-slate-500 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors'
                  )}
                >
                  <Factory size={14} />
                </div>
                {isDown ? (
                  <span className='text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded'>
                    需報修
                  </span>
                ) : (
                  <span
                    className={cn(
                      'text-[9px] font-black px-1.5 py-0.5 rounded border',
                      isMaint
                        ? 'text-amber-600 border-amber-200 bg-amber-50'
                        : 'text-emerald-600 border-emerald-200 bg-emerald-50'
                    )}
                  >
                    {eq.status}
                  </span>
                )}
              </div>
              <div className='flex flex-col relative z-10'>
                <span className='font-black text-xs text-slate-800 tracking-tight truncate'>
                  {eq.name}
                </span>
                <span className='text-[10px] text-slate-400 font-mono mt-0.5'>
                  OEE:{' '}
                  <span
                    className={cn(
                      'font-bold',
                      isDown ? 'text-rose-500' : 'text-slate-600'
                    )}
                  >
                    {eq.oee}%
                  </span>
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#e11d48', borderRadius: 12, borderRadiusSM: 6 } // Rose 600 base
      }}
    >
      <div className='w-full min-h-screen bg-[#f8fafc] p-4 font-sans'>
        <div className='mx-auto px-2 pt-2 pb-8 space-y-6 animate-fade-in relative max-w-[1600px]'>
          {loading && (
            <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-[110] flex items-center justify-center rounded-[28px] mt-[60px]'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-10 h-10 border-4 border-rose-100 border-t-rose-600 rounded-full animate-spin' />
                <span className='text-xs font-black text-rose-600 tracking-widest uppercase'>
                  Loading Maintenance Data...
                </span>
              </div>
            </div>
          )}

          {/* 玻璃透視頂部導航列 */}
          <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/50 py-2.5 rounded-2xl sticky top-0 z-20 backdrop-blur-md shadow-sm border border-white'>
            <div className='flex items-center gap-3 ml-2'>
              <div className='bg-gradient-to-br from-rose-500 to-red-600 p-2 rounded-xl shadow-rose-200 shadow-lg'>
                <Wrench size={20} className='text-white' />
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
                      設備故障報修中心
                    </span>
                    <div className='flex gap-1'>
                      {stats.critical > 0 && (
                        <Badge
                          count={`${stats.critical} 特急`}
                          style={{
                            backgroundColor: '#f43f5e',
                            fontSize: '10px',
                            boxShadow: 'none'
                          }}
                        />
                      )}
                      {stats.pending > 0 && (
                        <Badge
                          count={`${stats.pending} 待派工`}
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

            <div className='flex items-center gap-3 mr-2'>
              <Popover
                content={equipmentContent}
                trigger='click'
                placement='bottomRight'
                rootClassName='custom-stats-popover'
                open={isEquipmentPopoverVisible}
                onOpenChange={setIsEquipmentPopoverVisible}
              >
                <Button
                  className={cn(
                    'rounded-xl border shadow-sm font-bold h-10 flex items-center justify-center px-4 transition-all',
                    hasDownEquipment
                      ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 hover:border-rose-300'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200'
                  )}
                >
                  <Activity size={16} className='mr-1.5' />
                  <span className='text-sm hidden sm:inline'>機台矩陣</span>
                  {hasDownEquipment && (
                    <span className='relative flex h-2 w-2 ml-2'>
                      <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75'></span>
                      <span className='relative inline-flex rounded-full h-2 w-2 bg-rose-500'></span>
                    </span>
                  )}
                </Button>
              </Popover>
              <Tooltip title='重新整理狀態'>
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
                icon={<PhoneCall size={16} />}
                className='rounded-xl bg-rose-600 shadow-md shadow-rose-200 font-bold border-none h-10 flex items-center justify-center hover:bg-rose-500 px-5'
                onClick={() => openReportModal()}
              >
                <span className='hidden sm:inline ml-1 text-sm'>
                  建立報修單
                </span>
              </Button>
            </div>
          </div>

          <Card
            className='shadow-xl shadow-slate-200/50 border-none rounded-[24px] overflow-hidden bg-white mt-6'
            styles={{ body: { padding: 0 } }}
          >
            <div className='bg-slate-50/50 p-5 border-b border-slate-100 flex items-center justify-between'>
              <div className='flex items-center gap-3 text-slate-500 text-[11px] font-black uppercase tracking-widest'>
                <CheckSquare size={14} />
                全廠報修任務追蹤清單 (Repair Tickets)
              </div>
            </div>

            <div className='p-4 pt-0'>
              <Table<RepairTicket>
                columns={columns}
                dataSource={tickets}
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

          {/* --- 新增報修單 Modal --- */}
          <Modal
            title={
              <div className='flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3'>
                <div className='bg-rose-100 p-1.5 rounded-lg'>
                  <PhoneCall size={18} className='text-rose-600' />
                </div>
                <span className='font-black text-lg tracking-tight'>
                  建立設備報修單
                </span>
              </div>
            }
            open={isReportModalVisible}
            onOk={submitReport}
            onCancel={() => setIsReportModalVisible(false)}
            okText='確認送出通報'
            cancelText='取消'
            okButtonProps={{
              className:
                'bg-rose-600 hover:bg-rose-500 border-none shadow-md shadow-rose-200 rounded-xl font-bold h-10 px-6'
            }}
            cancelButtonProps={{
              className:
                'rounded-xl font-bold text-slate-500 border-slate-200 h-10 px-6 hover:bg-slate-50'
            }}
            className='custom-edit-modal top-10'
            width={600}
          >
            <Form form={reportForm} layout='vertical' className='mt-4 mb-0'>
              <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
                <Form.Item
                  name='workCenter'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      故障機台 / 產線
                    </span>
                  }
                  rules={[{ required: true, message: '請選擇機台' }]}
                >
                  <Select
                    className='h-10 rounded-xl text-xs font-mono'
                    placeholder='請選擇故障機台'
                  >
                    {mockEquipments.map(eq => (
                      <Select.Option key={eq.name} value={eq.name}>
                        {eq.name}
                      </Select.Option>
                    ))}
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
                    <Select.Option value='一般'>
                      一般 (可計畫內維修)
                    </Select.Option>
                    <Select.Option value='緊急'>
                      緊急 (影響部分產能)
                    </Select.Option>
                    <Select.Option value='停線特急'>
                      <span className='text-rose-600'>
                        停線特急 (全線停機待修)
                      </span>
                    </Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name='issue'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      故障現象詳細描述
                    </span>
                  }
                  rules={[{ required: true, message: '請描述故障現象' }]}
                  className='col-span-2'
                >
                  <Input.TextArea
                    rows={4}
                    className='rounded-xl border-slate-200 text-sm p-3'
                    placeholder='請盡可能詳細描述異常發生的時機、面板顯示的錯誤代碼 (Error Code) 或異音特徵...'
                  />
                </Form.Item>
              </div>
              <Alert
                message='送出後將自動發送 SMS/LINE 通知給值班廠務與維修工程師。'
                type='info'
                showIcon
                className='rounded-xl border-blue-100 bg-blue-50 text-blue-700 text-xs font-bold mt-2'
              />
            </Form>
          </Modal>

          {/* --- 維修進度剖析 Modal --- */}
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
                const isDone = activeTicket.status === '已完工'
                const isCritical = activeTicket.urgency === '停線特急'

                // 根據狀態決定 Steps 的 current index
                let stepCurrent = 0
                if (activeTicket.status === '維修中') stepCurrent = 1
                if (activeTicket.status === '待驗證') stepCurrent = 2
                if (activeTicket.status === '已完工') stepCurrent = 3

                return (
                  <div className='flex flex-col'>
                    {/* Header */}
                    <div className='flex items-center gap-3 text-slate-800 border-b border-slate-100 pb-5 mb-5 mt-2'>
                      <div
                        className={cn(
                          'p-3 rounded-xl shadow-md',
                          isDone
                            ? 'bg-emerald-500 shadow-emerald-200'
                            : 'bg-indigo-600 shadow-indigo-200'
                        )}
                      >
                        <Wrench size={24} className='text-white' />
                      </div>
                      <div className='flex flex-col'>
                        <span className='font-black text-xl tracking-tight'>
                          維修進度追蹤 (Repair Timeline)
                        </span>
                        <div className='flex items-center gap-2 mt-1'>
                          <span className='text-sm font-mono font-black text-indigo-600'>
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
                                : 'bg-slate-100 text-slate-600'
                            )}
                          >
                            {activeTicket.urgency}
                          </Tag>
                        </div>
                      </div>
                    </div>

                    {/* Issue Highlight */}
                    <div className='bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 flex flex-col gap-1'>
                      <span className='text-[10px] font-bold text-slate-400'>
                        故障現象描述
                      </span>
                      <span className='text-sm font-bold text-slate-800 leading-relaxed'>
                        {activeTicket.issue}
                      </span>
                    </div>

                    {/* Technician Info */}
                    <div className='grid grid-cols-2 gap-4 mb-6'>
                      <div className='bg-white border border-slate-100 shadow-sm p-4 rounded-2xl flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center'>
                          <HardHat size={20} className='text-indigo-600' />
                        </div>
                        <div className='flex flex-col'>
                          <span className='text-[10px] font-bold text-slate-400'>
                            負責維修技師
                          </span>
                          <span className='text-sm font-black text-slate-700'>
                            {activeTicket.technician || '尚未派工'}
                          </span>
                        </div>
                      </div>
                      <div className='bg-white border border-slate-100 shadow-sm p-4 rounded-2xl flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center'>
                          <Clock size={20} className='text-emerald-600' />
                        </div>
                        <div className='flex flex-col'>
                          <span className='text-[10px] font-bold text-slate-400'>
                            預計/實際完工時間
                          </span>
                          <span className='text-xs font-black text-slate-700 font-mono'>
                            {activeTicket.actualFinishTime ||
                              activeTicket.estimatedFinishTime ||
                              '評估中'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Divider className='border-slate-100 my-0 mb-6' />

                    {/* Timeline Steps */}
                    <div>
                      <span className='font-bold text-slate-700 text-sm flex items-center gap-1.5 mb-6'>
                        <Activity size={16} className='text-indigo-500' />{' '}
                        處置流程節點 (Workflow)
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
                                  現場通報故障
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
                                  指派技師與診斷 (Diagnosing)
                                </span>
                              ),
                              description: (
                                <span className='text-[11px] font-mono text-slate-400 pb-4 block mt-1'>
                                  {stepCurrent >= 1
                                    ? '已確認問題，準備料件中'
                                    : '等待派工...'}
                                </span>
                              ),
                              icon:
                                stepCurrent === 1 ? (
                                  <Timer
                                    size={18}
                                    className='text-blue-500 animate-spin-slow'
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
                                  設備搶修中 (Repairing)
                                </span>
                              ),
                              description: (
                                <span className='text-[11px] font-mono text-slate-400 pb-4 block mt-1'>
                                  {stepCurrent >= 2
                                    ? '零件更換完成，進行硬體復原'
                                    : ''}
                                </span>
                              ),
                              icon:
                                stepCurrent === 2 ? (
                                  <PenTool
                                    size={18}
                                    className='text-orange-500'
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
                                  生管/品管驗證完工 (Resolved)
                                </span>
                              ),
                              description: (
                                <span className='text-[11px] font-mono text-slate-400 block mt-1'>
                                  {stepCurrent >= 3
                                    ? `驗證通過，機台恢復生產 (${activeTicket.actualFinishTime})`
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
            .aps-monitor-table .ant-table-thead > tr > th {
              background: #ffffff !important;
              color: #64748b !important;
              font-weight: 700 !important;
              border-bottom: 1px solid #f1f5f9 !important;
              white-space: nowrap;
              padding-top: 16px !important;
              padding-bottom: 16px !important;
            }
            .aps-monitor-table .ant-table-tbody > tr:hover > td {
              background: #f8fafc !important;
            }

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
              border: 1px solid #ffe4e6;
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
