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
  InputNumber,
  Select,
  message,
  Table,
  Tag,
  Input,
  Popconfirm,
  Divider
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { InputRef } from 'antd'
import {
  Search,
  ChevronDown,
  Play,
  Pause,
  CheckSquare,
  RefreshCw,
  Settings,
  Info,
  Factory,
  ClipboardEdit,
  Plus,
  BoxSelect,
  ShieldAlert,
  Timer,
  UserCircle2,
  CheckCircle2,
  AlertTriangle
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
export type TaskStatus = '待開工' | '執行中' | '暫停中' | '已完工'

export interface ReportingTask {
  id: string
  woId: string
  partNumber: string
  productName: string
  routingStep: string // e.g., '0020 - SMT 表面黏著'
  workCenter: string
  targetQty: number
  goodQty: number
  scrapQty: number
  status: TaskStatus
  operator: string
  startTime: string | null
  estEndTime: string
}

// --- 擬真數據產生器 ---
const generateTasks = (count: number): ReportingTask[] => {
  const statuses: TaskStatus[] = [
    '執行中',
    '執行中',
    '執行中',
    '待開工',
    '待開工',
    '暫停中',
    '已完工'
  ]
  const workCenters = [
    'SMT-LINE-01',
    'DIP-LINE-02',
    'CNC-MC-12',
    'ASSY-LINE-A',
    'TEST-ST-05'
  ]
  const operators = [
    '陳明欣 (EMP-001)',
    '林佳蓉 (EMP-024)',
    '王大偉 (EMP-033)',
    '未指派',
    '張志宏 (EMP-102)'
  ]
  const steps = [
    '0010 - 備料與前置',
    '0020 - SMT 表面黏著',
    '0030 - CNC 切削成型',
    '0040 - 模組總裝',
    '0050 - 品管測試 (FCT)'
  ]

  return Array.from({ length: count }).map((_, idx) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const targetQty = Math.floor(Math.random() * 500) + 50

    let goodQty = 0
    let scrapQty = 0

    if (status === '已完工') {
      goodQty = targetQty - Math.floor(Math.random() * 5)
      scrapQty = targetQty - goodQty
    } else if (status === '執行中' || status === '暫停中') {
      goodQty = Math.floor(targetQty * (Math.random() * 0.8))
      scrapQty = Math.floor(goodQty * (Math.random() * 0.05)) // 模擬 0~5% 不良率
    }

    return {
      id: `TASK-${dayjs().format('MMDD')}-${String(idx + 1).padStart(4, '0')}`,
      woId: `WO-26X${String(Math.floor(Math.random() * 9000) + 1000)}`,
      partNumber: `PN-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      productName: '高階工業運算主機板',
      routingStep: steps[Math.floor(Math.random() * steps.length)],
      workCenter: workCenters[Math.floor(Math.random() * workCenters.length)],
      targetQty,
      goodQty,
      scrapQty,
      status,
      operator:
        status === '待開工'
          ? '未指派'
          : operators[Math.floor(Math.random() * (operators.length - 1))],
      startTime:
        status !== '待開工'
          ? dayjs()
              .subtract(Math.floor(Math.random() * 4), 'hour')
              .format('YYYY-MM-DD HH:mm')
          : null,
      estEndTime: dayjs()
        .add(Math.floor(Math.random() * 8) + 1, 'hour')
        .format('YYYY-MM-DD HH:mm')
    }
  })
}

const mockTasksData: ReportingTask[] = generateTasks(120)

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
export default function ProductionReporting() {
  const [loading, setLoading] = useState<boolean>(true)
  const [tasks, setTasks] = useState<ReportingTask[]>(mockTasksData)

  // 報工 Modal 狀態
  const [isReportModalVisible, setIsReportModalVisible] = useState(false)
  const [reportingTask, setReportingTask] = useState<ReportingTask | null>(null)
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
    const running = tasks.filter(d => d.status === '執行中').length
    const completed = tasks.filter(d => d.status === '已完工').length
    const totalTarget = tasks.reduce((sum, curr) => sum + curr.targetQty, 0)
    const totalGood = tasks.reduce((sum, curr) => sum + curr.goodQty, 0)
    const totalScrap = tasks.reduce((sum, curr) => sum + curr.scrapQty, 0)
    const defectRate =
      totalGood + totalScrap === 0
        ? 0
        : ((totalScrap / (totalGood + totalScrap)) * 100).toFixed(2)

    return { running, completed, defectRate, totalGood, totalTarget }
  }, [tasks])

  // --- 操作處理函式 ---
  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success({
        content: '現場任務清單已更新！',
        className: 'custom-message'
      })
    }, 600)
  }

  const handleStatusChange = (
    taskId: string,
    newStatus: TaskStatus,
    actionName: string
  ) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            status: newStatus,
            startTime:
              newStatus === '執行中' && !task.startTime
                ? dayjs().format('YYYY-MM-DD HH:mm')
                : task.startTime
          }
        }
        return task
      })
    )
    message.success({
      content: `工單已成功${actionName}！`,
      className: 'custom-message'
    })
  }

  const openReportModal = (task: ReportingTask) => {
    setReportingTask(task)
    reportForm.setFieldsValue({
      addGoodQty: 0,
      addScrapQty: 0,
      scrapReason: undefined
    })
    setIsReportModalVisible(true)
  }

  const handleSaveReport = async () => {
    try {
      const values = await reportForm.validateFields()
      const addedGood = values.addGoodQty || 0
      const addedScrap = values.addScrapQty || 0

      if (addedGood === 0 && addedScrap === 0) {
        message.warning({
          content: '請輸入本次報工數量！',
          className: 'custom-message'
        })
        return
      }

      setTasks(prev =>
        prev.map(task => {
          if (task.id === reportingTask?.id) {
            // 檢查是否達標完工
            const newGoodQty = task.goodQty + addedGood
            const newScrapQty = task.scrapQty + addedScrap
            const autoComplete = newGoodQty + newScrapQty >= task.targetQty

            return {
              ...task,
              goodQty: newGoodQty,
              scrapQty: newScrapQty,
              status: autoComplete ? '已完工' : task.status
            }
          }
          return task
        })
      )

      setIsReportModalVisible(false)
      message.success({
        content: `報工成功！已紀錄良品 +${addedGood}, 不良品 +${addedScrap}`,
        className: 'custom-message'
      })
    } catch (error) {
      console.log('Validation Failed:', error)
    }
  }

  const handleAddTask = async () => {
    try {
      const values = await addForm.validateFields()
      const newTask: ReportingTask = {
        id: `TASK-${dayjs().format('MMDD')}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        woId: values.woId,
        partNumber: values.partNumber,
        productName: '高階工業運算主機板',
        routingStep: values.routingStep,
        workCenter: values.workCenter,
        targetQty: values.targetQty,
        goodQty: 0,
        scrapQty: 0,
        status: '待開工',
        operator: '未指派',
        startTime: null,
        estEndTime: dayjs().add(8, 'hour').format('YYYY-MM-DD HH:mm')
      }
      setTasks([newTask, ...tasks])
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success({
        content: '已成功新增生產任務！',
        className: 'custom-message'
      })
    } catch (error) {
      console.log('Validation Failed:', error)
    }
  }

  // --- 觸控輔助函式 (HMI 面板使用) ---
  const incrementQty = (
    field: 'addGoodQty' | 'addScrapQty',
    amount: number
  ) => {
    const current = reportForm.getFieldValue(field) || 0
    reportForm.setFieldsValue({ [field]: current + amount })
  }

  // --- 搜尋過濾邏輯 ---
  const getSearchProps = (dataIndex: keyof ReportingTask, title: string) => ({
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
    onFilter: (value: any, record: ReportingTask): boolean => {
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
        <Factory size={16} className='text-blue-600' />
        <span className='font-bold text-slate-800'>
          現場生產看板 (Shop Floor KPI)
        </span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='執行中任務'
          value={stats.running}
          unit='站'
          icon={Play}
          colorClass='text-blue-600'
          bgClass='bg-blue-50'
          iconColorClass='text-blue-500'
          trend='機台運轉中'
        />
        <StatCard
          title='今日累計產出'
          value={stats.totalGood}
          unit='PCS'
          icon={BoxSelect}
          colorClass='text-emerald-600'
          bgClass='bg-emerald-50'
          iconColorClass='text-emerald-500'
          trend={`目標達成率 ${((stats.totalGood / stats.totalTarget) * 100).toFixed(1)}%`}
        />
        <StatCard
          title='今日已完工'
          value={stats.completed}
          unit='單'
          icon={CheckSquare}
          colorClass='text-indigo-600'
          bgClass='bg-indigo-50'
          iconColorClass='text-indigo-500'
        />
        <StatCard
          title='全廠不良率預警'
          value={stats.defectRate}
          unit='%'
          icon={ShieldAlert}
          colorClass='text-rose-600'
          bgClass='bg-rose-100/80'
          iconColorClass='text-rose-500'
          isAlert={Number(stats.defectRate) > 3}
          trend='目標: < 3.0%'
        />
      </div>
    </div>
  )

  // --- 表格欄位定義 ---
  const columns: ColumnsType<ReportingTask> = [
    {
      title: '工單 / 工序',
      key: 'woInfo',
      width: 240,
      fixed: 'left',
      sorter: (a, b) => a.woId.localeCompare(b.woId),
      ...getSearchProps('woId', '工單號'),
      render: (_, record) => (
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <span className='font-mono font-black text-blue-700 text-[14px]'>
              {record.woId}
            </span>
            <Tag className='m-0 border-none bg-slate-100 text-slate-500 font-mono text-[10px]'>
              {record.partNumber}
            </Tag>
          </div>
          <span
            className='text-xs font-bold text-slate-600 truncate'
            title={record.routingStep}
          >
            {record.routingStep}
          </span>
        </div>
      )
    },
    {
      title: '工作中心 / 人員',
      key: 'workCenterInfo',
      width: 180,
      filters: [
        { text: 'SMT-LINE-01', value: 'SMT-LINE-01' },
        { text: 'CNC-MC-12', value: 'CNC-MC-12' },
        { text: 'ASSY-LINE-A', value: 'ASSY-LINE-A' }
      ],
      onFilter: (value, record) => record.workCenter === value,
      render: (_, record) => (
        <div className='flex flex-col gap-1.5'>
          <div className='flex items-center gap-1.5 text-xs font-bold text-slate-700'>
            <Factory size={12} className='text-slate-400' /> {record.workCenter}
          </div>
          <div
            className={cn(
              'flex items-center gap-1.5 text-[11px] font-medium',
              record.operator === '未指派' ? 'text-rose-500' : 'text-slate-500'
            )}
          >
            <UserCircle2 size={12} /> {record.operator}
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
        { text: '待開工', value: '待開工' },
        { text: '執行中', value: '執行中' },
        { text: '暫停中', value: '暫停中' },
        { text: '已完工', value: '已完工' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: TaskStatus) => {
        let colorClass = ''
        let bgClass = ''
        let Icon = Timer

        switch (status) {
          case '執行中':
            colorClass = 'text-blue-600'
            bgClass = 'bg-blue-50 border-blue-200 shadow-sm shadow-blue-100'
            Icon = Play
            break
          case '待開工':
            colorClass = 'text-slate-500'
            bgClass = 'bg-white border-slate-200'
            Icon = Timer
            break
          case '暫停中':
            colorClass = 'text-amber-600'
            bgClass = 'bg-amber-50 border-amber-200'
            Icon = Pause
            break
          case '已完工':
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
              className={status === '執行中' ? 'fill-blue-600' : ''}
            />
            {status}
          </div>
        )
      }
    },
    {
      title: '生產進度 (報工狀態)',
      key: 'progress',
      width: 240,
      render: (_, record) => {
        const totalDone = record.goodQty + record.scrapQty
        const percent =
          record.targetQty === 0
            ? 0
            : Math.min(100, Math.round((totalDone / record.targetQty) * 100))
        const goodPercent =
          totalDone === 0 ? 0 : (record.goodQty / record.targetQty) * 100
        const scrapPercent =
          totalDone === 0 ? 0 : (record.scrapQty / record.targetQty) * 100

        return (
          <div className='w-full pr-2'>
            <div className='flex justify-between text-[10px] font-black mb-1.5'>
              <div className='flex gap-2'>
                <span className='text-emerald-600 tracking-tight'>
                  良 {record.goodQty}
                </span>
                {record.scrapQty > 0 && (
                  <span className='text-rose-500 tracking-tight'>
                    廢 {record.scrapQty}
                  </span>
                )}
              </div>
              <span className='text-slate-500'>
                / {record.targetQty} <span className='font-normal'>PCS</span>
              </span>
            </div>

            {/* 雙色疊加進度條 (Antd 預設不支援多段顏色，改用自訂 Tailwind 實作) */}
            <div className='w-full h-2 bg-slate-100 rounded-full overflow-hidden flex'>
              <div
                className='h-full bg-emerald-500 transition-all duration-500'
                style={{ width: `${goodPercent}%` }}
              ></div>
              <div
                className='h-full bg-rose-500 transition-all duration-500'
                style={{ width: `${scrapPercent}%` }}
              ></div>
            </div>
            <div className='text-right mt-0.5'>
              <span className='text-[9px] font-bold text-slate-400'>
                {percent}%
              </span>
            </div>
          </div>
        )
      }
    },
    {
      title: '排程時間',
      key: 'times',
      width: 160,
      render: (_, record) => (
        <div className='flex flex-col gap-1.5'>
          <div className='flex items-center gap-1.5 text-[11px] font-mono text-slate-500'>
            <Play size={10} className='text-emerald-500' />{' '}
            {record.startTime || '尚未開工'}
          </div>
          <div className='flex items-center gap-1.5 text-[11px] font-mono text-slate-500'>
            <CheckSquare size={10} className='text-slate-400' />{' '}
            {record.estEndTime}
          </div>
        </div>
      )
    },
    {
      title: '操作 (HMI)',
      key: 'action',
      width: 150,
      fixed: 'right',
      align: 'center',
      render: (_, record) => {
        const isReady = record.status === '待開工'
        const isRunning = record.status === '執行中'
        const isPaused = record.status === '暫停中'
        const isDone = record.status === '已完工'

        if (isDone) {
          return (
            <span className='text-emerald-600 font-bold text-xs flex items-center justify-center gap-1'>
              <CheckCircle2 size={14} /> 任務結束
            </span>
          )
        }

        return (
          <Space size='small'>
            {/* 開工/恢復 按鈕 */}
            {(isReady || isPaused) && (
              <Popconfirm
                title='確認開工'
                description={`確定要開始執行工序 ${record.routingStep.split(' - ')[0]} 嗎？`}
                onConfirm={() =>
                  handleStatusChange(record.id, '執行中', '開工')
                }
                okText='確認開工'
                cancelText='取消'
              >
                <Tooltip title={isReady ? '開工' : '恢復'}>
                  <Button
                    type='primary'
                    size='small'
                    className='bg-emerald-600 hover:bg-emerald-500 border-none rounded-md shadow-sm shadow-emerald-200 flex items-center justify-center w-8 h-8 p-0'
                  >
                    <Play size={14} className='fill-white ml-0.5' />
                  </Button>
                </Tooltip>
              </Popconfirm>
            )}

            {/* 報工 按鈕 (僅執行中可按) */}
            {isRunning && (
              <Tooltip title='報工'>
                <Button
                  type='primary'
                  size='small'
                  className='bg-blue-600 hover:bg-blue-500 border-none rounded-md shadow-sm shadow-blue-200 flex items-center justify-center w-8 h-8 p-0 animate-pulse-slow'
                  onClick={() => openReportModal(record)}
                >
                  <ClipboardEdit size={14} />
                </Button>
              </Tooltip>
            )}

            {/* 暫停 按鈕 */}
            {isRunning && (
              <Popconfirm
                title='暫停任務'
                description='即將暫停此任務的工時計算，確定嗎？'
                onConfirm={() =>
                  handleStatusChange(record.id, '暫停中', '暫停')
                }
                okText='暫停'
                cancelText='取消'
              >
                <Tooltip title='暫停'>
                  <Button
                    size='small'
                    className='text-amber-600 border-amber-200 hover:bg-amber-50 rounded-md flex items-center justify-center w-8 h-8 p-0'
                  >
                    <Pause size={14} className='fill-amber-600' />
                  </Button>
                </Tooltip>
              </Popconfirm>
            )}

            {/* 完工 按鈕 (需確認) */}
            {(isRunning || isPaused) && (
              <Popconfirm
                title='強制完工結案'
                description={
                  <div className='max-w-[200px] text-xs'>
                    注意：您即將結束此工序。若數量未達標，系統將記錄為短交完工。確定要結案嗎？
                  </div>
                }
                onConfirm={() =>
                  handleStatusChange(record.id, '已完工', '強制完工')
                }
                okText='確認完工'
                cancelText='取消'
                okButtonProps={{ danger: true }}
              >
                <Tooltip title='強制結案'>
                  <Button
                    size='small'
                    type='text'
                    className='text-slate-400 hover:text-slate-600 rounded-md flex items-center justify-center w-8 h-8 p-0'
                  >
                    <CheckSquare size={16} />
                  </Button>
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        )
      }
    }
  ]

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#2563eb', borderRadius: 12, borderRadiusSM: 6 } // Blue 600 base
      }}
    >
      <div className='w-full min-h-screen bg-[#f8fafc] p-4 font-sans'>
        <div className='mx-auto px-2 pt-2 pb-8 space-y-6 animate-fade-in relative max-w-400'>
          {loading && (
            <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-110 flex items-center justify-center rounded-[28px] mt-[60px]'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin' />
                <span className='text-xs font-black text-blue-600 tracking-widest uppercase'>
                  Loading Shop Floor Data...
                </span>
              </div>
            </div>
          )}

          {/* 玻璃透視頂部導航列 */}
          <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/50 py-2 rounded-xl sticky top-0 z-20 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='bg-blue-600 p-1.5 rounded-lg shadow-blue-200 shadow-lg'>
                <ClipboardEdit size={18} className='text-white' />
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
                      生產進度概覽
                    </span>
                    <div className='flex gap-1'>
                      <Badge
                        count={stats.running}
                        style={{
                          backgroundColor: '#2563eb',
                          fontSize: '10px',
                          boxShadow: 'none'
                        }}
                      />
                      {Number(stats.defectRate) > 3 && (
                        <Badge
                          count='不良偏高'
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
                      className='text-slate-400 group-hover:text-blue-600'
                    />
                  </div>
                </Popover>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Tooltip title='重新整理現場數據'>
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
                className='rounded-xl bg-blue-600 shadow-md shadow-blue-200 font-bold border-none h-10 flex items-center justify-center hover:bg-blue-500'
                onClick={() => setIsAddModalVisible(true)}
              >
                <span className='hidden sm:inline ml-1 text-xs'>新增任務</span>
              </Button>
            </div>
          </div>

          <Card
            className='shadow-xl shadow-slate-200/50 border-none rounded-[32px] overflow-hidden bg-white'
            styles={{ body: { padding: 0 } }}
          >
            <div className='bg-slate-50/50 p-5 border-b border-slate-100 flex items-center justify-between'>
              <div className='flex items-center gap-3 text-slate-500 text-[11px] font-black uppercase tracking-widest'>
                <Settings size={14} />
                現場派工與報工任務清單 (Dispatch & Reporting)
              </div>
              <div className='flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm'>
                <Info size={14} className='text-blue-500' />
                <span className='text-[10px] text-slate-400 font-bold uppercase tracking-tight'>
                  提示：只有狀態為「執行中」的任務可以進行資料報工
                </span>
              </div>
            </div>

            <div className='p-4 pt-0'>
              <Table<ReportingTask>
                columns={columns}
                dataSource={tasks}
                loading={false}
                scroll={{ x: 1300 }}
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

          {/* --- 現場 HMI 報工終端 Modal --- */}
          <Modal
            title={
              <div className='flex items-center gap-3 text-slate-800 border-b border-slate-100 pb-4'>
                <div className='bg-blue-600 p-2 rounded-xl shadow-md shadow-blue-200'>
                  <ClipboardEdit size={24} className='text-white' />
                </div>
                <div className='flex flex-col'>
                  <span className='font-black text-xl tracking-tight'>
                    現場作業報工 (Shop Floor Data Collection)
                  </span>
                  <span className='text-xs font-mono text-slate-400'>
                    {reportingTask?.woId} | {reportingTask?.routingStep}
                  </span>
                </div>
              </div>
            }
            open={isReportModalVisible}
            onCancel={() => setIsReportModalVisible(false)}
            footer={null} // 隱藏預設 Footer，改用自訂大型按鈕
            className='custom-hmi-modal'
            width={720}
          >
            <div className='mt-4 mb-2 flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100'>
              <div className='flex flex-col'>
                <span className='text-xs font-bold text-slate-400 mb-1'>
                  目標產出
                </span>
                <span className='text-3xl font-black text-slate-800 tracking-tighter'>
                  {reportingTask?.targetQty}{' '}
                  <span className='text-sm font-bold text-slate-400 ml-1'>
                    PCS
                  </span>
                </span>
              </div>
              <Divider type='vertical' className='h-12 border-slate-200' />
              <div className='flex flex-col items-center'>
                <span className='text-xs font-bold text-emerald-600 mb-1'>
                  已報良品
                </span>
                <span className='text-3xl font-black text-emerald-600 tracking-tighter'>
                  {reportingTask?.goodQty}
                </span>
              </div>
              <Divider type='vertical' className='h-12 border-slate-200' />
              <div className='flex flex-col items-end'>
                <span className='text-xs font-bold text-rose-500 mb-1'>
                  已報不良
                </span>
                <span className='text-3xl font-black text-rose-500 tracking-tighter'>
                  {reportingTask?.scrapQty}
                </span>
              </div>
            </div>

            <Form form={reportForm} layout='vertical' className='mt-6'>
              <div className='grid grid-cols-2 gap-8'>
                {/* 良品輸入區 */}
                <div className='flex flex-col p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100'>
                  <div className='flex items-center gap-2 mb-4'>
                    <CheckCircle2 size={18} className='text-emerald-500' />
                    <span className='font-bold text-emerald-700 text-sm'>
                      本次產出良品 (Good Qty)
                    </span>
                  </div>

                  <Form.Item
                    name='addGoodQty'
                    className='mb-4'
                    initialValue={0}
                  >
                    <InputNumber
                      min={0}
                      className='w-full h-16 text-center text-3xl font-black rounded-xl border-emerald-200 custom-hmi-input'
                      controls={false}
                    />
                  </Form.Item>

                  <div className='grid grid-cols-3 gap-2'>
                    <Button
                      onClick={() => incrementQty('addGoodQty', 1)}
                      className='h-12 rounded-lg font-black text-lg text-emerald-600 bg-white border-emerald-200 hover:border-emerald-400 hover:text-emerald-700'
                    >
                      +1
                    </Button>
                    <Button
                      onClick={() => incrementQty('addGoodQty', 10)}
                      className='h-12 rounded-lg font-black text-lg text-emerald-600 bg-white border-emerald-200 hover:border-emerald-400 hover:text-emerald-700'
                    >
                      +10
                    </Button>
                    <Button
                      onClick={() => incrementQty('addGoodQty', 50)}
                      className='h-12 rounded-lg font-black text-lg text-emerald-600 bg-white border-emerald-200 hover:border-emerald-400 hover:text-emerald-700'
                    >
                      +50
                    </Button>
                  </div>
                </div>

                {/* 不良品輸入區 */}
                <div className='flex flex-col p-5 bg-rose-50/50 rounded-2xl border border-rose-100'>
                  <div className='flex items-center gap-2 mb-4'>
                    <AlertTriangle size={18} className='text-rose-500' />
                    <span className='font-bold text-rose-700 text-sm'>
                      本次不良品 (Scrap Qty)
                    </span>
                  </div>

                  <Form.Item
                    name='addScrapQty'
                    className='mb-4'
                    initialValue={0}
                  >
                    <InputNumber
                      min={0}
                      className='w-full h-16 text-center text-3xl font-black rounded-xl border-rose-200 custom-hmi-input text-rose-500'
                      controls={false}
                    />
                  </Form.Item>

                  <div className='grid grid-cols-3 gap-2 mb-4'>
                    <Button
                      onClick={() => incrementQty('addScrapQty', 1)}
                      className='h-12 rounded-lg font-black text-lg text-rose-500 bg-white border-rose-200 hover:border-rose-400 hover:text-rose-600'
                    >
                      +1
                    </Button>
                    <Button
                      onClick={() => incrementQty('addScrapQty', 5)}
                      className='h-12 rounded-lg font-black text-lg text-rose-500 bg-white border-rose-200 hover:border-rose-400 hover:text-rose-600'
                    >
                      +5
                    </Button>
                    <Button
                      onClick={() =>
                        reportForm.setFieldsValue({ addScrapQty: 0 })
                      }
                      className='h-12 rounded-lg font-bold text-sm text-slate-400 bg-slate-100 border-none hover:bg-slate-200 hover:text-slate-600'
                    >
                      歸零
                    </Button>
                  </div>

                  <Form.Item name='scrapReason' className='mb-0'>
                    <Select
                      placeholder='選擇不良原因'
                      className='h-10 rounded-lg custom-hmi-select'
                      allowClear
                    >
                      <Select.Option value='R01'>
                        材料不良 (Material Defect)
                      </Select.Option>
                      <Select.Option value='R02'>
                        機台偏差 (Machine Error)
                      </Select.Option>
                      <Select.Option value='R03'>
                        人為操作 (Operator Error)
                      </Select.Option>
                      <Select.Option value='R04'>
                        外觀刮傷 (Scratch)
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </div>
              </div>

              {/* 大型提交按鈕 */}
              <div className='mt-8 flex gap-4'>
                <Button
                  size='large'
                  className='flex-1 h-14 rounded-xl font-bold text-slate-500 bg-slate-100 border-none hover:bg-slate-200 text-base'
                  onClick={() => setIsReportModalVisible(false)}
                >
                  取消返回
                </Button>
                <Button
                  type='primary'
                  size='large'
                  className='flex-[2] h-14 rounded-xl font-black text-lg bg-blue-600 hover:bg-blue-500 border-none shadow-lg shadow-blue-200 flex items-center justify-center gap-2'
                  onClick={handleSaveReport}
                >
                  <ClipboardEdit size={20} /> 確認提交報工數據
                </Button>
              </div>
            </Form>
          </Modal>

          {/* --- 新增任務 Modal --- */}
          <Modal
            title={
              <div className='flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3'>
                <div className='bg-blue-100 p-1.5 rounded-lg'>
                  <Plus size={18} className='text-blue-600' />
                </div>
                <span className='font-black text-lg tracking-tight'>
                  新增生產派工任務
                </span>
              </div>
            }
            open={isAddModalVisible}
            onOk={handleAddTask}
            onCancel={() => {
              setIsAddModalVisible(false)
              addForm.resetFields()
            }}
            okText='新增任務'
            cancelText='取消'
            okButtonProps={{
              className:
                'bg-blue-600 hover:bg-blue-500 border-none shadow-md shadow-blue-200 rounded-xl font-bold h-10 px-6'
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
                  name='woId'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      工單號碼 (WO ID)
                    </span>
                  }
                  rules={[{ required: true, message: '請輸入工單號碼' }]}
                >
                  <Input
                    className='h-10 rounded-xl border-slate-200 font-mono text-xs'
                    placeholder='例如: WO-26X1234'
                  />
                </Form.Item>
                <Form.Item
                  name='partNumber'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      生產料號 (Part Number)
                    </span>
                  }
                  rules={[{ required: true, message: '請輸入料號' }]}
                >
                  <Input
                    className='h-10 rounded-xl border-slate-200 font-mono text-xs'
                    placeholder='例如: PN-9876'
                  />
                </Form.Item>
                <Form.Item
                  name='routingStep'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      生產工序 (Routing Step)
                    </span>
                  }
                  rules={[{ required: true, message: '請選擇工序' }]}
                >
                  <Select
                    className='h-10 rounded-xl text-xs'
                    placeholder='選擇工序'
                  >
                    <Select.Option value='0010 - 備料與前置'>
                      0010 - 備料與前置
                    </Select.Option>
                    <Select.Option value='0020 - SMT 表面黏著'>
                      0020 - SMT 表面黏著
                    </Select.Option>
                    <Select.Option value='0030 - CNC 切削成型'>
                      0030 - CNC 切削成型
                    </Select.Option>
                    <Select.Option value='0040 - 模組總裝'>
                      0040 - 模組總裝
                    </Select.Option>
                    <Select.Option value='0050 - 品管測試 (FCT)'>
                      0050 - 品管測試 (FCT)
                    </Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  name='workCenter'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      指定機台 / 工作中心
                    </span>
                  }
                  rules={[{ required: true, message: '請選擇機台' }]}
                >
                  <Select
                    className='h-10 rounded-xl text-xs'
                    placeholder='選擇機台'
                  >
                    <Select.Option value='SMT-LINE-01'>
                      SMT-LINE-01
                    </Select.Option>
                    <Select.Option value='DIP-LINE-02'>
                      DIP-LINE-02
                    </Select.Option>
                    <Select.Option value='CNC-MC-12'>CNC-MC-12</Select.Option>
                    <Select.Option value='ASSY-LINE-A'>
                      ASSY-LINE-A
                    </Select.Option>
                    <Select.Option value='TEST-ST-05'>TEST-ST-05</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  name='targetQty'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      目標數量 (Target Qty)
                    </span>
                  }
                  rules={[{ required: true, message: '請輸入目標數量' }]}
                >
                  <InputNumber
                    min={1}
                    className='w-full h-10 rounded-xl border-slate-200 flex items-center font-mono text-xs'
                    placeholder='例如: 500'
                  />
                </Form.Item>
              </div>
            </Form>
          </Modal>

          <style>{`
            /* 自定義 HMI 報工終端 Modal 樣式 */
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
            /* 讓 InputNumber 文字置中變大 */
            .custom-hmi-input .ant-input-number-input {
              text-align: center;
              font-size: 2rem;
              font-weight: 900;
              height: 100%;
            }
            .custom-hmi-select .ant-select-selector {
              border-radius: 8px !important;
            }

            /* 呼吸燈動畫 */
            .animate-pulse-slow {
              animation: pulseSlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            @keyframes pulseSlow {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.8; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
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
