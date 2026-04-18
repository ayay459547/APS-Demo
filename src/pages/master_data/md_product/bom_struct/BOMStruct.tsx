import React, { useState, useEffect, useRef } from 'react'
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
  ChevronDown,
  Plus,
  MoreVertical,
  RefreshCw,
  Settings,
  Database,
  Network,
  Info,
  Zap,
  Edit,
  Trash2,
  GitMerge,
  GitBranch,
  Cpu,
  Layers,
  Box,
  Wrench,
  AlertTriangle,
  History
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 樣式合併工具函數 (Project Standard)
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- TypeScript 型別定義 ---
export type ItemType = '成品' | '半成品' | '原物料' | '包材'
export type BomStatus = '生效中' | '草稿' | '已停用' | '設變中 (ECN)'

export interface BomNode {
  key: string
  partNumber: string
  description: string
  itemType: ItemType
  qty: number
  uom: string // Unit of Measure
  scrapRate: number // 損耗率 (%)
  status?: BomStatus // 通常只有根節點或有版本的半成品有此狀態
  version?: string
  children?: BomNode[]
}

// --- 擬真數據產生器 (多階層 BOM) ---
const generateBomData = (count: number): BomNode[] => {
  const statuses: BomStatus[] = ['生效中', '草稿', '已停用', '設變中 (ECN)']
  const prefixes = ['SVR', 'GPU', 'GW', 'IND', 'MB']
  const descs = [
    '伺服器主機板總成',
    'AI 運算加速卡',
    '邊緣運算閘道器',
    '工控主機',
    '高階網路交換器'
  ]

  return Array.from({ length: count }).map((_, idx) => {
    const typeIdx = Math.floor(Math.random() * prefixes.length)
    const rootId = `${prefixes[typeIdx]}-26X${String(idx + 1).padStart(4, '0')}`
    const status = statuses[Math.floor(Math.random() * statuses.length)]

    const rootNode: BomNode = {
      key: `BOM-${rootId}`,
      partNumber: rootId,
      description: `${descs[typeIdx]} (標準型)`,
      itemType: '成品',
      qty: 1,
      uom: 'SET',
      scrapRate: 0,
      status,
      version: `V${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 9)}`,
      children: []
    }

    const childCount = Math.floor(Math.random() * 3) + 2 // 2~4 個子節點
    for (let i = 0; i < childCount; i++) {
      const isSub = Math.random() > 0.4
      const childId = `${rootId}-C${i + 1}`

      if (isSub) {
        rootNode.children!.push({
          key: `MB-${childId}`,
          partNumber: `PCBA-${childId}`,
          description: '專用控制電路板',
          itemType: '半成品',
          qty: Math.floor(Math.random() * 2) + 1,
          uom: 'PCS',
          scrapRate: Number((Math.random() * 2).toFixed(1)),
          version: `V1.0`,
          children: [
            {
              key: `IC-${childId}-1`,
              partNumber: `IC-CORE-${Math.floor(Math.random() * 1000)}`,
              description: '核心晶片',
              itemType: '原物料',
              qty: Math.floor(Math.random() * 4) + 1,
              uom: 'EA',
              scrapRate: Number((Math.random() * 0.5).toFixed(1))
            },
            {
              key: `MTL-${childId}-2`,
              partNumber: `MTL-PLST-${Math.floor(Math.random() * 100)}`,
              description: '散熱鰭片與五金',
              itemType: '原物料',
              qty: 2,
              uom: 'SET',
              scrapRate: Number((Math.random() * 8).toFixed(1)) // 有機率 > 5 觸發高損耗率警告
            }
          ]
        })
      } else {
        rootNode.children!.push({
          key: `PKG-${childId}`,
          partNumber: `PKG-${childId}`,
          description: '包裝與說明書配件包',
          itemType: '包材',
          qty: 1,
          uom: 'SET',
          scrapRate: Number((Math.random() * 1.5).toFixed(1))
        })
      }
    }
    return rootNode
  })
}

