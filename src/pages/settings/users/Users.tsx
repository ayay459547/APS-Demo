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
  Avatar,
  Modal,
  Form,
  Select,
  Switch,
  message,
  Timeline
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import type { InputRef } from 'antd'
import {
  Search,
  AlertCircle,
  ChevronDown,
  Plus,
  MoreVertical,
  RefreshCw,
  Settings,
  Info,
  Zap,
  Edit,
  ShieldCheck,
  UserCheck,
  UserX,
  Key,
  Mail,
  Building,
  History,
  Lock,
  Unlock,
  SmartphoneNfc,
  Eye,
  Edit3,
  Ban,
  MonitorSmartphone,
  Globe
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
export type AccountStatus = '啟用' | '停用' | '鎖定'
export type UserRole =
  | '系統管理員'
  | '生管排程員'
  | '現場主管'
  | '業務專員'
  | '高階主管'
export type PermissionLevel = 'read-write' | 'read-only' | 'none'

export interface PermissionScope {
  module: string
  level: PermissionLevel
}

export interface UserAccount {
  key: string
  empId: string
  name: string
  email: string
  department: string
  role: UserRole
  status: AccountStatus
  mfaEnabled: boolean
  lastLogin: string
  permissions: PermissionScope[]
}

// --- 擬真數據產生器 ---
const generateUsers = (count: number): UserAccount[] => {
  const roles: UserRole[] = [
    '系統管理員',
    '生管排程員',
    '生管排程員',
    '現場主管',
    '業務專員',
    '高階主管'
  ]
  // const departments = ['資訊部', '生管部', '製造部', '業務部', '總經理室']
  const statuses: AccountStatus[] = [
    '啟用',
    '啟用',
    '啟用',
    '啟用',
    '停用',
    '鎖定'
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

  return Array.from({ length: count }).map((_, idx) => {
    const role = roles[Math.floor(Math.random() * roles.length)]

    // 根據角色分配部門
    let department = '生管部'
    if (role === '系統管理員') department = '資訊部'
    if (role === '現場主管') department = '製造部'
    if (role === '業務專員') department = '業務部'
    if (role === '高階主管') department = '總經理室'

    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const name = `${lastNames[Math.floor(Math.random() * lastNames.length)]}${firstNames[Math.floor(Math.random() * firstNames.length)]}${Math.random() > 0.5 ? firstNames[Math.floor(Math.random() * firstNames.length)] : ''}`

    // 權限配置模擬
    const permissions: PermissionScope[] = [
      {
        module: '商品資料管理',
        level:
          role === '系統管理員' || role === '生管排程員'
            ? 'read-write'
            : 'read-only'
      },
      {
        module: 'BOM 管理',
        level:
          role === '系統管理員' || role === '生管排程員'
            ? 'read-write'
            : role === '業務專員'
              ? 'none'
              : 'read-only'
      },
      {
        module: '排程管理',
        level:
          role === '系統管理員' || role === '生管排程員'
            ? 'read-write'
            : role === '現場主管'
              ? 'read-only'
              : 'none'
      },
      {
        module: '現場與異常',
        level:
          role === '系統管理員' || role === '現場主管'
            ? 'read-write'
            : 'read-only'
      },
      {
        module: '系統設定',
        level: role === '系統管理員' ? 'read-write' : 'none'
      }
    ]

    return {
      key: `USR-${String(idx + 1).padStart(4, '0')}`,
      empId: `EMP-${String(Math.floor(Math.random() * 90000) + 10000)}`,
      name,
      email: `user.${String(idx + 1).padStart(3, '0')}@aps-demo.com`,
      department,
      role,
      status,
      mfaEnabled: role === '系統管理員' || Math.random() > 0.4, // 管理員強迫 MFA
      lastLogin:
        status === '啟用'
          ? dayjs()
              .subtract(Math.floor(Math.random() * 48), 'hour')
              .format('YYYY-MM-DD HH:mm')
          : dayjs()
              .subtract(Math.floor(Math.random() * 60) + 30, 'day')
              .format('YYYY-MM-DD HH:mm'),
      permissions
    }
  })
}

const mockUserData: UserAccount[] = generateUsers(120)

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
export default function UserManager() {
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const searchInputRef = useRef<InputRef>(null)

  // --- 狀態管理區 ---
  const [userData, setUserData] = useState<UserAccount[]>(mockUserData)

  // 編輯使用者
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null)
  const [editForm] = Form.useForm()

  // 新增使用者
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [addForm] = Form.useForm()

  // 登入日誌
  const [isLogModalVisible, setIsLogModalVisible] = useState(false)
  const [logUser, setLogUser] = useState<UserAccount | null>(null)

  // 調整權限 Modal
  const [isPermissionModalVisible, setIsPermissionModalVisible] =
    useState(false)
  const [permissionEditingUser, setPermissionEditingUser] =
    useState<UserAccount | null>(null)
  const [permissionForm] = Form.useForm()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(() => {
    const active = userData.filter(d => d.status === '啟用').length
    const admins = userData.filter(d => d.role === '系統管理員').length
    const locked = userData.filter(d => d.status === '鎖定').length
    const mfaCount = userData.filter(d => d.mfaEnabled).length
    const mfaRate = Math.round((mfaCount / userData.length) * 100) || 0

    return { active, admins, locked, mfaRate, total: userData.length }
  }, [userData])

  // --- 操作處理函式 ---
  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success({
        content: '帳號清單已重新整理！',
        className: 'custom-message'
      })
    }, 600)
  }

  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields()
      setUserData(prev =>
        prev.map(u => (u.key === editingUser?.key ? { ...u, ...values } : u))
      )
      setIsEditModalVisible(false)
      message.success({
        content: `使用者 ${values.name} 的資料已成功更新！`,
        className: 'custom-message'
      })
    } catch (error) {
      console.log('Validation Failed:', error)
    }
  }

  const handleAddUser = async () => {
    try {
      const values = await addForm.validateFields()
      const newUser: UserAccount = {
        key: `USR-NEW-${Date.now()}`,
        empId: `EMP-${Math.floor(Math.random() * 90000) + 10000}`,
        ...values,
        mfaEnabled: false,
        lastLogin: '從未登入',
        // 預設帶入基本權限清單
        permissions: [
          { module: '商品資料管理', level: 'read-only' },
          { module: 'BOM 管理', level: 'none' },
          { module: '排程管理', level: 'none' },
          { module: '現場與異常', level: 'none' },
          { module: '系統設定', level: 'none' }
        ]
      }
      setUserData([newUser, ...userData])
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success({
        content: `已成功新增使用者 ${values.name}！`,
        className: 'custom-message'
      })
    } catch (error) {
      console.log('Validation Failed:', error)
    }
  }

  const handleSavePermissions = async () => {
    try {
      const values = await permissionForm.validateFields()

      // 將 Form 的 values (物件格式) 轉回 PermissionScope 陣列格式
      const newPermissions: PermissionScope[] = Object.keys(values).map(
        module => ({
          module,
          level: values[module] as PermissionLevel
        })
      )

      setUserData(prev =>
        prev.map(u =>
          u.key === permissionEditingUser?.key
            ? { ...u, permissions: newPermissions }
            : u
        )
      )
      setIsPermissionModalVisible(false)
      message.success({
        content: `已成功更新 ${permissionEditingUser?.name} 的模組存取權限！`,
        className: 'custom-message'
      })
    } catch (error) {
      console.log('Validation Failed:', error)
    }
  }

  // --- 搜尋過濾邏輯 ---
  const getSearchProps = (dataIndex: keyof UserAccount, title: string) => ({
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
    onFilter: (value: any, record: UserAccount): boolean => {
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
        <ShieldCheck size={16} className='text-indigo-600' />
        <span className='font-bold text-slate-800'>系統存取與資安概覽</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='啟用中帳號'
          value={stats.active}
          unit={`/ ${stats.total} 個`}
          icon={UserCheck}
          colorClass='text-emerald-600'
          bgClass='bg-emerald-50'
          iconColorClass='text-emerald-500'
        />
        <StatCard
          title='系統管理員'
          value={stats.admins}
          unit='人'
          icon={Key}
          colorClass='text-purple-600'
          bgClass='bg-purple-50'
          iconColorClass='text-purple-500'
          trend='具備最高權限'
        />
        <StatCard
          title='異常鎖定帳號'
          value={stats.locked}
          unit='個'
          icon={AlertCircle}
          colorClass='text-rose-600'
          bgClass='bg-rose-100/80'
          iconColorClass='text-rose-500'
          isAlert={stats.locked > 0}
          trend='密碼錯誤或閒置過久'
        />
        <StatCard
          title='MFA 啟用率'
          value={stats.mfaRate}
          unit='%'
          icon={SmartphoneNfc}
          colorClass='text-blue-600'
          bgClass='bg-blue-50'
          iconColorClass='text-blue-500'
          trend='建議推動至 100%'
        />
      </div>
    </div>
  )

  // --- 展開的權限視圖 ---
  const expandedRowRender = (record: UserAccount) => {
    return (
      <div className='py-4 px-6 bg-slate-50/80 border-y border-blue-100 shadow-inner shadow-blue-50/50'>
        <div className='bg-white border border-slate-200 p-4 rounded-xl shadow-sm'>
          <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-4'>
            <div className='flex items-center gap-2'>
              <ShieldCheck size={16} className='text-indigo-600' />
              <span className='font-bold text-slate-700 text-[13px]'>
                模組存取權限矩陣 (Permission Scopes)
              </span>
            </div>
            <Button
              size='small'
              type='primary'
              ghost
              className='text-xs font-bold rounded-md flex items-center gap-1'
              onClick={() => {
                setPermissionEditingUser(record)
                // 將權限陣列轉換成 Form 可以直接接受的 key-value 物件格式
                const formValues: Record<string, string> = {}
                record.permissions.forEach(p => {
                  formValues[p.module] = p.level
                })
                permissionForm.setFieldsValue(formValues)
                setIsPermissionModalVisible(true)
              }}
            >
              <Zap size={14} /> 快速調整權限
            </Button>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
            {record.permissions.map((perm, idx) => (
              <div
                key={idx}
                className='flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100'
              >
                <span className='text-xs font-bold text-slate-600'>
                  {perm.module}
                </span>
                <div>
                  {perm.level === 'read-write' ? (
                    <Tag className='m-0 border-emerald-200 bg-emerald-50 text-emerald-600 font-bold flex items-center w-fit gap-1 text-[10px]'>
                      <Edit3 size={10} /> 讀寫授權
                    </Tag>
                  ) : perm.level === 'read-only' ? (
                    <Tag className='m-0 border-blue-200 bg-blue-50 text-blue-600 font-bold flex items-center w-fit gap-1 text-[10px]'>
                      <Eye size={10} /> 僅供檢視
                    </Tag>
                  ) : (
                    <Tag className='m-0 border-slate-200 bg-slate-100 text-slate-400 font-bold flex items-center w-fit gap-1 text-[10px]'>
                      <Ban size={10} /> 無存取權
                    </Tag>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // --- 表格欄位定義 ---
  const columns: ColumnsType<UserAccount> = [
    {
      title: '使用者資訊',
      key: 'userInfo',
      width: 260,
      fixed: 'left',
      sorter: (a, b) => a.name.localeCompare(b.name),
      ...getSearchProps('name', '姓名 / 帳號'),
      render: (_, record) => (
        <div className='flex items-center gap-3'>
          <Avatar
            className={cn(
              'font-bold shrink-0 shadow-sm',
              record.status === '啟用'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-400'
            )}
            size={36}
          >
            {record.name.charAt(0)}
          </Avatar>
          <div className='flex flex-col'>
            <span
              className={cn(
                'font-bold text-[13px]',
                record.status === '啟用' ? 'text-slate-800' : 'text-slate-400'
              )}
            >
              {record.name}
            </span>
            <span className='text-[11px] text-slate-400 font-mono tracking-tight'>
              {record.email}
            </span>
          </div>
        </div>
      )
    },
    {
      title: '工號 / 員工 ID',
      dataIndex: 'empId',
      key: 'empId',
      width: 160,
      sorter: (a, b) => a.empId.localeCompare(b.empId),
      ...getSearchProps('empId', '工號'),
      render: text => (
        <span className='font-mono font-bold text-slate-500 text-xs'>
          {text}
        </span>
      )
    },
    {
      title: '角色權限',
      dataIndex: 'role',
      key: 'role',
      width: 160,
      filters: [
        { text: '系統管理員', value: '系統管理員' },
        { text: '生管排程員', value: '生管排程員' },
        { text: '現場主管', value: '現場主管' },
        { text: '業務專員', value: '業務專員' },
        { text: '高階主管', value: '高階主管' }
      ],
      onFilter: (value, record) => record.role === value,
      render: (role: UserRole) => {
        let colorClass = 'bg-slate-50 text-slate-600 border-slate-200'
        if (role === '系統管理員')
          colorClass = 'bg-purple-50 text-purple-600 border-purple-200'
        if (role === '生管排程員')
          colorClass = 'bg-blue-50 text-blue-600 border-blue-200'
        if (role === '現場主管')
          colorClass = 'bg-orange-50 text-orange-600 border-orange-200'
        if (role === '業務專員')
          colorClass = 'bg-emerald-50 text-emerald-600 border-emerald-200'
        if (role === '高階主管')
          colorClass = 'bg-indigo-50 text-indigo-600 border-indigo-200'

        return (
          <div
            className={cn(
              'inline-flex items-center px-2.5 py-1 rounded text-[11px] font-bold border',
              colorClass
            )}
          >
            {role === '系統管理員' && <Key size={12} className='mr-1.5' />}
            {role}
          </div>
        )
      }
    },
    {
      title: '所屬部門',
      dataIndex: 'department',
      key: 'department',
      width: 140,
      sorter: (a, b) => a.department.localeCompare(b.department),
      render: text => (
        <div className='flex items-center gap-1.5 text-slate-600 text-xs font-bold'>
          <Building size={14} className='text-slate-400' />
          {text}
        </div>
      )
    },
    {
      title: '帳號狀態',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      sorter: (a, b) => a.status.localeCompare(b.status),
      filters: [
        { text: '啟用', value: '啟用' },
        { text: '停用', value: '停用' },
        { text: '鎖定', value: '鎖定' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: AccountStatus) => {
        const isEnable = status === '啟用'
        const isLock = status === '鎖定'
        return (
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border w-fit',
              isEnable
                ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                : isLock
                  ? 'bg-rose-50 border-rose-100 text-rose-600'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
            )}
          >
            {isEnable ? (
              <Unlock size={12} />
            ) : isLock ? (
              <Lock size={12} />
            ) : (
              <UserX size={12} />
            )}
            {status}
          </div>
        )
      }
    },
    {
      title: '資安保護 (MFA)',
      dataIndex: 'mfaEnabled',
      key: 'mfaEnabled',
      width: 150,
      filters: [
        { text: '已啟用 2FA', value: true },
        { text: '未驗證', value: false }
      ],
      onFilter: (value, record) => record.mfaEnabled === value,
      render: (mfa: boolean) =>
        mfa ? (
          <Tooltip title='雙因素認證已綁定'>
            <Tag className='m-0 border-blue-200 bg-blue-50 text-blue-600 font-bold px-2 py-0.5 flex items-center w-fit gap-1 text-[10px]'>
              <SmartphoneNfc size={12} className='inline' /> 已綁定 2FA
            </Tag>
          </Tooltip>
        ) : (
          <Tag className='m-0 border-slate-200 bg-white text-slate-400 font-bold px-2 py-0.5 flex items-center w-fit gap-1 text-[10px]'>
            未驗證
          </Tag>
        )
    },
    {
      title: '最後登入紀錄',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 150,
      sorter: (a, b) =>
        dayjs(a.lastLogin).valueOf() - dayjs(b.lastLogin).valueOf(),
      render: (date, record) => (
        <div className='flex flex-col gap-0.5'>
          {record.status !== '停用' ? (
            <>
              <span className='font-mono font-bold text-slate-600 text-[11px]'>
                {date.split(' ')[0]}
              </span>
              <span className='font-mono text-slate-400 text-[10px]'>
                {date.split(' ')[1]}
              </span>
            </>
          ) : (
            <span className='text-slate-300 text-xs'>-</span>
          )}
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 70,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: '1',
                label: (
                  <div className='flex items-center gap-2 w-full'>
                    <Edit size={14} className='text-blue-500' /> 編輯基本資料
                  </div>
                ),
                onClick: ({ domEvent }) => {
                  domEvent.stopPropagation() // 阻止表格展開
                  setEditingUser(record)
                  editForm.setFieldsValue(record)
                  setIsEditModalVisible(true)
                }
              },
              {
                key: '2',
                label: (
                  <div className='flex items-center gap-2 w-full'>
                    <Mail size={14} className='text-amber-500' /> 重設密碼信件
                  </div>
                ),
                onClick: ({ domEvent }) => {
                  domEvent.stopPropagation() // 阻止表格展開
                  Modal.confirm({
                    title: '發送重設密碼信件',
                    content: `確定要發送密碼重設信件至 ${record.email} 嗎？`,
                    okText: '確定發送',
                    cancelText: '取消',
                    centered: true,
                    onOk: () => {
                      message.success({
                        content: `已寄送密碼重設信件給 ${record.name}！`,
                        className: 'custom-message'
                      })
                    }
                  })
                }
              },
              {
                key: '3',
                label: (
                  <div className='flex items-center gap-2 w-full'>
                    <History size={14} className='text-slate-500' /> 登入日誌
                  </div>
                ),
                onClick: ({ domEvent }) => {
                  domEvent.stopPropagation() // 阻止表格展開
                  setLogUser(record)
                  setIsLogModalVisible(true)
                }
              },
              { key: '4', type: 'divider' },
              {
                key: '5',
                label: (
                  <div
                    className={cn(
                      'flex items-center gap-2 w-full',
                      record.status === '啟用'
                        ? 'text-rose-500'
                        : 'text-emerald-600'
                    )}
                  >
                    {record.status === '啟用' ? (
                      <UserX size={14} />
                    ) : (
                      <UserCheck size={14} />
                    )}
                    {record.status === '啟用' ? '停用此帳號' : '重新啟用帳號'}
                  </div>
                ),
                onClick: ({ domEvent }) => {
                  domEvent.stopPropagation() // 阻止表格展開
                  Modal.confirm({
                    title:
                      record.status === '啟用'
                        ? '停用帳號確認'
                        : '重新啟用確認',
                    content: (
                      <span className='text-sm'>
                        確定要將 <b>{record.name}</b> 的帳號設為
                        {record.status === '啟用' ? '停用' : '啟用'}嗎？
                      </span>
                    ),
                    okText: '確定',
                    cancelText: '取消',
                    okButtonProps: { danger: record.status === '啟用' },
                    centered: true,
                    onOk: () => {
                      setUserData(prev =>
                        prev.map(u =>
                          u.key === record.key
                            ? {
                                ...u,
                                status:
                                  record.status === '啟用' ? '停用' : '啟用'
                              }
                            : u
                        )
                      )
                      message.success({
                        content: `帳號已成功${record.status === '啟用' ? '停用' : '啟用'}！`,
                        className: 'custom-message'
                      })
                    }
                  })
                }
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

  const rowSelection: TableProps<UserAccount>['rowSelection'] = {
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
                  Loading Accounts...
                </span>
              </div>
            </div>
          )}

          {/* 玻璃透視頂部導航列 */}
          <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/50 py-2 rounded-xl sticky top-0 z-20 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='bg-indigo-600 p-1.5 rounded-lg shadow-indigo-200 shadow-lg'>
                <ShieldCheck size={18} className='text-white' />
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
                      資安與權限概覽
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
                      {stats.locked > 0 && (
                        <Badge
                          count={stats.locked}
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
              <Tooltip title='重新整理清單'>
                <Button
                  type='text'
                  icon={
                    <RefreshCw
                      size={16}
                      className={loading ? 'animate-spin' : ''}
                    />
                  }
                  className='text-slate-400 hover:bg-slate-100 rounded-xl font-medium h-10 w-10 flex items-center justify-center'
                  onClick={handleRefresh}
                />
              </Tooltip>
              <Button
                type='primary'
                icon={<Plus size={16} />}
                onClick={() => setIsAddModalVisible(true)}
                className='rounded-xl bg-indigo-600 shadow-md shadow-indigo-100 font-bold border-none h-10 flex items-center justify-center hover:bg-indigo-500'
              >
                <span className='hidden sm:inline ml-1 text-xs'>
                  新增使用者
                </span>
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
                    已選取 {selectedRowKeys.length} 個系統帳號
                  </span>
                </div>
                <Space>
                  <Button
                    size='small'
                    icon={<Edit3 size={14} />}
                    className='rounded-lg font-bold text-xs bg-white text-blue-600 border-slate-200 shadow-sm'
                  >
                    批次變更角色
                  </Button>
                  <Button
                    size='small'
                    icon={<Mail size={14} />}
                    className='rounded-lg font-bold text-xs bg-white text-amber-600 border-slate-200 shadow-sm'
                  >
                    發送重設密碼信
                  </Button>
                  <Button
                    size='small'
                    icon={<UserX size={14} />}
                    danger
                    className='rounded-lg font-bold text-xs bg-white shadow-sm'
                  >
                    批次停用
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
                系統帳號與權限清單 (User Master) - 共 {userData.length} 個
              </div>
              <div className='flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm'>
                <Info size={14} className='text-indigo-500' />
                <span className='text-[10px] text-slate-400 font-bold uppercase tracking-tight'>
                  提示：點擊列表列可展開查看各模組的「權限矩陣」
                </span>
              </div>
            </div>

            <div className='p-4 pt-0'>
              <Table<UserAccount>
                rowSelection={rowSelection}
                columns={columns}
                dataSource={userData}
                loading={false}
                scroll={{ x: 1200 }}
                pagination={{
                  pageSize: 10,
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

          {/* --- 編輯使用者 Modal --- */}
          <Modal
            centered
            title={
              <div className='flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3'>
                <div className='bg-blue-100 p-1.5 rounded-lg'>
                  <Edit3 size={18} className='text-blue-600' />
                </div>
                <span className='font-black text-lg tracking-tight'>
                  編輯系統使用者
                </span>
              </div>
            }
            open={isEditModalVisible}
            onOk={handleSaveEdit}
            onCancel={() => setIsEditModalVisible(false)}
            okText='儲存變更'
            cancelText='取消'
            okButtonProps={{
              className:
                'bg-blue-600 hover:bg-blue-500 border-none shadow-md shadow-blue-200 rounded-xl font-bold h-10 px-6'
            }}
            cancelButtonProps={{
              className:
                'rounded-xl font-bold text-slate-500 border-slate-200 h-10 px-6 hover:bg-slate-50'
            }}
            className='custom-edit-modal top-10'
            width={640}
            closeIcon={
              <UserX
                size={20}
                className='text-slate-400 hover:text-slate-600'
              />
            }
          >
            <Form form={editForm} layout='vertical' className='mt-6 mb-2'>
              <div className='grid grid-cols-2 gap-x-6 gap-y-4'>
                <Form.Item
                  name='name'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      使用者姓名
                    </span>
                  }
                  rules={[{ required: true, message: '請輸入姓名' }]}
                >
                  <Input className='h-10 rounded-xl border-slate-200' />
                </Form.Item>

                <Form.Item
                  name='email'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      聯絡信箱 (Email)
                    </span>
                  }
                  rules={[
                    { required: true, message: '請輸入信箱' },
                    { type: 'email', message: '信箱格式錯誤' }
                  ]}
                >
                  <Input
                    className='h-10 rounded-xl border-slate-200'
                    disabled
                  />
                </Form.Item>

                <Form.Item
                  name='department'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      所屬部門
                    </span>
                  }
                >
                  <Select className='h-10 rounded-xl'>
                    <Select.Option value='資訊部'>資訊部</Select.Option>
                    <Select.Option value='生管部'>生管部</Select.Option>
                    <Select.Option value='製造部'>製造部</Select.Option>
                    <Select.Option value='業務部'>業務部</Select.Option>
                    <Select.Option value='總經理室'>總經理室</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name='role'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      系統角色 (Role)
                    </span>
                  }
                >
                  <Select className='h-10 rounded-xl'>
                    <Select.Option value='系統管理員'>系統管理員</Select.Option>
                    <Select.Option value='生管排程員'>生管排程員</Select.Option>
                    <Select.Option value='現場主管'>現場主管</Select.Option>
                    <Select.Option value='業務專員'>業務專員</Select.Option>
                    <Select.Option value='高階主管'>高階主管</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name='status'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      帳號狀態
                    </span>
                  }
                >
                  <Select className='h-10 rounded-xl'>
                    <Select.Option value='啟用'>
                      <span className='text-emerald-600 font-bold'>啟用中</span>
                    </Select.Option>
                    <Select.Option value='停用'>
                      <span className='text-slate-500 font-bold'>已停用</span>
                    </Select.Option>
                    <Select.Option value='鎖定'>
                      <span className='text-rose-600 font-bold'>異常鎖定</span>
                    </Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name='mfaEnabled'
                  label={
                    <span className='font-bold text-slate-600 text-xs flex items-center gap-1'>
                      雙因素驗證 (MFA){' '}
                      <Tooltip title='建議所有使用者開啟'>
                        <AlertCircle size={12} className='text-slate-400' />
                      </Tooltip>
                    </span>
                  }
                  valuePropName='checked'
                  className='flex flex-col justify-center'
                >
                  <Switch
                    checkedChildren='已啟用'
                    unCheckedChildren='未驗證'
                    className='bg-slate-300'
                  />
                </Form.Item>
              </div>
            </Form>
          </Modal>

          {/* --- 新增使用者 Modal --- */}
          <Modal
            centered
            title={
              <div className='flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3'>
                <div className='bg-indigo-100 p-1.5 rounded-lg'>
                  <UserCheck size={18} className='text-indigo-600' />
                </div>
                <span className='font-black text-lg tracking-tight'>
                  新增系統使用者
                </span>
              </div>
            }
            open={isAddModalVisible}
            onOk={handleAddUser}
            onCancel={() => {
              setIsAddModalVisible(false)
              addForm.resetFields()
            }}
            okText='確認新增'
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
              <UserX
                size={20}
                className='text-slate-400 hover:text-slate-600'
              />
            }
          >
            <Form
              form={addForm}
              layout='vertical'
              className='mt-6 mb-2'
              initialValues={{
                status: '啟用',
                department: '生管部',
                role: '生管排程員'
              }}
            >
              <div className='grid grid-cols-2 gap-x-6 gap-y-4'>
                <Form.Item
                  name='name'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      使用者姓名
                    </span>
                  }
                  rules={[{ required: true, message: '請輸入姓名' }]}
                >
                  <Input
                    className='h-10 rounded-xl border-slate-200'
                    placeholder='例如：王小明'
                  />
                </Form.Item>

                <Form.Item
                  name='email'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      聯絡信箱 (Email)
                    </span>
                  }
                  rules={[
                    { required: true, message: '請輸入信箱' },
                    { type: 'email', message: '信箱格式錯誤' }
                  ]}
                >
                  <Input
                    className='h-10 rounded-xl border-slate-200'
                    placeholder='user@aps-demo.com'
                  />
                </Form.Item>

                <Form.Item
                  name='department'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      所屬部門
                    </span>
                  }
                >
                  <Select className='h-10 rounded-xl'>
                    <Select.Option value='資訊部'>資訊部</Select.Option>
                    <Select.Option value='生管部'>生管部</Select.Option>
                    <Select.Option value='製造部'>製造部</Select.Option>
                    <Select.Option value='業務部'>業務部</Select.Option>
                    <Select.Option value='總經理室'>總經理室</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name='role'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      系統角色 (Role)
                    </span>
                  }
                >
                  <Select className='h-10 rounded-xl'>
                    <Select.Option value='系統管理員'>系統管理員</Select.Option>
                    <Select.Option value='生管排程員'>生管排程員</Select.Option>
                    <Select.Option value='現場主管'>現場主管</Select.Option>
                    <Select.Option value='業務專員'>業務專員</Select.Option>
                    <Select.Option value='高階主管'>高階主管</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name='status'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      初始狀態
                    </span>
                  }
                >
                  <Select className='h-10 rounded-xl'>
                    <Select.Option value='啟用'>
                      <span className='text-emerald-600 font-bold'>啟用中</span>
                    </Select.Option>
                    <Select.Option value='停用'>
                      <span className='text-slate-500 font-bold'>預設停用</span>
                    </Select.Option>
                  </Select>
                </Form.Item>
              </div>
            </Form>
          </Modal>

          {/* --- 調整權限 Modal --- */}
          <Modal
            centered
            title={
              <div className='flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3'>
                <div className='bg-indigo-100 p-1.5 rounded-lg'>
                  <ShieldCheck size={18} className='text-indigo-600' />
                </div>
                <span className='font-black text-lg tracking-tight'>
                  調整存取權限 - {permissionEditingUser?.name}
                </span>
              </div>
            }
            open={isPermissionModalVisible}
            onOk={handleSavePermissions}
            onCancel={() => setIsPermissionModalVisible(false)}
            okText='儲存權限設定'
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
            width={680}
            style={{ maxWidth: '95%' }}
            closeIcon={
              <UserX
                size={20}
                className='text-slate-400 hover:text-slate-600'
              />
            }
          >
            <Form form={permissionForm} layout='vertical' className='mt-4 mb-0'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2'>
                {permissionEditingUser?.permissions.map(perm => (
                  <Form.Item
                    key={perm.module}
                    name={perm.module}
                    label={
                      <span className='font-bold text-slate-600 text-xs'>
                        {perm.module}
                      </span>
                    }
                    className='mb-3'
                  >
                    <Select className='h-10 rounded-xl font-bold'>
                      <Select.Option value='read-write'>
                        <span className='text-emerald-600 flex items-center gap-2'>
                          <Edit3 size={14} /> 讀寫授權
                        </span>
                      </Select.Option>
                      <Select.Option value='read-only'>
                        <span className='text-blue-600 flex items-center gap-2'>
                          <Eye size={14} /> 僅供檢視
                        </span>
                      </Select.Option>
                      <Select.Option value='none'>
                        <span className='text-slate-400 flex items-center gap-2'>
                          <Ban size={14} /> 無存取權
                        </span>
                      </Select.Option>
                    </Select>
                  </Form.Item>
                ))}
              </div>
            </Form>
          </Modal>

          {/* --- 登入日誌 Modal --- */}
          <Modal
            centered
            title={
              <div className='flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3'>
                <div className='bg-slate-100 p-1.5 rounded-lg'>
                  <History size={18} className='text-slate-600' />
                </div>
                <span className='font-black text-lg tracking-tight'>
                  登入日誌 - {logUser?.name}
                </span>
              </div>
            }
            open={isLogModalVisible}
            footer={null}
            onCancel={() => setIsLogModalVisible(false)}
            className='custom-edit-modal top-10'
            width={520}
            closeIcon={
              <UserX
                size={20}
                className='text-slate-400 hover:text-slate-600'
              />
            }
          >
            <div className='mt-6 pl-4 h-[300px] overflow-y-auto custom-scrollbar'>
              <Timeline
                items={[
                  {
                    color: 'green',
                    children: (
                      <div className='flex flex-col gap-1 pb-4'>
                        <span className='font-bold text-sm text-slate-700'>
                          成功登入系統
                        </span>
                        <span className='text-xs text-slate-500 flex items-center gap-1.5'>
                          <MonitorSmartphone size={12} /> Chrome on MacOS
                        </span>
                        <span className='text-xs font-mono text-slate-400 flex items-center gap-1.5'>
                          <Globe size={12} /> IP: 211.75.142.11 (台北)
                        </span>
                        <span className='text-[10px] text-slate-400 font-mono mt-1'>
                          {logUser?.lastLogin}
                        </span>
                      </div>
                    )
                  },
                  {
                    color: 'green',
                    children: (
                      <div className='flex flex-col gap-1 pb-4'>
                        <span className='font-bold text-sm text-slate-700'>
                          成功登入系統
                        </span>
                        <span className='text-xs text-slate-500 flex items-center gap-1.5'>
                          <MonitorSmartphone size={12} /> Chrome on MacOS
                        </span>
                        <span className='text-xs font-mono text-slate-400 flex items-center gap-1.5'>
                          <Globe size={12} /> IP: 211.75.142.11 (台北)
                        </span>
                        <span className='text-[10px] text-slate-400 font-mono mt-1'>
                          {dayjs(logUser?.lastLogin)
                            .subtract(1, 'day')
                            .format('YYYY-MM-DD HH:mm')}
                        </span>
                      </div>
                    )
                  },
                  {
                    color: 'red',
                    children: (
                      <div className='flex flex-col gap-1 pb-4'>
                        <span className='font-bold text-sm text-rose-600'>
                          登入失敗 - 密碼錯誤
                        </span>
                        <span className='text-xs text-slate-500 flex items-center gap-1.5'>
                          <MonitorSmartphone size={12} /> Safari on iOS
                        </span>
                        <span className='text-xs font-mono text-slate-400 flex items-center gap-1.5'>
                          <Globe size={12} /> IP: 114.32.45.66 (台中)
                        </span>
                        <span className='text-[10px] text-slate-400 font-mono mt-1'>
                          {dayjs(logUser?.lastLogin)
                            .subtract(1, 'day')
                            .subtract(2, 'hour')
                            .format('YYYY-MM-DD HH:mm')}
                        </span>
                      </div>
                    )
                  },
                  {
                    color: 'gray',
                    children: (
                      <div className='flex flex-col gap-1 pb-2'>
                        <span className='font-bold text-sm text-slate-500'>
                          系統密碼重設成功
                        </span>
                        <span className='text-xs text-slate-400'>
                          由管理員強制重設
                        </span>
                        <span className='text-[10px] text-slate-400 font-mono mt-1'>
                          {dayjs(logUser?.lastLogin)
                            .subtract(15, 'day')
                            .format('YYYY-MM-DD HH:mm')}
                        </span>
                      </div>
                    )
                  }
                ]}
              />
            </div>
          </Modal>

          <style>{`
            .aps-monitor-table .ant-table-thead > tr > th {
              background: #ffffff !important;
              color: #64748b !important;
              font-weight: 700 !important;
              border-bottom: 1px solid #f1f5f9 !important;
              white-space: nowrap;
              padding-top: 20px !important;
            }
            .aps-monitor-table .ant-table-tbody > tr:hover > td {
              background: #f8fafc !important;
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

            /* 自定義 Modal 樣式 */
            .custom-edit-modal .ant-modal-content {
              border-radius: 24px;
              padding: 24px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              border: 1px solid #f1f5f9;
            }
            .custom-edit-modal .ant-modal-header {
              background: transparent;
              margin-bottom: 0;
            }
            .custom-edit-modal .ant-select-selector {
              border-radius: 12px !important;
              align-items: center;
            }

            /* 自定義滾動條 */
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #f8fafc;
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #94a3b8;
            }

            /* 全局訊息提醒樣式 */
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
