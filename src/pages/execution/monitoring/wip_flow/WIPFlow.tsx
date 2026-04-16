import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  ConfigProvider,
  Card,
  Popover,
  Badge,
  Tooltip,
  Button,
  Modal,
  Table,
  Tag,
  Input,
  Progress,
  Steps,
  message
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { InputRef } from 'antd'
import {
  Search,
  ChevronDown,
  RefreshCw,
  Info,
  Factory,
  AlertTriangle,
  Clock,
  Activity,
  Layers,
  BarChart3,
  Timer,
  PieChart,
  Hourglass,
  BoxSelect,
  MapPin,
  TrendingDown,
  UserCircle2
} from 'lucide-react'
import dayjs from 'dayjs'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import * as echarts from 'echarts'

/**
 * 樣式合併工具函數 (Project Standard)
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- TypeScript 型別定義 ---
export type WipStatus = '正常流動' | '停滯警告' | '嚴重瓶頸'

export interface WipRecord {
  id: string
  woId: string
  partNumber: string
  productName: string
  currentStation: string
  wipQty: number
  waitTimeHours: number // 滯留時間(小時)
  status: WipStatus
  lastMoveTime: string
  operator: string
}

// --- 擬真數據產生器 ---
const generateWipData = (count: number): WipRecord[] => {
  const stations = [
    'SMT-LINE-01',
    'SMT-LINE-02',
    'DIP-LINE-01',
    'ASSY-LINE-A',
    'TEST-ST-05',
    'PKG-LINE-01'
  ]
  const products = [
    '高階伺服器主機板',
    '工控運算核心模組',
    '車載資訊娛樂主機',
    '醫療影像辨識板',
    'AI 邊緣運算加速卡'
  ]
  const operators = ['陳明欣', '林佳蓉', '王大偉', '張志宏', '無人接手']

  return Array.from({ length: count }).map((_, idx) => {
    // 根據常態分佈模擬滯留時間 (大部分正常，少部分瓶頸)
    const rand = Math.random()
    let waitTimeHours = 0
    let status: WipStatus = '正常流動'

    if (rand < 0.15) {
      waitTimeHours = Math.floor(Math.random() * 48) + 24 // 24~72 小時
      status = '嚴重瓶頸'
    } else if (rand < 0.35) {
      waitTimeHours = Math.floor(Math.random() * 16) + 8 // 8~24 小時
      status = '停滯警告'
    } else {
      waitTimeHours = Math.floor(Math.random() * 7) + 1 // 1~8 小時
      status = '正常流動'
    }

    const currentStation = stations[Math.floor(Math.random() * stations.length)]

    // 如果是嚴重瓶頸，通常沒人接手處理
    const operator =
      status === '嚴重瓶頸' && Math.random() > 0.5
        ? '無人接手'
        : operators[Math.floor(Math.random() * (operators.length - 1))]

    return {
      id: `WIP-${dayjs().format('MMDD')}-${String(idx + 1).padStart(4, '0')}`,
      woId: `WO-26X${String(Math.floor(Math.random() * 90000) + 10000)}`,
      partNumber: `PN-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      productName: products[Math.floor(Math.random() * products.length)],
      currentStation,
      wipQty: Math.floor(Math.random() * 800) + 50,
      waitTimeHours,
      status,
      lastMoveTime: dayjs()
        .subtract(waitTimeHours, 'hour')
        .subtract(Math.floor(Math.random() * 60), 'minute')
        .format('YYYY-MM-DD HH:mm'),
      operator
    }
  })
}

const mockWipData: WipRecord[] = generateWipData(65)

// --- ECharts 封裝組件 ---
const ReactECharts = ({
  option,
  style
}: {
  option: any
  style?: React.CSSProperties
}) => {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chartRef.current) {
      const chart = echarts.init(chartRef.current)
      chart.setOption(option)

      const handleResize = () => chart.resize()
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        chart.dispose()
      }
    }
  }, [option])

  return (
    <div ref={chartRef} style={{ width: '100%', height: '100%', ...style }} />
  )
}

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
export default function WipTrackingView() {
  const [loading, setLoading] = useState<boolean>(true)
  const [wipList] = useState<WipRecord[]>(mockWipData)

  // 剖析 Modal 狀態
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [activeWip, setActiveWip] = useState<WipRecord | null>(null)

  // 總覽圖表 Modal 狀態
  const [isChartModalVisible, setIsChartModalVisible] = useState(false)

  const searchInputRef = useRef<InputRef>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(() => {
    const totalWipQty = wipList.reduce((sum, w) => sum + w.wipQty, 0)
    const bottleneckCount = wipList.filter(d => d.status === '嚴重瓶頸').length
    const stagnantCount = wipList.filter(d => d.status === '停滯警告').length

    // 找出積壓數量最多的站點
    const stationMap: Record<string, number> = {}
    wipList.forEach(w => {
      stationMap[w.currentStation] =
        (stationMap[w.currentStation] || 0) + w.wipQty
    })
    let worstStation = '-'
    let maxQty = 0
    for (const [station, qty] of Object.entries(stationMap)) {
      if (qty > maxQty) {
        maxQty = qty
        worstStation = station
      }
    }

    return { totalWipQty, bottleneckCount, stagnantCount, worstStation, maxQty }
  }, [wipList])

  // ECharts 圖表設定
  const distributionChartOption = useMemo(() => {
    const stationMap: Record<string, number> = {}
    wipList.forEach(w => {
      stationMap[w.currentStation] =
        (stationMap[w.currentStation] || 0) + w.wipQty
    })

    const chartData = Object.keys(stationMap)
      .map(k => ({
        station: k,
        qty: stationMap[k]
      }))
      .sort((a, b) => b.qty - a.qty) // 降序

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: chartData.map(d => d.station),
        axisLabel: { interval: 0, rotate: 30 }
      },
      yAxis: { type: 'value', name: 'WIP 數量 (PCS)' },
      series: [
        {
          name: '在製品數量',
          type: 'bar',
          data: chartData.map((d, index) => ({
            value: d.qty,
            itemStyle: {
              // 數量最多的標紅，其餘藍色
              color: index === 0 ? '#f43f5e' : '#3b82f6',
              borderRadius: [4, 4, 0, 0]
            }
          })),
          label: { show: true, position: 'top', fontWeight: 'bold' },
          barWidth: '40%'
        }
      ]
    }
  }, [wipList])

  const statusChartOption = useMemo(() => {
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: '0%', left: 'center', icon: 'circle', itemGap: 20 },
      series: [
        {
          name: 'WIP 健康度',
          type: 'pie',
          radius: ['45%', '75%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: { show: false, position: 'center' },
          emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } },
          data: [
            {
              value: wipList.filter(d => d.status === '正常流動').length,
              name: '正常流動',
              itemStyle: { color: '#10b981' }
            }, // Emerald
            {
              value: stats.stagnantCount,
              name: '停滯警告',
              itemStyle: { color: '#f59e0b' }
            }, // Amber
            {
              value: stats.bottleneckCount,
              name: '嚴重瓶頸',
              itemStyle: { color: '#f43f5e' }
            } // Rose
          ]
        }
      ]
    }
  }, [stats, wipList])

  // --- 操作處理函式 ---
  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success({
        content: '在製品狀態已同步至最新！',
        className: 'custom-message'
      })
    }, 600)
  }

  const openDetailModal = (wip: WipRecord) => {
    setActiveWip(wip)
    setIsDetailModalVisible(true)
  }

  const handlePushWip = () => {
    message.loading({ content: '發送催料指令中...', key: 'push' })
    setTimeout(() => {
      message.success({
        content: `已向 ${activeWip?.currentStation} 負責人發送緊急處理通知！`,
        key: 'push',
        className: 'custom-message'
      })
      setIsDetailModalVisible(false)
    }, 1000)
  }

  // --- 搜尋過濾邏輯 ---
  const getSearchProps = (dataIndex: keyof WipRecord, title: string) => ({
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
    onFilter: (value: any, record: WipRecord): boolean => {
      const targetValue = record[dataIndex]
      if (targetValue === null || targetValue === undefined) return false
      return targetValue
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase())
    }
  })

  // --- Popover KPI 內容 ---
  const statsContent = (
    <div className='w-full max-w-[480px] py-1'>
      <div className='flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5'>
        <Layers size={16} className='text-indigo-600' />
        <span className='font-bold text-slate-800'>全廠在製品 (WIP) 概覽</span>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          title='廠內 WIP 總量'
          value={stats.totalWipQty.toLocaleString()}
          unit='PCS'
          icon={BoxSelect}
          colorClass='text-indigo-600'
          bgClass='bg-indigo-50'
          iconColorClass='text-indigo-500'
          trend='積壓資金與空間'
        />
        <StatCard
          title='最壅塞站點'
          value={stats.worstStation}
          unit=''
          icon={Factory}
          colorClass='text-rose-600'
          bgClass='bg-rose-50'
          iconColorClass='text-rose-500'
          trend={`積壓 ${stats.maxQty} PCS`}
        />
        <StatCard
          title='嚴重瓶頸批次'
          value={stats.bottleneckCount}
          unit='批'
          icon={AlertTriangle}
          colorClass='text-rose-600'
          bgClass='bg-rose-100/80'
          iconColorClass='text-rose-500'
          isAlert={stats.bottleneckCount > 0}
          trend='滯留超過 24 小時'
        />
        <StatCard
          title='停滯警告批次'
          value={stats.stagnantCount}
          unit='批'
          icon={Hourglass}
          colorClass='text-amber-600'
          bgClass='bg-amber-50'
          iconColorClass='text-amber-500'
          trend='滯留超過 8 小時'
        />
      </div>
    </div>
  )

  // --- 表格欄位定義 ---
  const columns: ColumnsType<WipRecord> = [
    {
      title: 'WIP 批號 / 工單',
      key: 'wipInfo',
      width: 240,
      fixed: 'left',
      ...getSearchProps('id', 'WIP 批號'),
      render: (_, record) => (
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <span
              className='font-mono font-black text-indigo-700 text-[14px] cursor-pointer hover:underline'
              onClick={() => openDetailModal(record)}
            >
              {record.id}
            </span>
          </div>
          <div className='flex flex-col'>
            <span className='text-[11px] font-bold text-slate-700 font-mono'>
              {record.woId}
            </span>
            <span
              className='text-[10px] text-slate-400 truncate max-w-[180px]'
              title={record.productName}
            >
              {record.partNumber} ({record.productName})
            </span>
          </div>
        </div>
      )
    },
    {
      title: '當前所在站點',
      dataIndex: 'currentStation',
      key: 'currentStation',
      width: 150,
      filters: [
        { text: 'SMT-LINE-01', value: 'SMT-LINE-01' },
        { text: 'DIP-LINE-01', value: 'DIP-LINE-01' },
        { text: 'ASSY-LINE-A', value: 'ASSY-LINE-A' },
        { text: 'TEST-ST-05', value: 'TEST-ST-05' }
      ],
      onFilter: (value, record) => record.currentStation === value,
      render: text => (
        <Tag className='m-0 border-indigo-200 bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded-md flex items-center gap-1.5 w-fit'>
          <MapPin size={12} className='inline' /> {text}
        </Tag>
      )
    },
    {
      title: '健康狀態',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      sorter: (a, b) => {
        const order = { 嚴重瓶頸: 3, 停滯警告: 2, 正常流動: 1 }
        return order[b.status] - order[a.status]
      },
      filters: [
        { text: '正常流動', value: '正常流動' },
        { text: '停滯警告', value: '停滯警告' },
        { text: '嚴重瓶頸', value: '嚴重瓶頸' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: WipStatus) => {
        let colorClass = ''
        let bgClass = ''
        switch (status) {
          case '正常流動':
            colorClass = 'text-emerald-600'
            bgClass = 'bg-emerald-50 border-emerald-200'
            break
          case '停滯警告':
            colorClass = 'text-amber-600'
            bgClass = 'bg-amber-50 border-amber-200'
            break
          case '嚴重瓶頸':
            colorClass = 'text-rose-600'
            bgClass =
              'bg-rose-50 border-rose-200 shadow-sm shadow-rose-100 animate-pulse'
            break
        }
        return (
          <div
            className={cn(
              'inline-flex items-center justify-center px-2 py-1 rounded-md text-[11px] font-bold border w-fit',
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
      title: '在製數量 (Qty)',
      dataIndex: 'wipQty',
      key: 'wipQty',
      width: 140,
      align: 'right',
      sorter: (a, b) => a.wipQty - b.wipQty,
      render: val => (
        <span className='font-black text-slate-700 font-mono text-sm'>
          {val.toLocaleString()}{' '}
          <span className='text-[10px] font-normal text-slate-400'>PCS</span>
        </span>
      )
    },
    {
      title: '本站滯留時間 (Wait Time)',
      key: 'waitTime',
      width: 220,
      sorter: (a, b) => a.waitTimeHours - b.waitTimeHours,
      render: (_, record) => {
        const isCritical = record.waitTimeHours >= 24
        const isWarning = record.waitTimeHours >= 8 && record.waitTimeHours < 24
        // 視覺化條 (最大顯示 72 小時)
        const maxHours = 72
        const percent = Math.min(100, (record.waitTimeHours / maxHours) * 100)

        return (
          <div className='w-full pr-4'>
            <div className='flex justify-between text-[10px] font-black mb-1'>
              <span className='text-slate-400 flex items-center gap-1'>
                <Hourglass size={10} /> 滯留
              </span>
              <span
                className={cn(
                  isCritical
                    ? 'text-rose-600'
                    : isWarning
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                )}
              >
                {record.waitTimeHours} <span className='font-normal'>小時</span>
              </span>
            </div>
            <Progress
              percent={percent}
              size='small'
              showInfo={false}
              strokeColor={
                isCritical ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981'
              }
              trailColor='#f1f5f9'
            />
          </div>
        )
      }
    },
    {
      title: '最後移轉紀錄',
      key: 'lastMove',
      width: 160,
      render: (_, record) => (
        <div className='flex flex-col gap-1.5'>
          <div
            className='flex items-center gap-1.5 text-[11px] font-mono text-slate-500'
            title='移入時間'
          >
            <Clock size={10} className='text-blue-400' /> {record.lastMoveTime}
          </div>
          <div className='flex items-center gap-1.5 text-[11px] font-medium text-slate-500'>
            <UserCircle2
              size={12}
              className={
                record.operator === '無人接手'
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }
            />
            <span
              className={
                record.operator === '無人接手' ? 'text-rose-500 font-bold' : ''
              }
            >
              {record.operator}
            </span>
          </div>
        </div>
      )
    },
    {
      title: '履歷',
      key: 'action',
      width: 70,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Tooltip title='查看 WIP 流動履歷'>
          <Button
            type='text'
            size='small'
            className='text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 rounded-md flex items-center justify-center w-8 h-8 p-0 mx-auto'
            onClick={() => openDetailModal(record)}
          >
            <BarChart3 size={16} />
          </Button>
        </Tooltip>
      )
    }
  ]

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
                  Locating WIP...
                </span>
              </div>
            </div>
          )}

          {/* 玻璃透視頂部導航列 */}
          <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/50 py-2 rounded-xl sticky top-0 z-20 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='bg-indigo-600 p-1.5 rounded-lg shadow-indigo-200 shadow-lg'>
                <Layers size={18} className='text-white' />
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
                      在製品追蹤
                    </span>
                    <div className='flex gap-1'>
                      {stats.stagnantCount > 0 && (
                        <Badge
                          count={`${stats.stagnantCount} 停滯`}
                          style={{
                            backgroundColor: '#f59e0b',
                            fontSize: '10px',
                            boxShadow: 'none'
                          }}
                        />
                      )}
                      {stats.bottleneckCount > 0 && (
                        <Badge
                          count={`${stats.bottleneckCount} 瓶頸`}
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
              <Tooltip title='WIP 分佈與健康度看板'>
                <Button
                  type='text'
                  icon={<PieChart size={16} />}
                  className='text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl h-10 w-10 flex items-center justify-center transition-colors'
                  onClick={() => setIsChartModalVisible(true)}
                />
              </Tooltip>
              <Tooltip title='重新定位所有在製品'>
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
            </div>
          </div>

          <Card
            className='shadow-xl shadow-slate-200/50 border-none rounded-[32px] overflow-hidden bg-transparent'
            styles={{ body: { padding: 0 } }}
          >
            <div className='bg-white/80 p-5 border-b border-slate-100 flex items-center justify-between rounded-t-[32px]'>
              <div className='flex items-center gap-3 text-slate-500 text-[11px] font-black uppercase tracking-widest'>
                <BoxSelect size={14} />
                全廠在製品 (WIP) 即時定位清單
              </div>
              <div className='flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm'>
                <Info size={14} className='text-indigo-500' />
                <span className='text-[10px] text-slate-400 font-bold uppercase tracking-tight'>
                  提示：紅色脈衝高亮的批次代表嚴重滯留，請優先處置以打通產線瓶頸。
                </span>
              </div>
            </div>

            <div className='bg-white/50 backdrop-blur-md pb-4 pt-4 px-4'>
              <Table<WipRecord>
                columns={columns}
                dataSource={wipList}
                loading={false}
                scroll={{ x: 1200 }}
                rowKey='id'
                pagination={{
                  pageSize: 15,
                  showSizeChanger: true,
                  pageSizeOptions: ['15', '30', '50'],
                  className: 'mt-4 !px-4 pb-2'
                }}
                className='aps-monitor-table'
              />
            </div>
          </Card>

          {/* --- WIP 分佈總覽圖表 Modal (ECharts) --- */}
          <Modal
            title={null}
            open={isChartModalVisible}
            onCancel={() => setIsChartModalVisible(false)}
            footer={null}
            className='custom-hmi-modal top-6'
            width={900}
          >
            <div className='flex flex-col h-[600px]'>
              <div className='flex items-center gap-3 text-slate-800 border-b border-slate-100 pb-4 mb-6'>
                <div className='bg-indigo-600 p-2.5 rounded-xl shadow-md shadow-indigo-200'>
                  <PieChart size={24} className='text-white' />
                </div>
                <div className='flex flex-col'>
                  <span className='font-black text-2xl tracking-tight'>
                    WIP 戰情總覽面板 (WIP Dashboard)
                  </span>
                  <span className='text-xs font-bold text-slate-500'>
                    視覺化全廠在製品分佈與健康狀態
                  </span>
                </div>
              </div>

              <div className='flex-1 grid grid-cols-5 gap-6'>
                {/* 左側：健康度環形圖 */}
                <div className='col-span-2 bg-slate-50 rounded-2xl border border-slate-100 p-4 flex flex-col'>
                  <h4 className='text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5'>
                    <Activity size={16} className='text-indigo-500' /> WIP
                    批次健康度
                  </h4>
                  <div className='flex-1 relative w-full min-h-[300px]'>
                    <ReactECharts option={statusChartOption} />
                  </div>
                </div>

                {/* 右側：各站點 WIP 數量長條圖 */}
                <div className='col-span-3 bg-slate-50 rounded-2xl border border-slate-100 p-4 flex flex-col'>
                  <h4 className='text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5'>
                    <Layers size={16} className='text-indigo-500' />{' '}
                    站點積壓數量排行 (PCS)
                  </h4>
                  <div className='flex-1 relative w-full min-h-[300px]'>
                    <ReactECharts option={distributionChartOption} />
                  </div>
                </div>
              </div>
            </div>
          </Modal>

          {/* --- WIP 履歷剖析 Modal --- */}
          <Modal
            title={null}
            open={isDetailModalVisible}
            onCancel={() => setIsDetailModalVisible(false)}
            footer={null}
            className='custom-hmi-modal'
            width={720}
          >
            {activeWip &&
              (() => {
                const isCritical = activeWip.status === '嚴重瓶頸'
                const isWarning = activeWip.status === '停滯警告'

                return (
                  <div className='flex flex-col'>
                    {/* Header */}
                    <div className='flex items-center gap-3 text-slate-800 border-b border-slate-100 pb-5 mb-5'>
                      <div
                        className={cn(
                          'p-3 rounded-xl shadow-md',
                          isCritical
                            ? 'bg-rose-600 shadow-rose-200'
                            : 'bg-indigo-600 shadow-indigo-200'
                        )}
                      >
                        <BarChart3 size={24} className='text-white' />
                      </div>
                      <div className='flex flex-col'>
                        <span className='font-black text-2xl tracking-tight'>
                          WIP 流動履歷剖析 (Flow History)
                        </span>
                        <div className='flex items-center gap-2 mt-1'>
                          <span
                            className={cn(
                              'text-sm font-mono font-black',
                              isCritical ? 'text-rose-600' : 'text-indigo-600'
                            )}
                          >
                            {activeWip.id}
                          </span>
                          <span className='text-[10px] text-slate-400'>|</span>
                          <span className='text-xs font-bold text-slate-500 font-mono'>
                            {activeWip.woId}
                          </span>
                          <Tag
                            className={cn(
                              'm-0 border-none font-bold text-[10px] px-2 py-0.5 ml-2',
                              isCritical
                                ? 'bg-rose-100 text-rose-700'
                                : isWarning
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                            )}
                          >
                            {activeWip.status}
                          </Tag>
                        </div>
                      </div>
                    </div>

                    {/* Highlight Box for Critical/Warning */}
                    {(isCritical || isWarning) && (
                      <div
                        className={cn(
                          'p-4 rounded-2xl border flex items-start gap-3 mb-6',
                          isCritical
                            ? 'bg-rose-50 border-rose-200'
                            : 'bg-amber-50 border-amber-200'
                        )}
                      >
                        <AlertTriangle
                          size={20}
                          className={cn(
                            'shrink-0 mt-0.5',
                            isCritical ? 'text-rose-500' : 'text-amber-500'
                          )}
                        />
                        <div className='flex flex-col'>
                          <span
                            className={cn(
                              'font-black text-sm',
                              isCritical ? 'text-rose-700' : 'text-amber-700'
                            )}
                          >
                            產線流動異常警告
                          </span>
                          <span
                            className={cn(
                              'text-xs font-medium mt-1',
                              isCritical ? 'text-rose-600' : 'text-amber-600'
                            )}
                          >
                            此批 WIP 於 <b>{activeWip.currentStation}</b>{' '}
                            已經滯留超過 <b>{activeWip.waitTimeHours} 小時</b>
                            ，嚴重低於標準流動速率，請主管立即介入排除障礙。
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Flow History Timeline */}
                    <div>
                      <span className='font-bold text-slate-700 text-sm flex items-center gap-1.5 mb-6'>
                        <TrendingDown size={16} className='text-indigo-500' />{' '}
                        生產履歷追溯 (Tracing)
                      </span>

                      <div className='px-6 h-[250px] overflow-y-auto'>
                        <Steps
                          direction='vertical'
                          size='small'
                          current={0}
                          items={[
                            {
                              title: (
                                <div className='flex items-center justify-between w-[450px]'>
                                  <span
                                    className={cn(
                                      'font-bold text-sm',
                                      isCritical
                                        ? 'text-rose-600'
                                        : 'text-blue-600'
                                    )}
                                  >
                                    當前站點：{activeWip.currentStation}
                                  </span>
                                  <span className='text-[10px] font-mono text-slate-400'>
                                    {activeWip.lastMoveTime}
                                  </span>
                                </div>
                              ),
                              description: (
                                <div className='flex flex-col gap-1 pb-4 pt-1'>
                                  <span className='text-xs text-slate-500'>
                                    數量:{' '}
                                    <strong className='text-slate-700'>
                                      {activeWip.wipQty} PCS
                                    </strong>
                                  </span>
                                  <span className='text-xs text-slate-500'>
                                    接手人員:{' '}
                                    <strong
                                      className={
                                        activeWip.operator === '無人接手'
                                          ? 'text-rose-500'
                                          : 'text-slate-700'
                                      }
                                    >
                                      {activeWip.operator}
                                    </strong>
                                  </span>
                                  <span
                                    className={cn(
                                      'text-xs font-bold mt-1',
                                      isCritical
                                        ? 'text-rose-500'
                                        : 'text-amber-500'
                                    )}
                                  >
                                    已滯留 {activeWip.waitTimeHours} 小時
                                  </span>
                                </div>
                              ),
                              status: isCritical ? 'error' : 'process',
                              icon: isCritical ? (
                                <AlertTriangle
                                  size={18}
                                  className='text-rose-500'
                                />
                              ) : (
                                <Timer
                                  size={18}
                                  className='text-blue-500 animate-spin-slow'
                                />
                              )
                            },
                            {
                              title: (
                                <div className='flex items-center justify-between w-[450px]'>
                                  <span className='font-bold text-sm text-slate-700'>
                                    前一站：SMT-LINE-01 (自動帶入)
                                  </span>
                                  <span className='text-[10px] font-mono text-slate-400'>
                                    {dayjs(activeWip.lastMoveTime)
                                      .subtract(5, 'hour')
                                      .format('YYYY-MM-DD HH:mm')}
                                  </span>
                                </div>
                              ),
                              description: (
                                <div className='flex flex-col gap-1 pb-4 pt-1'>
                                  <span className='text-xs text-slate-500'>
                                    數量:{' '}
                                    <strong className='text-slate-700'>
                                      {activeWip.wipQty + 2} PCS
                                    </strong>{' '}
                                    (2PCS 報廢)
                                  </span>
                                  <span className='text-xs text-slate-500'>
                                    耗時: <strong>5 小時</strong> (正常)
                                  </span>
                                </div>
                              ),
                              status: 'finish'
                            },
                            {
                              title: (
                                <div className='flex items-center justify-between w-[450px]'>
                                  <span className='font-bold text-sm text-slate-700'>
                                    發料入線 (Material Issued)
                                  </span>
                                  <span className='text-[10px] font-mono text-slate-400'>
                                    {dayjs(activeWip.lastMoveTime)
                                      .subtract(1, 'day')
                                      .format('YYYY-MM-DD HH:mm')}
                                  </span>
                                </div>
                              ),
                              description: (
                                <div className='flex flex-col gap-1 pb-4 pt-1'>
                                  <span className='text-xs text-slate-500'>
                                    發料單號:{' '}
                                    <strong className='text-slate-700 font-mono'>
                                      MAT-26X112
                                    </strong>
                                  </span>
                                </div>
                              ),
                              status: 'finish'
                            }
                          ]}
                        />
                      </div>
                    </div>

                    <div className='mt-4 flex justify-end gap-3'>
                      <Button
                        size='large'
                        className='h-12 rounded-xl font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 px-6'
                        onClick={() => setIsDetailModalVisible(false)}
                      >
                        關閉
                      </Button>
                      {(isCritical || isWarning) && (
                        <Button
                          type='primary'
                          size='large'
                          className='h-12 rounded-xl font-bold text-white bg-rose-600 border-none hover:bg-rose-500 px-6 shadow-md shadow-rose-200 flex items-center gap-2'
                          onClick={handlePushWip}
                        >
                          <AlertTriangle size={16} /> 通報催料 (Push Alert)
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })()}
          </Modal>

          <style>{`
            /* 自定義 Modal 樣式 */
            .custom-hmi-modal .ant-modal-content {
              border-radius: 28px;
              padding: 32px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
              border: 1px solid #f1f5f9;
            }
            .custom-hmi-modal .ant-modal-header {
              background: transparent;
              margin-bottom: 0;
            }

            /* 呼吸燈動畫 */
            .animate-pulse {
              animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; box-shadow: 0 0 12px rgba(244, 63, 94, 0.5); }
            }
            .animate-spin-slow {
              animation: spin 3s linear infinite;
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
