import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  ConfigProvider,
  Card,
  Popover,
  Badge,
  Tooltip,
  Button,
  Space,
  Modal,
  Form,
  Select,
  message,
  Progress,
  Table,
  Tag,
  Input,
  InputNumber
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { InputRef } from 'antd'
import {
  Search,
  ChevronDown,
  Play,
  CheckSquare,
  RefreshCw,
  Settings,
  Info,
  Factory,
  Activity,
  Timer,
  UserCircle2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Wrench,
  Clock,
  Construction,
  Plus
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
export type ChangeoverStatus = '待換線' | '換線中' | '異常延遲' | '已完成'

export interface ChangeoverTask {
  id: string
  workCenter: string
  prevWoId: string
  nextWoId: string
  nextPartNumber: string
  nextProductName: string
  stdSetupTime: number // 標準換線時間 (mins)
  actualSetupTime: number // 實際耗時 (mins)
  status: ChangeoverStatus
  operator: string
  startTime: string | null
  endTime: string | null
}

// --- 擬真數據產生器 ---
const generateChangeoverTasks = (count: number): ChangeoverTask[] => {
  const statuses: ChangeoverStatus[] = [
    '換線中',
    '換線中',
    '待換線',
    '待換線',
    '異常延遲',
    '已完成'
  ]
  const workCenters = [
    'SMT-LINE-01',
    'SMT-LINE-02',
    'DIP-LINE-01',
    'CNC-MC-12',
    'ASSY-LINE-A',
    'TEST-ST-05'
  ]
  const operators = [
    '陳明欣 (EMP-001)',
    '林佳蓉 (EMP-024)',
    '王大偉 (EMP-033)',
    '未指派',
    '張志宏 (EMP-102)',
    '機動換線小組'
  ]

  return Array.from({ length: count }).map((_, idx) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const workCenter =
      workCenters[Math.floor(Math.random() * workCenters.length)]
    const stdSetupTime = Math.floor(Math.random() * 45) + 15 // 15 ~ 60 mins

    let actualSetupTime = 0
    let startTime = null
    let endTime = null

    if (status === '已完成') {
      actualSetupTime = stdSetupTime + Math.floor(Math.random() * 20) - 10 // 可能提早或延遲
      startTime = dayjs()
        .subtract(actualSetupTime + Math.floor(Math.random() * 60), 'minute')
        .format('YYYY-MM-DD HH:mm')
      endTime = dayjs(startTime)
        .add(actualSetupTime, 'minute')
        .format('YYYY-MM-DD HH:mm')
    } else if (status === '換線中' || status === '異常延遲') {
      actualSetupTime = Math.floor(Math.random() * (stdSetupTime + 30)) // 換線中目前的耗時
      startTime = dayjs()
        .subtract(actualSetupTime, 'minute')
        .format('YYYY-MM-DD HH:mm')
    }

    return {
      id: `CO-${dayjs().format('MMDD')}-${String(idx + 1).padStart(4, '0')}`,
      workCenter,
      prevWoId: `WO-26X${String(Math.floor(Math.random() * 9000) + 1000)}`,
      nextWoId: `WO-26X${String(Math.floor(Math.random() * 9000) + 1000)}`,
      nextPartNumber: `PN-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      nextProductName:
        Math.random() > 0.5 ? '高階伺服器主機板' : '工控運算核心模組',
      stdSetupTime,
      actualSetupTime: Math.max(0, actualSetupTime),
      status,
      operator:
        status === '待換線'
          ? '機動換線小組'
          : operators[Math.floor(Math.random() * (operators.length - 2))],
      startTime,
      endTime
    }
  })
}

const mockTasksData: ChangeoverTask[] = generateChangeoverTasks(80)

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
      'bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md cursor-default min-w-40',
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
export default function ChangeoverManagement() {
  const [loading, setLoading] = useState<boolean>(true)
  const [tasks, setTasks] = useState<ChangeoverTask[]>(mockTasksData)

  // HMI Modal 狀態
  const [isHmiModalVisible, setIsHmiModalVisible] = useState(false)
  const [activeTask, setActiveTask] = useState<ChangeoverTask | null>(null)
  const [reportForm] = Form.useForm()

  // 新增任務 Modal 狀態
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [addForm] = Form.useForm()

  const searchInputRef = useRef<InputRef>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(() => {
    const pending = tasks.filter(d => d.status === '待換線').length
    const running = tasks.filter(d => d.status === '換線中').length
    const delayed = tasks.filter(d => d.status === '異常延遲').length

    // 計算平均實際換線工時 (僅計算已完成的)
    const completedTasks = tasks.filter(d => d.status === '已完成')
    const avgSetupTime =
      completedTasks.length > 0
        ? Math.round(
            completedTasks.reduce(
              (sum, curr) => sum + curr.actualSetupTime,
              0
            ) / completedTasks.length
          )
        : 0

    return { pending, running, delayed, avgSetupTime }
  }, [tasks])

  // --- 操作處理函式 ---
  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success({
        content: '換線任務清單已更新！',
        className: 'custom-message'
      })
    }, 600)
  }

  const openHmiModal = (task: ChangeoverTask) => {
    setActiveTask(task)
    reportForm.resetFields()
    setIsHmiModalVisible(true)
  }

  const handleStartChangeover = (task: ChangeoverTask) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === task.id
          ? {
              ...t,
              status: '換線中',
              startTime: dayjs().format('YYYY-MM-DD HH:mm'),
              operator: '當前作業員 (機動組)' // 模擬帶入當前登入者
            }
          : t
      )
    )
    setIsHmiModalVisible(false)
    message.success({
      content: `機台 ${task.workCenter} 已開始換線作業！`,
      className: 'custom-message'
    })
  }

  const handleFinishChangeover = (task: ChangeoverTask) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === task.id) {
          const endTimeStr = dayjs().format('YYYY-MM-DD HH:mm')
          const start = dayjs(t.startTime)
          const end = dayjs(endTimeStr)
          const actualMins = Math.max(1, end.diff(start, 'minute')) // 至少 1 分鐘

          return {
            ...t,
            status: '已完成',
            endTime: endTimeStr,
            actualSetupTime: actualMins
          }
        }
        return t
      })
    )
    setIsHmiModalVisible(false)
    message.success({
      content: `機台 ${task.workCenter} 換線完成，可開始生產！`,
      className: 'custom-message'
    })
  }

  const handleReportDelay = async () => {
    try {
      const values = await reportForm.validateFields()
      if (activeTask) {
        setTasks(prev =>
          prev.map(t =>
            t.id === activeTask.id ? { ...t, status: '異常延遲' } : t
          )
        )
        setIsHmiModalVisible(false)
        message.error({
          content: `已通報 ${activeTask.workCenter} 換線異常：${values.delayReason}`,
          className: 'custom-message'
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  const handleAddChangeover = async () => {
    try {
      const values = await addForm.validateFields()
      const newTask: ChangeoverTask = {
        id: `CO-${dayjs().format('MMDD')}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        workCenter: values.workCenter,
        prevWoId: values.prevWoId,
        nextWoId: values.nextWoId,
        nextPartNumber: values.nextPartNumber,
        nextProductName: values.nextProductName,
        stdSetupTime: values.stdSetupTime,
        actualSetupTime: 0,
        status: '待換線',
        operator: '未指派',
        startTime: null,
        endTime: null
      }
      setTasks([newTask, ...tasks])
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success({
        content: '已成功新增換線任務！',
        className: 'custom-message'
      })
    } catch (error) {
      console.log('Validation Failed:', error)
    }
  }

  // --- 搜尋過濾邏輯 ---
  const getSearchProps = (dataIndex: keyof ChangeoverTask, title: string) => ({
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
          className='mb-3! rounded-lg h-9 border-slate-200'
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
    onFilter: (value: any, record: ChangeoverTask): boolean => {
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
        <Wrench size={16} className='text-amber-600' />
        <span className='font-bold text-slate-800'>
          換線作業即時看板 (Changeover KPI)
        </span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='進行中換線'
          value={stats.running}
          unit='站'
          icon={Construction}
          colorClass='text-blue-600'
          bgClass='bg-blue-50'
          iconColorClass='text-blue-500'
          trend='機台整備中'
        />
        <StatCard
          title='等待換線'
          value={stats.pending}
          unit='站'
          icon={Timer}
          colorClass='text-slate-500'
          bgClass='bg-slate-100'
          iconColorClass='text-slate-400'
          trend='需人員介入'
        />
        <StatCard
          title='異常延遲'
          value={stats.delayed}
          unit='站'
          icon={AlertTriangle}
          colorClass='text-rose-600'
          bgClass='bg-rose-100/80'
          iconColorClass='text-rose-500'
          isAlert={stats.delayed > 0}
          trend='嚴重影響產能'
        />
        <StatCard
          title='平均換線耗時'
          value={stats.avgSetupTime}
          unit='mins'
          icon={Activity}
          colorClass='text-emerald-600'
          bgClass='bg-emerald-50'
          iconColorClass='text-emerald-500'
          trend='基於今日已完成'
        />
      </div>
    </div>
  )

  // --- 表格欄位定義 ---
  const columns: ColumnsType<ChangeoverTask> = [
    {
      title: '機台 / 站點',
      dataIndex: 'workCenter',
      key: 'workCenter',
      width: 150,
      fixed: 'left',
      sorter: (a, b) => a.workCenter.localeCompare(b.workCenter),
      ...getSearchProps('workCenter', '機台'),
      render: text => (
        <div className='flex items-center gap-2'>
          <div className='w-6 h-6 rounded bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0'>
            <Factory size={12} className='text-slate-400' />
          </div>
          <span className='font-bold text-slate-700 text-[13px]'>{text}</span>
        </div>
      )
    },
    {
      title: '工單切換 (Previous ➔ Next)',
      key: 'transition',
      width: 280,
      render: (_, record) => (
        <div className='flex flex-col gap-1.5'>
          <div className='flex items-center gap-2'>
            <Tag className='m-0 border-none bg-slate-100 text-slate-500 font-mono text-[10px] line-through'>
              {record.prevWoId}
            </Tag>
            <ArrowRight size={12} className='text-slate-400' />
            <Tag className='m-0 border-blue-200 bg-blue-50 text-blue-700 font-mono font-bold text-[11px]'>
              {record.nextWoId}
            </Tag>
          </div>
          <div className='flex items-center gap-1.5'>
            <span className='text-[11px] font-bold text-slate-600 truncate'>
              {record.nextPartNumber}
            </span>
            <span className='text-[10px] text-slate-400 truncate'>
              ({record.nextProductName})
            </span>
          </div>
        </div>
      )
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      sorter: (a, b) => a.status.localeCompare(b.status),
      filters: [
        { text: '待換線', value: '待換線' },
        { text: '換線中', value: '換線中' },
        { text: '異常延遲', value: '異常延遲' },
        { text: '已完成', value: '已完成' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: ChangeoverStatus) => {
        let colorClass = ''
        let bgClass = ''
        let Icon = Timer

        switch (status) {
          case '換線中':
            colorClass = 'text-blue-600'
            bgClass = 'bg-blue-50 border-blue-200 shadow-sm shadow-blue-100'
            Icon = Construction
            break
          case '待換線':
            colorClass = 'text-slate-500'
            bgClass = 'bg-white border-slate-200'
            Icon = Timer
            break
          case '異常延遲':
            colorClass = 'text-rose-600'
            bgClass = 'bg-rose-50 border-rose-200'
            Icon = AlertTriangle
            break
          case '已完成':
            colorClass = 'text-emerald-600'
            bgClass = 'bg-emerald-50 border-emerald-200'
            Icon = CheckSquare
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
            <Icon
              size={12}
              className={status === '換線中' ? 'animate-pulse' : ''}
            />
            {status}
          </div>
        )
      }
    },
    {
      title: '工時監控 (標準 vs 實際)',
      key: 'timeTracking',
      width: 240,
      render: (_, record) => {
        const { stdSetupTime, actualSetupTime, status } = record
        // 確保至少顯示一點進度，最高 100% (超過用紅色顯示)
        const percent =
          stdSetupTime === 0
            ? 0
            : Math.min(100, Math.round((actualSetupTime / stdSetupTime) * 100))
        const isOvertime = actualSetupTime > stdSetupTime && status !== '待換線'

        let progressStatus: any = 'active'
        let strokeColor = '#3b82f6' // Blue

        if (status === '已完成') {
          progressStatus = 'normal'
          strokeColor = isOvertime ? '#f59e0b' : '#10b981' // Amber if overtime, Emerald if on time
        } else if (status === '異常延遲' || isOvertime) {
          progressStatus = 'exception'
          strokeColor = '#f43f5e' // Rose
        } else if (status === '待換線') {
          progressStatus = 'normal'
          strokeColor = '#cbd5e1' // Slate
        }

        return (
          <div className='w-full pr-4'>
            <div className='flex justify-between text-[10px] font-black mb-1.5'>
              <div className='flex gap-2'>
                <span className='text-slate-400'>標準: {stdSetupTime}m</span>
                <span
                  className={cn(
                    'tracking-tight',
                    isOvertime
                      ? 'text-rose-500'
                      : status === '已完成'
                        ? 'text-emerald-600'
                        : 'text-blue-600'
                  )}
                >
                  實際: {actualSetupTime}m
                </span>
              </div>
              <span
                className={cn(isOvertime ? 'text-rose-500' : 'text-slate-500')}
              >
                {percent}%
              </span>
            </div>
            <Progress
              percent={percent}
              size='small'
              showInfo={false}
              strokeColor={strokeColor}
              status={progressStatus}
            />
          </div>
        )
      }
    },
    {
      title: '作業人員',
      dataIndex: 'operator',
      key: 'operator',
      width: 160,
      render: text => (
        <div
          className={cn(
            'flex items-center gap-1.5 text-[11px] font-medium',
            text === '未指派' || text === '機動換線小組'
              ? 'text-slate-400'
              : 'text-slate-700 font-bold'
          )}
        >
          <UserCircle2 size={14} /> {text}
        </div>
      )
    },
    {
      title: '操作 (HMI)',
      key: 'action',
      width: 100,
      fixed: 'right',
      align: 'center',
      render: (_, record) => {
        const isReady = record.status === '待換線'
        // const isRunning =
        //   record.status === '換線中' || record.status === '異常延遲'
        const isDone = record.status === '已完成'

        if (isDone) {
          return (
            <span className='text-emerald-600 font-bold text-[10px] flex items-center justify-center gap-1'>
              <CheckCircle2 size={12} /> 已結案
            </span>
          )
        }

        return (
          <Space size='small'>
            <Tooltip title='開啟換線終端'>
              <Button
                type='primary'
                size='small'
                className={cn(
                  'border-none rounded-md shadow-sm flex items-center justify-center w-8 h-8 p-0',
                  isReady
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-200'
                )}
                onClick={() => openHmiModal(record)}
              >
                {isReady ? (
                  <Play size={14} className='fill-white ml-0.5' />
                ) : (
                  <Wrench size={14} className='text-white' />
                )}
              </Button>
            </Tooltip>
          </Space>
        )
      }
    }
  ]

  return (
    <ConfigProvider
      theme={{
        token: { borderRadius: 12, borderRadiusSM: 6 } // Amber base
      }}
    >
      <div className='w-full min-h-screen bg-[#f8fafc] p-4 font-sans'>
        <div className='mx-auto px-2 pt-2 pb-8 space-y-6 animate-fade-in relative max-w-400'>
          {loading && (
            <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-110 flex items-center justify-center rounded-[28px] mt-15'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-10 h-10 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin' />
                <span className='text-xs font-black text-amber-600 tracking-widest uppercase'>
                  Loading Changeover Data...
                </span>
              </div>
            </div>
          )}

          {/* 玻璃透視頂部導航列 */}
          <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/50 py-2 rounded-xl sticky top-0 z-20 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='bg-amber-500 p-1.5 rounded-lg shadow-amber-200 shadow-lg'>
                <Wrench size={18} className='text-white' />
              </div>
              <div className='flex items-center'>
                <Popover
                  content={statsContent}
                  trigger='click'
                  placement='bottomLeft'
                  rootClassName='custom-stats-popover'
                >
                  <div className='flex items-center gap-2 cursor-pointer hover:bg-white px-2 sm:px-3 py-1.5 rounded-full transition-all group border border-transparent hover:border-slate-100'>
                    <span className='text-sm font-bold text-slate-600 group-hover:text-amber-600 whitespace-nowrap'>
                      換線作業監控
                    </span>
                    <div className='flex gap-1'>
                      <Badge
                        count={stats.running}
                        style={{
                          backgroundColor: '#3b82f6',
                          fontSize: '10px',
                          boxShadow: 'none'
                        }}
                      />
                      {stats.delayed > 0 && (
                        <Badge
                          count={stats.delayed}
                          style={{
                            backgroundColor: '#f43f5e',
                            fontSize: '10px',
                            boxShadow: 'none'
                          }}
                        />
                      )}
                    </div>
                    <ChevronDown
                      size={14}
                      className='text-slate-400 group-hover:text-amber-600'
                    />
                  </div>
                </Popover>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Tooltip title='重新整理換線數據'>
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
                icon={<Plus size={16} />}
                className='rounded-xl bg-amber-500 shadow-md shadow-amber-200 font-bold border-none h-10 flex items-center justify-center hover:bg-amber-400'
                onClick={() => setIsAddModalVisible(true)}
              >
                <span className='hidden sm:inline ml-1 text-xs'>新增任務</span>
              </Button>
            </div>
          </div>

          <Card
            className='shadow-xl shadow-slate-200/50 border-none rounded-4xl overflow-hidden bg-white'
            styles={{ body: { padding: 0 } }}
          >
            <div className='bg-slate-50/50 p-5 border-b border-slate-100 flex items-center justify-between'>
              <div className='flex items-center gap-3 text-slate-500 text-[11px] font-black uppercase tracking-widest'>
                <Settings size={14} />
                現場機台換線任務清單 (Setup / Changeover List)
              </div>
              <div className='flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm'>
                <Info size={14} className='text-amber-500' />
                <span className='text-[10px] text-slate-400 font-bold uppercase tracking-tight'>
                  提示：超時換線將影響 OEE 稼動率，請優先處理紅色高亮任務。
                </span>
              </div>
            </div>

            <div className='p-4 pt-0'>
              <Table<ChangeoverTask>
                columns={columns}
                dataSource={tasks}
                loading={false}
                scroll={{ x: 1000 }}
                rowKey='id'
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                  className: 'mt-4 !px-4 pb-2'
                }}
              />
            </div>
          </Card>

          {/* --- 現場 HMI 換線終端 Modal --- */}
          <Modal
            title={
              <div className='flex items-center justify-between border-b border-slate-100 pb-4 pr-6'>
                <div className='flex items-center gap-3 text-slate-800'>
                  <div className='bg-amber-500 p-2 rounded-xl shadow-md shadow-amber-200'>
                    <Wrench size={24} className='text-white' />
                  </div>
                  <div className='flex flex-col'>
                    <span className='font-black text-xl tracking-tight'>
                      機台換線終端 (Changeover HMI)
                    </span>
                    <span className='text-xs font-mono text-slate-400 font-bold'>
                      {activeTask?.workCenter}
                    </span>
                  </div>
                </div>
                {activeTask?.status === '換線中' && (
                  <div className='flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 animate-pulse'>
                    <Clock size={14} className='text-blue-500' />
                    <span className='text-xs font-bold text-blue-700 font-mono'>
                      {activeTask.actualSetupTime} mins
                    </span>
                  </div>
                )}
              </div>
            }
            open={isHmiModalVisible}
            onCancel={() => setIsHmiModalVisible(false)}
            footer={null} // 隱藏預設 Footer，改用自訂大型按鈕
            className='custom-hmi-modal'
            width={640}
          >
            {/* 工單切換資訊面板 */}
            <div className='mt-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 relative overflow-hidden'>
              <div className='flex items-center justify-between relative z-10'>
                {/* Previous */}
                <div className='flex flex-col flex-1'>
                  <span className='text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider'>
                    完成生產 (Finished)
                  </span>
                  <span className='text-base font-black text-slate-400 tracking-tight font-mono line-through'>
                    {activeTask?.prevWoId}
                  </span>
                </div>

                <div className='mx-4 bg-white p-2 rounded-full border border-slate-200 shadow-sm flex items-center justify-center shrink-0'>
                  <ArrowRight size={20} className='text-blue-500' />
                </div>

                {/* Next */}
                <div className='flex flex-col flex-1 items-end'>
                  <span className='text-[10px] font-bold text-blue-500 mb-1 uppercase tracking-wider'>
                    即將生產 (Next)
                  </span>
                  <span className='text-xl font-black text-blue-700 tracking-tight font-mono'>
                    {activeTask?.nextWoId}
                  </span>
                  <span className='text-xs font-bold text-slate-500 mt-1'>
                    {activeTask?.nextPartNumber}
                  </span>
                  <span className='text-[10px] text-slate-400'>
                    {activeTask?.nextProductName}
                  </span>
                </div>
              </div>
              {/* 背景裝飾 */}
              <div className='absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-blue-100/50 to-transparent z-0 pointer-events-none'></div>
            </div>

            {/* HMI 操作按鈕區 */}
            {activeTask?.status === '待換線' ? (
              <div className='flex flex-col items-center justify-center py-8'>
                <Button
                  type='primary'
                  size='large'
                  className='w-full h-20 rounded-2xl font-black text-2xl bg-emerald-600 hover:bg-emerald-500 border-none shadow-xl shadow-emerald-200 flex items-center justify-center gap-3'
                  onClick={() => handleStartChangeover(activeTask)}
                >
                  <Play size={20} className='fill-white' /> 開始換線作業 (Start
                  Setup)
                </Button>
                <span className='text-xs font-bold text-slate-400 mt-4'>
                  標準耗時：{activeTask?.stdSetupTime} 分鐘
                </span>
              </div>
            ) : (
              <Form form={reportForm} layout='vertical' className='mt-4'>
                <div className='grid grid-cols-2 gap-4 mb-6'>
                  <Button
                    size='large'
                    className='h-16 rounded-xl font-bold text-base text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100 hover:border-rose-300 flex items-center justify-center gap-2'
                    onClick={handleReportDelay}
                  >
                    <AlertTriangle size={18} /> 申報異常延遲
                  </Button>
                  <Button
                    type='primary'
                    size='large'
                    className='h-16 rounded-xl font-black text-lg bg-blue-600 hover:bg-blue-500 border-none shadow-lg shadow-blue-200 flex items-center justify-center gap-2'
                    onClick={() => handleFinishChangeover(activeTask!)}
                  >
                    <CheckSquare size={20} /> 完成換線 (Finish)
                  </Button>
                </div>

                <div className='bg-rose-50/50 p-4 rounded-xl border border-rose-100'>
                  <Form.Item
                    name='delayReason'
                    label={
                      <span className='font-bold text-rose-700 text-xs'>
                        異常延遲原因 (如需申報異常請選擇)
                      </span>
                    }
                    className='mb-0'
                  >
                    <Select
                      placeholder='選擇導致延遲的原因'
                      className='h-10 rounded-lg custom-hmi-select'
                      allowClear
                    >
                      <Select.Option value='備料未齊'>
                        材料未到位 (Material Shortage)
                      </Select.Option>
                      <Select.Option value='治具異常'>
                        治具/刀具異常 (Tooling Issue)
                      </Select.Option>
                      <Select.Option value='機台校正失敗'>
                        機台校正失敗 (Calibration Error)
                      </Select.Option>
                      <Select.Option value='首件檢驗未過'>
                        首件檢驗未過 (FAI Failed)
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </div>
              </Form>
            )}
          </Modal>

          {/* --- 新增換線任務 Modal --- */}
          <Modal
            title={
              <div className='flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3'>
                <div className='bg-amber-100 p-1.5 rounded-lg'>
                  <Plus size={18} className='text-amber-600' />
                </div>
                <span className='font-black text-lg tracking-tight'>
                  建立換線任務
                </span>
              </div>
            }
            open={isAddModalVisible}
            onOk={handleAddChangeover}
            onCancel={() => {
              setIsAddModalVisible(false)
              addForm.resetFields()
            }}
            okText='建立任務'
            cancelText='取消'
            okButtonProps={{
              className:
                'bg-amber-500 hover:bg-amber-400 border-none shadow-md shadow-amber-200 rounded-xl font-bold h-10 px-6'
            }}
            cancelButtonProps={{
              className:
                'rounded-xl font-bold text-slate-500 border-slate-200 h-10 px-6 hover:bg-slate-50'
            }}
            className='custom-edit-modal'
            width={640}
          >
            <Form form={addForm} layout='vertical' className='mt-4 mb-0'>
              <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
                <Form.Item
                  name='workCenter'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      機台 / 工作中心
                    </span>
                  }
                  rules={[{ required: true, message: '請選擇機台' }]}
                >
                  <Select
                    className='h-10 rounded-xl font-mono text-xs'
                    placeholder='請選擇機台'
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
                    <Select.Option value='CNC-MC-12'>CNC-MC-12</Select.Option>
                    <Select.Option value='ASSY-LINE-A'>
                      ASSY-LINE-A
                    </Select.Option>
                    <Select.Option value='TEST-ST-05'>TEST-ST-05</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name='stdSetupTime'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      標準換線工時 (分鐘)
                    </span>
                  }
                  rules={[{ required: true, message: '請輸入工時' }]}
                >
                  <InputNumber
                    min={1}
                    className='w-full h-10 rounded-xl border-slate-200 flex items-center font-mono text-xs'
                    placeholder='例如: 30'
                  />
                </Form.Item>

                <Form.Item
                  name='prevWoId'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      前置工單 (Previous)
                    </span>
                  }
                  rules={[{ required: true, message: '請輸入前置工單' }]}
                >
                  <Input
                    className='h-10 rounded-xl border-slate-200 font-mono text-xs'
                    placeholder='WO-...'
                  />
                </Form.Item>

                <Form.Item
                  name='nextWoId'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      接續工單 (Next)
                    </span>
                  }
                  rules={[{ required: true, message: '請輸入接續工單' }]}
                >
                  <Input
                    className='h-10 rounded-xl border-slate-200 font-mono text-xs'
                    placeholder='WO-...'
                  />
                </Form.Item>

                <Form.Item
                  name='nextPartNumber'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      目標料號 (Part Number)
                    </span>
                  }
                  rules={[{ required: true, message: '請輸入目標料號' }]}
                >
                  <Input
                    className='h-10 rounded-xl border-slate-200 font-mono text-xs'
                    placeholder='PN-...'
                  />
                </Form.Item>

                <Form.Item
                  name='nextProductName'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      目標品名
                    </span>
                  }
                  rules={[{ required: true, message: '請輸入目標品名' }]}
                >
                  <Input
                    className='h-10 rounded-xl border-slate-200 text-xs'
                    placeholder='例如: 高階伺服器主機板'
                  />
                </Form.Item>
              </div>
            </Form>
          </Modal>

          <style>{`
            /* 自定義 HMI 終端 Modal 樣式 */
            .custom-hmi-modal .ant-modal-content {
              border-radius: 28px;
              padding: 32px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              border: 1px solid #f1f5f9;
            }
            .custom-hmi-modal .ant-modal-header {
              background: transparent;
              margin-bottom: 0;
            }
            .custom-hmi-select .ant-select-selector {
              border-radius: 8px !important;
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
