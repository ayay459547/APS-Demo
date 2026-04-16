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
  Radio,
  Divider
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { InputRef } from 'antd'
import {
  Search,
  ChevronDown,
  RefreshCw,
  Info,
  Factory,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Plus,
  FileSearch,
  Microscope,
  ClipboardList,
  CheckSquare,
  Play,
  UserCircle2,
  ListTodo,
  FileCheck,
  Ban
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
export type InspType = '首件檢驗 (FAI)' | '巡迴檢驗 (IPQC)' | '末件檢驗 (LAI)'
export type InspStatus = '待檢驗' | '檢驗中' | '合格' | '不合格'

export interface InspectionTask {
  id: string
  woId: string
  partNumber: string
  workCenter: string
  type: InspType
  status: InspStatus
  inspector: string
  requestTime: string
  finishTime: string | null
  failReason?: string
}

// --- 擬真數據產生器 ---
const generateInspections = (count: number): InspectionTask[] => {
  const types: InspType[] = [
    '首件檢驗 (FAI)',
    '首件檢驗 (FAI)',
    '巡迴檢驗 (IPQC)',
    '巡迴檢驗 (IPQC)',
    '末件檢驗 (LAI)'
  ]
  const statuses: InspStatus[] = [
    '待檢驗',
    '檢驗中',
    '合格',
    '合格',
    '合格',
    '不合格'
  ]
  const workCenters = [
    'SMT-LINE-01',
    'DIP-LINE-02',
    'CNC-MC-12',
    'ASSY-LINE-A',
    'TEST-ST-05'
  ]
  const inspectors = ['品管-李依婷', '品管-吳建豪', '未指派', '品管-陳經理']

  return Array.from({ length: count }).map((_, idx) => {
    const type = types[Math.floor(Math.random() * types.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const requestTime = dayjs()
      .subtract(Math.floor(Math.random() * 240), 'minute')
      .format('YYYY-MM-DD HH:mm')

    let finishTime = null
    let failReason = undefined
    let inspector =
      inspectors[Math.floor(Math.random() * (inspectors.length - 1))]

    if (status === '待檢驗') {
      inspector = '未指派'
    } else if (status === '檢驗中') {
      // 保留 requestTime
    } else {
      finishTime = dayjs(requestTime)
        .add(Math.floor(Math.random() * 30) + 5, 'minute')
        .format('YYYY-MM-DD HH:mm')
      if (status === '不合格') {
        failReason = '尺寸超差 / 焊點空焊'
      }
    }

    return {
      id: `QA-${dayjs().format('MMDD')}-${String(idx + 1).padStart(4, '0')}`,
      woId: `WO-26X${String(Math.floor(Math.random() * 9000) + 1000)}`,
      partNumber: `PN-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      workCenter: workCenters[Math.floor(Math.random() * workCenters.length)],
      type,
      status,
      inspector,
      requestTime,
      finishTime,
      failReason
    }
  })
}

const mockInspectionData: InspectionTask[] = generateInspections(80)

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
export default function QualityInspection() {
  const [loading, setLoading] = useState<boolean>(true)
  const [tasks, setTasks] = useState<InspectionTask[]>(mockInspectionData)

  // HMI Modal 狀態
  const [isHmiModalVisible, setIsHmiModalVisible] = useState(false)
  const [activeTask, setActiveTask] = useState<InspectionTask | null>(null)
  const [qaForm] = Form.useForm()

  // 新增檢驗請求 Modal 狀態
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [addForm] = Form.useForm()

  // 查看檢驗紀錄 Modal 狀態
  const [isRecordModalVisible, setIsRecordModalVisible] = useState(false)

  const searchInputRef = useRef<InputRef>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(() => {
    const pending = tasks.filter(d => d.status === '待檢驗').length
    const inspecting = tasks.filter(d => d.status === '檢驗中').length
    const faiTasks = tasks.filter(
      d =>
        d.type === '首件檢驗 (FAI)' &&
        (d.status === '合格' || d.status === '不合格')
    )
    const faiPassed = faiTasks.filter(d => d.status === '合格').length
    const faiPassRate =
      faiTasks.length > 0
        ? ((faiPassed / faiTasks.length) * 100).toFixed(1)
        : '100.0'
    const totalFailed = tasks.filter(d => d.status === '不合格').length

    return { pending, inspecting, faiPassRate, totalFailed }
  }, [tasks])

  // --- 操作處理函式 ---
  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success({
        content: '品質檢驗清單已更新！',
        className: 'custom-message'
      })
    }, 600)
  }

  const openHmiModal = (task: InspectionTask) => {
    setActiveTask(task)
    if (task.status === '待檢驗') {
      // 自動轉為檢驗中
      setTasks(prev =>
        prev.map(t =>
          t.id === task.id
            ? { ...t, status: '檢驗中', inspector: '當前 QA 人員' }
            : t
        )
      )
      task.status = '檢驗中'
    }
    qaForm.resetFields()
    // 預設全勾選合格 (加速 HMI 操作)
    qaForm.setFieldsValue({
      item1: 'pass',
      item2: 'pass',
      item3: 'pass',
      result: 'pass'
    })
    setIsHmiModalVisible(true)
  }

  const handleSaveInspection = async () => {
    try {
      const values = await qaForm.validateFields()
      const isFail = values.result === 'fail'

      if (isFail && !values.failReason) {
        message.warning({
          content: '判定為不合格時，請填寫異常原因！',
          className: 'custom-message'
        })
        return
      }

      setTasks(prev =>
        prev.map(t => {
          if (t.id === activeTask?.id) {
            return {
              ...t,
              status: isFail ? '不合格' : '合格',
              finishTime: dayjs().format('YYYY-MM-DD HH:mm'),
              failReason: isFail ? values.failReason : undefined
            }
          }
          return t
        })
      )

      setIsHmiModalVisible(false)
      if (isFail) {
        message.error({
          content: `檢驗不合格！已通報現場主管與生管。`,
          className: 'custom-message'
        })
      } else {
        message.success({
          content: `檢驗合格！該機台可繼續生產。`,
          className: 'custom-message'
        })
      }
    } catch (error) {
      console.log('Validation Failed:', error)
    }
  }

  const handleAddRequest = async () => {
    try {
      const values = await addForm.validateFields()
      const newTask: InspectionTask = {
        id: `QA-${dayjs().format('MMDD')}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        woId: values.woId,
        partNumber: values.partNumber,
        workCenter: values.workCenter,
        type: values.type,
        status: '待檢驗',
        inspector: '未指派',
        requestTime: dayjs().format('YYYY-MM-DD HH:mm'),
        finishTime: null
      }
      setTasks([newTask, ...tasks])
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success({
        content: '已成功送出檢驗申請！',
        className: 'custom-message'
      })
    } catch (error) {
      console.log('Validation Failed:', error)
    }
  }

  // --- 搜尋過濾邏輯 ---
  const getSearchProps = (dataIndex: keyof InspectionTask, title: string) => ({
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
            className='text-[10px] font-bold px-4 text-white border-none bg-indigo-600 rounded-lg'
          >
            篩選
          </Button>
        </div>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <Search
        size={14}
        className={filtered ? 'text-indigo-500' : 'text-slate-300'}
      />
    ),
    onFilter: (value: any, record: InspectionTask): boolean => {
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
        <Microscope size={16} className='text-indigo-600' />
        <span className='font-bold text-slate-800'>
          現場品質檢驗看板 (QA KPI)
        </span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='首件一次通過率 (FPY)'
          value={stats.faiPassRate}
          unit='%'
          icon={ShieldCheck}
          colorClass='text-emerald-600'
          bgClass='bg-emerald-50'
          iconColorClass='text-emerald-500'
          trend='目標: > 98.0%'
        />
        <StatCard
          title='待檢驗任務'
          value={stats.pending}
          unit='站'
          icon={Clock}
          colorClass='text-amber-600'
          bgClass='bg-amber-50'
          iconColorClass='text-amber-500'
          isAlert={stats.pending > 10}
          trend='可能造成機台停等'
        />
        <StatCard
          title='檢驗執行中'
          value={stats.inspecting}
          unit='站'
          icon={FileSearch}
          colorClass='text-blue-600'
          bgClass='bg-blue-50'
          iconColorClass='text-blue-500'
        />
        <StatCard
          title='今日判退不合格'
          value={stats.totalFailed}
          unit='次'
          icon={AlertTriangle}
          colorClass='text-rose-600'
          bgClass='bg-rose-100/80'
          iconColorClass='text-rose-500'
          isAlert={stats.totalFailed > 0}
          trend='需填寫異常改善單'
        />
      </div>
    </div>
  )

  // --- 表格欄位定義 ---
  const columns: ColumnsType<InspectionTask> = [
    {
      title: '檢驗單號 / 類型',
      key: 'idAndType',
      width: 220,
      fixed: 'left',
      sorter: (a, b) => a.id.localeCompare(b.id),
      ...getSearchProps('id', '單號'),
      render: (_, record) => {
        let typeColor = 'bg-slate-100 text-slate-600 border-slate-200'
        if (record.type === '首件檢驗 (FAI)')
          typeColor = 'bg-purple-50 text-purple-700 border-purple-200'
        if (record.type === '巡迴檢驗 (IPQC)')
          typeColor = 'bg-cyan-50 text-cyan-700 border-cyan-200'
        if (record.type === '末件檢驗 (LAI)')
          typeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200'

        return (
          <div className='flex flex-col gap-1.5'>
            <span className='font-mono font-black text-slate-700 text-[14px]'>
              {record.id}
            </span>
            <Tag
              className={cn(
                'm-0 border font-bold text-[10px] w-fit',
                typeColor
              )}
            >
              {record.type}
            </Tag>
          </div>
        )
      }
    },
    {
      title: '工單號碼 / 料號',
      key: 'woInfo',
      width: 200,
      ...getSearchProps('woId', '工單號'),
      render: (_, record) => (
        <div className='flex flex-col gap-1'>
          <span className='font-mono font-bold text-blue-700 text-xs'>
            {record.woId}
          </span>
          <span className='font-mono text-[11px] text-slate-500'>
            {record.partNumber}
          </span>
        </div>
      )
    },
    {
      title: '機台 / 檢驗員',
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
              record.inspector === '未指派' ? 'text-rose-500' : 'text-slate-500'
            )}
          >
            <UserCircle2 size={12} /> {record.inspector}
          </div>
        </div>
      )
    },
    {
      title: '檢驗狀態',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      sorter: (a, b) => a.status.localeCompare(b.status),
      filters: [
        { text: '待檢驗', value: '待檢驗' },
        { text: '檢驗中', value: '檢驗中' },
        { text: '合格', value: '合格' },
        { text: '不合格', value: '不合格' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: InspStatus, record) => {
        let colorClass = ''
        let bgClass = ''
        let Icon = Clock

        switch (status) {
          case '待檢驗':
            colorClass = 'text-amber-600'
            bgClass = 'bg-amber-50 border-amber-200'
            Icon = Clock
            break
          case '檢驗中':
            colorClass = 'text-blue-600'
            bgClass = 'bg-blue-50 border-blue-200 shadow-sm shadow-blue-100'
            Icon = FileSearch
            break
          case '合格':
            colorClass = 'text-emerald-600'
            bgClass = 'bg-emerald-50 border-emerald-200'
            Icon = CheckCircle2
            break
          case '不合格':
            colorClass = 'text-rose-600'
            bgClass = 'bg-rose-50 border-rose-200'
            Icon = AlertTriangle
            break
        }

        return (
          <div className='flex flex-col gap-1'>
            <div
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border w-fit',
                bgClass,
                colorClass
              )}
            >
              <Icon
                size={12}
                className={status === '檢驗中' ? 'animate-pulse' : ''}
              />
              {status}
            </div>
            {status === '不合格' && record.failReason && (
              <span
                className='text-[10px] text-rose-500 font-bold truncate max-w-[120px]'
                title={record.failReason}
              >
                {record.failReason}
              </span>
            )}
          </div>
        )
      }
    },
    {
      title: '申請 / 完成時間',
      key: 'times',
      width: 160,
      render: (_, record) => (
        <div className='flex flex-col gap-1.5'>
          <div
            className='flex items-center gap-1.5 text-[11px] font-mono text-slate-500'
            title='申請時間'
          >
            <Plus size={10} className='text-blue-400' /> {record.requestTime}
          </div>
          <div
            className='flex items-center gap-1.5 text-[11px] font-mono text-slate-500'
            title='完成時間'
          >
            <CheckSquare
              size={10}
              className={
                record.finishTime ? 'text-emerald-500' : 'text-slate-300'
              }
            />{' '}
            {record.finishTime || '尚未完成'}
          </div>
        </div>
      )
    },
    {
      title: '品管操作 (HMI)',
      key: 'action',
      width: 120,
      fixed: 'right',
      align: 'center',
      render: (_, record) => {
        const isDone = record.status === '合格' || record.status === '不合格'
        const isPending = record.status === '待檢驗'

        if (isDone) {
          return (
            <Tooltip title='查看檢驗紀錄'>
              <Button
                size='small'
                type='text'
                className='text-slate-400 hover:text-indigo-600 rounded-md flex items-center justify-center w-8 h-8 p-0 mx-auto'
                onClick={() => {
                  setActiveTask(record)
                  setIsRecordModalVisible(true)
                }}
              >
                <ClipboardList size={16} />
              </Button>
            </Tooltip>
          )
        }

        return (
          <Tooltip title={isPending ? '接單並檢驗' : '繼續檢驗'}>
            <Button
              type='primary'
              size='small'
              className='bg-indigo-600 hover:bg-indigo-500 border-none rounded-md shadow-sm shadow-indigo-200 flex items-center justify-center w-8 h-8 p-0 mx-auto animate-pulse-slow'
              onClick={() => openHmiModal(record)}
            >
              {isPending ? (
                <Play size={14} className='fill-white ml-0.5' />
              ) : (
                <Microscope size={16} />
              )}
            </Button>
          </Tooltip>
        )
      }
    }
  ]

  const [randomPass] = useState(() => Math.random() > 0.5)

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#4f46e5', borderRadius: 12, borderRadiusSM: 6 } // Indigo 600 base
      }}
    >
      <div className='w-full min-h-screen bg-[#f8fafc] p-4 font-sans'>
        <div className='mx-auto px-2 pt-2 pb-8 space-y-6 animate-fade-in relative max-w-[1600px]'>
          {loading && (
            <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-[110] flex items-center justify-center rounded-[28px] mt-[60px]'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin' />
                <span className='text-xs font-black text-indigo-600 tracking-widest uppercase'>
                  Loading QA Data...
                </span>
              </div>
            </div>
          )}

          {/* 玻璃透視頂部導航列 */}
          <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/50 py-2 rounded-xl sticky top-0 z-20 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='bg-indigo-600 p-1.5 rounded-lg shadow-indigo-200 shadow-lg'>
                <Microscope size={18} className='text-white' />
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
                      品質檢驗概覽
                    </span>
                    <div className='flex gap-1'>
                      <Badge
                        count={stats.pending}
                        style={{
                          backgroundColor: '#f59e0b',
                          fontSize: '10px',
                          boxShadow: 'none'
                        }}
                      />
                      {stats.totalFailed > 0 && (
                        <Badge
                          count='不合格預警'
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
                      className='text-slate-400 group-hover:text-indigo-600'
                    />
                  </div>
                </Popover>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Tooltip title='重新整理檢驗數據'>
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
                className='rounded-xl bg-indigo-600 shadow-md shadow-indigo-200 font-bold border-none h-10 flex items-center justify-center hover:bg-indigo-500'
                onClick={() => setIsAddModalVisible(true)}
              >
                <span className='hidden sm:inline ml-1 text-xs'>申請檢驗</span>
              </Button>
            </div>
          </div>

          <Card
            className='shadow-xl shadow-slate-200/50 border-none rounded-[32px] overflow-hidden bg-white'
            styles={{ body: { padding: 0 } }}
          >
            <div className='bg-slate-50/50 p-5 border-b border-slate-100 flex items-center justify-between'>
              <div className='flex items-center gap-3 text-slate-500 text-[11px] font-black uppercase tracking-widest'>
                <ListTodo size={14} />
                現場品質檢驗任務清單 (QA Inspection List)
              </div>
              <div className='flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm'>
                <Info size={14} className='text-indigo-500' />
                <span className='text-[10px] text-slate-400 font-bold uppercase tracking-tight'>
                  提示：首件檢驗 (FAI) 通過前，該機台之工單無法進行常規報工。
                </span>
              </div>
            </div>

            <div className='p-4 pt-0'>
              <Table<InspectionTask>
                columns={columns}
                dataSource={tasks}
                loading={false}
                scroll={{ x: 1100 }}
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

          {/* --- 查看檢驗紀錄 Modal --- */}
          <Modal
            title={
              <div className='flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3'>
                <div className='bg-slate-100 p-1.5 rounded-lg'>
                  <ClipboardList size={18} className='text-slate-600' />
                </div>
                <span className='font-black text-lg tracking-tight'>
                  品質檢驗紀錄單 (Inspection Record)
                </span>
              </div>
            }
            open={isRecordModalVisible}
            footer={null}
            onCancel={() => setIsRecordModalVisible(false)}
            className='custom-edit-modal top-10'
            width={640}
            closeIcon={
              <XCircle
                size={20}
                className='text-slate-400 hover:text-slate-600 absolute top-6 right-6 z-10'
              />
            }
          >
            <div className='mt-2 flex flex-col gap-6'>
              {/* Summary Header */}
              <div className='flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100'>
                <div className='flex flex-col gap-1'>
                  <span className='text-[10px] font-bold text-slate-400'>
                    檢驗單號
                  </span>
                  <span className='text-sm font-black text-slate-700 font-mono'>
                    {activeTask?.id}
                  </span>
                </div>
                <div className='flex flex-col gap-1'>
                  <span className='text-[10px] font-bold text-slate-400'>
                    檢驗類型
                  </span>
                  <Tag className='m-0 border-indigo-200 bg-indigo-50 text-indigo-700 font-bold text-[10px] px-2'>
                    {activeTask?.type}
                  </Tag>
                </div>
                <div className='flex flex-col gap-1 items-end'>
                  <span className='text-[10px] font-bold text-slate-400'>
                    最終判定
                  </span>
                  {activeTask?.status === '合格' ? (
                    <span className='text-base font-black text-emerald-600 flex items-center gap-1.5'>
                      <CheckCircle2 size={16} /> 合格 Pass
                    </span>
                  ) : (
                    <span className='text-base font-black text-rose-600 flex items-center gap-1.5'>
                      <AlertTriangle size={16} /> 不合格 Fail
                    </span>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className='grid grid-cols-2 gap-4 px-2'>
                <div className='flex flex-col border-b border-slate-100 pb-2'>
                  <span className='text-[10px] font-bold text-slate-400 mb-1'>
                    受檢機台
                  </span>
                  <span className='text-sm font-bold text-slate-700 flex items-center gap-1.5'>
                    <Factory size={14} className='text-slate-400' />{' '}
                    {activeTask?.workCenter}
                  </span>
                </div>
                <div className='flex flex-col border-b border-slate-100 pb-2'>
                  <span className='text-[10px] font-bold text-slate-400 mb-1'>
                    工單料號
                  </span>
                  <span className='text-sm font-bold text-blue-700 font-mono'>
                    {activeTask?.woId}
                  </span>
                </div>
                <div className='flex flex-col border-b border-slate-100 pb-2'>
                  <span className='text-[10px] font-bold text-slate-400 mb-1'>
                    負責檢驗員
                  </span>
                  <span className='text-sm font-bold text-slate-700 flex items-center gap-1.5'>
                    <UserCircle2 size={14} className='text-slate-400' />{' '}
                    {activeTask?.inspector}
                  </span>
                </div>
                <div className='flex flex-col border-b border-slate-100 pb-2'>
                  <span className='text-[10px] font-bold text-slate-400 mb-1'>
                    完成時間
                  </span>
                  <span className='text-sm font-bold text-slate-700 flex items-center gap-1.5 font-mono'>
                    <Clock size={14} className='text-slate-400' />{' '}
                    {activeTask?.finishTime}
                  </span>
                </div>
              </div>

              {/* Checklist Results */}
              <div>
                <div className='flex items-center gap-2 mb-3 px-2'>
                  <FileCheck size={16} className='text-indigo-500' />
                  <h4 className='text-sm font-black text-slate-700 m-0'>
                    檢驗項目明細 (Checklist Result)
                  </h4>
                </div>

                <div className='flex flex-col gap-3'>
                  <div className='flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm'>
                    <span className='text-sm font-bold text-slate-700'>
                      1. 外觀檢驗 (Appearance)
                    </span>
                    {activeTask?.status === '合格' ? (
                      <Tag className='m-0 border-emerald-200 bg-emerald-50 text-emerald-600 font-bold px-3 py-1 rounded-lg flex items-center gap-1'>
                        <CheckCircle2 size={14} className='inline' /> PASS
                      </Tag>
                    ) : (
                      <Tag className='m-0 border-rose-200 bg-rose-50 text-rose-600 font-bold px-3 py-1 rounded-lg flex items-center gap-1'>
                        <XCircle size={14} className='inline' /> FAIL
                      </Tag>
                    )}
                  </div>

                  <div className='flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm'>
                    <span className='text-sm font-bold text-slate-700'>
                      2. 尺寸量測 (Dimensions)
                    </span>
                    {activeTask?.status === '合格' || randomPass ? (
                      <Tag className='m-0 border-emerald-200 bg-emerald-50 text-emerald-600 font-bold px-3 py-1 rounded-lg flex items-center gap-1'>
                        <CheckCircle2 size={14} className='inline' /> PASS
                      </Tag>
                    ) : (
                      <Tag className='m-0 border-rose-200 bg-rose-50 text-rose-600 font-bold px-3 py-1 rounded-lg flex items-center gap-1'>
                        <XCircle size={14} className='inline' /> FAIL
                      </Tag>
                    )}
                  </div>

                  <div className='flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm'>
                    <span className='text-sm font-bold text-slate-700'>
                      3. 功能測試 (Functional)
                    </span>
                    {activeTask?.status === '合格' ? (
                      <Tag className='m-0 border-emerald-200 bg-emerald-50 text-emerald-600 font-bold px-3 py-1 rounded-lg flex items-center gap-1'>
                        <CheckCircle2 size={14} className='inline' /> PASS
                      </Tag>
                    ) : (
                      <Tag className='m-0 border-rose-200 bg-rose-50 text-rose-600 font-bold px-3 py-1 rounded-lg flex items-center gap-1'>
                        <XCircle size={14} className='inline' /> FAIL
                      </Tag>
                    )}
                  </div>
                </div>
              </div>

              {/* Fail Reason (If applicable) */}
              {activeTask?.status === '不合格' && activeTask.failReason && (
                <div className='bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 mt-2'>
                  <Ban size={20} className='text-rose-500 shrink-0 mt-0.5' />
                  <div className='flex flex-col'>
                    <span className='text-xs font-bold text-rose-700 mb-1'>
                      判定不合格原因 / 備註
                    </span>
                    <span className='text-sm font-medium text-rose-600'>
                      {activeTask.failReason}
                    </span>
                  </div>
                </div>
              )}

              <div className='mt-4 flex justify-end'>
                <Button
                  size='large'
                  className='h-12 rounded-xl font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 px-8'
                  onClick={() => setIsRecordModalVisible(false)}
                >
                  關閉
                </Button>
              </div>
            </div>
          </Modal>

          {/* --- 品管 HMI 檢驗終端 Modal --- */}
          <Modal
            title={null}
            open={isHmiModalVisible}
            onCancel={() => setIsHmiModalVisible(false)}
            footer={null}
            className='custom-hmi-modal top-6'
            width={800}
            closeIcon={
              <XCircle
                size={24}
                className='text-slate-300 hover:text-slate-500 absolute top-6 right-6 z-10'
              />
            }
          >
            <div className='flex items-center gap-3 text-slate-800 border-b border-slate-100 pb-4 mb-4'>
              <div className='bg-indigo-600 p-2.5 rounded-xl shadow-md shadow-indigo-200'>
                <Microscope size={24} className='text-white' />
              </div>
              <div className='flex flex-col'>
                <span className='font-black text-xl tracking-tight'>
                  品管檢驗終端 (QA Terminal)
                </span>
                <div className='flex items-center gap-2'>
                  <span className='text-xs font-mono text-indigo-500 font-bold'>
                    {activeTask?.id}
                  </span>
                  <span className='text-[10px] text-slate-400'>|</span>
                  <span className='text-xs font-bold text-slate-500'>
                    {activeTask?.type}
                  </span>
                </div>
              </div>
            </div>

            {/* 工單資訊面板 */}
            <div className='bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-3 gap-4 mb-6'>
              <div className='flex flex-col border-r border-slate-200'>
                <span className='text-[10px] font-bold text-slate-400 mb-1'>
                  受檢機台 / 線體
                </span>
                <span className='text-sm font-black text-slate-800 tracking-tight'>
                  {activeTask?.workCenter}
                </span>
              </div>
              <div className='flex flex-col border-r border-slate-200 pl-2'>
                <span className='text-[10px] font-bold text-slate-400 mb-1'>
                  生產工單號碼
                </span>
                <span className='text-sm font-black text-blue-700 font-mono tracking-tight'>
                  {activeTask?.woId}
                </span>
              </div>
              <div className='flex flex-col pl-2'>
                <span className='text-[10px] font-bold text-slate-400 mb-1'>
                  檢驗依據 (SOP)
                </span>
                <span className='text-xs font-bold text-indigo-600 underline cursor-pointer'>
                  檢視標準作業書 PDF
                </span>
              </div>
            </div>

            <Form form={qaForm} layout='vertical'>
              <div className='space-y-4 mb-6'>
                <div className='bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between'>
                  <div className='flex flex-col'>
                    <span className='font-bold text-slate-700 text-sm'>
                      1. 外觀檢驗 (Appearance)
                    </span>
                    <span className='text-xs text-slate-400'>
                      無刮傷、變形、髒污或氧化現象
                    </span>
                  </div>
                  <Form.Item name='item1' className='mb-0'>
                    <Radio.Group
                      optionType='button'
                      buttonStyle='solid'
                      className='custom-hmi-radio !flex gap-2'
                    >
                      <Radio
                        value='pass'
                        className='w-24 text-center font-bold'
                      >
                        合格
                      </Radio>
                      <Radio
                        value='fail'
                        className='w-24 text-center font-bold'
                      >
                        不合格
                      </Radio>
                    </Radio.Group>
                  </Form.Item>
                </div>

                <div className='bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between'>
                  <div className='flex flex-col'>
                    <span className='font-bold text-slate-700 text-sm'>
                      2. 尺寸量測 (Dimensions)
                    </span>
                    <span className='text-xs text-slate-400'>
                      關鍵尺寸落於公差範圍內 (±0.05mm)
                    </span>
                  </div>
                  <Form.Item name='item2' className='!mb-0'>
                    <Radio.Group
                      optionType='button'
                      buttonStyle='solid'
                      className='custom-hmi-radio !flex gap-2'
                    >
                      <Radio
                        value='pass'
                        className='w-24 text-center font-bold'
                      >
                        合格
                      </Radio>
                      <Radio
                        value='fail'
                        className='w-24 text-center font-bold'
                      >
                        不合格
                      </Radio>
                    </Radio.Group>
                  </Form.Item>
                </div>

                <div className='bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between'>
                  <div className='flex flex-col'>
                    <span className='font-bold text-slate-700 text-sm'>
                      3. 功能測試 (Functional)
                    </span>
                    <span className='text-xs text-slate-400'>
                      通電測試正常，指示燈號與訊號正確
                    </span>
                  </div>
                  <Form.Item name='item3' className='!mb-0'>
                    <Radio.Group
                      optionType='button'
                      buttonStyle='solid'
                      className='custom-hmi-radio !flex gap-2'
                    >
                      <Radio
                        value='pass'
                        className='w-24 text-center font-bold'
                      >
                        合格
                      </Radio>
                      <Radio
                        value='fail'
                        className='w-24 text-center font-bold'
                      >
                        不合格
                      </Radio>
                    </Radio.Group>
                  </Form.Item>
                </div>
              </div>

              <Divider className='my-4 border-slate-200' />

              <div className='bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-4'>
                <div className='flex items-center justify-between'>
                  <span className='font-black text-slate-800 text-lg'>
                    最終檢驗判定 (Final Result)
                  </span>
                  <Form.Item name='result' className='!mb-0'>
                    <Radio.Group
                      optionType='button'
                      buttonStyle='solid'
                      className='custom-hmi-radio-large !flex gap-2'
                    >
                      <Radio
                        value='pass'
                        className='!w-32 !h-12 text-center font-black text-lg'
                      >
                        合格 Pass
                      </Radio>
                      <Radio
                        value='fail'
                        className='!w-32 !h-12 text-center font-black text-lg'
                      >
                        退件 Fail
                      </Radio>
                    </Radio.Group>
                  </Form.Item>
                </div>

                {/* 使用 Form.Item 的 dependencies 動態顯示退件原因 */}
                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) =>
                    prevValues.result !== currentValues.result
                  }
                >
                  {({ getFieldValue }) =>
                    getFieldValue('result') === 'fail' ? (
                      <Form.Item name='failReason' className='mb-0 mt-2'>
                        <Input.TextArea
                          rows={2}
                          placeholder='請詳述不合格原因，或輸入量測超差數據...'
                          className='rounded-xl border-rose-200 bg-white'
                        />
                      </Form.Item>
                    ) : null
                  }
                </Form.Item>
              </div>

              {/* 大型提交按鈕 */}
              <div className='mt-6 flex gap-4'>
                <Button
                  size='large'
                  className='flex-1 h-14 rounded-xl font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-base'
                  onClick={() => setIsHmiModalVisible(false)}
                >
                  暫存並退出
                </Button>
                <Button
                  type='primary'
                  size='large'
                  className='flex-[2] h-14 rounded-xl font-black text-lg bg-indigo-600 hover:bg-indigo-500 border-none shadow-lg shadow-indigo-200 flex items-center justify-center gap-2'
                  onClick={handleSaveInspection}
                >
                  <ShieldCheck size={20} /> 提交檢驗報告 (Submit)
                </Button>
              </div>
            </Form>
          </Modal>

          {/* --- 新增檢驗請求 Modal --- */}
          <Modal
            title={
              <div className='flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3'>
                <div className='bg-indigo-100 p-1.5 rounded-lg'>
                  <Plus size={18} className='text-indigo-600' />
                </div>
                <span className='font-black text-lg tracking-tight'>
                  申請品質檢驗
                </span>
              </div>
            }
            open={isAddModalVisible}
            onOk={handleAddRequest}
            onCancel={() => {
              setIsAddModalVisible(false)
              addForm.resetFields()
            }}
            okText='送出申請'
            cancelText='取消'
            okButtonProps={{
              className:
                'bg-indigo-600 hover:bg-indigo-500 border-none shadow-md shadow-indigo-200 rounded-xl font-bold h-10 px-6'
            }}
            cancelButtonProps={{
              className:
                'rounded-xl font-bold text-slate-500 border-slate-200 h-10 px-6 hover:bg-slate-50'
            }}
            className='custom-edit-modal top-10'
            width={640}
            closeIcon={
              <XCircle
                size={20}
                className='text-slate-400 hover:text-slate-600'
              />
            }
          >
            <Form
              form={addForm}
              layout='vertical'
              className='mt-4 mb-0'
              initialValues={{ type: '首件檢驗 (FAI)' }}
            >
              <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
                <Form.Item
                  name='workCenter'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      提報機台 / 工作中心
                    </span>
                  }
                  rules={[{ required: true }]}
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
                  name='type'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      檢驗類型
                    </span>
                  }
                  rules={[{ required: true }]}
                >
                  <Select className='h-10 rounded-xl text-xs'>
                    <Select.Option value='首件檢驗 (FAI)'>
                      首件檢驗 (FAI)
                    </Select.Option>
                    <Select.Option value='巡迴檢驗 (IPQC)'>
                      巡迴檢驗 (IPQC)
                    </Select.Option>
                    <Select.Option value='末件檢驗 (LAI)'>
                      末件檢驗 (LAI)
                    </Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name='woId'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      生產工單號碼
                    </span>
                  }
                  rules={[{ required: true }]}
                >
                  <Input
                    className='h-10 rounded-xl border-slate-200 font-mono text-xs'
                    placeholder='WO-...'
                  />
                </Form.Item>

                <Form.Item
                  name='partNumber'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      生產料號
                    </span>
                  }
                  rules={[{ required: true }]}
                >
                  <Input
                    className='h-10 rounded-xl border-slate-200 font-mono text-xs'
                    placeholder='PN-...'
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
            
            /* 客製化 Radio Group 樣式 (HMI Checklist) */
            .custom-hmi-radio .ant-radio-button-wrapper {
              border-radius: 8px;
              border-color: #cbd5e1;
            }
            .custom-hmi-radio .ant-radio-button-wrapper:not(:first-child)::before {
              display: none;
            }
            .custom-hmi-radio .ant-radio-button-wrapper-checked:first-child {
              background-color: #10b981 !important; /* Emerald 500 for Pass */
              border-color: #10b981 !important;
              color: white !important;
            }
            .custom-hmi-radio .ant-radio-button-wrapper-checked:last-child {
              background-color: #f43f5e !important; /* Rose 500 for Fail */
              border-color: #f43f5e !important;
              color: white !important;
            }

            .custom-hmi-radio-large .ant-radio-button-wrapper {
              border-radius: 12px;
              border-color: #cbd5e1;
              line-height: 46px; /* align text vertically */
            }
            .custom-hmi-radio-large .ant-radio-button-wrapper:not(:first-child)::before {
              display: none;
            }
            .custom-hmi-radio-large .ant-radio-button-wrapper-checked:first-child {
              background-color: #10b981 !important; 
              border-color: #10b981 !important;
              color: white !important;
            }
            .custom-hmi-radio-large .ant-radio-button-wrapper-checked:last-child {
              background-color: #f43f5e !important; 
              border-color: #f43f5e !important;
              color: white !important;
            }

            /* 呼吸燈動畫 */
            .animate-pulse-slow {
              animation: pulseSlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            @keyframes pulseSlow {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.8; box-shadow: 0 0 10px rgba(79, 70, 229, 0.5); }
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
