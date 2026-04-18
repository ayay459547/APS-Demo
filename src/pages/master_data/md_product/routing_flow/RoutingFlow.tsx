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
  Space
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
  Waypoints,
  ListOrdered,
  Clock,
  Timer,
  CheckCircle2,
  Cpu,
  Layers,
  Copy
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
export type RoutingStatus = '生效中' | '草稿' | '已停用' | '審核中'

export interface OperationStep {
  stepNo: string // e.g., '0010', '0020'
  opName: string
  workCenter: string
  setupTime: number // 準備工時 (mins)
  runTime: number // 單件加工工時 (mins/pcs)
  yieldRate: number // 標準良率 (%)
}

export interface RoutingNode {
  key: string
  routingId: string
  targetSku: string // 對應的成品/半成品料號
  description: string
  status: RoutingStatus
  version: string
  totalSetupTime: number // 加總準備工時
  totalRunTime: number // 加總單件工時
  operations: OperationStep[]
  lastUpdated: string
}

// --- 擬真數據產生器 (標準製程與工序) ---
const generateRoutingData = (count: number): RoutingNode[] => {
  const statuses: RoutingStatus[] = [
    '生效中',
    '生效中',
    '生效中',
    '草稿',
    '審核中',
    '已停用'
  ]
  const prefixes = ['SVR', 'GPU', 'GW', 'IND', 'MB']
  const opLibraries = [
    { name: 'SMT 表面黏著', center: 'SMT-LINE-01', set: 45, run: 0.5 },
    { name: 'DIP 插件與波焊', center: 'DIP-LINE-02', set: 30, run: 1.2 },
    { name: 'PCBA 檢測 (ICT/FCT)', center: 'TEST-ST-05', set: 15, run: 2.0 },
    { name: 'CNC 外殼切削', center: 'CNC-MC-12', set: 60, run: 15.0 },
    { name: '系統組裝', center: 'ASSY-LINE-A', set: 20, run: 8.5 },
    { name: '燒機測試 (Burn-in)', center: 'BURN-RM-01', set: 10, run: 240.0 },
    { name: '包裝與入庫', center: 'PKG-LINE-01', set: 10, run: 1.5 }
  ]

  return Array.from({ length: count }).map(() => {
    const typeIdx = Math.floor(Math.random() * prefixes.length)
    const sku = `${prefixes[typeIdx]}-26X${String(Math.floor(Math.random() * 1000) + 1).padStart(4, '0')}`
    const routingId = `RTG-${sku}`
    const status = statuses[Math.floor(Math.random() * statuses.length)]

    // 隨機產生 2 ~ 6 個工序
    const opCount = Math.floor(Math.random() * 5) + 2
    const operations: OperationStep[] = []
    let totalSetup = 0
    let totalRun = 0

    for (let i = 0; i < opCount; i++) {
      const opTemplate =
        opLibraries[Math.floor(Math.random() * opLibraries.length)]
      // 加入些微變數
      const actualSetup = Math.round(
        opTemplate.set * (0.8 + Math.random() * 0.4)
      )
      const actualRun = Number(
        (opTemplate.run * (0.9 + Math.random() * 0.2)).toFixed(2)
      )

      operations.push({
        stepNo: String((i + 1) * 10).padStart(4, '0'), // 0010, 0020, 0030...
        opName: opTemplate.name,
        workCenter: opTemplate.center,
        setupTime: actualSetup,
        runTime: actualRun,
        yieldRate: Number((95 + Math.random() * 4.9).toFixed(1))
      })
      totalSetup += actualSetup
      totalRun += actualRun
    }

    // 依工序編號排序
    operations.sort((a, b) => parseInt(a.stepNo) - parseInt(b.stepNo))

    return {
      key: routingId,
      routingId,
      targetSku: sku,
      description: `標準生產工藝路線 - ${sku}`,
      status,
      version: `V${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 9)}`,
      totalSetupTime: totalSetup,
      totalRunTime: Number(totalRun.toFixed(2)),
      operations,
      lastUpdated: dayjs()
        .subtract(Math.floor(Math.random() * 30), 'day')
        .format('YYYY-MM-DD HH:mm')
    }
  })
}

