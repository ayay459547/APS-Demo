import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  ConfigProvider,
  Card,
  Tooltip,
  Button,
  Table,
  Tag,
  Segmented,
  message,
  Modal
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  RefreshCw,
  Factory,
  AlertTriangle,
  Clock,
  Activity,
  TrendingUp,
  BarChart3,
  PieChart,
  ShieldAlert,
  Zap,
  Download,
  Target,
  Crosshair,
  Settings2
} from 'lucide-react'
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
export interface UnderperformingMachine {
  id: string
  workCenter: string
  oee: number
  downtimeHours: number
  defectRate: number
  primaryIssue: string
  status: '觀察中' | '需立即處置'
}

// --- 擬真數據產生器 ---
const generateOeeData = (range: string = 'today') => {
  let labels = []
  if (range === 'today') {
    labels = [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00'
    ]
  } else if (range === 'week') {
    labels = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']
  } else {
    labels = Array.from({ length: 15 }).map((_, i) => `${i * 2 + 1}日`) // 簡化顯示半個月
  }

  return labels
    .map(label => ({
      label,
      availability: Math.floor(Math.random() * 20) + 75, // 75-95%
      performance: Math.floor(Math.random() * 25) + 70, // 70-95%
      quality: Math.floor(Math.random() * 10) + 88 // 88-98%
    }))
    .map(d => ({
      ...d,
      oee: Math.round((d.availability * d.performance * d.quality) / 10000)
    }))
}

const generateLineOutput = (range: string = 'today') => {
  const multiplier = range === 'month' ? 30 : range === 'week' ? 7 : 1
  const lines = [
    'SMT-LINE-01',
    'SMT-LINE-02',
    'DIP-LINE-01',
    'ASSY-LINE-A',
    'PKG-01'
  ]
  return lines.map(line => {
    const target = (Math.floor(Math.random() * 3000) + 1000) * multiplier
    const ratio = Math.random() * 0.4 + 0.7 // 70% ~ 110%
    return {
      line,
      target,
      actual: Math.floor(target * ratio)
    }
  })
}

const generateDefects = (range: string = 'today') => {
  const multiplier = range === 'month' ? 30 : range === 'week' ? 7 : 1
  const rawDefects = [
    {
      reason: '材料不良 (Material)',
      count: Math.floor(450 * multiplier * (Math.random() * 0.4 + 0.8))
    },
    {
      reason: '尺寸超差 (Dimension)',
      count: Math.floor(320 * multiplier * (Math.random() * 0.4 + 0.8))
    },
    {
      reason: '外觀刮傷 (Scratch)',
      count: Math.floor(180 * multiplier * (Math.random() * 0.4 + 0.8))
    },
    {
      reason: '機台校正偏移 (Calibration)',
      count: Math.floor(90 * multiplier * (Math.random() * 0.4 + 0.8))
    },
    {
      reason: '人為操作 (Operator)',
      count: Math.floor(45 * multiplier * (Math.random() * 0.4 + 0.8))
    },
    {
      reason: '其他 (Others)',
      count: Math.floor(15 * multiplier * (Math.random() * 0.4 + 0.8))
    }
  ].sort((a, b) => b.count - a.count)

  let cumulativeCount = 0
  const total = rawDefects.reduce((sum, d) => sum + d.count, 0)

  return rawDefects.map(d => {
    cumulativeCount += d.count
    return {
      ...d,
      cumulativeRatio: Math.round((cumulativeCount / total) * 100)
    }
  })
}

const generateUnderperforming = (): UnderperformingMachine[] => {
  const candidates = [
    {
      id: 'WC-01',
      workCenter: 'SMT-LINE-02',
      primaryIssue: '貼片機拋料率過高'
    },
    {
      id: 'WC-02',
      workCenter: 'CNC-MC-12',
      primaryIssue: '刀具磨損導致尺寸超差'
    },
    { id: 'WC-03', workCenter: 'DIP-LINE-01', primaryIssue: '人工插件漏件' },
    { id: 'WC-04', workCenter: 'TEST-ST-05', primaryIssue: '測試治具接觸不良' },
    {
      id: 'WC-05',
      workCenter: 'SMT-LINE-01',
      primaryIssue: '錫膏印刷厚度異常'
    },
    { id: 'WC-06', workCenter: 'ASSY-LINE-A', primaryIssue: '電動起子扭力異常' }
  ]

  // 隨機挑選 3~4 個異常機台
  const shuffled = candidates
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.floor(Math.random() * 2) + 3)

  return shuffled.map(c => ({
    ...c,
    oee: parseFloat((Math.random() * 20 + 60).toFixed(1)), // 60~80%
    downtimeHours: parseFloat((Math.random() * 4 + 0.5).toFixed(1)),
    defectRate: parseFloat((Math.random() * 5 + 1).toFixed(1)),
    status: Math.random() > 0.5 ? '需立即處置' : '觀察中'
  })) as UnderperformingMachine[]
}

