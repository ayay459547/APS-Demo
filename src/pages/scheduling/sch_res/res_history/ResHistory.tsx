import React, { useEffect, useRef, useState, useMemo } from 'react'
import {
  ConfigProvider,
  Button,
  Tag,
  Card,
  Space,
  Row,
  Col,
  Badge,
  Tooltip,
  Checkbox,
  Modal,
  message,
  Popover
} from 'antd'
import {
  History,
  Settings2,
  Activity,
  CheckCircle2,
  ChevronRight,
  Search,
  FileText,
  Target,
  Bot,
  Sparkles,
  Trophy,
  ThumbsUp,
  ThumbsDown,
  Medal,
  BarChart3,
  Trash2,
  Info,
  Database
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

// --- 資料定義 (歷史排程快照庫) ---
interface HistoricalSchedule {
  id: string
  title: string
  date: string
  context: string
  score: number
  isCurrent?: boolean
  params: {
    dispatchRule: string
    batchRule: string
    productionConfig: string
  }
  kpis: {
    otd: number
    oee: number
    tardiness: number
    cost: number
  }
  radarScores: number[]
  aiAnalysis: {
    pros: string[]
    cons: string[]
  }
  color: string
}

// 包含排名資訊的擴展型別
interface RankedSchedule extends HistoricalSchedule {
  ranks: {
    otd: number
    oee: number
    cost: number
  }
}

const INITIAL_HISTORY_DB: HistoricalSchedule[] = [
  {
    id: 'HIS-260421-CUR',
    title: '現行正式排程',
    date: '2026-04-21 08:00',
    context: '當前產線正在執行的主排程計畫',
    score: 86,
    isCurrent: true,
    params: {
      dispatchRule: 'EDD (交期優先)',
      batchRule: 'ITEM (同品號合併)',
      productionConfig: '常規日班 / 無加班'
    },
    kpis: { otd: 94.2, oee: 87.5, tardiness: 124, cost: 15.2 },
    radarScores: [94, 87, 85, 80, 75],
    aiAnalysis: {
      pros: [
        '整體指標表現均衡，符合日常營運標準',
        '同品號合併策略穩定控制了換線成本'
      ],
      cons: [
        '面對特急單的插入缺乏排程彈性',
        'CNC 站點在目前的配置下已逼近超載臨界點'
      ]
    },
    color: '#10b981' // Emerald
  },
  {
    id: 'HIS-260418-E',
    title: '四月下旬設備歲修排產',
    date: '2026-04-18 16:45',
    context: '雷射切割機輪流歲修，產能降載',
    score: 78,
    params: {
      dispatchRule: 'EDD (交期優先)',
      batchRule: 'LFL (逐單生產)',
      productionConfig: '部分設備停機'
    },
    kpis: { otd: 85.0, oee: 98.2, tardiness: 110, cost: 22.0 },
    radarScores: [85, 98, 72, 50, 20],
    aiAnalysis: {
      pros: ['剩餘機台稼動率極高', '優先確保了即將到期訂單的達交'],
      cons: [
        '排程彈性極低，任何異常將導致連鎖延遲',
        '無法進行合單，換線成本偏高'
      ]
    },
    color: '#f43f5e' // Rose
  },
  {
    id: 'HIS-260410-D',
    title: '四月中旬產能擴充測試',
    date: '2026-04-10 11:30',
    context: '模擬新增 2 台 CNC 機台的產能舒緩效果',
    score: 89,
    params: {
      dispatchRule: 'SPT (最短工時)',
      batchRule: 'ITEM (同品號合併)',
      productionConfig: '新增機台擴充產能'
    },
    kpis: { otd: 92.5, oee: 82.0, tardiness: 65, cost: 16.5 },
    radarScores: [92, 82, 80, 85, 90],
    aiAnalysis: {
      pros: ['大幅降低延遲時數', '產能餘裕度高，具備應付急單彈性'],
      cons: ['設備稼動率下降，投資報酬率(ROI)可能需進一步評估']
    },
    color: '#1447e6' // Teal
  },
  {
    id: 'HIS-260328-C',
    title: '三月底成本優化排產',
    date: '2026-03-28 09:15',
    context: '月底結算，強調極致的機台稼動與成本控制',
    score: 95,
    params: {
      dispatchRule: '動態權重 (OEE優先)',
      batchRule: 'FAMILY (群組特徵合併)',
      productionConfig: '全域廠區調度開啟'
    },
    kpis: { otd: 95.8, oee: 96.5, tardiness: 42, cost: 8.5 },
    radarScores: [95, 96, 91, 88, 65],
    aiAnalysis: {
      pros: [
        '採用群組特徵合併，將換線成本壓縮至歷史新低的 8.5%',
        'OEE 與 OTD 達到完美的雙高平衡 (皆 > 95%)',
        '允許跨廠區調度，成功紓解了 CNC 站的瓶頸'
      ],
      cons: [
        '過度合併導致單一批量過大，部分產線出現短暫的等待料現象',
        '排程彈性下降，若遇機台臨時故障將難以抽單重排'
      ]
    },
    color: '#8b5cf6' // Violet
  },
  {
    id: 'HIS-260315-B',
    title: '三月中旬急單湧入處理',
    date: '2026-03-15 14:20',
    context: '臨時安插 50K 急單，產能緊繃',
    score: 88,
    params: {
      dispatchRule: 'SPT (最短工時)',
      batchRule: 'ITEM (同品號合併)',
      productionConfig: '瓶頸站週末加班'
    },
    kpis: { otd: 88.2, oee: 92.4, tardiness: 145, cost: 15.2 },
    radarScores: [88, 92, 84, 60, 45],
    aiAnalysis: {
      pros: [
        '稼動率高達 92.4%，有效消化了爆量的訂單',
        '同品號合併生產，換線成本下降了 40%'
      ],
      cons: [
        '最短工時優先導致部分「長工時/早交期」訂單被嚴重排擠',
        '總延遲時數飆升至 145 小時，引發客訴風險'
      ]
    },
    color: '#3b82f6' // Blue
  },
  {
    id: 'HIS-260301-A',
    title: '三月上旬常規排產',
    date: '2026-03-01 08:30',
    context: '訂單量平穩，強調準時交貨',
    score: 82,
    params: {
      dispatchRule: 'EDD (交期優先)',
      batchRule: 'LFL (逐單生產)',
      productionConfig: '常規日班 / 無加班'
    },
    kpis: { otd: 98.5, oee: 75.2, tardiness: 12, cost: 25.4 },
    radarScores: [98, 75, 74, 85, 80],
    aiAnalysis: {
      pros: [
        '極高的準時交貨率 (OTD) 達 98.5%',
        '現場在製品 (WIP) 庫存極低，物流順暢'
      ],
      cons: [
        '逐單生產導致換線極度頻繁，清機時間佔比達 25%',
        '整體機台稼動率 (OEE) 僅 75%，浪費了 25% 潛在產能'
      ]
    },
    color: '#94a3b8' // Slate
  }
]

// --- AI 互動節點型別 ---
export type AiStep = 1 | 2 | 3
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

export default function APSHistoryBenchmarking() {
  const radarChartRef = useRef<HTMLDivElement>(null)
  const barChartRef = useRef<HTMLDivElement>(null)

  // --- 狀態管理 ---
  const [historyData, setHistoryData] =
    useState<HistoricalSchedule[]>(INITIAL_HISTORY_DB)
  const [searchTerm, setSearchTerm] = useState<string>('')

  // 需求變更：預設只勾選現行版本
  const [selectedIds, setSelectedIds] = useState<string[]>([
    INITIAL_HISTORY_DB[0].id
  ])
  const [hasAnalyzed, setHasAnalyzed] = useState<boolean>(false)
  const [rankedSchedules, setRankedSchedules] = useState<RankedSchedule[]>([])

  // AI 助理狀態
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false)
  const [aiStep, setAiStep] = useState<AiStep>(1)
  const [aiLogs, setAiLogs] = useState<AiLog[]>([])
  const aiLogEndRef = useRef<HTMLDivElement>(null)
  const aiTimersRef = useRef<number[]>([])

  // --- 列表搜尋與過濾 ---
  const filteredHistory = useMemo(() => {
    return historyData.filter(
      h =>
        h.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.context.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.date.includes(searchTerm)
    )
  }, [historyData, searchTerm])

  // --- 選擇控制 ---
  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(v => v !== id))
      // 不在此處重置分析結果 (保留舊畫面)
    } else {
      if (selectedIds.length >= 3) {
        message.warning('最多只能同時選擇 3 個歷史排程進行比對')
        return
      }
      setSelectedIds([...selectedIds, id])
      // 不在此處重置分析結果 (保留舊畫面)
    }
  }

  // --- 刪除控制 ---
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '確定要刪除此排程快照嗎？',
      content:
        '刪除後將無法復原，且釋放的空間將可用於儲存新快照。請確認是否繼續。',
      okText: '確定刪除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        setHistoryData(prev => prev.filter(h => h.id !== id))
        setSelectedIds(prev => prev.filter(v => v !== id))
        // 同步從分析結果中移除已刪除的資料
        setRankedSchedules(prev => prev.filter(h => h.id !== id))
        message.success('已成功刪除排程快照，釋放儲存空間。')
      }
    })
  }

  // 自動捲動 AI 對話
  useEffect(() => {
    if (aiLogEndRef.current) {
      aiLogEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [aiLogs])

  const clearAiTimers = () => {
    aiTimersRef.current.forEach(window.clearTimeout)
    aiTimersRef.current = []
  }

  const handleCancelAnalysis = () => {
    clearAiTimers()
    setIsAiModalOpen(false)
    message.info('已中斷綜合分析。')
  }

  // --- 啟動 AI 歷史比對 ---
  const handleStartAnalysis = () => {
    if (selectedIds.length < 2) {
      message.error('請至少選擇 2 個歷史排程快照才能進行比對！')
      return
    }

    clearAiTimers()
    setIsAiModalOpen(true)
    setAiStep(1)
    setAiLogs([
      {
        id: generateId(),
        type: 'system',
        text: `APS 歷史回溯分析引擎啟動 • ${dayjs().format('YYYY/MM/DD HH:mm')}`
      },
      {
        id: generateId(),
        type: 'log',
        text: `正在提取 ${selectedIds.length} 份歷史排程快照資料...`
      },
      {
        id: generateId(),
        type: 'log',
        text: '正在解析當時套用之「排程參數」與「生產環境變數」...'
      }
    ])

    const t1 = window.setTimeout(() => {
      setAiLogs(prev => [
        ...prev,
        {
          id: generateId(),
          type: 'log',
          text: `正在進行多維度歸一化評分 (OEE, OTD, Tardiness, Cost)...`
        },
        {
          id: generateId(),
          type: 'log',
          text: `正在生成策略優劣勢 (Pros & Cons) 洞察報告...`
        }
      ])
    }, 1500)
    aiTimersRef.current.push(t1)

    const t2 = window.setTimeout(() => {
      setAiStep(2)
      setAiLogs(prev => [
        ...prev,
        {
          id: 'prompt_final',
          type: 'prompt',
          text: `歷史綜合評比與優劣勢報告已生成完畢。是否立即前往戰情看板檢視排名？`,
          options: [
            {
              label: '顯示綜合分析排名與戰情圖表',
              value: 'render',
              icon: <Trophy size={16} />,
              color: 'text-white',
              bgClass: 'bg-indigo-600 hover:bg-indigo-700'
            }
          ]
        }
      ])
    }, 3200)
    aiTimersRef.current.push(t2)
  }

  const handleAiInteract = (step: AiStep, value: string, label: string) => {
    clearAiTimers()
    setAiLogs(prev => [
      ...prev.filter(l => l.type !== 'prompt'),
      { id: generateId(), type: 'user', text: `${label}` }
    ])

    if (value === 'render') {
      setIsAiModalOpen(false)

      const selectedData = historyData.filter(h => selectedIds.includes(h.id))

      // 計算各維度的單獨排名
      const otdRanked = [...selectedData].sort(
        (a, b) => b.kpis.otd - a.kpis.otd
      )
      const oeeRanked = [...selectedData].sort(
        (a, b) => b.kpis.oee - a.kpis.oee
      )
      const costRanked = [...selectedData].sort(
        (a, b) => a.kpis.cost - b.kpis.cost
      ) // 越低越好

      const enrichedData: RankedSchedule[] = selectedData.map(h => ({
        ...h,
        ranks: {
          otd: otdRanked.findIndex(x => x.id === h.id) + 1,
          oee: oeeRanked.findIndex(x => x.id === h.id) + 1,
          cost: costRanked.findIndex(x => x.id === h.id) + 1
        }
      }))

      // 最終整體以 AI score 排序
      const sorted = enrichedData.sort((a, b) => b.score - a.score)

      setRankedSchedules(sorted)
      setHasAnalyzed(true)
      message.success('分析完成！已為您生成綜合排行榜與多維度評比。')
    }
  }

  // --- 初始化與重繪 ECharts ---
  useEffect(() => {
    if (
      !hasAnalyzed ||
      !radarChartRef.current ||
      !barChartRef.current ||
      rankedSchedules.length === 0
    )
      return

    const radarChart = echarts.init(radarChartRef.current)
    const barChart = echarts.init(barChartRef.current)

    // 1. 歷史多維度雷達圖
    const radarSeriesData = rankedSchedules.map(schedule => ({
      value: schedule.radarScores,
      name: schedule.date, // 圖表圖例改用時間標記
      itemStyle: { color: schedule.color },
      lineStyle: {
        width: schedule === rankedSchedules[0] ? 3 : 2,
        type: schedule === rankedSchedules[0] ? 'solid' : ('dashed' as any)
      },
      areaStyle: {
        color:
          schedule === rankedSchedules[0]
            ? `${schedule.color}33`
            : 'transparent'
      }
    }))

    const radarOption: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#1e293b' }
      },
      legend: { bottom: 0, textStyle: { color: '#64748b' } },
      radar: {
        indicator: [
          { name: '準時達交 (OTD)', max: 100 },
          { name: '設備稼動 (OEE)', max: 100 },
          { name: '成本控制 (Cost)', max: 100 },
          { name: '排程彈性 (Flex)', max: 100 },
          { name: '產能餘裕 (Cap)', max: 100 }
        ],
        radius: '65%',
        axisName: { color: '#64748b', fontWeight: 'bold' },
        splitLine: { lineStyle: { color: ['#e2e8f0'] } },
        splitArea: { show: false },
        axisLine: { lineStyle: { color: '#e2e8f0' } }
      },
      series: [{ name: '歷史評比', type: 'radar', data: radarSeriesData }]
    }
    radarChart.setOption(radarOption, true)

    // 2. 核心指標對比柱狀圖 (KPIs)
    const barOption: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#1e293b' }
      },
      legend: { bottom: 0, textStyle: { color: '#64748b' } },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['OTD (%)', 'OEE (%)', '延遲時數 (Hrs)', '換線佔比 (%)'],
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b', fontFamily: 'Inter' }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { color: '#64748b' }
      },
      series: rankedSchedules.map(schedule => ({
        name: schedule.date,
        type: 'bar',
        barGap: '15%',
        itemStyle: { color: schedule.color, borderRadius: [4, 4, 0, 0] },
        data: [
          schedule.kpis.otd,
          schedule.kpis.oee,
          schedule.kpis.tardiness,
          schedule.kpis.cost
        ]
      }))
    }
    barChart.setOption(barOption, true)

    const handleResize = () => {
      radarChart.resize()
      barChart.resize()
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      radarChart.dispose()
      barChart.dispose()
    }
  }, [hasAnalyzed, rankedSchedules])

  // --- Popover 內容 ---
  const renderParamPopover = (schedule: HistoricalSchedule) => (
    <div className='flex flex-col gap-3 w-[260px] p-1'>
      <div className='flex items-center gap-2 border-b border-slate-100 pb-2'>
        <Settings2 size={16} className='text-indigo-500' />
        <span className='font-black text-slate-700'>快照參數詳情</span>
      </div>
      <div className='flex flex-col gap-2.5 text-xs font-bold'>
        <div className='flex flex-col'>
          <span className='text-slate-400 mb-0.5'>派工優先規則</span>
          <span className='text-indigo-600 bg-indigo-50/50 p-1.5 rounded'>
            {schedule.params.dispatchRule}
          </span>
        </div>
        <div className='flex flex-col'>
          <span className='text-slate-400 mb-0.5'>批次與合單策略</span>
          <span className='text-blue-600 bg-blue-50/50 p-1.5 rounded'>
            {schedule.params.batchRule}
          </span>
        </div>
        <div className='flex flex-col'>
          <span className='text-slate-400 mb-0.5'>生產環境配置</span>
          <span className='text-emerald-600 bg-emerald-50/50 p-1.5 rounded'>
            {schedule.params.productionConfig}
          </span>
        </div>
      </div>
    </div>
  )

  // --- 排名獎牌小元件 ---
  const getRankBadge = (index: number) => {
    if (index === 0)
      return (
        <div className='w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 text-white flex items-center justify-center shadow-md border-2 border-white absolute -top-3 -left-3'>
          <Medal size={16} />
        </div>
      )
    if (index === 1)
      return (
        <div className='w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-white flex items-center justify-center shadow-md border-2 border-white absolute -top-3 -left-3 font-black text-sm'>
          2
        </div>
      )
    if (index === 2)
      return (
        <div className='w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 text-white flex items-center justify-center shadow-md border-2 border-white absolute -top-3 -left-3 font-black text-sm'>
          3
        </div>
      )
    return null
  }

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
        <header className='h-[72px] bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-50 shadow-sm'>
          <div className='flex items-center gap-4'>
            <div className='w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200'>
              <History size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className='text-xl font-black tracking-tight text-slate-800 m-0'>
                歷史排程智能診斷與評比
              </h1>
              <p className='text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest'>
                Historical Schedule AI Benchmarking
              </p>
            </div>
          </div>

          <Space size='middle'>
            <Button
              type='primary'
              disabled={selectedIds.length < 2}
              icon={<Sparkles size={16} />}
              onClick={handleStartAnalysis}
              className={cn(
                'font-bold px-6 border-none transition-all h-10 rounded-lg flex items-center gap-2',
                selectedIds.length < 2
                  ? 'bg-slate-300 text-white'
                  : 'shadow-md shadow-indigo-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90'
              )}
            >
              啟動 AI 歷史綜合評比 ({selectedIds.length}/3)
            </Button>
          </Space>
        </header>

        {/* --- 主內容區塊 (左右佈局) --- */}
        <div className='flex-1 flex overflow-hidden'>
          {/* 左側：歷史快照庫 (Sidebar) */}
          <div className='w-[360px] bg-slate-50 border-r border-slate-200 flex flex-col shrink-0'>
            <div className='p-5 border-b border-slate-200 flex flex-col gap-3 bg-white'>
              <div className='flex items-center justify-between'>
                <span className='font-black text-slate-800 flex items-center gap-2'>
                  <FileText size={16} className='text-indigo-500' />{' '}
                  歷史排程快照庫
                </span>
                <div className='flex items-center gap-1.5'>
                  <Database
                    size={12}
                    className={
                      historyData.length >= 6
                        ? 'text-rose-500'
                        : 'text-slate-400'
                    }
                  />
                  <span
                    className={cn(
                      'text-[10px] font-bold',
                      historyData.length >= 6
                        ? 'text-rose-500'
                        : 'text-slate-400'
                    )}
                  >
                    容量
                  </span>
                  <Badge
                    count={`${historyData.length}/6`}
                    showZero
                    color={historyData.length >= 6 ? '#ef4444' : '#cbd5e1'}
                  />
                </div>
              </div>
              <div className='flex items-center bg-slate-100 rounded-lg px-3 py-1.5 border border-transparent focus-within:border-indigo-400 focus-within:bg-white focus-within:shadow-sm transition-all w-full'>
                <Search size={14} className='text-slate-400 mr-2 shrink-0' />
                <input
                  placeholder='搜尋快照標題、情境...'
                  className='bg-transparent border-none outline-none text-xs font-bold w-full text-slate-700 placeholder:text-slate-400'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className='flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-3'>
              {filteredHistory.map(schedule => {
                const isSelected = selectedIds.includes(schedule.id)
                return (
                  <div
                    key={schedule.id}
                    onClick={() => handleToggleSelect(schedule.id)}
                    className={cn(
                      'p-4 rounded-2xl cursor-pointer transition-all border-2 relative overflow-visible flex flex-col',
                      isSelected
                        ? 'bg-white border-indigo-500 shadow-md'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                    )}
                  >
                    <div className='flex items-center gap-3 mb-2'>
                      <Checkbox checked={isSelected} />
                      {schedule.isCurrent && (
                        <Tag
                          color='success'
                          className='m-0 border-none font-bold text-[10px]'
                        >
                          現行排程
                        </Tag>
                      )}
                    </div>

                    <h3
                      className={cn(
                        'text-base font-black mb-1.5 leading-snug w-full font-mono',
                        isSelected ? 'text-indigo-700' : 'text-slate-700'
                      )}
                    >
                      {schedule.date}
                    </h3>
                    <p className='text-[11px] text-slate-500 font-bold m-0 line-clamp-2'>
                      {schedule.context}
                    </p>

                    {/* 直接顯示在底部的 操作與資訊列，加強防跑版處理 */}
                    <div className='flex items-center justify-between mt-3 pt-3 border-t border-slate-100'>
                      <div className='flex flex-wrap gap-1.5 flex-1 min-w-0'>
                        <Tag className='m-0 text-[10px] border-none bg-slate-100 text-slate-600 font-bold truncate max-w-[90px]'>
                          {schedule.params.dispatchRule.split(' ')[0]}
                        </Tag>
                        <Tag className='m-0 text-[10px] border-none bg-slate-100 text-slate-600 font-bold truncate max-w-[90px]'>
                          {schedule.params.batchRule.split(' ')[0]}
                        </Tag>
                      </div>
                      <div className='flex items-center gap-1 shrink-0 ml-2'>
                        <Popover
                          content={renderParamPopover(schedule)}
                          title={null}
                          trigger='hover'
                          placement='right'
                        >
                          <Button
                            type='text'
                            size='small'
                            icon={<Info size={14} />}
                            className='text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 w-7 h-7 rounded-md flex items-center justify-center'
                            onClick={e => e.stopPropagation()}
                          />
                        </Popover>
                        {!schedule.isCurrent && (
                          <Tooltip title='刪除快照'>
                            <Button
                              type='text'
                              size='small'
                              icon={<Trash2 size={14} />}
                              className='text-slate-400 hover:text-rose-500 hover:bg-rose-50 w-7 h-7 rounded-md flex items-center justify-center'
                              onClick={e => {
                                e.stopPropagation()
                                handleDelete(schedule.id)
                              }}
                            />
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {filteredHistory.length === 0 && (
                <div className='text-center text-slate-400 font-bold text-xs mt-10'>
                  查無符合條件的排程快照
                </div>
              )}
            </div>
          </div>

          {/* 右側：戰情畫布 (Main Dashboard) */}
          <div className='flex-1 bg-[#f8fafc] overflow-y-auto custom-scrollbar p-6'>
            {!hasAnalyzed ? (
              <div className='w-full h-full flex flex-col items-center justify-center'>
                <div className='relative mb-6'>
                  <div className='absolute inset-0 bg-indigo-200 blur-3xl opacity-30 animate-pulse' />
                  <History
                    size={80}
                    className='text-slate-300 relative'
                    strokeWidth={1.5}
                  />
                </div>
                <h2 className='text-xl font-black text-slate-700 m-0'>
                  等待啟動分析
                </h2>
                <p className='text-slate-500 font-bold mt-2 text-sm'>
                  從左側勾選您想比對的排程版本 (至少 2 筆)，讓 AI
                  挖掘過去決策的優勢與盲點。
                </p>
              </div>
            ) : (
              <div className='max-w-7xl mx-auto flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]'>
                {/* 1. AI 綜合評估排名 (Leaderboard) */}
                <div className='flex items-center gap-2 mb-2'>
                  <Trophy size={20} className='text-amber-500' />
                  <h2 className='text-lg font-black text-slate-800 m-0'>
                    AI 綜合推薦排行榜
                  </h2>
                  <Tag
                    color='purple'
                    className='border-none font-bold bg-purple-50 text-purple-600 ml-2'
                  >
                    基於 OEE, OTD 與成本之多目標評分
                  </Tag>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4'>
                  {rankedSchedules.map((schedule, idx) => (
                    <Card
                      key={schedule.id}
                      bordered={false}
                      className={cn(
                        'shadow-sm rounded-2xl border transition-all relative overflow-visible',
                        idx === 0
                          ? 'border-amber-300 bg-amber-50/30'
                          : 'border-slate-200 bg-white'
                      )}
                      styles={{ body: { padding: '24px' } }}
                    >
                      {getRankBadge(idx)}
                      <div className='flex justify-between items-start mb-4 pl-4'>
                        <div className='flex flex-col w-[70%]'>
                          <span className='text-[15px] font-black leading-tight text-slate-800 mb-1'>
                            {schedule.date}
                          </span>
                          <span className='text-xs font-bold text-slate-400'>
                            {schedule.title}
                          </span>
                        </div>
                        <div className='flex flex-col items-end shrink-0'>
                          <span className='text-[10px] font-bold text-slate-400 uppercase tracking-widest'>
                            AI Score
                          </span>
                          <span
                            className={cn(
                              'text-3xl font-black font-mono',
                              idx === 0 ? 'text-amber-500' : 'text-indigo-600'
                            )}
                          >
                            {schedule.score}
                          </span>
                        </div>
                      </div>

                      {/* --- 新增：不同維度的排名 Badge --- */}
                      <div className='flex gap-2 mt-2 mb-4 px-1'>
                        <Tooltip title='達交率 (OTD) 在本次分析中的排名'>
                          <div
                            className={cn(
                              'flex flex-col p-1.5 rounded-lg items-center justify-center flex-1 border',
                              schedule.ranks.otd === 1
                                ? 'bg-emerald-50 border-emerald-100'
                                : 'bg-slate-50 border-slate-100'
                            )}
                          >
                            <span className='text-[9px] text-slate-400 font-bold uppercase tracking-wider'>
                              OTD
                            </span>
                            <span
                              className={cn(
                                'text-[13px] font-black font-mono leading-none mt-0.5',
                                schedule.ranks.otd === 1
                                  ? 'text-emerald-500'
                                  : 'text-slate-600'
                              )}
                            >
                              #{schedule.ranks.otd}
                            </span>
                          </div>
                        </Tooltip>
                        <Tooltip title='稼動率 (OEE) 在本次分析中的排名'>
                          <div
                            className={cn(
                              'flex flex-col p-1.5 rounded-lg items-center justify-center flex-1 border',
                              schedule.ranks.oee === 1
                                ? 'bg-blue-50 border-blue-100'
                                : 'bg-slate-50 border-slate-100'
                            )}
                          >
                            <span className='text-[9px] text-slate-400 font-bold uppercase tracking-wider'>
                              OEE
                            </span>
                            <span
                              className={cn(
                                'text-[13px] font-black font-mono leading-none mt-0.5',
                                schedule.ranks.oee === 1
                                  ? 'text-blue-500'
                                  : 'text-slate-600'
                              )}
                            >
                              #{schedule.ranks.oee}
                            </span>
                          </div>
                        </Tooltip>
                        <Tooltip title='成本控制 (Cost) 在本次分析中的排名'>
                          <div
                            className={cn(
                              'flex flex-col p-1.5 rounded-lg items-center justify-center flex-1 border',
                              schedule.ranks.cost === 1
                                ? 'bg-amber-50 border-amber-100'
                                : 'bg-slate-50 border-slate-100'
                            )}
                          >
                            <span className='text-[9px] text-slate-400 font-bold uppercase tracking-wider'>
                              Cost
                            </span>
                            <span
                              className={cn(
                                'text-[13px] font-black font-mono leading-none mt-0.5',
                                schedule.ranks.cost === 1
                                  ? 'text-amber-500'
                                  : 'text-slate-600'
                              )}
                            >
                              #{schedule.ranks.cost}
                            </span>
                          </div>
                        </Tooltip>
                      </div>

                      {/* AI 優劣勢解析 */}
                      <div className='flex flex-col gap-3 pt-4 border-t border-slate-200/60'>
                        <div className='flex flex-col gap-1.5 mt-1'>
                          <span className='text-[11px] font-black text-emerald-600 flex items-center gap-1'>
                            <ThumbsUp size={12} /> 策略優勢 (Pros)
                          </span>
                          <ul className='m-0 pl-4 text-[11px] font-bold text-slate-600 space-y-1'>
                            {schedule.aiAnalysis.pros.map((pro, i) => (
                              <li key={i}>{pro}</li>
                            ))}
                          </ul>
                        </div>

                        <div className='flex flex-col gap-1.5 mt-1'>
                          <span className='text-[11px] font-black text-rose-500 flex items-center gap-1'>
                            <ThumbsDown size={12} /> 潛在風險 (Cons)
                          </span>
                          <ul className='m-0 pl-4 text-[11px] font-bold text-slate-600 space-y-1'>
                            {schedule.aiAnalysis.cons.map((con, i) => (
                              <li key={i}>{con}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* 2. 雙軌圖表分析 (ECharts) */}
                <div className='flex items-center gap-2 mt-4 mb-2'>
                  <Activity size={20} className='text-indigo-500' />
                  <h2 className='text-lg font-black text-slate-800 m-0'>
                    多維度數據交叉比對
                  </h2>
                </div>
                <Row gutter={[20, 20]}>
                  <Col xs={24} lg={10}>
                    <Card
                      title={
                        <div className='flex items-center gap-2 text-slate-800'>
                          <Target size={18} className='text-indigo-500' />
                          <span className='font-black text-[15px]'>
                            多維度策略輪廓 (Radar)
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
                          padding: '10px 20px',
                          height: 'calc(100% - 60px)'
                        }
                      }}
                    >
                      <div ref={radarChartRef} className='w-full h-full' />
                    </Card>
                  </Col>

                  <Col xs={24} lg={14}>
                    <Card
                      title={
                        <div className='flex items-center gap-2 text-slate-800'>
                          <BarChart3 size={18} className='text-indigo-500' />
                          <span className='font-black text-[15px]'>
                            核心 KPI 差異對比 (Grouped Bar)
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
                          padding: '10px 20px',
                          height: 'calc(100% - 60px)'
                        }
                      }}
                    >
                      <div ref={barChartRef} className='w-full h-full' />
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
          </div>
        </div>

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
                  歷史評比引擎
                </span>
              </div>
              <div className='flex-1 p-8 flex flex-col gap-8 relative'>
                <div className='absolute left-10 top-12 bottom-12 w-0.5 bg-slate-200' />

                {[
                  {
                    step: 1,
                    label: '提取快照與參數解析',
                    sub: 'Data & Params Extraction'
                  },
                  {
                    step: 2,
                    label: '多維度歸一化評分',
                    sub: 'Multi-Objective Scoring'
                  },
                  {
                    step: 3,
                    label: '生成策略優劣勢洞察',
                    sub: 'Pros & Cons Generation'
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
                  <span className='text-[15px]'>AI 評比助理</span>
                </div>
                <Badge
                  status='processing'
                  text={
                    <span className='text-xs text-slate-500 font-bold'>
                      Benchmarking...
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
                {aiStep < 2 && !aiLogs[aiLogs.length - 1]?.options && (
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

          .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

          .ai-copilot-modal .ant-modal-content { padding: 0 !important; }
          .ai-copilot-modal .ant-modal-close { top: 12px; right: 12px; z-index: 20; }
        `}</style>
      </div>
    </ConfigProvider>
  )
}