// 產生 300 筆假資料
const mockRoutingData: RoutingNode[] = generateRoutingData(300)

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
export default function RoutingManager() {
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const searchInputRef = useRef<InputRef>(null)

  useEffect(() => {
    // 模擬載入時間
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(() => {
    const activeData = mockRoutingData.filter(d => d.status === '生效中')
    const avgOps =
      activeData.length > 0
        ? (
            activeData.reduce((acc, curr) => acc + curr.operations.length, 0) /
            activeData.length
          ).toFixed(1)
        : '0'

    return {
      active: activeData.length,
      drafts: mockRoutingData.filter(
        d => d.status === '草稿' || d.status === '審核中'
      ).length,
      avgOps,
      total: mockRoutingData.length
    }
  }, [])

  // --- 搜尋過濾邏輯 ---
  const getSearchProps = (dataIndex: keyof RoutingNode, title: string) => ({
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
    onFilter: (value: any, record: RoutingNode): boolean => {
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
    <div className='w-full max-w-120 py-1'>
      <div className='flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5'>
        <Waypoints size={16} className='text-indigo-600' />
        <span className='font-bold text-slate-800'>製程工藝數據概覽</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='生效中標準製程'
          value={stats.active}
          unit='份'
          icon={CheckCircle2}
          colorClass='text-emerald-600'
          bgClass='bg-emerald-50'
          iconColorClass='text-emerald-500'
          trend='排程可用工藝'
        />
        <StatCard
          title='待審核 / 草稿'
          value={stats.drafts}
          unit='份'
          icon={AlertCircle}
          colorClass='text-amber-600'
          bgClass='bg-amber-50'
          iconColorClass='text-amber-500'
          trend='需工程部確認'
        />
        <StatCard
          title='平均工序數'
          value={stats.avgOps}
          unit='站'
          icon={ListOrdered}
          colorClass='text-blue-600'
          bgClass='bg-blue-50'
          iconColorClass='text-blue-500'
        />
        <StatCard
          title='製程主檔總數'
          value={stats.total}
          unit='份'
          icon={Layers}
          colorClass='text-purple-600'
          bgClass='bg-purple-50'
          iconColorClass='text-purple-500'
        />
      </div>
    </div>
  )

  // --- 展開的工序子表格 (Nested Table) ---
  const expandedRowRender = (record: RoutingNode) => {
    const opColumns: ColumnsType<OperationStep> = [
      {
        title: '工序編號',
        dataIndex: 'stepNo',
        key: 'stepNo',
        width: 100,
        render: text => (
          <span className='font-mono font-bold text-slate-500'>{text}</span>
        )
      },
      {
        title: '工序名稱',
        dataIndex: 'opName',
        key: 'opName',
        width: 200,
        render: text => (
          <span className='font-bold text-slate-700 text-xs'>{text}</span>
        )
      },
      {
        title: '指定機台/線體 (Work Center)',
        dataIndex: 'workCenter',
        key: 'workCenter',
        width: 220,
        render: text => (
          <Tag className='m-0 border-slate-200 bg-white text-blue-600 font-mono font-bold text-[10px]'>
            <Cpu size={10} className='inline mr-1' />
            {text}
          </Tag>
        )
      },
      {
        title: '準備工時 (Setup)',
        dataIndex: 'setupTime',
        key: 'setupTime',
        width: 140,
        align: 'right',
        render: val => (
          <span className='font-mono text-xs text-slate-600'>
            {val} <span className='text-[10px] text-slate-400'>min</span>
          </span>
        )
      },
      {
        title: '單件工時 (Run Time)',
        dataIndex: 'runTime',
        key: 'runTime',
        width: 160,
        align: 'right',
        render: val => (
          <span className='font-mono text-xs font-bold text-indigo-600'>
            {val}{' '}
            <span className='text-[10px] text-slate-400 font-normal'>
              min/pcs
            </span>
          </span>
        )
      },
      {
        title: '標準良率',
        dataIndex: 'yieldRate',
        key: 'yieldRate',
        width: 120,
        align: 'right',
        render: val => (
          <span
            className={cn(
              'font-mono text-xs font-bold px-2 py-0.5 rounded',
              val >= 98
                ? 'text-emerald-600 bg-emerald-50'
                : 'text-amber-600 bg-amber-50'
            )}
          >
            {val}%
          </span>
        )
      }
    ]

    return (
      <div className='py-4 px-6 bg-slate-50/80 border-y border-blue-100 shadow-inner shadow-blue-50/50'>
        <div className='flex items-center gap-2 mb-3'>
          <ListOrdered size={16} className='text-blue-600' />
          <span className='font-bold text-slate-700 text-[13px]'>
            工序明細 (Operations Detail)
          </span>
        </div>
        <Table<OperationStep>
          columns={opColumns}
          dataSource={record.operations}
          pagination={false}
          size='small'
          rowKey='stepNo'
          className='nested-operation-table bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm'
        />
      </div>
    )
  }

  // --- 表格欄位定義 ---
  const columns: ColumnsType<RoutingNode> = [
    {
      title: '製程編號 (Routing ID)',
      dataIndex: 'routingId',
      key: 'routingId',
      width: 220,
      fixed: 'left',
      sorter: (a, b) => a.routingId.localeCompare(b.routingId),
      ...getSearchProps('routingId', '製程編號'),
      render: text => (
        <div className='inline-flex items-center gap-2 align-middle group'>
          <div className='w-6 h-6 rounded bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors'>
            <Waypoints size={14} className='text-indigo-500' />
          </div>
          <span className='font-mono font-black text-indigo-700 text-[13px] tracking-tight cursor-pointer hover:underline'>
            {text}
          </span>
        </div>
      )
    },
    {
      title: '適用料號 (Target SKU)',
      dataIndex: 'targetSku',
      key: 'targetSku',
      width: 200,
      sorter: (a, b) => a.targetSku.localeCompare(b.targetSku),
      ...getSearchProps('targetSku', '適用料號'),
      render: text => (
        <div className='flex flex-col'>
          <span className='font-bold text-slate-700 text-xs font-mono'>
            {text}
          </span>
        </div>
      )
    },
    {
      title: '狀態 / 版本',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      sorter: (a, b) => a.status.localeCompare(b.status),
      filters: [
        { text: '生效中', value: '生效中' },
        { text: '草稿', value: '草稿' },
        { text: '審核中', value: '審核中' },
        { text: '已停用', value: '已停用' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: RoutingStatus, record) => (
        <div className='flex items-center gap-2'>
          <Badge
            status={
              status === '生效中'
                ? 'success'
                : status === '草稿'
                  ? 'default'
                  : status === '審核中'
                    ? 'warning'
                    : 'error'
            }
          />
          <span
            className={cn(
              'font-bold text-[11px]',
              status === '生效中'
                ? 'text-emerald-600'
                : status === '草稿'
                  ? 'text-slate-500'
                  : status === '審核中'
                    ? 'text-amber-600'
                    : 'text-rose-600'
            )}
          >
            {status}
          </span>
          <Tag className='m-0 border-slate-200 bg-slate-50 text-slate-500 font-mono font-bold text-[9px] px-1'>
            {record.version}
          </Tag>
        </div>
      )
    },
    {
      title: '工序數',
      key: 'opCount',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.operations.length - b.operations.length,
      render: (_, record) => (
        <Tag className='m-0 bg-blue-50 border-blue-100 text-blue-600 font-black rounded-full px-2.5'>
          {record.operations.length} 站
        </Tag>
      )
    },
    {
      title: '總準備時間',
      dataIndex: 'totalSetupTime',
      key: 'totalSetupTime',
      width: 130,
      align: 'right',
      sorter: (a, b) => a.totalSetupTime - b.totalSetupTime,
      render: val => (
        <div className='flex items-center justify-end gap-1 text-slate-500'>
          <Clock size={12} />
          <span className='font-mono text-xs'>
            {val} <span className='text-[10px]'>min</span>
          </span>
        </div>
      )
    },
    {
      title: '單件總加工時',
      dataIndex: 'totalRunTime',
      key: 'totalRunTime',
      width: 140,
      align: 'right',
      sorter: (a, b) => a.totalRunTime - b.totalRunTime,
      render: val => (
        <div className='flex items-center justify-end gap-1 text-indigo-600 font-bold'>
          <Timer size={12} />
          <span className='font-mono text-sm'>
            {val}{' '}
            <span className='text-[10px] font-normal text-slate-400'>
              min/pcs
            </span>
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
                label: '編輯製程',
                icon: <Edit size={14} className='text-blue-500' />
              },
              {
                key: '2',
                label: '複製為新版本',
                icon: <Copy size={14} className='text-indigo-500' />
              },
              { key: '3', type: 'divider' },
              {
                key: '4',
                label: '停用此製程',
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

  const rowSelection: TableProps<RoutingNode>['rowSelection'] = {
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
                <div className='w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin' />
                <span className='text-xs font-black text-indigo-600 tracking-widest uppercase'>
                  Loading Routings...
                </span>
              </div>
            </div>
          )}

          {/* 玻璃透視頂部導航列 */}
          <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/50 py-2 rounded-xl sticky top-0 z-20 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='bg-indigo-600 p-1.5 rounded-lg shadow-indigo-200 shadow-lg'>
                <Waypoints size={18} className='text-white' />
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
                      製程工藝概覽
                    </span>
                    <div className='flex gap-1'>
                      <Badge
                        count={stats.active}
                        style={{
                          backgroundColor: '#10b981',
                          fontSize: '10px',
                          boxShadow: 'none'
                        }}
                      />
                      <Badge
                        count={stats.drafts}
                        style={{
                          backgroundColor: '#f59e0b',
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
              <Tooltip title='導出製程表 (Excel)'>
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
                <span className='hidden sm:inline ml-1 text-xs'>建立製程</span>
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
                    已選取 {selectedRowKeys.length} 份製程主檔
                  </span>
                </div>
                <Space>
                  <Button
                    size='small'
                    icon={<CheckCircle2 size={14} />}
                    className='rounded-lg font-bold text-xs bg-white text-emerald-600 border-slate-200 shadow-sm'
                  >
                    批量發布 (生效)
                  </Button>
                  <Button
                    size='small'
                    icon={<Trash2 size={14} />}
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
                標準工藝路線主檔 (Standard Routing) - 共{' '}
                {mockRoutingData.length} 筆
              </div>
              <div className='flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm'>
                <Info size={14} className='text-indigo-500' />
                <span className='text-[10px] text-slate-400 font-bold uppercase tracking-tight'>
                  提示：點擊列表列可展開查看「工序步驟與標準工時」明細
                </span>
              </div>
            </div>

            <div className='p-4 pt-0'>
              <Table<RoutingNode>
                rowSelection={rowSelection}
                columns={columns}
                dataSource={mockRoutingData}
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
            /* 子表格樣式優化 */
            .nested-operation-table .ant-table-thead > tr > th {
              background: #f8fafc !important;
              color: #94a3b8 !important;
              font-size: 11px !important;
              padding: 8px 16px !important;
              font-weight: 600 !important;
            }
            .nested-operation-table .ant-table-tbody > tr > td {
              padding: 8px 16px !important;
              border-bottom: 1px solid #f1f5f9 !important;
            }

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
