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
  ChevronDown,
  Plus,
  MoreVertical,
  RefreshCw,
  Settings,
  Info,
  Zap,
  Edit,
  Trash2,
  Users,
  UserCheck,
  UserMinus,
  UserCog,
  Award,
  Briefcase,
  GraduationCap,
  CalendarClock,
  Activity,
  FileBadge,
  Clock
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
export type AttendanceStatus = '出勤中' | '休息中' | '請假' | '未排班'
export type SkillLevel =
  | '專家 (Trainer)'
  | '熟手 (Senior)'
  | '一般 (Junior)'
  | '新手 (Trainee)'
export type Department =
  | 'SMT 製造部'
  | 'DIP 插件部'
  | '組裝部'
  | '測試品管部'
  | 'CNC 加工部'

export interface CurrentAssignment {
  woId: string
  workCenter: string
  taskName: string
  shift: string
}

export interface EmployeeNode {
  key: string
  empId: string
  name: string
  department: Department
  status: AttendanceStatus
  skillLevel: SkillLevel
  efficiency: number // 作業效率 (%)
  certifications: string[] // 持有證照
  currentAssignment?: CurrentAssignment | null
  lastUpdated: string
}

// --- 擬真數據產生器 (人力資源) ---
const generateHRData = (count: number): EmployeeNode[] => {
  const departments: Department[] = [
    'SMT 製造部',
    'DIP 插件部',
    '組裝部',
    '測試品管部',
    'CNC 加工部'
  ]
  const statuses: AttendanceStatus[] = [
    '出勤中',
    '出勤中',
    '出勤中',
    '休息中',
    '請假',
    '未排班'
  ]
  const skills: SkillLevel[] = [
    '專家 (Trainer)',
    '熟手 (Senior)',
    '熟手 (Senior)',
    '一般 (Junior)',
    '一般 (Junior)',
    '新手 (Trainee)'
  ]

  const firstNames = [
    '偉',
    '傑',
    '志',
    '明',
    '俊',
    '宏',
    '柏',
    '宇',
    '佳',
    '玲',
    '淑',
    '惠',
    '雅',
    '婷',
    '欣',
    '怡'
  ]
  const lastNames = [
    '陳',
    '林',
    '黃',
    '張',
    '李',
    '王',
    '吳',
    '劉',
    '蔡',
    '楊',
    '許',
    '鄭'
  ]

  const availableCerts = [
    'SMT 機台操作認證',
    'CNC 銑床乙級',
    'IPC-A-610 檢驗員',
    '堆高機操作證',
    '靜電防護 (ESD) 認證',
    '銲接專業認證',
    '六標準差綠帶'
  ]

  return Array.from({ length: count }).map((_, idx) => {
    const dept = departments[Math.floor(Math.random() * departments.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const skill = skills[Math.floor(Math.random() * skills.length)]

    const name = `${lastNames[Math.floor(Math.random() * lastNames.length)]}${firstNames[Math.floor(Math.random() * firstNames.length)]}${Math.random() > 0.5 ? firstNames[Math.floor(Math.random() * firstNames.length)] : ''}`
    const empId = `EMP-${String(dayjs().year()).slice(2)}${String(idx + 1).padStart(4, '0')}`

    // 效率邏輯設定：專家通常較高
    let efficiency = 0
    if (skill === '專家 (Trainer)')
      efficiency = Number((95 + Math.random() * 5).toFixed(1)) // 95-100
    else if (skill === '熟手 (Senior)')
      efficiency = Number((85 + Math.random() * 10).toFixed(1)) // 85-95
    else if (skill === '一般 (Junior)')
      efficiency = Number((75 + Math.random() * 10).toFixed(1)) // 75-85
    else efficiency = Number((60 + Math.random() * 15).toFixed(1)) // 60-75

    // 隨機分派 1~3 張證照
    const certCount =
      skill === '專家 (Trainer)' ? 3 : skill === '新手 (Trainee)' ? 1 : 2
    const shuffledCerts = [...availableCerts].sort(() => 0.5 - Math.random())
    const certifications = shuffledCerts.slice(0, certCount)

    let currentAssignment = null
    if (status === '出勤中' || status === '休息中') {
      currentAssignment = {
        woId: `WO-26X${String(Math.floor(Math.random() * 9000) + 1000)}`,
        workCenter: `${dept.split(' ')[0]}-LINE-0${Math.floor(Math.random() * 5) + 1}`,
        taskName: '常規生產作業',
        shift: Math.random() > 0.3 ? '早班 (08:00-17:00)' : '晚班 (20:00-05:00)'
      }
    }

    return {
      key: empId,
      empId,
      name,
      department: dept,
      status,
      skillLevel: skill,
      efficiency,
      certifications,
      currentAssignment,
      lastUpdated: dayjs()
        .subtract(Math.floor(Math.random() * 5), 'hour')
        .format('YYYY-MM-DD HH:mm')
    }
  })
}

// 產生 200 筆員工資料
const mockEmployeeData: EmployeeNode[] = generateHRData(200)

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
export default function HRManager() {
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const searchInputRef = useRef<InputRef>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(() => {
    const present = mockEmployeeData.filter(
      d => d.status === '出勤中' || d.status === '休息中'
    ).length
    const leave = mockEmployeeData.filter(d => d.status === '請假').length
    const trainers = mockEmployeeData.filter(
      d => d.skillLevel === '專家 (Trainer)'
    ).length

    // 計算出勤人員的平均效率
    const presentData = mockEmployeeData.filter(
      d => d.status === '出勤中' || d.status === '休息中'
    )
    const avgEff =
      presentData.length > 0
        ? (
            presentData.reduce((acc, curr) => acc + curr.efficiency, 0) /
            presentData.length
          ).toFixed(1)
        : '0'

    return { present, leave, trainers, avgEff, total: mockEmployeeData.length }
  }, [])

  // --- 搜尋過濾邏輯 ---
  const getSearchProps = (dataIndex: keyof EmployeeNode, title: string) => ({
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
    onFilter: (value: any, record: EmployeeNode): boolean => {
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
        <Users size={16} className='text-indigo-600' />
        <span className='font-bold text-slate-800'>廠區人力資源概覽</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='當前出勤人數'
          value={stats.present}
          unit={`/ ${stats.total} 人`}
          icon={UserCheck}
          colorClass='text-emerald-600'
          bgClass='bg-emerald-50'
          iconColorClass='text-emerald-500'
          trend='可排程人力'
        />
        <StatCard
          title='出勤平均效率'
          value={stats.avgEff}
          unit='%'
          icon={Activity}
          colorClass='text-blue-600'
          bgClass='bg-blue-50'
          iconColorClass='text-blue-500'
          trend='目標: > 80%'
        />
        <StatCard
          title='今日請假人數'
          value={stats.leave}
          unit='人'
          icon={UserMinus}
          colorClass='text-rose-600'
          bgClass='bg-rose-100/80'
          iconColorClass='text-rose-500'
          isAlert={stats.leave > 15}
          trend='可能影響產線排程'
        />
        <StatCard
          title='專家級 (Trainer)'
          value={stats.trainers}
          unit='人'
          icon={Award}
          colorClass='text-purple-600'
          bgClass='bg-purple-50'
          iconColorClass='text-purple-500'
          trend='高階工序必須人力'
        />
      </div>
    </div>
  )

  // --- 展開的人員詳細資訊區塊 ---
  const expandedRowRender = (record: EmployeeNode) => {
    return (
      <div className='py-4 px-6 bg-slate-50/80 border-y border-blue-100 shadow-inner shadow-blue-50/50 flex gap-6'>
        {/* 左側：技能與證照 */}
        <div className='flex-1 bg-white border border-slate-200 p-4 rounded-xl shadow-sm'>
          <div className='flex items-center gap-2 border-b border-slate-100 pb-3 mb-3'>
            <FileBadge size={16} className='text-amber-500' />
            <span className='font-bold text-slate-700 text-[13px]'>
              持有技能與認證 (Certifications)
            </span>
          </div>
          <div className='flex flex-wrap gap-2'>
            {record.certifications.length > 0 ? (
              record.certifications.map((cert, i) => (
                <Tag
                  key={i}
                  className='m-0 border-amber-200 bg-amber-50 text-amber-700 font-bold px-2 py-1 rounded-md flex items-center gap-1.5'
                >
                  <Award size={12} className='inline' /> {cert}
                </Tag>
              ))
            ) : (
              <span className='text-slate-400 text-xs font-medium'>
                無特殊證照紀錄
              </span>
            )}
          </div>
        </div>

        {/* 右側：當前任務與班別 */}
        <div className='w-[380px] bg-white border border-slate-200 p-4 rounded-xl shadow-sm'>
          <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-3'>
            <div className='flex items-center gap-2'>
              <Briefcase size={16} className='text-blue-600' />
              <span className='font-bold text-slate-700 text-[13px]'>
                當前排班與分派 (Assignment)
              </span>
            </div>
            {record.status === '出勤中' ? (
              <Tag color='processing' className='m-0 font-bold border-none'>
                工作中
              </Tag>
            ) : record.status === '請假' ? (
              <Tag className='m-0 text-rose-500 bg-rose-50 border-none font-bold'>
                請假中
              </Tag>
            ) : (
              <Tag className='m-0 text-slate-500 bg-slate-100 border-none font-bold'>
                {record.status}
              </Tag>
            )}
          </div>

          {record.currentAssignment ? (
            <div className='flex flex-col gap-3'>
              <div className='flex justify-between'>
                <span className='text-xs text-slate-500'>當前班別</span>
                <span className='text-xs font-bold text-slate-700 flex items-center gap-1'>
                  <Clock size={12} className='text-slate-400' />
                  {record.currentAssignment.shift}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-xs text-slate-500'>分派站點 / 機台</span>
                <span className='text-xs font-bold font-mono text-indigo-700'>
                  {record.currentAssignment.workCenter}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-xs text-slate-500'>執行工單號</span>
                <span className='text-xs font-bold font-mono text-blue-700'>
                  {record.currentAssignment.woId}
                </span>
              </div>
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center h-[80px] text-slate-400'>
              <CalendarClock size={24} className='mb-2 opacity-50' />
              <span className='text-xs font-medium'>當前無排定班別或任務</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- 表格欄位定義 ---
  const columns: ColumnsType<EmployeeNode> = [
    {
      title: '員工編號 (Emp ID)',
      dataIndex: 'empId',
      key: 'empId',
      width: 200,
      fixed: 'left',
      sorter: (a, b) => a.empId.localeCompare(b.empId),
      ...getSearchProps('empId', '員工編號'),
      render: text => (
        <div className='inline-flex items-center gap-2 align-middle group'>
          <div className='w-6 h-6 rounded bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors'>
            <UserCog
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
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      sorter: (a, b) => a.name.localeCompare(b.name),
      ...getSearchProps('name', '姓名'),
      render: text => (
        <span className='font-bold text-slate-700 text-[13px]'>{text}</span>
      )
    },
    {
      title: '部門 / 單位',
      dataIndex: 'department',
      key: 'department',
      width: 160,
      filters: [
        { text: 'SMT 製造部', value: 'SMT 製造部' },
        { text: 'DIP 插件部', value: 'DIP 插件部' },
        { text: '組裝部', value: '組裝部' },
        { text: '測試品管部', value: '測試品管部' },
        { text: 'CNC 加工部', value: 'CNC 加工部' }
      ],
      onFilter: (value, record) => record.department === value,
      render: text => (
        <span className='text-xs font-bold text-slate-600'>{text}</span>
      )
    },
    {
      title: '出勤狀態',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      sorter: (a, b) => a.status.localeCompare(b.status),
      filters: [
        { text: '出勤中', value: '出勤中' },
        { text: '休息中', value: '休息中' },
        { text: '請假', value: '請假' },
        { text: '未排班', value: '未排班' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: AttendanceStatus) => {
        let colorClass = ''
        let bgClass = ''

        switch (status) {
          case '出勤中':
            colorClass = 'text-emerald-600'
            bgClass = 'bg-emerald-50 border-emerald-100'
            break
          case '休息中':
            colorClass = 'text-amber-600'
            bgClass = 'bg-amber-50 border-amber-100'
            break
          case '請假':
            colorClass = 'text-rose-600'
            bgClass = 'bg-rose-50 border-rose-100'
            break
          case '未排班':
            colorClass = 'text-slate-500'
            bgClass = 'bg-slate-100 border-slate-200'
            break
        }

        return (
          <div
            className={cn(
              'inline-flex items-center justify-center px-2 py-1 rounded-md text-[11px] font-bold border w-[60px]',
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
      title: '技能等級',
      dataIndex: 'skillLevel',
      key: 'skillLevel',
      width: 150,
      sorter: (a, b) => a.skillLevel.localeCompare(b.skillLevel),
      filters: [
        { text: '專家 (Trainer)', value: '專家 (Trainer)' },
        { text: '熟手 (Senior)', value: '熟手 (Senior)' },
        { text: '一般 (Junior)', value: '一般 (Junior)' },
        { text: '新手 (Trainee)', value: '新手 (Trainee)' }
      ],
      onFilter: (value, record) => record.skillLevel === value,
      render: (level: SkillLevel) => {
        const isExpert = level.includes('專家')
        const isTrainee = level.includes('新手')
        return (
          <Tag
            className={cn(
              'm-0 border font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center w-fit gap-1',
              isExpert
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : isTrainee
                  ? 'bg-slate-50 text-slate-500 border-slate-200'
                  : 'bg-blue-50 text-blue-600 border-blue-200'
            )}
          >
            {isExpert && <GraduationCap size={12} />}
            {level.split(' ')[0]}
          </Tag>
        )
      }
    },
    {
      title: '作業效率 (Efficiency)',
      dataIndex: 'efficiency',
      key: 'efficiency',
      width: 180,
      sorter: (a, b) => a.efficiency - b.efficiency,
      render: (eff, record) => {
        const isActive =
          record.status === '出勤中' || record.status === '休息中'
        const displayEff = isActive ? eff : 0
        const strokeColor =
          displayEff >= 90
            ? '#10b981'
            : displayEff >= 75
              ? '#3b82f6'
              : '#f59e0b'

        return (
          <div className='w-full pr-4'>
            <div className='flex justify-between text-[10px] font-black mb-1'>
              <span className='text-slate-400'>效率評估</span>
              <span className={isActive ? 'text-slate-700' : 'text-slate-400'}>
                {displayEff}%
              </span>
            </div>
            <Progress
              percent={displayEff}
              size='small'
              showInfo={false}
              strokeColor={isActive ? strokeColor : '#cbd5e1'}
            />
          </div>
        )
      }
    },
    {
      title: '分派站點',
      key: 'assignment',
      width: 140,
      render: (_, record) => {
        if (!record.currentAssignment)
          return <span className='text-slate-300 text-xs font-bold'>-</span>
        return (
          <span className='font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100'>
            {record.currentAssignment.workCenter.split('-')[0]}-
            {record.currentAssignment.workCenter.split('-')[2]}
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
                label: '編輯人員資料',
                icon: <Edit size={14} className='text-blue-500' />
              },
              {
                key: '2',
                label: '變更排班',
                icon: <CalendarClock size={14} className='text-amber-500' />
              },
              { key: '3', type: 'divider' },
              {
                key: '4',
                label: '人員離職註銷',
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

  const rowSelection: TableProps<EmployeeNode>['rowSelection'] = {
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
                  Syncing HR Data...
                </span>
              </div>
            </div>
          )}

          {/* 玻璃透視頂部導航列 */}
          <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/50 py-2 rounded-xl sticky top-0 z-20 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='bg-indigo-600 p-1.5 rounded-lg shadow-indigo-200 shadow-lg'>
                <Users size={18} className='text-white' />
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
                      人力資源概覽
                    </span>
                    <div className='flex gap-1'>
                      <Badge
                        count={stats.present}
                        style={{
                          backgroundColor: '#10b981',
                          fontSize: '10px',
                          boxShadow: 'none'
                        }}
                      />
                      {stats.leave > 15 && (
                        <Badge
                          count={stats.leave}
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
              <Tooltip title='重新整理'>
                <Button
                  type='text'
                  icon={<RefreshCw size={16} />}
                  className='text-slate-400 hover:bg-slate-100 rounded-xl font-medium h-10 w-10 flex items-center justify-center'
                />
              </Tooltip>
              <Tooltip title='導出人力清冊 (Excel)'>
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
                <span className='hidden sm:inline ml-1 text-xs'>新增人員</span>
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
                    已選取 {selectedRowKeys.length} 位人員
                  </span>
                </div>
                <Space>
                  <Button
                    size='small'
                    icon={<CalendarClock size={14} />}
                    className='rounded-lg font-bold text-xs bg-white text-blue-600 border-slate-200 shadow-sm'
                  >
                    批量變更排班
                  </Button>
                  <Button
                    size='small'
                    icon={<Award size={14} />}
                    className='rounded-lg font-bold text-xs bg-white text-amber-600 border-slate-200 shadow-sm'
                  >
                    批量更新技能
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
                廠區生產人力資源庫 (HR Master) - 共 {mockEmployeeData.length} 人
              </div>
              <div className='flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm'>
                <Info size={14} className='text-indigo-500' />
                <span className='text-[10px] text-slate-400 font-bold uppercase tracking-tight'>
                  提示：點擊人員可展開查看「持有證照」與「當前排班」明細
                </span>
              </div>
            </div>

            <div className='p-4 pt-0'>
              <Table<EmployeeNode>
                rowSelection={rowSelection}
                columns={columns}
                dataSource={mockEmployeeData}
                loading={false}
                scroll={{ x: 1200 }}
                pagination={{
                  pageSize: 10, // 依照需求：Table 一次顯示 10 筆
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
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
