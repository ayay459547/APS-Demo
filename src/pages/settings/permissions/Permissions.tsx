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
  message,
  Popconfirm,
  Radio
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import type { InputRef } from 'antd'
import {
  Search,
  ChevronDown,
  Plus,
  MoreVertical,
  RefreshCw,
  Settings,
  Info,
  Zap,
  Edit,
  Trash2,
  ShieldCheck,
  Key,
  Eye,
  Edit3,
  Ban,
  Users,
  Copy,
  ShieldAlert,
  Shield,
  CheckCircle2,
  XCircle,
  FileCheck
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
export type RoleStatus = '啟用' | '停用'
export type PermissionLevel = 'read-write' | 'read-only' | 'none'

export interface PermissionScope {
  module: string
  level: PermissionLevel
}

export interface RoleNode {
  key: string
  roleId: string
  roleName: string
  description: string
  isSystemDefault: boolean // 系統預設角色不可刪除
  userCount: number // 綁定的人數
  status: RoleStatus
  permissions: PermissionScope[]
  lastUpdated: string
}

const SYSTEM_MODULES = [
  '商品資料管理',
  'BOM 管理',
  '標準製程管理',
  '生產資源建模',
  '排程管理',
  '排程分析',
  '現場與異常',
  '使用者管理',
  '權限管理',
  '系統整合設定'
]

// --- 擬真數據產生器 ---
const mockRoleData: RoleNode[] = [
  {
    key: 'ROLE-SYS-001',
    roleId: 'R-ADMIN',
    roleName: '系統管理員',
    description: '擁有全系統最高權限，可管理使用者、權限及底層系統設定。',
    isSystemDefault: true,
    userCount: 3,
    status: '啟用',
    lastUpdated: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
    permissions: SYSTEM_MODULES.map(mod => ({
      module: mod,
      level: 'read-write'
    }))
  },
  {
    key: 'ROLE-SYS-002',
    roleId: 'R-PLANNER',
    roleName: '生管排程員',
    description: '負責廠區生產計畫排程、工單下發與產能評估。',
    isSystemDefault: true,
    userCount: 12,
    status: '啟用',
    lastUpdated: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm'),
    permissions: [
      { module: '商品資料管理', level: 'read-write' },
      { module: 'BOM 管理', level: 'read-write' },
      { module: '標準製程管理', level: 'read-write' },
      { module: '生產資源建模', level: 'read-only' },
      { module: '排程管理', level: 'read-write' },
      { module: '排程分析', level: 'read-write' },
      { module: '現場與異常', level: 'read-only' },
      { module: '使用者管理', level: 'none' },
      { module: '權限管理', level: 'none' },
      { module: '系統整合設定', level: 'none' }
    ]
  },
  {
    key: 'ROLE-SYS-003',
    roleId: 'R-MANAGER',
    roleName: '現場主管',
    description: '負責現場機台調度、異常回報與進度監督。',
    isSystemDefault: true,
    userCount: 8,
    status: '啟用',
    lastUpdated: dayjs().subtract(15, 'day').format('YYYY-MM-DD HH:mm'),
    permissions: [
      { module: '商品資料管理', level: 'read-only' },
      { module: 'BOM 管理', level: 'read-only' },
      { module: '標準製程管理', level: 'read-only' },
      { module: '生產資源建模', level: 'read-write' },
      { module: '排程管理', level: 'read-only' },
      { module: '排程分析', level: 'read-only' },
      { module: '現場與異常', level: 'read-write' },
      { module: '使用者管理', level: 'none' },
      { module: '權限管理', level: 'none' },
      { module: '系統整合設定', level: 'none' }
    ]
  },
  {
    key: 'ROLE-CUS-001',
    roleId: 'R-SALES',
    roleName: '業務專員',
    description: '負責建立銷售訂單，查看交期與產能負載。',
    isSystemDefault: false,
    userCount: 25,
    status: '啟用',
    lastUpdated: dayjs().subtract(20, 'day').format('YYYY-MM-DD HH:mm'),
    permissions: [
      { module: '商品資料管理', level: 'read-only' },
      { module: 'BOM 管理', level: 'none' },
      { module: '標準製程管理', level: 'none' },
      { module: '生產資源建模', level: 'none' },
      { module: '排程管理', level: 'read-only' },
      { module: '排程分析', level: 'read-only' },
      { module: '現場與異常', level: 'none' },
      { module: '使用者管理', level: 'none' },
      { module: '權限管理', level: 'none' },
      { module: '系統整合設定', level: 'none' }
    ]
  },
  {
    key: 'ROLE-CUS-002',
    roleId: 'R-EXEC',
    roleName: '高階主管',
    description: '廠級管理層，擁有全系統報表與數據檢視權限。',
    isSystemDefault: false,
    userCount: 5,
    status: '啟用',
    lastUpdated: dayjs().subtract(30, 'day').format('YYYY-MM-DD HH:mm'),
    permissions: SYSTEM_MODULES.map(mod => ({
      module: mod,
      level:
        mod.includes('管理') || mod.includes('設定') ? 'read-only' : 'read-only'
    }))
  },
  {
    key: 'ROLE-CUS-003',
    roleId: 'R-PLANNER-AST',
    roleName: '生管助理',
    description: '協助生管排程員處理報表與資料建檔，無排程發布權限。',
    isSystemDefault: false,
    userCount: 0,
    status: '停用',
    lastUpdated: dayjs().subtract(45, 'day').format('YYYY-MM-DD HH:mm'),
    permissions: [
      { module: '商品資料管理', level: 'read-write' },
      { module: 'BOM 管理', level: 'read-only' },
      { module: '標準製程管理', level: 'read-only' },
      { module: '生產資源建模', level: 'none' },
      { module: '排程管理', level: 'read-only' },
      { module: '排程分析', level: 'none' },
      { module: '現場與異常', level: 'read-only' },
      { module: '使用者管理', level: 'none' },
      { module: '權限管理', level: 'none' },
      { module: '系統整合設定', level: 'none' }
    ]
  }
]

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
export default function RoleManager() {
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const searchInputRef = useRef<InputRef>(null)

  // 狀態管理區
  const [roleData, setRoleData] = useState<RoleNode[]>(mockRoleData)

  // 編輯基本資料 Modal
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleNode | null>(null)
  const [editForm] = Form.useForm()

  // 新增角色 Modal
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [addForm] = Form.useForm()

  // 調整權限矩陣 Modal
  const [isPermissionModalVisible, setIsPermissionModalVisible] =
    useState(false)
  const [permissionEditingRole, setPermissionEditingRole] =
    useState<RoleNode | null>(null)
  const [permissionForm] = Form.useForm()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(() => {
    const active = roleData.filter(d => d.status === '啟用').length
    const sysDefault = roleData.filter(d => d.isSystemDefault).length
    const custom = roleData.filter(d => !d.isSystemDefault).length
    const totalUsers = roleData.reduce((sum, role) => sum + role.userCount, 0)

    return { active, sysDefault, custom, totalUsers, total: roleData.length }
  }, [roleData])

  // --- 操作處理函式 ---
  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success({
        content: '角色與權限清單已重新整理！',
        className: 'custom-message'
      })
    }, 600)
  }

  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields()
      setRoleData(prev =>
        prev.map(r =>
          r.key === editingRole?.key
            ? {
                ...r,
                ...values,
                lastUpdated: dayjs().format('YYYY-MM-DD HH:mm')
              }
            : r
        )
      )
      setIsEditModalVisible(false)
      message.success({
        content: `角色 ${values.roleName} 的基本資料已更新！`,
        className: 'custom-message'
      })
    } catch (error) {
      console.log('Validation Failed:', error)
    }
  }

  const handleAddRole = async () => {
    try {
      const values = await addForm.validateFields()
      const newRole: RoleNode = {
        key: `ROLE-CUS-${Date.now()}`,
        roleId: `R-${Math.floor(Math.random() * 9000) + 1000}`,
        ...values,
        isSystemDefault: false,
        userCount: 0,
        lastUpdated: dayjs().format('YYYY-MM-DD HH:mm'),
        permissions: SYSTEM_MODULES.map(mod => ({ module: mod, level: 'none' }))
      }
      setRoleData([newRole, ...roleData])
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success({
        content: `已成功新增自訂角色 ${values.roleName}！`,
        className: 'custom-message'
      })
    } catch (error) {
      console.log('Validation Failed:', error)
    }
  }

  const handleCloneRole = (role: RoleNode) => {
    const clonedRole: RoleNode = {
      ...role,
      key: `ROLE-CUS-${Date.now()}`,
      roleId: `${role.roleId}-COPY`,
      roleName: `${role.roleName} (複製)`,
      isSystemDefault: false,
      userCount: 0,
      status: '停用',
      lastUpdated: dayjs().format('YYYY-MM-DD HH:mm'),
      permissions: JSON.parse(JSON.stringify(role.permissions))
    }
    setRoleData([clonedRole, ...roleData])
    message.success({
      content: `已成功複製角色 ${role.roleName}！`,
      className: 'custom-message'
    })
  }

  const handleSavePermissions = async () => {
    try {
      const values = await permissionForm.validateFields()
      const newPermissions: PermissionScope[] = SYSTEM_MODULES.map(module => ({
        module,
        level: values[module] as PermissionLevel
      }))

      setRoleData(prev =>
        prev.map(r =>
          r.key === permissionEditingRole?.key
            ? {
                ...r,
                permissions: newPermissions,
                lastUpdated: dayjs().format('YYYY-MM-DD HH:mm')
              }
            : r
        )
      )
      setIsPermissionModalVisible(false)
      message.success({
        content: `已成功更新 ${permissionEditingRole?.roleName} 的權限矩陣！`,
        className: 'custom-message'
      })
    } catch (error) {
      console.log('Validation Failed:', error)
    }
  }

  // --- 搜尋過濾邏輯 ---
  const getSearchProps = (dataIndex: keyof RoleNode, title: string) => ({
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
    onFilter: (value: any, record: RoleNode): boolean => {
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
        <ShieldAlert size={16} className='text-indigo-600' />
        <span className='font-bold text-slate-800'>角色與權限概覽</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='總角色數'
          value={stats.total}
          unit='個'
          icon={Shield}
          colorClass='text-blue-600'
          bgClass='bg-blue-50'
          iconColorClass='text-blue-500'
        />
        <StatCard
          title='系統預設角色'
          value={stats.sysDefault}
          unit='個'
          icon={Key}
          colorClass='text-purple-600'
          bgClass='bg-purple-50'
          iconColorClass='text-purple-500'
          trend='不可刪除'
        />
        <StatCard
          title='啟用中角色'
          value={stats.active}
          unit='個'
          icon={CheckCircle2}
          colorClass='text-emerald-600'
          bgClass='bg-emerald-50'
          iconColorClass='text-emerald-500'
        />
        <StatCard
          title='角色授權總數'
          value={stats.totalUsers}
          unit='人次'
          icon={Users}
          colorClass='text-indigo-600'
          bgClass='bg-indigo-50'
          iconColorClass='text-indigo-500'
          trend='綁定於活躍帳號'
        />
      </div>
    </div>
  )

  // --- 展開的權限視圖 ---
  const expandedRowRender = (record: RoleNode) => {
    return (
      <div className='py-4 px-6 bg-slate-50/80 border-y border-indigo-100 shadow-inner shadow-indigo-50/50'>
        <div className='bg-white border border-slate-200 p-4 rounded-xl shadow-sm'>
          <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-4'>
            <div className='flex items-center gap-2'>
              <FileCheck size={16} className='text-indigo-600' />
              <span className='font-bold text-slate-700 text-[13px]'>
                模組存取權限矩陣 (Permission Scopes)
              </span>
            </div>
            <Button
              size='small'
              type='primary'
              ghost
              className='text-xs font-bold rounded-md flex items-center gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50'
              onClick={() => {
                setPermissionEditingRole(record)
                const formValues: Record<string, string> = {}
                SYSTEM_MODULES.forEach(mod => {
                  const perm = record.permissions.find(p => p.module === mod)
                  formValues[mod] = perm ? perm.level : 'none'
                })
                permissionForm.setFieldsValue(formValues)
                setIsPermissionModalVisible(true)
              }}
            >
              <Zap size={14} /> 快速調整權限
            </Button>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
            {SYSTEM_MODULES.map((mod, idx) => {
              const perm = record.permissions.find(p => p.module === mod) || {
                module: mod,
                level: 'none'
              }
              return (
                <div
                  key={idx}
                  className='flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100'
                >
                  <span
                    className='text-xs font-bold text-slate-600 truncate'
                    title={mod}
                  >
                    {mod}
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
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // --- 表格欄位定義 ---
  const columns: ColumnsType<RoleNode> = [
    {
      title: '角色名稱',
      key: 'roleName',
      width: 220,
      fixed: 'left',
      sorter: (a, b) => a.roleName.localeCompare(b.roleName),
      ...getSearchProps('roleName', '角色名稱'),
      render: (_, record) => (
        <div className='flex items-center gap-3'>
          <Avatar
            className={cn(
              'font-bold shrink-0 shadow-sm',
              record.status === '啟用'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-200 text-slate-400'
            )}
            size={36}
          >
            <Shield size={18} />
          </Avatar>
          <div className='flex flex-col'>
            <span
              className={cn(
                'font-bold text-[13px] flex items-center gap-1',
                record.status === '啟用' ? 'text-slate-800' : 'text-slate-400'
              )}
            >
              {record.roleName}
              {record.isSystemDefault && (
                <Tag className='m-0 text-[9px] px-1 py-0 border-none bg-blue-50 text-blue-500 font-black ml-1'>
                  系統
                </Tag>
              )}
            </span>
            <span className='text-[11px] text-slate-400 font-mono tracking-tight'>
              {record.roleId}
            </span>
          </div>
        </div>
      )
    },
    {
      title: '角色描述',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      render: text => (
        <span
          className='text-xs font-medium text-slate-500 truncate max-w-[280px] inline-block'
          title={text}
        >
          {text}
        </span>
      )
    },
    {
      title: '綁定人數',
      dataIndex: 'userCount',
      key: 'userCount',
      width: 120,
      align: 'center',
      sorter: (a, b) => a.userCount - b.userCount,
      render: count => (
        <Tag className='m-0 border-none bg-slate-100 text-slate-600 font-bold px-3 py-0.5 rounded-full flex items-center justify-center gap-1 w-fit mx-auto'>
          <Users size={12} className='inline' /> {count} 人
        </Tag>
      )
    },
    {
      title: '角色狀態',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      sorter: (a, b) => a.status.localeCompare(b.status),
      filters: [
        { text: '啟用', value: '啟用' },
        { text: '停用', value: '停用' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: RoleStatus) => {
        const isEnable = status === '啟用'
        return (
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border w-fit',
              isEnable
                ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            )}
          >
            {isEnable ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {status}
          </div>
        )
      }
    },
    {
      title: '最後異動時間',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      width: 150,
      sorter: (a, b) =>
        dayjs(a.lastUpdated).valueOf() - dayjs(b.lastUpdated).valueOf(),
      render: date => (
        <div className='flex flex-col gap-0.5'>
          <span className='font-mono font-bold text-slate-600 text-[11px]'>
            {date.split(' ')[0]}
          </span>
          <span className='font-mono text-slate-400 text-[10px]'>
            {date.split(' ')[1]}
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
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: '1',
                label: (
                  <div className='flex items-center gap-2 w-full'>
                    <Edit size={14} className='text-blue-500' /> 編輯角色資訊
                  </div>
                ),
                onClick: ({ domEvent }) => {
                  domEvent.stopPropagation()
                  setEditingRole(record)
                  editForm.setFieldsValue(record)
                  setIsEditModalVisible(true)
                }
              },
              {
                key: '2',
                label: (
                  <div className='flex items-center gap-2 w-full'>
                    <Copy size={14} className='text-indigo-500' /> 複製角色配置
                  </div>
                ),
                onClick: ({ domEvent }) => {
                  domEvent.stopPropagation()
                  handleCloneRole(record)
                }
              },
              { key: '3', type: 'divider' },
              {
                key: '4',
                label: (
                  <div onClick={e => e.stopPropagation()} className='w-full'>
                    <Popconfirm
                      title={
                        record.status === '啟用'
                          ? '停用角色確認'
                          : '啟用角色確認'
                      }
                      description={
                        <div className='text-sm max-w-[200px]'>
                          確定要將 <b>{record.roleName}</b> 設為
                          {record.status === '啟用' ? '停用' : '啟用'}嗎？
                          {record.status === '啟用' && record.userCount > 0 && (
                            <p className='mt-1 text-rose-500 font-bold text-xs'>
                              警告：將影響目前綁定的 {record.userCount}{' '}
                              位使用者！
                            </p>
                          )}
                        </div>
                      }
                      onConfirm={() => {
                        setRoleData(prev =>
                          prev.map(r =>
                            r.key === record.key
                              ? {
                                  ...r,
                                  status:
                                    record.status === '啟用' ? '停用' : '啟用',
                                  lastUpdated:
                                    dayjs().format('YYYY-MM-DD HH:mm')
                                }
                              : r
                          )
                        )
                        message.success({
                          content: `角色已成功${record.status === '啟用' ? '停用' : '啟用'}！`,
                          className: 'custom-message'
                        })
                      }}
                      okText='確定'
                      cancelText='取消'
                      placement='left'
                      okButtonProps={{ danger: record.status === '啟用' }}
                    >
                      <div
                        className={cn(
                          'flex items-center gap-2 w-full',
                          record.status === '啟用'
                            ? 'text-amber-500'
                            : 'text-emerald-600'
                        )}
                      >
                        {record.status === '啟用' ? (
                          <Ban size={14} />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        {record.status === '啟用'
                          ? '停用此角色'
                          : '重新啟用角色'}
                      </div>
                    </Popconfirm>
                  </div>
                )
              },
              {
                key: '5',
                disabled: record.isSystemDefault || record.userCount > 0,
                label: (
                  <div onClick={e => e.stopPropagation()} className='w-full'>
                    <Popconfirm
                      title='刪除角色'
                      description={`確定要永久刪除 ${record.roleName} 嗎？`}
                      onConfirm={() => {
                        setRoleData(prev =>
                          prev.filter(r => r.key !== record.key)
                        )
                        message.success({
                          content: '角色已刪除！',
                          className: 'custom-message'
                        })
                      }}
                      okText='確定刪除'
                      cancelText='取消'
                      placement='left'
                      okButtonProps={{ danger: true }}
                    >
                      <div className='flex items-center gap-2 w-full text-rose-500'>
                        <Trash2 size={14} /> 刪除角色
                      </div>
                    </Popconfirm>
                  </div>
                )
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
            onClick={e => e.stopPropagation()}
          />
        </Dropdown>
      )
    }
  ]

  const rowSelection: TableProps<RoleNode>['rowSelection'] = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    columnWidth: 48,
    fixed: 'left',
    getCheckboxProps: record => ({
      disabled: record.isSystemDefault // 系統預設角色不允許批次刪除等危險操作
    })
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5', // Indigo 600
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
          {loading && (
            <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-[110] flex items-center justify-center rounded-[28px] mt-[60px]'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin' />
                <span className='text-xs font-black text-indigo-600 tracking-widest uppercase'>
                  Loading Roles...
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
                      角色權限概覽
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
                onClick={() => setIsAddModalVisible(true)}
                className='rounded-xl bg-indigo-600 shadow-md shadow-indigo-100 font-bold border-none h-10 flex items-center justify-center hover:bg-indigo-500'
              >
                <span className='hidden sm:inline ml-1 text-xs'>
                  建立自訂角色
                </span>
              </Button>
            </div>
          </div>

          <Card
            className='shadow-xl shadow-slate-200/50 border-none rounded-[32px] overflow-hidden bg-white'
            styles={{ body: { padding: 0 } }}
          >
            {selectedRowKeys.length > 0 && (
              <div className='mx-4 mt-4 bg-indigo-50/80 border border-indigo-100 p-3 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2 duration-300'>
                <div className='flex items-center gap-2 text-indigo-700'>
                  <Zap size={16} className='fill-indigo-700' />
                  <span className='text-sm font-bold text-indigo-700'>
                    已選取 {selectedRowKeys.length} 個自訂角色
                  </span>
                </div>
                <Space>
                  <Button
                    size='small'
                    icon={<Trash2 size={14} />}
                    danger
                    className='rounded-lg font-bold text-xs bg-white shadow-sm'
                  >
                    批次刪除
                  </Button>
                  <Button
                    type='text'
                    size='small'
                    onClick={() => setSelectedRowKeys([])}
                    className='text-slate-400 text-xs hover:text-slate-600'
                  >
                    取消
                  </Button>
                </Space>
              </div>
            )}

            <div className='bg-slate-50/50 p-5 border-b border-slate-100 flex items-center justify-between'>
              <div className='flex items-center gap-3 text-slate-500 text-[11px] font-black uppercase tracking-widest'>
                <Settings size={14} /> 角色與權限管理 (Roles Master)
              </div>
              <div className='flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm'>
                <Info size={14} className='text-indigo-500' />
                <span className='text-[10px] text-slate-400 font-bold uppercase tracking-tight'>
                  提示：點擊列表列可展開編輯角色的「模組權限矩陣」
                </span>
              </div>
            </div>

            <div className='p-4 pt-0'>
              <Table<RoleNode>
                rowSelection={rowSelection}
                columns={columns}
                dataSource={roleData}
                loading={false}
                scroll={{ x: 1000 }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: false,
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

          {/* 編輯角色 Modal */}
          <Modal
            centered
            title={
              <div className='flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3'>
                <div className='bg-indigo-100 p-1.5 rounded-lg'>
                  <Edit3 size={18} className='text-indigo-600' />
                </div>
                <span className='font-black text-lg tracking-tight'>
                  編輯角色基本資訊
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
                'bg-indigo-600 hover:bg-indigo-500 border-none shadow-md shadow-indigo-200 rounded-xl font-bold h-10 px-6'
            }}
            cancelButtonProps={{
              className:
                'rounded-xl font-bold text-slate-500 border-slate-200 h-10 px-6 hover:bg-slate-50'
            }}
            className='custom-edit-modal top-20'
            width={500}
            closeIcon={
              <XCircle
                size={20}
                className='text-slate-400 hover:text-slate-600'
              />
            }
          >
            <Form form={editForm} layout='vertical' className='mt-6 mb-2'>
              <Form.Item
                name='roleName'
                label={
                  <span className='font-bold text-slate-600 text-xs'>
                    角色名稱
                  </span>
                }
                rules={[{ required: true, message: '請輸入角色名稱' }]}
              >
                <Input
                  className='h-10 rounded-xl border-slate-200'
                  disabled={editingRole?.isSystemDefault}
                />
              </Form.Item>
              <Form.Item
                name='description'
                label={
                  <span className='font-bold text-slate-600 text-xs'>
                    角色描述
                  </span>
                }
              >
                <Input.TextArea
                  rows={3}
                  className='rounded-xl border-slate-200'
                />
              </Form.Item>
              <Form.Item
                name='status'
                label={
                  <span className='font-bold text-slate-600 text-xs'>狀態</span>
                }
              >
                <Radio.Group className='flex gap-4 mt-1'>
                  <Radio value='啟用'>
                    <span className='text-emerald-600 font-bold'>啟用</span>
                  </Radio>
                  <Radio value='停用'>
                    <span className='text-slate-500 font-bold'>停用</span>
                  </Radio>
                </Radio.Group>
              </Form.Item>
            </Form>
          </Modal>

          {/* 新增角色 Modal */}
          <Modal
            centered
            title={
              <div className='flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3'>
                <div className='bg-indigo-100 p-1.5 rounded-lg'>
                  <Plus size={18} className='text-indigo-600' />
                </div>
                <span className='font-black text-lg tracking-tight'>
                  建立自訂角色
                </span>
              </div>
            }
            open={isAddModalVisible}
            onOk={handleAddRole}
            onCancel={() => {
              setIsAddModalVisible(false)
              addForm.resetFields()
            }}
            okText='建立角色'
            cancelText='取消'
            okButtonProps={{
              className:
                'bg-indigo-600 hover:bg-indigo-500 border-none shadow-md shadow-indigo-200 rounded-xl font-bold h-10 px-6'
            }}
            cancelButtonProps={{
              className:
                'rounded-xl font-bold text-slate-500 border-slate-200 h-10 px-6 hover:bg-slate-50'
            }}
            className='custom-edit-modal top-20'
            width={500}
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
              className='mt-6 mb-2'
              initialValues={{ status: '啟用' }}
            >
              <Form.Item
                name='roleName'
                label={
                  <span className='font-bold text-slate-600 text-xs'>
                    角色名稱
                  </span>
                }
                rules={[{ required: true, message: '請輸入角色名稱' }]}
              >
                <Input
                  className='h-10 rounded-xl border-slate-200'
                  placeholder='例如：生管助理'
                />
              </Form.Item>
              <Form.Item
                name='description'
                label={
                  <span className='font-bold text-slate-600 text-xs'>
                    角色描述
                  </span>
                }
              >
                <Input.TextArea
                  rows={3}
                  className='rounded-xl border-slate-200'
                  placeholder='簡述此角色的主要職責...'
                />
              </Form.Item>
              <Form.Item
                name='status'
                label={
                  <span className='font-bold text-slate-600 text-xs'>
                    初始狀態
                  </span>
                }
              >
                <Radio.Group className='flex gap-4 mt-1'>
                  <Radio value='啟用'>
                    <span className='text-emerald-600 font-bold'>啟用</span>
                  </Radio>
                  <Radio value='停用'>
                    <span className='text-slate-500 font-bold'>停用</span>
                  </Radio>
                </Radio.Group>
              </Form.Item>
            </Form>
          </Modal>

          {/* 調整權限 Modal */}
          <Modal
            centered
            title={
              <div className='flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3'>
                <div className='bg-indigo-100 p-1.5 rounded-lg'>
                  <ShieldCheck size={18} className='text-indigo-600' />
                </div>
                <span className='font-black text-lg tracking-tight'>
                  調整存取權限 - {permissionEditingRole?.roleName}
                </span>
              </div>
            }
            open={isPermissionModalVisible}
            onOk={handleSavePermissions}
            onCancel={() => setIsPermissionModalVisible(false)}
            okText='儲存權限矩陣'
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
              <XCircle
                size={20}
                className='text-slate-400 hover:text-slate-600'
              />
            }
          >
            <Form form={permissionForm} layout='vertical' className='mt-4 mb-0'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2'>
                {SYSTEM_MODULES.map(mod => (
                  <Form.Item
                    key={mod}
                    name={mod}
                    label={
                      <span className='font-bold text-slate-600 text-xs'>
                        {mod}
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
