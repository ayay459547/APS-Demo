import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Table,
  Tag,
  Input,
  Button,
  ConfigProvider,
  Card,
  Popover,
  Badge,
  Tooltip,
  Dropdown,
  Space,
  Progress
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import type { InputRef } from 'antd'
import {
  Search,
  Download,
  AlertCircle,
  ChevronDown,
  Plus,
  MoreVertical,
  RefreshCw,
  Settings,
  Info,
  Zap,
  Edit,
  Trash2,
  Cpu,
  Server,
  Wrench,
  PlayCircle,
  PauseCircle,
  PowerOff,
  Activity,
  CalendarClock,
  ClipboardList,
  Factory
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
export type EquipmentStatus = '運轉中' | '待機中' | '保養中' | '異常停機'
export type EquipmentGroup =
  | 'SMT 線體'
  | 'DIP 線體'
  | 'CNC 加工機'
  | '組裝線'
  | '測試站'

export interface CurrentTask {
  woId: string
  partNumber: string
  progress: number
  estEndTime: string
}

export interface EquipmentNode {
  key: string
  equipmentId: string
  equipmentName: string
  group: EquipmentGroup
  workCenter: string
  status: EquipmentStatus
  oee: number // 稼動率 Overall Equipment Effectiveness (%)
  lastMaintenance: string
  nextMaintenance: string
  currentTask?: CurrentTask | null
}

// --- 擬真數據產生器 (設備資源) ---
const generateEquipmentData = (count: number): EquipmentNode[] => {
  const groups: EquipmentGroup[] = [
    'SMT 線體',
    'DIP 線體',
    'CNC 加工機',
    '組裝線',
    '測試站'
  ]
  const statuses: EquipmentStatus[] = [
    '運轉中',
    '運轉中',
    '運轉中',
    '待機中',
    '保養中',
    '異常停機'
  ]

  const prefixes: Record<EquipmentGroup, string> = {
    'SMT 線體': 'SMT',
    'DIP 線體': 'DIP',
    'CNC 加工機': 'CNC',
    組裝線: 'ASY',
    測試站: 'TST'
  }

  return Array.from({ length: count }).map((_, idx) => {
    const group = groups[Math.floor(Math.random() * groups.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const prefix = prefixes[group]
    const equipmentId = `EQ-${prefix}-${String(idx + 1).padStart(3, '0')}`

    // OEE 邏輯設定
    let oee = 0
    if (status === '運轉中') {
      oee = Number((75 + Math.random() * 24).toFixed(1)) // 75% ~ 99%
    } else if (status === '待機中') {
      oee = Number((30 + Math.random() * 40).toFixed(1)) // 30% ~ 70% (計算歷史平均)
    }

    const lastMaintDate = dayjs().subtract(
      Math.floor(Math.random() * 90),
      'day'
    )
    const nextMaintDate = lastMaintDate.add(90, 'day')

    let currentTask = null
    if (status === '運轉中') {
      currentTask = {
        woId: `WO-26X${String(Math.floor(Math.random() * 9000) + 1000)}`,
        partNumber: `PN-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        progress: Math.floor(Math.random() * 95) + 1,
        estEndTime: dayjs()
          .add(Math.floor(Math.random() * 12) + 1, 'hour')
          .format('YYYY-MM-DD HH:mm')
      }
    }

    return {
      key: equipmentId,
      equipmentId,
      equipmentName: `${group} #${String(idx + 1).padStart(2, '0')}`,
      group,
      workCenter: `WC-${prefix}-01`,
      status,
      oee,
      lastMaintenance: lastMaintDate.format('YYYY-MM-DD'),
      nextMaintenance: nextMaintDate.format('YYYY-MM-DD'),
      currentTask
    }
  })
}

// 產生 150 台設備資料
const mockEquipmentData: EquipmentNode[] = generateEquipmentData(150)

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
export default function EquipmentManager() {
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const searchInputRef = useRef<InputRef>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(() => {
    const running = mockEquipmentData.filter(d => d.status === '運轉中').length
    const idle = mockEquipmentData.filter(d => d.status === '待機中').length
    const error = mockEquipmentData.filter(d => d.status === '異常停機').length
    const avgOee = (
      mockEquipmentData.reduce((acc, curr) => acc + curr.oee, 0) /
      mockEquipmentData.length
    ).toFixed(1)

    return { running, idle, error, avgOee, total: mockEquipmentData.length }
  }, [])

  // --- 搜尋過濾邏輯 ---
  const getSearchProps = (dataIndex: keyof EquipmentNode, title: string) => ({
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
    onFilter: (value: any, record: EquipmentNode): boolean => {
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

  // --- Popover KPI 內容 ---
  const statsContent = (
    <div className='w-full max-w-[480px] py-1'>
      <div className='flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5'>
        <Server size={16} className='text-indigo-600' />
        <span className='font-bold text-slate-800'>廠區設備負載概覽</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='運轉中機台'
          value={stats.running}
          unit={`/ ${stats.total} 台`}
          icon={PlayCircle}
          colorClass='text-emerald-600'
          bgClass='bg-emerald-50'
          iconColorClass='text-emerald-500'
          trend='產能輸出中'
        />
        <StatCard
          title='全廠平均 OEE'
          value={stats.avgOee}
          unit='%'
          icon={Activity}
          colorClass='text-blue-600'
          bgClass='bg-blue-50'
          iconColorClass='text-blue-500'
          trend='目標: > 85%'
        />
        <StatCard
          title='異常停機警報'
          value={stats.error}
          unit='台'
          icon={AlertCircle}
          colorClass='text-rose-600'
          bgClass='bg-rose-100/80'
          iconColorClass='text-rose-500'
          isAlert={true}
          trend='需工程師立即介入'
        />
        <StatCard
          title='待機閒置中'
          value={stats.idle}
          unit='台'
          icon={PauseCircle}
          colorClass='text-slate-500'
          bgClass='bg-slate-100'
          iconColorClass='text-slate-400'
          trend='可排程閒置產能'
        />
      </div>
    </div>
  )

  // --- 展開的當前任務區塊 ---
  const expandedRowRender = (record: EquipmentNode) => {
    return (
      <div className='py-4 px-6 bg-slate-50/80 border-y border-blue-100 shadow-inner shadow-blue-50/50 flex gap-6'>
        {/* 左側：當前加工任務 */}
        <div className='flex-1 bg-white border border-slate-200 p-4 rounded-xl shadow-sm'>
          <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-3'>
            <div className='flex items-center gap-2'>
              <ClipboardList size={16} className='text-blue-600' />
              <span className='font-bold text-slate-700 text-[13px]'>
                當前排程任務 (Current Work Order)
              </span>
            </div>
            {record.currentTask ? (
              <Tag color='processing' className='m-0 font-bold border-none'>
                執行中
              </Tag>
            ) : (
              <Tag className='m-0 text-slate-500 bg-slate-100 border-none font-bold'>
                無任務
              </Tag>
            )}
          </div>

          {record.currentTask ? (
            <div className='flex flex-col gap-3'>
              <div className='flex justify-between'>
                <span className='text-xs text-slate-500'>工單編號</span>
                <span className='text-xs font-bold font-mono text-blue-700'>
                  {record.currentTask.woId}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-xs text-slate-500'>加工料號</span>
                <span className='text-xs font-bold font-mono text-slate-700'>
                  {record.currentTask.partNumber}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-xs text-slate-500'>預計完工時間</span>
                <span className='text-xs font-bold text-emerald-600 flex items-center gap-1'>
                  <CalendarClock size={12} />
                  {record.currentTask.estEndTime}
                </span>
              </div>
              <div className='mt-1'>
                <div className='flex justify-between text-[10px] mb-1 font-bold'>
                  <span className='text-slate-500'>任務完成度</span>
                  <span className='text-blue-600'>
                    {record.currentTask.progress}%
                  </span>
                </div>
                <Progress
                  percent={record.currentTask.progress}
                  size='small'
                  showInfo={false}
                  strokeColor='#3b82f6'
                />
              </div>
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center h-[120px] text-slate-400'>
              <PowerOff size={24} className='mb-2 opacity-50' />
              <span className='text-xs font-medium'>
                機台閒置或保養中，無加工任務
              </span>
            </div>
          )}
        </div>

        {/* 右側：機台保養資訊 */}
        <div className='w-[320px] bg-white border border-slate-200 p-4 rounded-xl shadow-sm'>
          <div className='flex items-center gap-2 border-b border-slate-100 pb-3 mb-3'>
            <Wrench size={16} className='text-amber-500' />
            <span className='font-bold text-slate-700 text-[13px]'>
              機台保養排程 (Maintenance)
            </span>
          </div>
          <div className='flex flex-col gap-4'>
            <div className='bg-slate-50 p-3 rounded-lg border border-slate-100'>
              <div className='text-[10px] text-slate-400 font-bold mb-1'>
                上次保養日期
              </div>
              <div className='font-mono font-bold text-slate-700'>
                {record.lastMaintenance}
              </div>
            </div>
            <div
              className={cn(
                'p-3 rounded-lg border',
                dayjs(record.nextMaintenance).diff(dayjs(), 'day') < 14
                  ? 'bg-rose-50 border-rose-100'
                  : 'bg-emerald-50 border-emerald-100'
              )}
            >
              <div
                className={cn(
                  'text-[10px] font-bold mb-1',
                  dayjs(record.nextMaintenance).diff(dayjs(), 'day') < 14
                    ? 'text-rose-500'
                    : 'text-emerald-600'
                )}
              >
                下次預定保養 (距今{' '}
                {dayjs(record.nextMaintenance).diff(dayjs(), 'day')} 天)
              </div>
              <div
                className={cn(
                  'font-mono font-black',
                  dayjs(record.nextMaintenance).diff(dayjs(), 'day') < 14
                    ? 'text-rose-600'
                    : 'text-emerald-700'
                )}
              >
                {record.nextMaintenance}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- 表格欄位定義 ---
  const columns: ColumnsType<EquipmentNode> = [
    {
      title: '設備代號 (Equipment ID)',
      dataIndex: 'equipmentId',
      key: 'equipmentId',
      width: 230,
      fixed: 'left',
      sorter: (a, b) => a.equipmentId.localeCompare(b.equipmentId),
      ...getSearchProps('equipmentId', '設備代號'),
      render: text => (
        <div className='inline-flex items-center gap-2 align-middle group'>
          <div className='w-6 h-6 rounded bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors'>
            <Cpu
              size={14}
              className='text-slate-500 group-hover:text-indigo-500'
            />
          </div>
          <span className='font-mono font-black text-indigo-700 text-[13px] tracking-tight cursor-pointer hover:underline'>
            {text}
          </span>
        </div>
      )
    },
    {
      title: '設備名稱',
      dataIndex: 'equipmentName',
      key: 'equipmentName',
      width: 200,
      sorter: (a, b) => a.equipmentName.localeCompare(b.equipmentName),
      ...getSearchProps('equipmentName', '設備名稱'),
      render: text => (
        <span className='font-bold text-slate-700 text-xs'>{text}</span>
      )
    },
    {
      title: '設備群組 / 工作中心',
      key: 'groupInfo',
      width: 180,
      filters: [
        { text: 'SMT 線體', value: 'SMT 線體' },
        { text: 'DIP 線體', value: 'DIP 線體' },
        { text: 'CNC 加工機', value: 'CNC 加工機' },
        { text: '組裝線', value: '組裝線' },
        { text: '測試站', value: '測試站' }
      ],
      onFilter: (value, record) => record.group === value,
      render: (_, record) => (
        <div className='flex flex-col gap-1'>
          <Tag className='w-fit m-0 border-slate-200 bg-white text-slate-600 font-bold text-[10px] flex items-center gap-1'>
            <Factory size={10} className='inline' /> {record.group}
          </Tag>
          <span className='text-[10px] font-mono text-slate-400 pl-1'>
            {record.workCenter}
          </span>
        </div>
      )
    },
    {
      title: '當前狀態',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      sorter: (a, b) => a.status.localeCompare(b.status),
      filters: [
        { text: '運轉中', value: '運轉中' },
        { text: '待機中', value: '待機中' },
        { text: '保養中', value: '保養中' },
        { text: '異常停機', value: '異常停機' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: EquipmentStatus) => {
        let colorClass = ''
        let bgClass = ''
        let Icon = PlayCircle

        switch (status) {
          case '運轉中':
            colorClass = 'text-emerald-600'
            bgClass = 'bg-emerald-50 border-emerald-100'
            Icon = PlayCircle
            break
          case '待機中':
            colorClass = 'text-blue-600'
            bgClass = 'bg-blue-50 border-blue-100'
            Icon = PauseCircle
            break
          case '保養中':
            colorClass = 'text-amber-600'
            bgClass = 'bg-amber-50 border-amber-100'
            Icon = Wrench
            break
          case '異常停機':
            colorClass = 'text-rose-600'
            bgClass = 'bg-rose-50 border-rose-100'
            Icon = PowerOff
            break
        }

        return (
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border',
              bgClass,
              colorClass
            )}
          >
            <Icon size={12} />
            {status}
          </div>
        )
      }
    },
    {
      title: '綜合稼動率 (OEE)',
      dataIndex: 'oee',
      key: 'oee',
      width: 180,
      sorter: (a, b) => a.oee - b.oee,
      render: (oee, record) => {
        // 異常或保養時顯示 0 或灰色
        const isActive =
          record.status === '運轉中' || record.status === '待機中'
        const displayOee = isActive ? oee : 0
        const strokeColor =
          displayOee >= 85
            ? '#10b981'
            : displayOee >= 60
              ? '#f59e0b'
              : '#f43f5e'

        return (
          <div className='w-full pr-4'>
            <div className='flex justify-between text-[10px] font-black mb-1'>
              <span className='text-slate-400'>OEE 表現</span>
              <span className={isActive ? 'text-slate-700' : 'text-slate-400'}>
                {displayOee}%
              </span>
            </div>
            <Progress
              percent={displayOee}
              size='small'
              showInfo={false}
              strokeColor={isActive ? strokeColor : '#cbd5e1'}
              status={record.status === '異常停機' ? 'exception' : 'normal'}
            />
          </div>
        )
      }
    },
    {
      title: '下次保養日',
      dataIndex: 'nextMaintenance',
      key: 'nextMaintenance',
      width: 130,
      sorter: (a, b) =>
        dayjs(a.nextMaintenance).valueOf() - dayjs(b.nextMaintenance).valueOf(),
      render: date => {
        const isUrgent = dayjs(date).diff(dayjs(), 'day') < 14
        return (
          <span
            className={cn(
              'font-mono text-xs font-bold px-2 py-1 rounded',
              isUrgent ? 'bg-rose-50 text-rose-600' : 'text-slate-600'
            )}
          >
            {date}
          </span>
        )
      }
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
                label: '編輯設備資訊',
                icon: <Edit size={14} className='text-blue-500' />
              },
              {
                key: '2',
                label: '安排保養計畫',
                icon: <Wrench size={14} className='text-amber-500' />
              },
              { key: '3', type: 'divider' },
              {
                key: '4',
                label: '停機註銷',
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
            onClick={e => e.stopPropagation()} // 避免觸發列的展開
          />
        </Dropdown>
      )
    }
  ]

  const rowSelection: TableProps<EquipmentNode>['rowSelection'] = {
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
        <div className='mx-auto px-2 pt-2 pb-8 space-y-4 animate-fade-in relative max-w-[1600px]'>
          {/* 全域 Loading 遮罩 */}
          {loading && (
            <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-[110] flex items-center justify-center rounded-[28px] mt-[60px]'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin' />
                <span className='text-xs font-black text-indigo-600 tracking-widest uppercase'>
                  Syncing Equipment Data...
                </span>
              </div>
            </div>
          )}

          {/* 玻璃透視頂部導航列 */}
          <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/50 py-2 rounded-xl sticky top-0 z-20 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='bg-indigo-600 p-1.5 rounded-lg shadow-indigo-200 shadow-lg'>
                <Server size={18} className='text-white' />
              </div>
              <div className='flex items-center'>
                <Popover
                  content={statsContent}
                  trigger='click'
                  placement='bottomLeft'
                  rootClassName='custom-stats-popover'
                >
                  <div className='flex items-center gap-2 cursor-pointer hover:bg-white px-2 sm:px-3 py-1.5 rounded-full transition-all group border border-transparent hover:border-slate-100'>
                    <span className='text-sm font-bold text-slate-600 group-hover:text-indigo-600 whitespace-nowrap'>
                      設備產能概覽
                    </span>
                    <div className='flex gap-1'>
                      <Badge
                        count={stats.running}
                        style={{
                          backgroundColor: '#10b981',
                          fontSize: '10px',
                          boxShadow: 'none'
                        }}
                      />
                      <Badge
                        count={stats.error}
                        style={{
                          backgroundColor: '#f43f5e',
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
            </div>

            <div className='flex items-center gap-2'>
              <Tooltip title='重新整理'>
                <Button
                  type='text'
                  icon={<RefreshCw size={16} />}
                  className='text-slate-400 hover:bg-slate-100 rounded-xl font-medium h-10 w-10 flex items-center justify-center'
                />
              </Tooltip>
              <Tooltip title='導出設備清冊 (Excel)'>
                <Button
                  icon={<Download size={16} />}
                  className='rounded-xl font-medium h-10 flex items-center justify-center border-slate-200 text-slate-600 bg-white hover:bg-slate-50 shadow-sm'
                >
                  <span className='hidden lg:inline ml-1 text-xs'>
                    匯出資料
                  </span>
                </Button>
              </Tooltip>
              <Button
                type='primary'
                icon={<Plus size={16} />}
                className='rounded-xl bg-indigo-600 shadow-md shadow-indigo-100 font-bold border-none h-10 flex items-center justify-center hover:bg-indigo-500'
              >
                <span className='hidden sm:inline ml-1 text-xs'>新增設備</span>
              </Button>
            </div>
          </div>

          <Card
            className='shadow-xl shadow-slate-200/50 border-none rounded-[32px] overflow-hidden bg-white'
            styles={{ body: { padding: 0 } }}
          >
            {/* 批量操作浮動條 */}
            {selectedRowKeys.length > 0 && (
              <div className='mx-4 mt-4 bg-indigo-50/80 border border-indigo-100 p-3 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2 duration-300'>
                <div className='flex items-center gap-2 text-indigo-700'>
                  <Zap size={16} className='fill-indigo-700' />
                  <span className='text-sm font-bold text-indigo-700'>
                    已選取 {selectedRowKeys.length} 台設備機台
                  </span>
                </div>
                <Space>
                  <Button
                    size='small'
                    icon={<Wrench size={14} />}
                    className='rounded-lg font-bold text-xs bg-white text-amber-600 border-slate-200 shadow-sm'
                  >
                    批量排定保養
                  </Button>
                  <Button
                    size='small'
                    icon={<PowerOff size={14} />}
                    danger
                    className='rounded-lg font-bold text-xs bg-white shadow-sm'
                  >
                    批量停機
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
                廠區生產設備清單 (Equipment Master) - 共{' '}
                {mockEquipmentData.length} 台
              </div>
              <div className='flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm'>
                <Info size={14} className='text-indigo-500' />
                <span className='text-[10px] text-slate-400 font-bold uppercase tracking-tight'>
                  提示：點擊機台可展開查看「當前排程任務」與「保養明細」
                </span>
              </div>
            </div>

            <div className='p-4 pt-0'>
              <Table<EquipmentNode>
                rowSelection={rowSelection}
                columns={columns}
                dataSource={mockEquipmentData}
                loading={false}
                scroll={{ x: 1200 }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  className: 'mt-4 !px-4 pb-2'
                }}
                expandable={{
                  expandedRowRender,
                  expandRowByClick: true,
                  columnWidth: 48
                }}
                className='aps-monitor-table'
              />
            </div>
          </Card>

          <style>{`
            /* 調整展開圖標 */
            .aps-monitor-table .ant-table-row-expand-icon {
              border: 1px solid #cbd5e1;
              color: #64748b;
              border-radius: 4px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 18px;
              height: 18px;
              vertical-align: middle;
            }
            .aps-monitor-table .ant-table-row-expand-icon:hover {
              border-color: #4f46e5;
              color: #4f46e5;
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