// --- ECharts 封裝組件 ---
const ReactECharts = ({
  option,
  style,
  className
}: {
  option: any
  style?: React.CSSProperties
  className?: string
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
    <div
      ref={chartRef}
      style={{ width: '100%', height: '100%', ...style }}
      className={className}
    />
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
      'bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md cursor-default',
      isAlert &&
        'ring-2 ring-rose-200 bg-rose-50/30 border-transparent shadow-rose-100'
    )}
  >
    <div>
      <p className='text-slate-500 text-xs font-bold tracking-wide mb-1'>
        {title}
      </p>
      <div className='flex items-baseline gap-1'>
        <span
          className={cn(
            'text-2xl font-black tracking-tight font-mono',
            isAlert ? 'text-rose-600' : 'text-slate-800'
          )}
        >
          {value}
        </span>
        <span className='text-[11px] text-slate-400 font-medium'>{unit}</span>
      </div>
      {trend && (
        <div
          className={cn(
            'mt-1.5 text-[11px] font-bold flex items-center gap-1',
            colorClass
          )}
        >
          {trend}
        </div>
      )}
    </div>
    <div className={cn('p-3 rounded-xl', bgClass, isAlert && 'animate-pulse')}>
      <Icon size={24} className={iconColorClass} />
    </div>
  </div>
)

