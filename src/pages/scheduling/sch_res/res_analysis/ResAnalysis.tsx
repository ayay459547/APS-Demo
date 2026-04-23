import React, { useEffect, useRef, useState } from 'react'
import {
  ConfigProvider,
  Button,
  Tag,
  Card,
  Space,
  Progress,
  Row,
  Col,
  Avatar,
  List,
  Badge,
  Modal,
  message
} from 'antd'
import {
  BarChart3,
  TrendingUp,
  Gauge,
  Clock,
  AlertTriangle,
  PackageX,
  Factory,
  Settings2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Sparkles,
  CheckCircle2,
  Bot,
  ChevronRight,
  Search,
  ScanSearch
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

// --- 工具函數 ---
function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes))
}
const generateId = () =>
  Math.random().toString(36).substring(2, 11) + Date.now().toString(36)

// --- 假資料定義 ---
const MOCK_KPIS = {
  otd: { value: 94.2, trend: 1.5, status: 'up' },
  oee: { value: 87.5, trend: 2.1, status: 'up' },
  tardiness: { value: 124, trend: -15, status: 'down' },
  setupCost: { value: 15.2, trend: 3.4, status: 'up' }
}

const MOCK_BOTTLENECKS = [
  {
    id: 'CNC-001',
    name: '五軸 CNC 精銑 1號機',
    load: 112,
    process: '精銑',
    status: 'critical'
  },
  {
    id: 'LSR-002',
    name: '超高速雷射 2號機',
    load: 98,
    process: '下料',
    status: 'warning'
  },
  {
    id: 'BND-001',
    name: '智能折彎單元 1號機',
    load: 95,
    process: '成型',
    status: 'warning'
  }
]

const MOCK_DELAYED_ORDERS = [
  {
    id: 'WO-20260492',
    customer: 'Tesla Giga',
    item: '電池外殼底座',
    delayDays: 3,
    reason: 'CNC 產能瓶頸',
    priority: 'Urgent'
  },
  {
    id: 'WO-20260511',
    customer: 'SpaceX',
    item: '衛星支架組件',
    delayDays: 2,
    reason: '物料未齊套',
    priority: 'High'
  },
  {
    id: 'WO-20260534',
    customer: 'NVIDIA',
    item: 'AI 伺服器散熱片',
    delayDays: 1,
    reason: '換線等待過長',
    priority: 'High'
  },
  {
    id: 'WO-20260601',
    customer: 'ASML',
    item: 'EUV 承載盤',
    delayDays: 1,
    reason: '品檢前置期',
    priority: 'Normal'
  }
]

// --- AI 互動節點型別 ---
export type AiStep = 1 | 2 | 3 | 4
export type AiLogType = 'log' | 'prompt' | 'user' | 'system'
export interface AiLog {
  id: string
  type: AiLogType
  text: string
  options?: {
    label: string
    value: string
    icon?: React.ReactNode
    color?: string
    bgClass?: string
  }[]
}

