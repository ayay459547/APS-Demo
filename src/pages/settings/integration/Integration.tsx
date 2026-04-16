import React, { useState, useEffect, useMemo } from 'react'
import {
  ConfigProvider,
  Card,
  Popover,
  Badge,
  Tooltip,
  Button,
  Space,
  Switch,
  Modal,
  Form,
  Input,
  Select,
  message,
  Progress,
  Timeline,
  Popconfirm,
  Checkbox
} from 'antd'
import {
  RefreshCw,
  Settings,
  Info,
  ShieldCheck,
  Database,
  Activity,
  Network,
  PackageOpen,
  Cpu,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Link,
  Link2Off,
  Cable,
  ArrowRightLeft,
  ServerCrash,
  RadioTower,
  PlayCircle,
  ChevronDown,
  Plus,
  Trash2
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
export type SyncStatus = 'Connected' | 'Syncing' | 'Error' | 'Disabled'
export type SystemType = 'ERP' | 'MES' | 'PLM' | 'WMS' | 'SCADA' | 'HRMS'

export interface IntegrationNode {
  id: string
  name: string
  type: SystemType
  provider: string
  status: SyncStatus
  lastSync: string
  syncCount: number
  errorCount: number
  description: string
  syncEntities: string[] // 新增：要同步的資料實體
}

// --- 擬真數據產生器 ---
const mockIntegrations: IntegrationNode[] = [
  {
    id: 'INT-ERP-01',
    name: '企業資源規劃系統',
    type: 'ERP',
    provider: 'SAP S/4HANA',
    status: 'Connected',
    lastSync: dayjs().subtract(5, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    syncCount: 14520,
    errorCount: 2,
    description: '同步銷售訂單、採購單、主檔物料與庫存水位。',
    syncEntities: [
      'sales_orders',
      'purchase_orders',
      'inventory',
      'item_master'
    ]
  },
  {
    id: 'INT-MES-01',
    name: '製造執行系統',
    type: 'MES',
    provider: 'Siemens Opcenter',
    status: 'Syncing',
    lastSync: dayjs().subtract(1, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    syncCount: 52400,
    errorCount: 0,
    description: '即時收集現場報工、WIP 在製品進度與工單狀態。',
    syncEntities: ['shop_floor_data', 'wip_status']
  },
  {
    id: 'INT-PLM-01',
    name: '產品生命週期管理',
    type: 'PLM',
    provider: 'PTC Windchill',
    status: 'Connected',
    lastSync: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    syncCount: 850,
    errorCount: 0,
    description: '接收最新工程變更 (ECN)、BOM 結構與標準製程。',
    syncEntities: ['bom_structures', 'standard_routings']
  },
  {
    id: 'INT-WMS-01',
    name: '倉儲管理系統',
    type: 'WMS',
    provider: 'Manhattan Active',
    status: 'Connected',
    lastSync: dayjs().subtract(15, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    syncCount: 3200,
    errorCount: 15,
    description: '同步入庫、出庫紀錄與儲位即時動態。',
    syncEntities: ['inventory_movements']
  },
  {
    id: 'INT-SCA-01',
    name: '資料採集與監視',
    type: 'SCADA',
    provider: 'Ignition SCADA',
    status: 'Error',
    lastSync: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    syncCount: 128000,
    errorCount: 450,
    description: '機台稼動率 (OEE)、感測器數值與異常停機警報。',
    syncEntities: ['equipment_status', 'oee']
  },
  {
    id: 'INT-HRM-01',
    name: '人力資源管理系統',
    type: 'HRMS',
    provider: 'Workday',
    status: 'Disabled',
    lastSync: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    syncCount: 0,
    errorCount: 0,
    description: '同步員工班表、請假紀錄與技能證照。',
    syncEntities: ['hr_attendance']
  }
]

// 所有可選的同步實體清單
const ENTITY_OPTIONS = [
  { label: '銷售訂單 (Sales Orders)', value: 'sales_orders' },
  { label: '採購單 (Purchase Orders)', value: 'purchase_orders' },
  { label: '產品主檔 (Item Master)', value: 'item_master' },
  { label: '庫存與儲位 (Inventory)', value: 'inventory' },
  { label: '庫存異動 (Inventory Movements)', value: 'inventory_movements' },
  { label: 'BOM 結構 (BOM Structures)', value: 'bom_structures' },
  { label: '標準製程 (Standard Routings)', value: 'standard_routings' },
  { label: '現場報工 (Shop Floor Data)', value: 'shop_floor_data' },
  { label: '在製品狀態 (WIP Status)', value: 'wip_status' },
  { label: '設備狀態 (Equipment Status)', value: 'equipment_status' },
  { label: '機台稼動率 (OEE)', value: 'oee' },
  { label: '人員考勤與班表 (HR Attendance)', value: 'hr_attendance' }
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

// --- 輔助函數：系統圖示與顏色 ---
const getSystemMeta = (type: SystemType) => {
  switch (type) {
    case 'ERP':
      return {
        icon: Database,
        colorClass: 'text-blue-600',
        bgClass: 'bg-blue-50',
        borderClass: 'border-blue-200'
      }
    case 'MES':
      return {
        icon: Activity,
        colorClass: 'text-indigo-600',
        bgClass: 'bg-indigo-50',
        borderClass: 'border-indigo-200'
      }
    case 'PLM':
      return {
        icon: Network,
        colorClass: 'text-emerald-600',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-200'
      }
    case 'WMS':
      return {
        icon: PackageOpen,
        colorClass: 'text-amber-600',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-200'
      }
    case 'SCADA':
      return {
        icon: Cpu,
        colorClass: 'text-cyan-600',
        bgClass: 'bg-cyan-50',
        borderClass: 'border-cyan-200'
      }
    case 'HRMS':
      return {
        icon: Users,
        colorClass: 'text-purple-600',
        bgClass: 'bg-purple-50',
        borderClass: 'border-purple-200'
      }
    default:
      return {
        icon: Link,
        colorClass: 'text-slate-600',
        bgClass: 'bg-slate-50',
        borderClass: 'border-slate-200'
      }
  }
}

// --- 主元件 ---
export default function SystemIntegration() {
  const [loading, setLoading] = useState<boolean>(true)
  const [integrations, setIntegrations] =
    useState<IntegrationNode[]>(mockIntegrations)

  // 編輯設定 Modal 狀態
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false)
  const [editingNode, setEditingNode] = useState<IntegrationNode | null>(null)
  const [configForm] = Form.useForm()

  // 新增系統 Modal 狀態
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [addForm] = Form.useForm()

  // 日誌 Modal 狀態
  const [isLogModalVisible, setIsLogModalVisible] = useState(false)
  const [logNode, setLogNode] = useState<IntegrationNode | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(() => {
    const connected = integrations.filter(
      d => d.status === 'Connected' || d.status === 'Syncing'
    ).length
    const error = integrations.filter(d => d.status === 'Error').length
    const totalSync = integrations.reduce(
      (sum, curr) => sum + curr.syncCount,
      0
    )
    const totalError = integrations.reduce(
      (sum, curr) => sum + curr.errorCount,
      0
    )
    const successRate =
      totalSync === 0
        ? 100
        : Math.round(((totalSync - totalError) / totalSync) * 1000) / 10

    return {
      connected,
      error,
      totalSync,
      successRate,
      total: integrations.length
    }
  }, [integrations])

  const handleRefreshAll = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success({
        content: '已重新獲取所有系統連線狀態！',
        className: 'custom-message'
      })
    }, 800)
  }

  const handleManualSync = (id: string, name: string) => {
    setIntegrations(prev =>
      prev.map(node => (node.id === id ? { ...node, status: 'Syncing' } : node))
    )
    message.loading({
      content: `${name} 強制同步中...`,
      key: 'syncing',
      duration: 0
    })

    setTimeout(() => {
      setIntegrations(prev =>
        prev.map(node =>
          node.id === id
            ? {
                ...node,
                status: 'Connected',
                lastSync: dayjs().format('YYYY-MM-DD HH:mm:ss')
              }
            : node
        )
      )
      message.success({
        content: `${name} 同步完成！`,
        key: 'syncing',
        className: 'custom-message'
      })
    }, 2000)
  }

  const handleDeleteNode = (id: string, name: string) => {
    setIntegrations(prev => prev.filter(node => node.id !== id))
    message.success({
      content: `已刪除節點 ${name}！`,
      className: 'custom-message'
    })
  }

  // --- 儲存編輯設定 ---
  const handleSaveConfig = async () => {
    try {
      const values = await configForm.validateFields()
      setIntegrations(prev =>
        prev.map(node =>
          node.id === editingNode?.id
            ? {
                ...node,
                status: values.enabled ? 'Connected' : 'Disabled',
                syncEntities: values.syncEntities || []
              }
            : node
        )
      )
      setIsConfigModalVisible(false)
      message.success({
        content: `${editingNode?.name} 整合設定已更新！`,
        className: 'custom-message'
      })
    } catch (error) {
      console.log('Validation Failed:', error)
    }
  }

  // --- 新增系統節點 ---
  const handleAddNode = async () => {
    try {
      const values = await addForm.validateFields()
      const newNode: IntegrationNode = {
        id: `INT-${values.type}-${Math.floor(Math.random() * 9000) + 1000}`,
        name: values.name,
        type: values.type as SystemType,
        provider: values.provider,
        status: 'Connected', // 預設連線
        lastSync: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        syncCount: 0,
        errorCount: 0,
        description: values.description || '自訂新增的整合系統。',
        syncEntities: values.syncEntities || []
      }

      setIntegrations([newNode, ...integrations])
      setIsAddModalVisible(false)
      addForm.resetFields()
      message.success({
        content: `已成功新增整合節點 ${values.name}！`,
        className: 'custom-message'
      })
    } catch (error) {
      console.log('Validation Failed:', error)
    }
  }

  const handleTestConnection = () => {
    message.loading({ content: '測試連線中...', key: 'testing' })
    setTimeout(() => {
      message.success({
        content: '連線測試成功！API Endpoint 回應 HTTP 200 OK。',
        key: 'testing',
        className: 'custom-message'
      })
    }, 1200)
  }

  // --- Popover KPI 內容 ---
  const statsContent = (
    <div className='w-full max-w-[480px] py-1'>
      <div className='flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5'>
        <Cable size={16} className='text-indigo-600' />
        <span className='font-bold text-slate-800'>全廠系統資料流概覽</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='API 健康連線數'
          value={stats.connected}
          unit={`/ ${stats.total} 個`}
          icon={CheckCircle2}
          colorClass='text-emerald-600'
          bgClass='bg-emerald-50'
          iconColorClass='text-emerald-500'
        />
        <StatCard
          title='今日資料傳輸量'
          value={(stats.totalSync / 1000).toFixed(1)}
          unit='K 筆'
          icon={ArrowRightLeft}
          colorClass='text-blue-600'
          bgClass='bg-blue-50'
          iconColorClass='text-blue-500'
          trend='即時同步中'
        />
        <StatCard
          title='斷線 / 同步異常'
          value={stats.error}
          unit='個'
          icon={ServerCrash}
          colorClass='text-rose-600'
          bgClass='bg-rose-100/80'
          iconColorClass='text-rose-500'
          isAlert={stats.error > 0}
          trend='需工程師檢查'
        />
        <StatCard
          title='API 傳輸成功率'
          value={stats.successRate}
          unit='%'
          icon={ShieldCheck}
          colorClass='text-purple-600'
          bgClass='bg-purple-50'
          iconColorClass='text-purple-500'
        />
      </div>
    </div>
  )

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#4f46e5', borderRadius: 12, borderRadiusSM: 4 }
      }}
    >
      <div className='w-full min-h-screen bg-[#f8fafc] p-4 font-sans'>
        <div className='mx-auto px-2 pt-2 pb-8 space-y-6 animate-fade-in relative max-w-[1600px]'>
          {loading && (
            <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-[110] flex items-center justify-center rounded-[28px] mt-[60px]'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin' />
                <span className='text-xs font-black text-indigo-600 tracking-widest uppercase'>
                  Connecting Systems...
                </span>
              </div>
            </div>
          )}

          {/* 玻璃透視頂部導航列 */}
          <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/50 py-2 rounded-xl sticky top-0 z-20 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='bg-indigo-600 p-1.5 rounded-lg shadow-indigo-200 shadow-lg'>
                <RadioTower size={18} className='text-white' />
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
                      整合節點監控
                    </span>
                    <div className='flex gap-1'>
                      <Badge
                        count={stats.connected}
                        style={{
                          backgroundColor: '#10b981',
                          fontSize: '10px',
                          boxShadow: 'none'
                        }}
                      />
                      {stats.error > 0 && (
                        <Badge
                          count={stats.error}
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
              <Tooltip title='重新整理所有連線狀態'>
                <Button
                  type='text'
                  icon={
                    <RefreshCw
                      size={16}
                      className={loading ? 'animate-spin' : ''}
                    />
                  }
                  className='text-slate-400 hover:bg-slate-100 rounded-xl h-10 w-10 flex items-center justify-center'
                  onClick={handleRefreshAll}
                />
              </Tooltip>
              <Button
                type='primary'
                icon={<Plus size={16} />}
                onClick={() => setIsAddModalVisible(true)}
                className='rounded-xl bg-indigo-600 shadow-md shadow-indigo-100 font-bold border-none h-10 flex items-center justify-center hover:bg-indigo-500'
              >
                <span className='hidden sm:inline ml-1 text-xs'>
                  新增整合節點
                </span>
              </Button>
            </div>
          </div>

          <div className='flex items-center gap-3 text-slate-500 text-[12px] font-black uppercase tracking-widest pl-2'>
            <Cable size={16} /> 核心系統整合矩陣 (Integration Matrix)
          </div>

          {/* 系統整合卡片 Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
            {integrations.map(node => {
              const meta = getSystemMeta(node.type)
              const MetaIcon = meta.icon

              const isConnected = node.status === 'Connected'
              const isSyncing = node.status === 'Syncing'
              const isError = node.status === 'Error'
              const isDisabled = node.status === 'Disabled'

              let statusColor = 'bg-slate-100 text-slate-500 border-slate-200'
              let StatusIcon = Link2Off
              if (isConnected) {
                statusColor =
                  'bg-emerald-50 text-emerald-600 border-emerald-200'
                StatusIcon = CheckCircle2
              } else if (isSyncing) {
                statusColor = 'bg-blue-50 text-blue-600 border-blue-200'
                StatusIcon = RefreshCw
              } else if (isError) {
                statusColor = 'bg-rose-50 text-rose-600 border-rose-200'
                StatusIcon = AlertCircle
              }

              return (
                <Card
                  key={node.id}
                  className={cn(
                    'border-none rounded-[24px] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden bg-white group',
                    isError && 'ring-1 ring-rose-200 shadow-rose-100/50'
                  )}
                  styles={{ body: { padding: 0 } }}
                >
                  <div className='p-5 pb-4'>
                    <div className='flex justify-between items-start mb-4'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={cn(
                            'w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner border',
                            meta.bgClass,
                            meta.colorClass,
                            meta.borderClass
                          )}
                        >
                          <MetaIcon size={24} />
                        </div>
                        <div className='flex flex-col'>
                          <span className='font-black text-slate-800 text-base tracking-tight'>
                            {node.type}
                          </span>
                          <span className='text-xs font-bold text-slate-400'>
                            {node.provider}
                          </span>
                        </div>
                      </div>
                      <div
                        className={cn(
                          'px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-bold border h-fit',
                          statusColor
                        )}
                      >
                        <StatusIcon
                          size={12}
                          className={isSyncing ? 'animate-spin' : ''}
                        />
                        {node.status}
                        {isConnected && (
                          <span className='relative flex h-2 w-2 ml-1'>
                            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                            <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500'></span>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className='text-xs text-slate-500 font-medium mb-5 line-clamp-2 h-8'>
                      {node.description}
                    </p>

                    <div className='bg-slate-50 rounded-xl p-3 border border-slate-100 grid grid-cols-2 gap-2 relative overflow-hidden'>
                      {/* 如果停用，加上灰色遮罩 */}
                      {isDisabled && (
                        <div className='absolute inset-0 bg-slate-100/80 z-10 backdrop-blur-[1px] flex items-center justify-center'>
                          <span className='font-bold text-slate-400 text-xs'>
                            節點已停用
                          </span>
                        </div>
                      )}

                      <div className='flex flex-col'>
                        <span className='text-[10px] font-bold text-slate-400 mb-0.5'>
                          最後同步時間
                        </span>
                        <span
                          className={cn(
                            'text-xs font-mono font-bold',
                            isError ? 'text-rose-500' : 'text-slate-700'
                          )}
                        >
                          {node.lastSync.split(' ')[1]}
                        </span>
                      </div>
                      <div className='flex flex-col items-end'>
                        <span className='text-[10px] font-bold text-slate-400 mb-0.5'>
                          成功筆數 / 異常
                        </span>
                        <span className='text-xs font-mono font-bold text-slate-700'>
                          {node.syncCount}{' '}
                          <span
                            className={cn(
                              'ml-1',
                              node.errorCount > 0
                                ? 'text-rose-500'
                                : 'text-emerald-500'
                            )}
                          >
                            / {node.errorCount}
                          </span>
                        </span>
                      </div>
                      <div className='col-span-2 mt-1'>
                        <Progress
                          percent={
                            node.syncCount === 0
                              ? 0
                              : Math.round(
                                  ((node.syncCount - node.errorCount) /
                                    node.syncCount) *
                                    100
                                )
                          }
                          size='small'
                          showInfo={false}
                          strokeColor={
                            isError
                              ? '#f43f5e'
                              : isSyncing
                                ? '#3b82f6'
                                : '#10b981'
                          }
                          status={
                            isError
                              ? 'exception'
                              : isSyncing
                                ? 'active'
                                : 'normal'
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className='bg-slate-50 border-t border-slate-100 px-5 py-3 flex justify-between items-center group-hover:bg-slate-100/50 transition-colors'>
                    <Button
                      type='text'
                      size='small'
                      className='text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-white'
                      onClick={() => {
                        setEditingNode(node)
                        configForm.setFieldsValue({
                          enabled: node.status !== 'Disabled',
                          apiUrl: `https://api.${node.provider.toLowerCase().replace(/[\s/]/g, '')}.com/v1`,
                          token: '••••••••••••••••',
                          syncEntities: node.syncEntities
                        })
                        setIsConfigModalVisible(true)
                      }}
                    >
                      <Settings size={14} className='mr-1' /> 整合設定
                    </Button>

                    <Space>
                      <Tooltip title='查看同步日誌'>
                        <Button
                          type='text'
                          size='small'
                          className='text-slate-400 hover:text-blue-500 hover:bg-white'
                          onClick={() => {
                            setLogNode(node)
                            setIsLogModalVisible(true)
                          }}
                        >
                          <Info size={16} />
                        </Button>
                      </Tooltip>

                      <Popconfirm
                        title='刪除整合節點'
                        description={
                          <span className='text-xs'>
                            確定要刪除 <b>{node.name}</b> 嗎？此操作無法復原。
                          </span>
                        }
                        onConfirm={() => handleDeleteNode(node.id, node.name)}
                        okText='刪除'
                        cancelText='取消'
                        okButtonProps={{ danger: true }}
                        placement='topRight'
                      >
                        <Tooltip title='刪除此節點'>
                          <Button
                            type='text'
                            size='small'
                            className='text-slate-400 hover:text-rose-500 hover:bg-white'
                          >
                            <Trash2 size={16} />
                          </Button>
                        </Tooltip>
                      </Popconfirm>

                      <Button
                        type='primary'
                        size='small'
                        disabled={isDisabled || isSyncing}
                        className={cn(
                          'text-xs font-bold rounded-lg px-3 shadow-sm',
                          isError
                            ? 'bg-rose-500 hover:bg-rose-400'
                            : 'bg-indigo-600 hover:bg-indigo-500'
                        )}
                        onClick={() => handleManualSync(node.id, node.name)}
                      >
                        <PlayCircle size={14} className='mr-1' />{' '}
                        {isError ? '重試' : '強制同步'}
                      </Button>
                    </Space>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* --- 新增系統整合 Modal --- */}
          <Modal
            centered
            title={
              <div className='flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3'>
                <div className='bg-indigo-100 p-1.5 rounded-lg'>
                  <Cable size={18} className='text-indigo-600' />
                </div>
                <span className='font-black text-lg tracking-tight'>
                  新增整合節點
                </span>
              </div>
            }
            open={isAddModalVisible}
            onOk={handleAddNode}
            onCancel={() => {
              setIsAddModalVisible(false)
              addForm.resetFields()
            }}
            okText='建立節點'
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
            width={600}
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
              initialValues={{ type: 'ERP' }}
            >
              <div className='grid grid-cols-2 gap-x-4'>
                <Form.Item
                  name='name'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      系統名稱
                    </span>
                  }
                  rules={[{ required: true }]}
                >
                  <Input
                    className='h-10 rounded-xl border-slate-200 text-xs'
                    placeholder='例如：新版製造執行系統'
                  />
                </Form.Item>
                <Form.Item
                  name='type'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      系統類型
                    </span>
                  }
                >
                  <Select className='h-10 rounded-xl text-xs'>
                    <Select.Option value='ERP'>ERP 企業資源規劃</Select.Option>
                    <Select.Option value='MES'>MES 製造執行系統</Select.Option>
                    <Select.Option value='PLM'>PLM 產品生命週期</Select.Option>
                    <Select.Option value='WMS'>WMS 倉儲管理系統</Select.Option>
                    <Select.Option value='SCADA'>
                      SCADA 資料採集與監視
                    </Select.Option>
                    <Select.Option value='HRMS'>
                      HRMS 人力資源系統
                    </Select.Option>
                  </Select>
                </Form.Item>
              </div>

              <Form.Item
                name='provider'
                label={
                  <span className='font-bold text-slate-600 text-xs'>
                    供應商 / 系統型號
                  </span>
                }
                rules={[{ required: true }]}
              >
                <Input
                  className='h-10 rounded-xl border-slate-200 text-xs'
                  placeholder='例如：Oracle, SAP, 自行開發...'
                />
              </Form.Item>

              <Form.Item
                name='description'
                label={
                  <span className='font-bold text-slate-600 text-xs'>
                    用途描述 (選填)
                  </span>
                }
              >
                <Input.TextArea
                  rows={2}
                  className='rounded-xl border-slate-200 text-xs'
                  placeholder='簡述此節點負責同步哪些資料...'
                />
              </Form.Item>

              <Form.Item
                name='syncEntities'
                label={
                  <span className='font-bold text-slate-600 text-xs'>
                    預設同步資料實體 (Entities)
                  </span>
                }
              >
                <Checkbox.Group className='w-full grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1'>
                  {ENTITY_OPTIONS.map(opt => (
                    <Checkbox key={opt.value} value={opt.value}>
                      <span className='text-xs text-slate-600 font-medium'>
                        {opt.label}
                      </span>
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </Form.Item>
            </Form>
          </Modal>

          {/* --- 節點設定 Modal --- */}
          <Modal
            centered
            title={
              <div className='flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3'>
                <div
                  className={cn(
                    'p-1.5 rounded-lg',
                    getSystemMeta(editingNode?.type || 'ERP').bgClass
                  )}
                >
                  <Settings
                    size={18}
                    className={
                      getSystemMeta(editingNode?.type || 'ERP').colorClass
                    }
                  />
                </div>
                <span className='font-black text-lg tracking-tight'>
                  API 整合設定 - {editingNode?.type}
                </span>
              </div>
            }
            open={isConfigModalVisible}
            onOk={handleSaveConfig}
            onCancel={() => setIsConfigModalVisible(false)}
            okText='儲存設定'
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
            width={600}
            closeIcon={
              <XCircle
                size={20}
                className='text-slate-400 hover:text-slate-600'
              />
            }
          >
            <Form form={configForm} layout='vertical' className='mt-4 mb-0'>
              <Form.Item
                name='enabled'
                valuePropName='checked'
                className='mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100'
              >
                <div className='flex justify-between items-center w-full'>
                  <div className='flex flex-col'>
                    <span className='font-bold text-slate-700'>
                      啟用此整合節點
                    </span>
                    <span className='text-[10px] text-slate-400'>
                      開啟後將依排程自動向來源系統發出 API 請求
                    </span>
                  </div>
                  <Switch checkedChildren='ON' unCheckedChildren='OFF' />
                </div>
              </Form.Item>

              <div className='grid grid-cols-1 gap-y-1'>
                <Form.Item
                  name='syncEntities'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      同步資料實體 (Entities)
                    </span>
                  }
                >
                  <Checkbox.Group className='w-full grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100'>
                    {ENTITY_OPTIONS.map(opt => (
                      <Checkbox key={opt.value} value={opt.value}>
                        <span className='text-xs text-slate-600 font-medium'>
                          {opt.label}
                        </span>
                      </Checkbox>
                    ))}
                  </Checkbox.Group>
                </Form.Item>

                <Form.Item
                  name='apiUrl'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      API Base URL
                    </span>
                  }
                  rules={[{ required: true }]}
                >
                  <Input className='h-10 rounded-xl border-slate-200 font-mono text-xs' />
                </Form.Item>

                <Form.Item
                  name='token'
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      Authentication Token (Bearer)
                    </span>
                  }
                  rules={[{ required: true }]}
                >
                  <Input.Password className='h-10 rounded-xl border-slate-200 font-mono text-xs' />
                </Form.Item>

                <div className='flex items-center justify-between mb-4'>
                  <Button
                    type='dashed'
                    className='rounded-lg font-bold text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                    onClick={handleTestConnection}
                  >
                    <Cable size={14} className='mr-1' /> 測試連線 (Test
                    Connection)
                  </Button>
                </div>

                <Form.Item
                  label={
                    <span className='font-bold text-slate-600 text-xs'>
                      自動同步排程頻率 (CRON)
                    </span>
                  }
                  className='mb-0'
                >
                  <Select
                    className='h-10 rounded-xl font-mono text-xs'
                    defaultValue='15m'
                  >
                    <Select.Option value='1m'>
                      每 1 分鐘 (* * * * *)
                    </Select.Option>
                    <Select.Option value='15m'>
                      每 15 分鐘 (*/15 * * * *)
                    </Select.Option>
                    <Select.Option value='1h'>每小時 (0 * * * *)</Select.Option>
                    <Select.Option value='1d'>
                      每天午夜 (0 0 * * *)
                    </Select.Option>
                  </Select>
                </Form.Item>
              </div>
            </Form>
          </Modal>

          {/* --- 同步日誌 Modal --- */}
          <Modal
            centered
            title={
              <div className='flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3'>
                <div className='bg-slate-100 p-1.5 rounded-lg'>
                  <Activity size={18} className='text-slate-600' />
                </div>
                <span className='font-black text-lg tracking-tight'>
                  同步日誌 (Sync Logs) - {logNode?.type}
                </span>
              </div>
            }
            open={isLogModalVisible}
            footer={null}
            onCancel={() => setIsLogModalVisible(false)}
            className='custom-edit-modal top-10'
            width={520}
            closeIcon={
              <XCircle
                size={20}
                className='text-slate-400 hover:text-slate-600'
              />
            }
          >
            {/* 加大左側 Padding (pl-8) 解決 Timeline 文字被切斷的問題 */}
            <div className='mt-6 pl-8 pr-4 h-[300px] overflow-y-auto custom-scrollbar'>
              <Timeline
                items={[
                  {
                    color: logNode?.status === 'Error' ? 'red' : 'blue',
                    children: (
                      <div className='flex flex-col gap-1 pb-4'>
                        <span
                          className={cn(
                            'font-bold text-sm',
                            logNode?.status === 'Error'
                              ? 'text-rose-600'
                              : 'text-blue-600'
                          )}
                        >
                          {logNode?.status === 'Error'
                            ? 'API 請求超時 (Timeout)'
                            : '手動觸發同步 (Manual Sync)'}
                        </span>
                        <span className='text-xs font-mono text-slate-400'>
                          Payload: Request 150 records
                        </span>
                        <span className='text-[10px] text-slate-400 font-mono mt-1'>
                          {logNode?.lastSync}
                        </span>
                      </div>
                    )
                  },
                  {
                    color: 'green',
                    children: (
                      <div className='flex flex-col gap-1 pb-4'>
                        <span className='font-bold text-sm text-slate-700'>
                          自動同步成功 (CRON)
                        </span>
                        <span className='text-xs font-mono text-slate-500'>
                          Processed: 1,024 OK, 0 Errors
                        </span>
                        <span className='text-[10px] text-slate-400 font-mono mt-1'>
                          {dayjs(logNode?.lastSync)
                            .subtract(15, 'minute')
                            .format('YYYY-MM-DD HH:mm:ss')}
                        </span>
                      </div>
                    )
                  },
                  {
                    color: 'green',
                    children: (
                      <div className='flex flex-col gap-1 pb-4'>
                        <span className='font-bold text-sm text-slate-700'>
                          自動同步成功 (CRON)
                        </span>
                        <span className='text-xs font-mono text-slate-500'>
                          Processed: 8 OK, 0 Errors
                        </span>
                        <span className='text-[10px] text-slate-400 font-mono mt-1'>
                          {dayjs(logNode?.lastSync)
                            .subtract(30, 'minute')
                            .format('YYYY-MM-DD HH:mm:ss')}
                        </span>
                      </div>
                    )
                  }
                ]}
              />
            </div>
          </Modal>

          <style>{`
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