const mockBomData: BomNode[] = generateBomData(300)

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
export default function BomManager() {
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const searchInputRef = useRef<InputRef>(null)

  useEffect(() => {
    // 模擬載入時間
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  // --- 搜尋過濾邏輯 ---
  const getSearchProps = (dataIndex: keyof BomNode, title: string) => ({
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
    onFilter: (value: any, record: BomNode): boolean => {
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
        <Network size={16} className='text-indigo-600' />
        <span className='font-bold text-slate-800'>BOM 結構與設變概覽</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='生效中 BOM 總數'
          value={mockBomData.filter(d => d.status === '生效中').length}
          unit='份'
          icon={GitBranch}
          colorClass='text-blue-600'
          bgClass='bg-blue-50'
          iconColorClass='text-blue-500'
          trend='+12 本週新增'
        />
        <StatCard
          title='處理中設變 (ECN)'
          value={15}
          unit='單'
          icon={GitMerge}
          colorClass='text-amber-600'
          bgClass='bg-amber-50'
          iconColorClass='text-amber-500'
          trend='影響 42 份 BOM'
        />
        <StatCard
          title='高損耗率警告'
          value={8}
          unit='項'
          icon={AlertTriangle}
          colorClass='text-rose-600'
          bgClass='bg-rose-100/80'
          iconColorClass='text-rose-500'
          isAlert={true}
          trend='損耗率 > 5%'
        />
        <StatCard
          title='平均 BOM 階層'
          value={4.2}
          unit='階'
          icon={Layers}
          colorClass='text-emerald-600'
          bgClass='bg-emerald-50'
          iconColorClass='text-emerald-500'
        />
      </div>
    </div>
  )

  // --- 輔助函數：取得物料類型 Icon ---
  const getItemTypeIcon = (type: ItemType) => {
    switch (type) {
      case '成品':
        return <Database size={14} className='text-indigo-500' />
      case '半成品':
        return <Layers size={14} className='text-blue-500' />
      case '原物料':
        return <Cpu size={14} className='text-emerald-500' />
      case '包材':
        return <Box size={14} className='text-amber-500' />
      default:
        return <Wrench size={14} className='text-slate-500' />
    }
  }

  // --- 表格欄位定義 ---
  const columns: ColumnsType<BomNode> = [
    {
      title: '料號 (Part Number)',
      dataIndex: 'partNumber',
      key: 'partNumber',
      width: 280,
      fixed: 'left',
      sorter: (a, b) => a.partNumber.localeCompare(b.partNumber),
      ...getSearchProps('partNumber', '料號'),
      render: (text, record) => (
        <div className='inline-flex items-center gap-2 align-middle'>
          <div className='w-6 h-6 rounded bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0'>
            {getItemTypeIcon(record.itemType)}
          </div>
          <span
            className={cn(
              'font-mono tracking-tight cursor-pointer hover:underline',
              record.itemType === '成品'
                ? 'font-black text-blue-700 text-[13px]'
                : 'font-bold text-slate-700 text-xs'
            )}
          >
            {text}
          </span>
        </div>
      )
    },
    {
      title: '品名與規格',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      sorter: (a, b) => a.description.localeCompare(b.description),
      ...getSearchProps('description', '品名'),
      render: text => (
        <span
          className='font-medium text-slate-600 text-[13px] truncate'
          title={text}
        >
          {text}
        </span>
      )
    },
    {
      title: '屬性',
      dataIndex: 'itemType',
      key: 'itemType',
      width: 100,
      sorter: (a, b) => a.itemType.localeCompare(b.itemType),
      filters: [
        { text: '成品', value: '成品' },
        { text: '半成品', value: '半成品' },
        { text: '原物料', value: '原物料' },
        { text: '包材', value: '包材' }
      ],
      onFilter: (value, record) => record.itemType === value,
      render: (type: ItemType) => {
        const colors: Record<ItemType, string> = {
          成品: 'bg-indigo-50 text-indigo-600 border-indigo-100',
          半成品: 'bg-blue-50 text-blue-600 border-blue-100',
          原物料: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          包材: 'bg-amber-50 text-amber-600 border-amber-100'
        }
        return (
          <div
            className={cn(
              'inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold border',
              colors[type]
            )}
          >
            {type}
          </div>
        )
      }
    },
    {
      title: '組成用量 (Qty)',
      dataIndex: 'qty',
      key: 'qty',
      width: 150,
      align: 'right',
      sorter: (a, b) => a.qty - b.qty,
      render: (qty, record) => (
        <div className='flex items-baseline justify-end gap-1'>
          <span className='font-black text-slate-800 text-sm'>{qty}</span>
          <span className='text-[10px] font-bold text-slate-400'>
            {record.uom}
          </span>
        </div>
      )
    },
    {
      title: '標準損耗率',
      dataIndex: 'scrapRate',
      key: 'scrapRate',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.scrapRate - b.scrapRate,
      render: rate => (
        <div className='flex items-center justify-end gap-1.5'>
          {rate > 5 && <AlertTriangle size={12} className='text-rose-500' />}
          <span
            className={cn(
              'font-bold font-mono text-xs px-1.5 py-0.5 rounded',
              rate > 5
                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                : 'text-slate-500'
            )}
          >
            {rate.toFixed(1)}%
          </span>
        </div>
      )
    },
    {
      title: '版本 / 狀態',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      sorter: (a, b) => {
        // 先排狀態，再排版本
        const statusA = a.status || ''
        const statusB = b.status || ''
        if (statusA !== statusB) return statusA.localeCompare(statusB)
        const verA = a.version || ''
        const verB = b.version || ''
        return verA.localeCompare(verB)
      },
      filters: [
        { text: '生效中', value: '生效中' },
        { text: '草稿', value: '草稿' },
        { text: '設變中 (ECN)', value: '設變中 (ECN)' },
        { text: '已停用', value: '已停用' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: BomStatus, record) => {
        if (!status && !record.version)
          return <span className='text-slate-300'>-</span>

        return (
          <div className='flex items-center gap-2'>
            {record.version && (
              <Tag className='m-0 border-slate-200 bg-slate-50 text-slate-600 font-mono font-bold text-[10px]'>
                {record.version}
              </Tag>
            )}
            {status && (
              <Badge
                status={
                  status === '生效中'
                    ? 'success'
                    : status === '設變中 (ECN)'
                      ? 'warning'
                      : 'default'
                }
                text={
                  <span
                    className={cn(
                      'font-bold text-xs',
                      status === '生效中'
                        ? 'text-emerald-600'
                        : status === '設變中 (ECN)'
                          ? 'text-amber-600'
                          : 'text-slate-400'
                    )}
                  >
                    {status}
                  </span>
                }
              />
            )}
          </div>
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
                label: '編輯節點',
                icon: <Edit size={14} className='text-blue-500' />
              },
              {
                key: '2',
                label: '替換料號 (替代件)',
                icon: <RefreshCw size={14} className='text-indigo-500' />
              },
              {
                key: '3',
                label: '版本歷程',
                icon: <History size={14} className='text-slate-500' />
              },
              { key: '4', type: 'divider' },
              {
                key: '5',
                label: '移除此節點',
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

  const rowSelection: TableProps<BomNode>['rowSelection'] = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    columnWidth: 48,
    fixed: 'left',
    // 讓樹狀結構的子節點也能被獨立選取
    checkStrictly: false
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
                <div className='w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin' />
                <span className='text-xs font-black text-blue-600 tracking-widest uppercase'>
                  Parsing BOM Structures...
                </span>
              </div>
            </div>
          )}

          {/* 神級改版：玻璃透視頂部導航列 (Design Tokens) */}
          <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/50 py-2 rounded-xl sticky top-0 z-20 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='bg-blue-600 p-1.5 rounded-lg shadow-blue-200 shadow-lg'>
                <Network size={18} className='text-white' />
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
                      BOM 結構概覽
                    </span>
                    <div className='flex gap-1'>
                      <Badge
                        count={15} // 模擬處理中的 ECN
                        style={{
                          backgroundColor: '#f59e0b',
                          fontSize: '10px',
                          boxShadow: 'none'
                        }}
                      />
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
              <Tooltip title='展開所有節點'>
                <Button
                  type='text'
                  icon={<GitBranch size={16} />}
                  className='text-slate-400 hover:bg-slate-100 rounded-xl font-medium h-10 w-10 flex items-center justify-center'
                />
              </Tooltip>
              <Tooltip title='BOM 版本比較'>
                <Button
                  icon={<GitMerge size={16} />}
                  className='rounded-xl font-medium h-10 flex items-center justify-center border-slate-200 text-slate-600 bg-white hover:bg-slate-50 shadow-sm'
                >
                  <span className='hidden lg:inline ml-1 text-xs'>
                    BOM 比較
                  </span>
                </Button>
              </Tooltip>
              <Tooltip title='導出展開表 (Excel)'>
                <Button
                  icon={<Download size={16} />}
                  className='rounded-xl font-medium h-10 flex items-center justify-center border-slate-200 text-slate-600 bg-white hover:bg-slate-50 shadow-sm'
                >
                  <span className='hidden lg:inline ml-1 text-xs'>
                    匯出展開表
                  </span>
                </Button>
              </Tooltip>
              <Button
                type='primary'
                icon={<Plus size={16} />}
                className='rounded-xl bg-blue-600 shadow-md shadow-blue-100 font-bold border-none h-10 flex items-center justify-center'
              >
                <span className='hidden sm:inline ml-1 text-xs'>
                  建立新 BOM
                </span>
              </Button>
            </div>
          </div>

          <Card
            className='shadow-xl shadow-slate-200/50 border-none rounded-[32px] overflow-hidden bg-white'
            styles={{ body: { padding: 0 } }}
          >
            {/* 批量操作浮動條 (當有選取時) */}
            {selectedRowKeys.length > 0 && (
              <div className='mx-4 mt-4 bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2 duration-300'>
                <div className='flex items-center gap-2 text-blue-700'>
                  <Zap size={16} className='fill-blue-700' />
                  <span className='text-sm font-bold text-blue-700'>
                    已選取 {selectedRowKeys.length} 個料件節點
                  </span>
                </div>
                <Space>
                  <Button
                    size='small'
                    icon={<RefreshCw size={14} />}
                    className='rounded-lg font-bold text-xs bg-white text-slate-700 border-slate-200 shadow-sm'
                  >
                    批量替換料號
                  </Button>
                  <Button
                    size='small'
                    icon={<Trash2 size={14} />}
                    danger
                    className='rounded-lg font-bold text-xs bg-white shadow-sm'
                  >
                    批量移除
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
                多階層物料清單管理 (Multi-Level BOM) - 共 {
                  mockBomData.length
                }{' '}
                筆
              </div>
              <div className='flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm'>
                <Info size={14} className='text-blue-500' />
                <span className='text-[10px] text-slate-400 font-bold uppercase tracking-tight'>
                  提示：點擊料號前方箭頭可展開子階層物料
                </span>
              </div>
            </div>

            <div className='p-4 pt-0'>
              <Table<BomNode>
                rowSelection={rowSelection}
                columns={columns}
                dataSource={mockBomData}
                loading={false}
                scroll={{ x: 1200 }}
                pagination={{
                  pageSize: 15,
                  showSizeChanger: true,
                  className: 'mt-4 !px-4 pb-2'
                }}
                expandable={{
                  // 移除強制指定的 index，讓 Antd 原生自動處理 Checkbox 與 展開 Icon 的並排佈局
                  defaultExpandAllRows: false // 300 筆資料建議預設收合，避免渲染過載
                }}
                className='aps-monitor-table custom-tree-table'
              />
            </div>
          </Card>

          <style>{`

            /* 針對 Tree Table 的展開圖標進行美化 */
            .custom-tree-table .ant-table-row-expand-icon {
              border: 1px solid #cbd5e1;
              color: #64748b;
              border-radius: 4px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 18px;
              height: 18px;
              margin-right: 8px;
              vertical-align: middle;
            }
            .custom-tree-table .ant-table-row-expand-icon:hover {
              border-color: #3b82f6;
              color: #3b82f6;
            }
            /* 讓子層的背景顏色略有區別，增加層次感 (針對展開的階層) */
            .custom-tree-table .ant-table-row-level-1 > td {
              background-color: #fafafa;
            }
            .custom-tree-table .ant-table-row-level-2 > td {
              background-color: #fdfdfd;
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