export default function APSSchedulingAnalysis() {
  const trendChartRef = useRef<HTMLDivElement>(null)
  const distChartRef = useRef<HTMLDivElement>(null)

  // --- 狀態管理 ---
  const [hasAnalyzed, setHasAnalyzed] = useState<boolean>(false)
  const [analysisMode, setAnalysisMode] = useState<'summary' | 'deep' | null>(
    null
  ) // 控制顯示模式
  const [pendingAnalysisMode, setPendingAnalysisMode] = useState<
    'summary' | 'deep'
  >('deep') // 暫存 AI 對話中的選擇

  // AI 助理狀態
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false)
  const [aiStep, setAiStep] = useState<AiStep>(1)
  const [aiLogs, setAiLogs] = useState<AiLog[]>([])
  const aiLogEndRef = useRef<HTMLDivElement>(null)
  const aiTimersRef = useRef<number[]>([])

  // 自動捲動 AI 對話
  useEffect(() => {
    if (aiLogEndRef.current) {
      aiLogEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [aiLogs])

  // --- 中斷機制 ---
  const clearAiTimers = () => {
    aiTimersRef.current.forEach(window.clearTimeout)
    aiTimersRef.current = []
  }

  const handleCancelAnalysis = () => {
    clearAiTimers()
    setIsAiModalOpen(false)
    message.info('已中斷排程分析程序，資料未更新。')
  }

  // --- AI 啟動分析邏輯 ---
  const handleStartAnalysis = () => {
    clearAiTimers()
    setIsAiModalOpen(true)
    setAiStep(1)
    setAiLogs([
      {
        id: generateId(),
        type: 'system',
        text: `APS 智能分析引擎連線成功 • ${dayjs().format('YYYY/MM/DD HH:mm')}`
      },
      {
        id: generateId(),
        type: 'log',
        text: '正在擷取當前正式排程之資料快照...'
      },
      {
        id: generateId(),
        type: 'log',
        text: '正在計算全域 KPI 指標 (OEE, OTD, 換線成本)...'
      }
    ])

    const t1 = window.setTimeout(() => {
      setAiLogs(prev => [
        ...prev,
        {
          id: generateId(),
          type: 'log',
          text: `✔ KPI 計算完成：預估稼動率可達 87.5%，達交率 94.2%。`
        },
        {
          id: generateId(),
          type: 'log',
          text: `正在掃描所有工作站尋找潛在瓶頸...`
        }
      ])
    }, 1500)
    aiTimersRef.current.push(t1)

    const t2 = window.setTimeout(() => {
      setAiLogs(prev => [
        ...prev,
        {
          id: 'prompt1',
          type: 'prompt',
          text: '【分析報告】已找出 3 個負荷過重之瓶頸機台。是否需要連帶對「高風險延遲工單」進行深度根因診斷？',
          options: [
            {
              label: '進行深度診斷 (推薦)',
              value: 'deep_scan',
              icon: <ScanSearch size={16} />,
              color: 'text-indigo-600',
              bgClass: 'bg-indigo-50'
            },
            {
              label: '跳過，僅顯示摘要',
              value: 'skip',
              icon: <BarChart3 size={16} />,
              color: 'text-slate-600',
              bgClass: 'bg-slate-50'
            }
          ]
        }
      ])
    }, 3000)
    aiTimersRef.current.push(t2)
  }

  const handleAiInteract = (step: AiStep, value: string, label: string) => {
    clearAiTimers()
    setAiLogs(prev => [
      ...prev.filter(l => l.type !== 'prompt'),
      { id: generateId(), type: 'user', text: `${label}` }
    ])

    if (step === 1) {
      setAiStep(3)
      setPendingAnalysisMode(value === 'deep_scan' ? 'deep' : 'summary')

      const t1 = window.setTimeout(() => {
        if (value === 'deep_scan') {
          setAiLogs(prev => [
            ...prev,
            {
              id: generateId(),
              type: 'log',
              text: `啟動深度診斷模式...正在追溯 BOM 表與前置期...`
            },
            {
              id: generateId(),
              type: 'log',
              text: `✔ 成功鎖定 4 筆高風險延遲工單及其觸發原因。`
            }
          ])
        } else {
          setAiLogs(prev => [
            ...prev,
            {
              id: generateId(),
              type: 'log',
              text: `套用快速摘要模式...跳過深度根因分析。`
            }
          ])
        }
      }, 800)
      aiTimersRef.current.push(t1)

      const t2 = window.setTimeout(() => {
        setAiStep(4)
        setAiLogs(prev => [
          ...prev,
          {
            id: 'prompt_final',
            type: 'prompt',
            text: `分析報表渲染準備就緒。是否立即前往「排程結果分析」戰情看板？`,
            options: [
              {
                label: '確認並渲染圖表',
                value: 'render',
                icon: <BarChart3 size={16} />,
                color: 'text-white',
                bgClass: 'bg-indigo-600 hover:bg-indigo-700'
              }
            ]
          }
        ])
      }, 2500)
      aiTimersRef.current.push(t2)
    } else if (step === 4) {
      if (value === 'render') {
        setIsAiModalOpen(false)
        setAnalysisMode(pendingAnalysisMode) // 正式套用選擇的顯示模式
        setHasAnalyzed(true)
        message.success('排程分析完成！戰情看板已更新。')
      }
    }
  }

  // --- 初始化 ECharts ---
  useEffect(() => {
    if (!hasAnalyzed || !trendChartRef.current || !distChartRef.current) return

    const trendChart = echarts.init(trendChartRef.current)
    const distChart = echarts.init(distChartRef.current)
    const dates = Array.from({ length: 7 }).map((_, i) =>
      dayjs().add(i, 'day').format('MM/DD')
    )

    // --- 產能負荷趨勢圖 ---
    const trendOption: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#1e293b' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b', fontFamily: 'Inter' }
      },
      yAxis: {
        type: 'value',
        max: 120,
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { color: '#64748b', formatter: '{value}%' }
      },
      series: [
        {
          name: '預估稼動率',
          type: 'line',
          smooth: true,
          lineStyle: { width: 3, color: '#4f46e5' }, // Indigo-600
          showSymbol: false,
          areaStyle: {
            opacity: 0.2,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#4f46e5' },
              { offset: 1, color: 'rgba(79, 70, 229, 0.01)' }
            ])
          },
          data: [82, 88, 95, 105, 92, 85, 78],
          markLine: {
            silent: true,
            lineStyle: { color: '#ef4444', type: 'dashed' },
            data: [
              {
                yAxis: 100,
                label: {
                  formatter: '超載線',
                  position: 'insideEndTop',
                  color: '#ef4444'
                }
              }
            ]
          }
        }
      ]
    }
    trendChart.setOption(trendOption, true)

    // --- 工時耗用分佈圖 ---
    const distOption: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} 小時 ({d}%)',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#1e293b' }
      },
      legend: {
        bottom: '0%',
        left: 'center',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: '#64748b' }
      },
      color: ['#4f46e5', '#f59e0b', '#e2e8f0'],
      series: [
        {
          name: '工時分佈',
          type: 'pie',
          radius: ['50%', '75%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: { show: false, position: 'center' },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              color: '#1e293b'
            }
          },
          labelLine: { show: false },
          data: [
            { value: 850, name: '有效生產' },
            { value: 152, name: '換線清機' },
            { value: 98, name: '機台閒置' }
          ]
        }
      ]
    }
    distChart.setOption(distOption, true)

    const handleResize = () => {
      trendChart.resize()
      distChart.resize()
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      trendChart.dispose()
      distChart.dispose()
    }
  }, [hasAnalyzed])

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          borderRadius: 12,
          fontFamily: '"Inter", "Noto Sans TC", sans-serif'
        }
      }}
    >
      <div className='w-full h-full bg-[#f8fafc] text-slate-800 flex flex-col overflow-hidden relative'>
        {/* --- 頂部 Header --- */}
        <header className='h-[72px] bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-50 shadow-sm animate-[fadeIn_0.3s_ease-out]'>
          <div className='flex items-center gap-4'>
            <div className='w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200'>
              <BarChart3 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className='text-xl font-black tracking-tight text-slate-800 m-0'>
                排程結果分析
              </h1>
              <p className='text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest'>
                Scheduling Results & Analytics
              </p>
            </div>
          </div>

          <Space size='middle'>
            <Button
              type='primary'
              icon={<Sparkles size={16} />}
              onClick={handleStartAnalysis}
              className='font-bold px-6 shadow-md shadow-indigo-200 border-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition-all h-10 rounded-lg flex items-center gap-2'
            >
              {hasAnalyzed ? '重新診斷分析' : 'AI 排程分析'}
            </Button>
          </Space>
        </header>

        {/* --- 主內容區塊 --- */}
        <main className='flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar relative'>
          {/* 空狀態：等待分析 */}
          {!hasAnalyzed ? (
            <div className='absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50'>
              <div className='relative mb-6'>
                <div className='absolute inset-0 bg-indigo-200 blur-3xl opacity-30 animate-pulse' />
                <Search
                  size={80}
                  className='text-slate-300 relative'
                  strokeWidth={1.5}
                />
              </div>
              <h2 className='text-xl font-black text-slate-700 m-0'>
                等待執行排程分析
              </h2>
              <p className='text-slate-500 font-bold mt-2 text-sm'>
                請點擊右上角「AI 排程分析」按鈕，讓系統為您檢測瓶頸與風險
              </p>
            </div>
          ) : (
            <div className='max-w-7xl mx-auto flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]'>
              {/* 1. 北極星指標 (KPI Cards) */}
              <Row gutter={[20, 20]}>
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    bordered={false}
                    className='shadow-sm rounded-2xl border border-slate-200 hover:border-indigo-200 transition-colors h-full group'
                    styles={{ body: { padding: '20px' } }}
                  >
                    <div className='flex justify-between items-start mb-2'>
                      <div className='flex items-center gap-2 text-slate-500'>
                        <CheckCircle2 size={16} />{' '}
                        <span className='font-bold text-sm'>
                          準時達交率 (OTD)
                        </span>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full',
                          MOCK_KPIS.otd.status === 'up'
                            ? 'text-emerald-600 bg-emerald-50'
                            : 'text-rose-600 bg-rose-50'
                        )}
                      >
                        <ArrowUpRight size={12} /> {MOCK_KPIS.otd.trend}%
                      </div>
                    </div>
                    <div className='flex items-baseline gap-1 mt-2'>
                      <span className='text-3xl font-black text-slate-800 font-mono tracking-tight'>
                        {MOCK_KPIS.otd.value}
                      </span>
                      <span className='text-sm font-bold text-slate-400'>
                        %
                      </span>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                  <Card
                    bordered={false}
                    className='shadow-sm rounded-2xl border border-slate-200 hover:border-indigo-200 transition-colors h-full'
                    styles={{ body: { padding: '20px' } }}
                  >
                    <div className='flex justify-between items-start mb-2'>
                      <div className='flex items-center gap-2 text-slate-500'>
                        <Gauge size={16} />{' '}
                        <span className='font-bold text-sm'>
                          設備稼動率 (OEE)
                        </span>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full',
                          MOCK_KPIS.oee.status === 'up'
                            ? 'text-emerald-600 bg-emerald-50'
                            : 'text-rose-600 bg-rose-50'
                        )}
                      >
                        <ArrowUpRight size={12} /> {MOCK_KPIS.oee.trend}%
                      </div>
                    </div>
                    <div className='flex items-baseline gap-1 mt-2'>
                      <span className='text-3xl font-black text-indigo-600 font-mono tracking-tight'>
                        {MOCK_KPIS.oee.value}
                      </span>
                      <span className='text-sm font-bold text-slate-400'>
                        %
                      </span>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                  <Card
                    bordered={false}
                    className='shadow-sm rounded-2xl border border-slate-200 hover:border-indigo-200 transition-colors h-full'
                    styles={{ body: { padding: '20px' } }}
                  >
                    <div className='flex justify-between items-start mb-2'>
                      <div className='flex items-center gap-2 text-slate-500'>
                        <AlertTriangle size={16} />{' '}
                        <span className='font-bold text-sm'>總延遲時數</span>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full text-emerald-600 bg-emerald-50'
                        )}
                      >
                        <ArrowDownRight size={12} />{' '}
                        {Math.abs(MOCK_KPIS.tardiness.trend)}h
                      </div>
                    </div>
                    <div className='flex items-baseline gap-1 mt-2'>
                      <span className='text-3xl font-black text-slate-800 font-mono tracking-tight'>
                        {MOCK_KPIS.tardiness.value}
                      </span>
                      <span className='text-sm font-bold text-slate-400'>
                        Hrs
                      </span>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                  <Card
                    bordered={false}
                    className='shadow-sm rounded-2xl border border-slate-200 hover:border-indigo-200 transition-colors h-full'
                    styles={{ body: { padding: '20px' } }}
                  >
                    <div className='flex justify-between items-start mb-2'>
                      <div className='flex items-center gap-2 text-slate-500'>
                        <Settings2 size={16} />{' '}
                        <span className='font-bold text-sm'>換線工時佔比</span>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full text-rose-600 bg-rose-50'
                        )}
                      >
                        <ArrowUpRight size={12} />{' '}
                        {Math.abs(MOCK_KPIS.setupCost.trend)}%
                      </div>
                    </div>
                    <div className='flex items-baseline gap-1 mt-2'>
                      <span className='text-3xl font-black text-amber-500 font-mono tracking-tight'>
                        {MOCK_KPIS.setupCost.value}
                      </span>
                      <span className='text-sm font-bold text-slate-400'>
                        %
                      </span>
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* 2. 動態數據圖表 (ECharts) */}
              <Row gutter={[20, 20]}>
                <Col xs={24} lg={16}>
                  <Card
                    title={
                      <div className='flex items-center gap-2 text-slate-800'>
                        <TrendingUp size={18} className='text-indigo-500' />
                        <span className='font-black text-[15px]'>
                          產能負荷趨勢預測
                        </span>
                      </div>
                    }
                    extra={
                      <Tag className='border-none bg-slate-100 text-slate-500 font-bold m-0'>
                        未來 7 日
                      </Tag>
                    }
                    bordered={false}
                    className='shadow-sm rounded-2xl border border-slate-200 h-[380px]'
                    styles={{
                      header: {
                        borderBottom: '1px solid #f1f5f9',
                        padding: '16px 20px'
                      },
                      body: {
                        padding: '10px 20px 20px 20px',
                        height: 'calc(100% - 60px)'
                      }
                    }}
                  >
                    <div ref={trendChartRef} className='w-full h-full' />
                  </Card>
                </Col>

                <Col xs={24} lg={8}>
                  <Card
                    title={
                      <div className='flex items-center gap-2 text-slate-800'>
                        <Clock size={18} className='text-indigo-500' />
                        <span className='font-black text-[15px]'>
                          工時耗用分佈
                        </span>
                      </div>
                    }
                    bordered={false}
                    className='shadow-sm rounded-2xl border border-slate-200 h-[380px]'
                    styles={{
                      header: {
                        borderBottom: '1px solid #f1f5f9',
                        padding: '16px 20px'
                      },
                      body: {
                        padding: '10px 20px 20px 20px',
                        height: 'calc(100% - 60px)'
                      }
                    }}
                  >
                    <div ref={distChartRef} className='w-full h-full' />
                  </Card>
                </Col>
              </Row>

              {/* 3. 瓶頸與例外管理 (依據 analysisMode 決定是否顯示) */}
              {analysisMode === 'deep' ? (
                <Row
                  gutter={[20, 20]}
                  className='mb-8 animate-[fadeIn_0.5s_ease-out]'
                >
                  <Col xs={24} lg={10}>
                    <Card
                      title={
                        <div className='flex items-center gap-2 text-slate-800'>
                          <Factory size={18} className='text-rose-500' />
                          <span className='font-black text-[15px]'>
                            Top 3 瓶頸設備 (Bottlenecks)
                          </span>
                        </div>
                      }
                      bordered={false}
                      className='shadow-sm rounded-2xl border border-slate-200 h-full'
                      styles={{
                        header: {
                          borderBottom: '1px solid #f1f5f9',
                          padding: '16px 20px'
                        },
                        body: { padding: '20px' }
                      }}
                    >
                      <div className='flex flex-col gap-5'>
                        {MOCK_BOTTLENECKS.map((machine, idx) => (
                          <div
                            key={machine.id}
                            className='flex flex-col gap-1.5'
                          >
                            <div className='flex justify-between items-center'>
                              <div className='flex items-center gap-2'>
                                <Avatar
                                  size={24}
                                  className={
                                    machine.status === 'critical'
                                      ? 'bg-rose-100 text-rose-600 font-black text-xs'
                                      : 'bg-amber-100 text-amber-600 font-black text-xs'
                                  }
                                >
                                  #{idx + 1}
                                </Avatar>
                                <span className='text-sm font-black text-slate-700'>
                                  {machine.name}
                                </span>
                              </div>
                              <span
                                className={cn(
                                  'text-xs font-black font-mono',
                                  machine.status === 'critical'
                                    ? 'text-rose-600'
                                    : 'text-amber-500'
                                )}
                              >
                                {machine.load}%
                              </span>
                            </div>
                            <Progress
                              percent={machine.load > 100 ? 100 : machine.load}
                              showInfo={false}
                              strokeColor={
                                machine.status === 'critical'
                                  ? '#ef4444'
                                  : '#f59e0b'
                              }
                              trailColor='#f1f5f9'
                              strokeWidth={8}
                              className='m-0'
                            />
                            <div className='flex justify-between items-center mt-1'>
                              <span className='text-[10px] text-slate-400 font-bold tracking-widest'>
                                {machine.process}
                              </span>
                              {machine.status === 'critical' && (
                                <span className='text-[10px] text-rose-500 font-bold flex items-center gap-1 animate-pulse'>
                                  <AlertTriangle size={10} /> 嚴重超載
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} lg={14}>
                    <Card
                      title={
                        <div className='flex items-center gap-2 text-slate-800'>
                          <PackageX size={18} className='text-amber-500' />
                          <span className='font-black text-[15px]'>
                            高風險延遲工單 (Delayed Orders)
                          </span>
                        </div>
                      }
                      extra={
                        <Tag
                          color='warning'
                          className='border-none font-bold bg-amber-50 text-amber-600 m-0'
                        >
                          {MOCK_DELAYED_ORDERS.length} 筆需關注
                        </Tag>
                      }
                      bordered={false}
                      className='shadow-sm rounded-2xl border border-slate-200 h-full'
                      styles={{
                        header: {
                          borderBottom: '1px solid #f1f5f9',
                          padding: '16px 20px'
                        },
                        body: { padding: '0px' }
                      }}
                    >
                      <List
                        itemLayout='horizontal'
                        dataSource={MOCK_DELAYED_ORDERS}
                        className='custom-list'
                        renderItem={item => (
                          <List.Item className='px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors group'>
                            <div className='flex items-center justify-between w-full gap-4'>
                              {/* 狀態與標題 */}
                              <div className='flex items-start gap-3 w-1/3'>
                                <div className='mt-1'>
                                  {item.priority === 'Urgent' ? (
                                    <Badge color='#ef4444' />
                                  ) : (
                                    <Badge color='#f59e0b' />
                                  )}
                                </div>
                                <div className='flex flex-col'>
                                  <span className='text-sm font-black font-mono text-indigo-600'>
                                    {item.id}
                                  </span>
                                  <span className='text-[11px] font-bold text-slate-500 mt-0.5 truncate'>
                                    {item.customer} • {item.item}
                                  </span>
                                </div>
                              </div>

                              {/* 延遲狀況 */}
                              <div className='flex flex-col items-start w-1/4'>
                                <span className='text-xs font-bold text-slate-400'>
                                  預估延遲
                                </span>
                                <span
                                  className={cn(
                                    'text-[14px] font-black font-mono',
                                    item.delayDays >= 3
                                      ? 'text-rose-500'
                                      : 'text-amber-500'
                                  )}
                                >
                                  {item.delayDays} Days
                                </span>
                              </div>

                              {/* 原因 */}
                              <div className='flex flex-col items-start w-1/4 hidden sm:flex'>
                                <span className='text-xs font-bold text-slate-400'>
                                  觸發原因
                                </span>
                                <span className='text-[12px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded mt-0.5'>
                                  {item.reason}
                                </span>
                              </div>
                            </div>
                          </List.Item>
                        )}
                      />
                    </Card>
                  </Col>
                </Row>
              ) : (
                <div className='w-full bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center mt-2 mb-8 animate-[fadeIn_0.5s_ease-out]'>
                  <ScanSearch
                    size={48}
                    className='text-slate-300 mb-4'
                    strokeWidth={1.5}
                  />
                  <span className='text-lg font-black text-slate-600'>
                    深度診斷模組未啟用
                  </span>
                  <span className='text-sm font-bold text-slate-400 mt-1 max-w-md text-center'>
                    目前為「快速摘要模式」。若需解鎖「Top 3
                    瓶頸設備」與「高風險延遲工單」之根因分析，請重新執行 AI
                    排程分析。
                  </span>
                  <Button
                    type='primary'
                    className='mt-6 bg-indigo-600 shadow-md shadow-indigo-200 border-none font-bold px-6 h-10 rounded-lg flex items-center gap-2 hover:bg-indigo-500'
                    onClick={handleStartAnalysis}
                  >
                    <Sparkles size={16} /> 重新執行 AI 深度分析
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* === AI 智慧分析對話框 (Agent Loop) === */}
        <Modal
          open={isAiModalOpen}
          closable={true}
          maskClosable={true}
          onCancel={handleCancelAnalysis}
          footer={null}
          width={1000}
          centered
          className='ai-copilot-modal'
          styles={{
            root: {
              padding: 0,
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: 'transparent'
            },
            mask: {
              backdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(241, 245, 249, 0.6)'
            }
          }}
        >
          <div className='flex h-[650px] w-full relative bg-white'>
            {/* 左側：架構拓撲圖 (Flow Diagram) */}
            <div className='w-[30%] bg-slate-50 flex flex-col border-r border-slate-200'>
              <div className='px-6 py-5 border-b border-slate-200 flex flex-col bg-white'>
                <span className='text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1 flex items-center gap-1.5'>
                  <Activity size={12} /> Analysis Loop
                </span>
                <span className='text-lg font-black text-slate-800'>
                  排程分析代理
                </span>
              </div>
              <div className='flex-1 p-8 flex flex-col gap-8 relative'>
                <div className='absolute left-10 top-12 bottom-12 w-0.5 bg-slate-200' />

                {[
                  {
                    step: 1,
                    label: '排程快照與資料準備',
                    sub: 'Data Snapshots'
                  },
                  {
                    step: 2,
                    label: '全域 KPI 指標計算',
                    sub: 'Global KPI Metrics'
                  },
                  {
                    step: 3,
                    label: '潛在瓶頸與風險診斷',
                    sub: 'Risk & Bottleneck Diagnosis'
                  },
                  {
                    step: 4,
                    label: '報表與戰情畫布渲染',
                    sub: 'Dashboard Rendering'
                  }
                ].map(node => (
                  <div
                    key={node.step}
                    className={cn(
                      'flex items-start gap-4 relative z-10 transition-all duration-500',
                      aiStep >= node.step
                        ? 'opacity-100'
                        : 'opacity-40 grayscale'
                    )}
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center border-[3px] shadow-sm shrink-0 transition-colors',
                        aiStep === node.step
                          ? 'bg-indigo-600 border-indigo-100 ring-4 ring-indigo-600/20'
                          : aiStep > node.step
                            ? 'bg-slate-800 border-slate-800'
                            : 'bg-white border-slate-300'
                      )}
                    >
                      {aiStep > node.step && (
                        <CheckCircle2 size={12} className='text-white' />
                      )}
                    </div>
                    <div
                      className={cn(
                        'flex flex-col',
                        aiStep === node.step &&
                          'scale-105 origin-left transition-transform'
                      )}
                    >
                      <span
                        className={cn(
                          'font-black text-sm transition-colors',
                          aiStep === node.step
                            ? 'text-indigo-600'
                            : 'text-slate-700'
                        )}
                      >
                        {node.label}
                      </span>
                      <span className='text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5'>
                        {node.sub}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 右側：互動式 AI 助手對話區 (Chat UI) */}
            <div className='w-[70%] bg-white flex flex-col relative'>
              <div className='h-14 bg-white/90 backdrop-blur flex items-center px-6 border-b border-slate-100 shrink-0 justify-between z-10'>
                <div className='flex items-center gap-2 text-indigo-600 font-bold'>
                  <Bot size={20} />{' '}
                  <span className='text-[15px]'>AI 分析助理</span>
                </div>
                <Badge
                  status='processing'
                  text={
                    <span className='text-xs text-slate-500 font-bold'>
                      Running Diagnostics
                    </span>
                  }
                />
              </div>

              <div className='flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-slate-50/50'>
                {aiLogs.map(log => {
                  if (log.type === 'system') {
                    return (
                      <div
                        key={log.id}
                        className='text-center text-[11px] text-slate-400 font-bold my-2 bg-slate-100/50 py-1 px-3 rounded-full self-center'
                      >
                        {log.text}
                      </div>
                    )
                  }
                  if (log.type === 'user') {
                    return (
                      <div
                        key={log.id}
                        className='self-end bg-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm max-w-[80%] text-[13px] font-medium animate-[fadeIn_0.3s_ease-out]'
                      >
                        {log.text}
                      </div>
                    )
                  }
                  if (log.type === 'log') {
                    return (
                      <div
                        key={log.id}
                        className='flex gap-3 text-slate-600 text-[13px] animate-[fadeIn_0.3s_ease-out]'
                      >
                        <Sparkles
                          size={16}
                          className='mt-0.5 text-indigo-400 shrink-0 opacity-70'
                        />
                        <div className='bg-white border border-slate-100 px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm leading-relaxed'>
                          {log.text}
                        </div>
                      </div>
                    )
                  }
                  if (log.type === 'prompt') {
                    return (
                      <div
                        key={log.id}
                        className='flex flex-col gap-3 max-w-[90%] animate-[fadeIn_0.5s_ease-out]'
                      >
                        <div className='flex gap-3 text-slate-800 text-[14px] font-bold leading-relaxed'>
                          <Bot
                            size={18}
                            className='mt-0.5 text-indigo-600 shrink-0'
                          />
                          {log.text}
                        </div>
                        <div className='flex flex-col gap-2 pl-7 mt-1'>
                          {log.options?.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() =>
                                handleAiInteract(aiStep, opt.value, opt.label)
                              }
                              className='flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all text-left group outline-none'
                            >
                              <div className='flex items-center gap-3'>
                                <span
                                  className={cn(
                                    'p-2 rounded-lg transition-colors',
                                    opt.bgClass,
                                    opt.color
                                  )}
                                >
                                  {opt.icon}
                                </span>
                                <span className='font-bold text-slate-700 text-[13px]'>
                                  {opt.label}
                                </span>
                              </div>
                              <ChevronRight
                                size={16}
                                className='text-slate-300 group-hover:text-indigo-500 transition-colors'
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  }
                  return null
                })}

                {/* 閃爍 Loading 指示器 */}
                {(aiStep === 1 || aiStep === 3) &&
                  !aiLogs[aiLogs.length - 1]?.options && (
                    <div className='flex gap-2 items-center pl-1 text-indigo-400'>
                      <span
                        className='w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce'
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className='w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce'
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className='w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce'
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  )}
                <div ref={aiLogEndRef} className='h-2' />
              </div>
            </div>
          </div>
        </Modal>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

          .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #f8fafc; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

          .custom-list .ant-list-item { padding: 16px 24px; }
          .custom-list .ant-list-item:last-child { border-bottom: none; }

          .ai-copilot-modal .ant-modal-content { padding: 0 !important; }
          .ai-copilot-modal .ant-modal-close { top: 12px; right: 12px; z-index: 20; }
        `}</style>
      </div>
    </ConfigProvider>
  )
}