// --- 主元件 ---
export default function DataAnalyticsDashboard() {
  const [loading, setLoading] = useState<boolean>(true)
  const [timeRange, setTimeRange] = useState<string>('today')

  // Data States
  const [oeeData, setOeeData] = useState(generateOeeData('today'))
  const [outputData, setOutputData] = useState(generateLineOutput('today'))
  const [defectData, setDefectData] = useState(generateDefects('today'))
  const [underperforming, setUnderperforming] = useState(
    generateUnderperforming()
  )

  // Modal States
  const [isMachineListModalVisible, setIsMachineListModalVisible] =
    useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setOeeData(generateOeeData(timeRange))
      setOutputData(generateLineOutput(timeRange))
      setDefectData(generateDefects(timeRange))
      setUnderperforming(generateUnderperforming())
      setLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [timeRange])

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setOeeData(generateOeeData(timeRange))
      setOutputData(generateLineOutput(timeRange))
      setDefectData(generateDefects(timeRange))
      setUnderperforming(generateUnderperforming())
      setLoading(false)
      message.success({
        content: '戰情圖表數據已更新！',
        className: 'custom-message'
      })
    }, 800)
  }

  // --- ECharts Options ---
  // 1. 綜合 OEE 趨勢圖 (Area Line)
  const oeeChartOption = useMemo(() => {
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: {
        data: ['全廠 OEE', '可用率', '表現率', '品質率'],
        bottom: 0,
        icon: 'roundRect'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: oeeData.map(d => d.label)
      },
      yAxis: {
        type: 'value',
        min: 40,
        max: 100,
        axisLabel: { formatter: '{value}%' }
      },
      series: [
        {
          name: '全廠 OEE',
          type: 'line',
          data: oeeData.map(d => d.oee),
          smooth: true,
          symbolSize: 8,
          itemStyle: { color: '#4f46e5' }, // Indigo 600
          lineStyle: { width: 4 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(79, 70, 229, 0.4)' },
              { offset: 1, color: 'rgba(79, 70, 229, 0.05)' }
            ])
          },
          z: 10
        },
        {
          name: '可用率',
          type: 'line',
          data: oeeData.map(d => d.availability),
          smooth: true,
          lineStyle: { width: 2, type: 'dashed' },
          itemStyle: { color: '#f59e0b' } // Amber 500
        },
        {
          name: '表現率',
          type: 'line',
          data: oeeData.map(d => d.performance),
          smooth: true,
          lineStyle: { width: 2, type: 'dashed' },
          itemStyle: { color: '#3b82f6' } // Blue 500
        },
        {
          name: '品質率',
          type: 'line',
          data: oeeData.map(d => d.quality),
          smooth: true,
          lineStyle: { width: 2, type: 'dashed' },
          itemStyle: { color: '#10b981' } // Emerald 500
        }
      ]
    }
  }, [oeeData])

  // 2. 產線目標達成率 (Bar Chart)
  const outputChartOption = useMemo(() => {
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['目標產出', '實際產出'], bottom: 0, icon: 'circle' },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '10%',
        containLabel: true
      },
      xAxis: { type: 'category', data: outputData.map(d => d.line) },
      yAxis: { type: 'value', name: '數量 (PCS)' },
      series: [
        {
          name: '目標產出',
          type: 'bar',
          data: outputData.map(d => d.target),
          itemStyle: { color: '#e2e8f0', borderRadius: [4, 4, 0, 0] }, // Slate 200
          barWidth: '30%',
          barGap: '-100%', // 重疊顯示
          z: 1
        },
        {
          name: '實際產出',
          type: 'bar',
          data: outputData.map(d => ({
            value: d.actual,
            itemStyle: {
              // 實際 < 目標 90% 顯示紅色，否則顯示藍綠色
              color: d.actual / d.target < 0.9 ? '#f43f5e' : '#0ea5e9',
              borderRadius: [4, 4, 0, 0]
            }
          })),
          label: {
            show: true,
            position: 'top',
            formatter: (params: any) =>
              `${Math.round((params.value / outputData[params.dataIndex].target) * 100)}%`
          },
          barWidth: '30%',
          z: 2
        }
      ]
    }
  }, [outputData])

  // 3. 不良原因柏拉圖 (Pareto Chart - Bar + Line)
  const defectChartOption = useMemo(() => {
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: {
        data: ['不良數量', '累積百分比'],
        bottom: 0,
        icon: 'roundRect'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: defectData.map(d => d.reason.split(' ')[0]),
        axisLabel: { interval: 0, rotate: 30 }
      },
      yAxis: [
        { type: 'value', name: '不良數', alignTicks: true },
        {
          type: 'value',
          name: '累積 %',
          max: 100,
          alignTicks: true,
          axisLabel: { formatter: '{value}%' }
        }
      ],
      series: [
        {
          name: '不良數量',
          type: 'bar',
          data: defectData.map(d => d.count),
          itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] }, // Amber 500
          barWidth: '40%'
        },
        {
          name: '累積百分比',
          type: 'line',
          yAxisIndex: 1,
          data: defectData.map(d => d.cumulativeRatio),
          itemStyle: { color: '#e11d48' }, // Rose 600
          lineStyle: { width: 3 },
          symbolSize: 8,
          label: { show: true, position: 'top', formatter: '{c}%' }
        }
      ]
    }
  }, [defectData])

  // --- 表格欄位定義 (不良機台關注清單) ---
  const columns: ColumnsType<UnderperformingMachine> = [
    {
      title: '異常站點 / 機台',
      dataIndex: 'workCenter',
      key: 'workCenter',
      width: 180,
      render: text => (
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200'>
            <Factory size={14} className='text-slate-500' />
          </div>
          <span className='font-bold text-slate-700 text-sm'>{text}</span>
        </div>
      )
    },
    {
      title: '當前 OEE',
      dataIndex: 'oee',
      key: 'oee',
      width: 140,
      render: val => (
        <span
          className={cn(
            'font-black text-lg font-mono',
            val < 70 ? 'text-rose-600' : 'text-amber-600'
          )}
        >
          {val}%
        </span>
      )
    },
    {
      title: '累積停機時數',
      dataIndex: 'downtimeHours',
      key: 'downtimeHours',
      width: 140,
      render: val => (
        <div className='flex items-center gap-1.5'>
          <Clock
            size={14}
            className={val > 2 ? 'text-rose-500' : 'text-slate-400'}
          />
          <span
            className={cn(
              'font-bold text-sm font-mono',
              val > 2 ? 'text-rose-600' : 'text-slate-600'
            )}
          >
            {val} hr
          </span>
        </div>
      )
    },
    {
      title: '主要異常真因 (Root Cause)',
      dataIndex: 'primaryIssue',
      key: 'primaryIssue',
      width: 250,
      render: text => (
        <div className='flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 w-fit'>
          <AlertTriangle size={14} className='text-rose-500 shrink-0' />
          <span className='text-xs font-bold text-rose-700'>{text}</span>
        </div>
      )
    },
    {
      title: '處置狀態',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: status => (
        <Tag
          className={cn(
            'm-0 font-bold border-none px-3 py-1 rounded-full text-xs',
            status === '需立即處置'
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-amber-100 text-amber-700'
          )}
        >
          {status}
        </Tag>
      )
    }
  ]

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#4f46e5', borderRadius: 12, borderRadiusSM: 6 } // Indigo 600 base
      }}
    >
      <div className='w-full min-h-screen bg-[#f1f5f9] p-4 font-sans'>
        <div className='mx-auto px-2 pt-2 pb-8 space-y-6 animate-fade-in relative max-w-400'>
          {loading && (
            <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-110 flex items-center justify-center rounded-[28px] mt-15'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin' />
                <span className='text-xs font-black text-indigo-600 tracking-widest uppercase'>
                  Analyzing Data...
                </span>
              </div>
            </div>
          )}

          {/* 玻璃透視頂部導航列 */}
          <div className='flex flex-wrap items-center justify-between px-1 gap-y-4 bg-white/70 py-2.5 rounded-2xl sticky top-0 z-20 backdrop-blur-md shadow-sm border border-white'>
            <div className='flex items-center gap-3 ml-2'>
              <div className='bg-linear-to-br from-indigo-600 to-purple-600 p-2 rounded-xl shadow-indigo-200 shadow-lg'>
                <BarChart3 size={20} className='text-white' />
              </div>
              <div className='flex flex-col'>
                <span className='text-lg font-black text-slate-800 tracking-tight'>
                  高階生產戰情分析 (Analytics Dashboard)
                </span>
                <span className='text-[11px] font-bold text-slate-500 tracking-wider uppercase'>
                  Real-time Operational Intelligence
                </span>
              </div>
            </div>

            <div className='flex items-center gap-4 mr-2'>
              <Segmented
                options={[
                  { value: 'today', label: '今日' },
                  { value: 'week', label: '本週' },
                  { value: 'month', label: '本月' }
                ]}
                value={timeRange}
                onChange={val => {
                  setLoading(true)
                  setTimeRange(val as string)
                }}
                className='bg-slate-200/50 p-1 rounded-xl font-bold text-slate-600'
              />
              <Tooltip title='匯出戰情 PDF 報告'>
                <Button
                  type='text'
                  icon={<Download size={18} />}
                  className='text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl h-10 w-10 flex items-center justify-center transition-colors'
                  onClick={() => message.info('報告生成中，即將開始下載...')}
                />
              </Tooltip>
              <Tooltip title='重新整理大數據'>
                <Button
                  type='primary'
                  icon={
                    <RefreshCw
                      size={16}
                      className={loading ? 'animate-spin' : ''}
                    />
                  }
                  className='rounded-xl bg-indigo-600 shadow-md shadow-indigo-200 font-bold border-none h-10 flex items-center justify-center hover:bg-indigo-500'
                  onClick={handleRefresh}
                >
                  <span className='hidden sm:inline ml-1 text-sm'>
                    更新數據
                  </span>
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* 全局 KPI 脈衝監控區塊 */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5'>
            <StatCard
              title='全廠綜合稼動率 (OEE)'
              value='78.4'
              unit='%'
              icon={Activity}
              colorClass='text-rose-500'
              bgClass='bg-indigo-50'
              iconColorClass='text-indigo-600'
              trend='較昨日下降 2.1%'
              isAlert={true} // 模擬 OEE 過低報警
            />
            <StatCard
              title='累積生產總產出'
              value='12,450'
              unit='PCS'
              icon={Target}
              colorClass='text-emerald-500'
              bgClass='bg-emerald-50'
              iconColorClass='text-emerald-600'
              trend='達標率 92.5%'
            />
            <StatCard
              title='直通良率 (FPY)'
              value='96.5'
              unit='%'
              icon={ShieldAlert}
              colorClass='text-amber-500'
              bgClass='bg-blue-50'
              iconColorClass='text-blue-600'
              trend='低於目標 98.0%'
            />
            <StatCard
              title='機台異常停機時數'
              value='4.2'
              unit='hr'
              icon={Zap}
              colorClass='text-rose-500'
              bgClass='bg-rose-50'
              iconColorClass='text-rose-600'
              trend='佔用總工時 5.8%'
            />
          </div>

          {/* 核心視覺化圖表區塊 (Grid) */}
          <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
            {/* OEE 趨勢圖 (佔 2 欄) */}
            <Card
              className='xl:col-span-2 rounded-3xl border-none shadow-md bg-white hover:shadow-lg transition-shadow'
              styles={{ body: { padding: '24px' } }}
            >
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-2'>
                  <div className='w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center'>
                    <TrendingUp size={18} className='text-indigo-600' />
                  </div>
                  <h3 className='text-lg font-black text-slate-800 m-0'>
                    OEE 綜合設備稼動率趨勢
                  </h3>
                </div>
                <Tag
                  color='processing'
                  className='m-0 font-bold rounded-md px-3 py-1'
                >
                  每小時自動快照
                </Tag>
              </div>
              <div className='w-full h-[320px]'>
                <ReactECharts option={oeeChartOption} />
              </div>
            </Card>

            {/* 產線達成率 (佔 1 欄) */}
            <Card
              className='col-span-1 rounded-3xl border-none shadow-md bg-white hover:shadow-lg transition-shadow'
              styles={{ body: { padding: '24px' } }}
            >
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-2'>
                  <div className='w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center'>
                    <Crosshair size={18} className='text-blue-600' />
                  </div>
                  <h3 className='text-lg font-black text-slate-800 m-0'>
                    各線體產出達成率
                  </h3>
                </div>
              </div>
              <div className='w-full h-[320px]'>
                <ReactECharts option={outputChartOption} />
              </div>
            </Card>

            {/* 不良原因柏拉圖 (佔 2 欄) */}
            <Card
              className='xl:col-span-2 rounded-3xl border-none shadow-md bg-white hover:shadow-lg transition-shadow'
              styles={{ body: { padding: '24px' } }}
            >
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-2'>
                  <div className='w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center'>
                    <PieChart size={18} className='text-amber-600' />
                  </div>
                  <h3 className='text-lg font-black text-slate-800 m-0'>
                    不良原因柏拉圖 (Pareto Analysis)
                  </h3>
                </div>
                <div className='text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full'>
                  前兩大異常佔整體損失 69%
                </div>
              </div>
              <div className='w-full h-[320px]'>
                <ReactECharts option={defectChartOption} />
              </div>
            </Card>

            {/* 異常機台關注清單 (佔 1 欄的縮略版本，引導至下方完整表格) */}
            <Card
              className='col-span-1 rounded-3xl border-none shadow-md bg-gradient-to-b from-rose-50 to-white hover:shadow-lg transition-shadow'
              styles={{
                body: {
                  padding: '24px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }
              }}
            >
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-2'>
                  <div className='w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center'>
                    <AlertTriangle size={18} className='text-rose-600' />
                  </div>
                  <h3 className='text-lg font-black text-slate-800 m-0'>
                    重點關注機台 Top 3
                  </h3>
                </div>
              </div>

              <div className='flex-1 flex flex-col gap-4'>
                {underperforming.slice(0, 3).map((machine, idx) => (
                  <div
                    key={machine.id}
                    className='bg-white p-3 rounded-xl border border-rose-100 shadow-sm flex items-center justify-between'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-6 h-6 rounded-full bg-rose-600 text-white font-black text-xs flex items-center justify-center'>
                        {idx + 1}
                      </div>
                      <div className='flex flex-col'>
                        <span className='font-bold text-slate-700'>
                          {machine.workCenter}
                        </span>
                        <span className='text-[10px] text-rose-500 font-bold truncate max-w-[120px]'>
                          {machine.primaryIssue}
                        </span>
                      </div>
                    </div>
                    <div className='flex flex-col items-end'>
                      <span className='text-[10px] text-slate-400 font-bold mb-0.5'>
                        OEE
                      </span>
                      <span className='text-sm font-black text-rose-600 font-mono'>
                        {machine.oee}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type='dashed'
                className='w-full mt-4 border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-100'
                onClick={() => setIsMachineListModalVisible(true)}
              >
                查看完整關注清單
              </Button>
            </Card>
          </div>

          {/* --- 完整關注清單 Modal --- */}
          <Modal
            title={
              <div className='flex items-center gap-3 text-slate-800 border-b border-slate-100 pb-4'>
                <div className='bg-rose-100 p-2 rounded-xl shadow-sm shadow-rose-100'>
                  <Settings2 size={24} className='text-rose-600' />
                </div>
                <div className='flex flex-col'>
                  <span className='font-black text-xl tracking-tight'>
                    機台異常與低效處置清單 (Action Required)
                  </span>
                  <span className='text-xs font-bold text-slate-400 mt-1'>
                    請優先處理「需立即處置」的機台，以防產能持續流失
                  </span>
                </div>
              </div>
            }
            open={isMachineListModalVisible}
            onCancel={() => setIsMachineListModalVisible(false)}
            footer={null}
            className='custom-hmi-modal'
            width={1000}
          >
            <div className='mt-4'>
              <Table<UnderperformingMachine>
                columns={columns}
                dataSource={underperforming}
                loading={false}
                scroll={{ x: 1000 }}
                rowKey='id'
                pagination={{
                  pageSize: 10,
                  showSizeChanger: false,
                  className: 'mt-4 pb-2'
                }}
              />
            </div>
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

            .custom-message .ant-message-notice-content {
              border-radius: 12px;
              padding: 12px 24px;
              font-weight: bold;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
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
