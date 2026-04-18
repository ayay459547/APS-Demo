import React, { useState, useMemo } from 'react'
import {
  ConfigProvider,
  Card,
  Button,
  Modal,
  Form,
  Select,
  message,
  Table,
  Tag,
  Input,
  DatePicker,
  Divider,
  Badge,
  Switch,
  Progress
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  FlaskConical,
  GitCompare,
  PlayCircle,
  Plus,
  Save,
  Zap,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Clock,
  Factory,
  Package,
  CalendarDays,
  FileText,
  SlidersHorizontal,
  ArrowRight,
  Settings2,
  Trash2,
  RefreshCw,
  Users,
  Settings,
  GitMerge
} from 'lucide-react'
import dayjs from 'dayjs'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

const { RangePicker } = DatePicker

/**
 * 樣式合併工具函數
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- TypeScript 型別定義 ---
export type ParamCategory =
  | '訂單參數'
  | '機台參數'
  | '物料參數'
  | '排程參數'
  | '製程參數'
  | '人力參數'
  | '批次與換線'
export type ScenarioStatus = '草稿' | '模擬運算中' | '分析完成'

export interface ScenarioParameter {
  id: string
  category: ParamCategory
  action: string
  target: string
  value: string
}

export interface KPIComparison {
  metric: string
  baseline: number
  simulated: number
  unit: string
  isBetter: boolean
  diffStr: string
}

export interface ImpactedOrder {
  woNumber: string
  customer: string
  originalDate: string
  newDate: string
  delayDays: number
  priority: '高' | '中' | '低'
}

export interface Scenario {
  id: string
  name: string
  description: string
  status: ScenarioStatus
  createdAt: string
  parameters: ScenarioParameter[]
  kpis?: KPIComparison[]
  impactedOrders?: ImpactedOrder[]
}

// --- 擬真數據產生器 ---
const mockScenarios: Scenario[] = [
  {
    id: 'SIM-260417-001',
    name: 'A客戶 50K 急單插排衝擊評估',
    description:
      '測試若強制將 A 客戶的特急單插入 SMT-LINE-01，並要求週末加班的整體影響。',
    status: '分析完成',
    createdAt: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm'),
    parameters: [
      {
        id: 'p1',
        category: '訂單參數',
        action: '急單強制插排',
        target: 'WO-99812',
        value: 'Qty: 50K, 交期 04/20'
      },
      {
        id: 'p2',
        category: '機台參數',
        action: '產能擴充/加班',
        target: 'SMT-LINE-01',
        value: '4/18-4/19 全天加班'
      },
      {
        id: 'p3',
        category: '排程參數',
        action: '變更排程策略',
        target: '全局設定',
        value: '達交率優先 (OTD First)'
      }
    ],
    kpis: [
      {
        metric: '整體訂單達交率 (OTD)',
        baseline: 98.5,
        simulated: 92.1,
        unit: '%',
        isBetter: false,
        diffStr: '-6.4%'
      },
      {
        metric: '設備綜合效率 (OEE)',
        baseline: 75.4,
        simulated: 86.8,
        unit: '%',
        isBetter: true,
        diffStr: '+11.4%'
      },
      {
        metric: '總延遲時間 (Total Tardiness)',
        baseline: 12,
        simulated: 84,
        unit: 'hrs',
        isBetter: false,
        diffStr: '+72 hrs'
      }
    ],
    impactedOrders: [
      {
        woNumber: 'WO-202604-012',
        customer: 'B 科技',
        originalDate: '2026-04-19',
        newDate: '2026-04-20',
        delayDays: 1,
        priority: '高'
      },
      {
        woNumber: 'WO-202604-015',
        customer: 'C 電子',
        originalDate: '2026-04-19',
        newDate: '2026-04-21',
        delayDays: 2,
        priority: '中'
      },
      {
        woNumber: 'WO-202604-018',
        customer: 'D 實業',
        originalDate: '2026-04-20',
        newDate: '2026-04-22',
        delayDays: 2,
        priority: '低'
      },
      {
        woNumber: 'WO-202604-022',
        customer: 'E 系統',
        originalDate: '2026-04-21',
        newDate: '2026-04-22',
        delayDays: 1,
        priority: '中'
      }
    ]
  },
  {
    id: 'SIM-260417-002',
    name: 'MCU 缺料延遲沙盤推演',
    description:
      '模擬 STM32 晶片延遲一週到廠，評估產能閒置狀況與訂單延遲影響。',
    status: '草稿',
    createdAt: dayjs().subtract(5, 'hour').format('YYYY-MM-DD HH:mm'),
    parameters: [
      {
        id: 'p4',
        category: '物料參數',
        action: '交期遞延',
        target: 'IC-MCU-STM32',
        value: '延遲至 04/25 到廠'
      },
      {
        id: 'p5',
        category: '排程參數',
        action: '開啟替代料邏輯',
        target: 'BOM 展開規則',
        value: '允許使用 GD32 替代'
      }
    ]
  },
  {
    id: 'SIM-260417-003',
    name: '組裝線流感缺勤與降速評估',
    description: '模擬組裝線 A 流感導致 5 人缺勤，且新進人員良率較低的情境。',
    status: '草稿',
    createdAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
    parameters: [
      {
        id: 'p6',
        category: '人力參數',
        action: '人員缺勤/請假',
        target: 'ASSY-LINE-A',
        value: '減少 5 人'
      },
      {
        id: 'p7',
        category: '製程參數',
        action: '調整預期良率',
        target: 'ASSY-LINE-A',
        value: '良率降至 85%'
      }
    ]
  }
]

// --- 參數分類的視覺設定 ---
const CategoryStyleMap: Record<
  ParamCategory,
  { icon: React.ElementType; color: string; bg: string; border: string }
> = {
  訂單參數: {
    icon: FileText,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200'
  },
  機台參數: {
    icon: Factory,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200'
  },
  物料參數: {
    icon: Package,
    color: 'text-fuchsia-600',
    bg: 'bg-fuchsia-50',
    border: 'border-fuchsia-200'
  },
  排程參數: {
    icon: SlidersHorizontal,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200'
  },
  製程參數: {
    icon: Settings,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200'
  },
  人力參數: {
    icon: Users,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200'
  },
  批次與換線: {
    icon: GitMerge,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200'
  }
}

// --- 子組件：KPI 比較卡片 ---
const KPICard: React.FC<{ kpi: KPIComparison }> = ({ kpi }) => {
  const showRed = !kpi.isBetter

  return (
    <div className='bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group'>
      {/* Background Decor */}
      <div
        className={cn(
          'absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 transition-transform group-hover:scale-110',
          showRed ? 'bg-rose-500' : 'bg-emerald-500'
        )}
      />

      <p className='text-slate-500 text-xs font-bold mb-4 relative z-10 flex items-center justify-between'>
        {kpi.metric}
        {showRed ? (
          <TrendingDown size={16} className='text-rose-500' />
        ) : (
          <TrendingUp size={16} className='text-emerald-500' />
        )}
      </p>

      <div className='flex items-end justify-between relative z-10'>
        <div className='flex flex-col'>
          <span className='text-[10px] text-slate-400 font-bold mb-1 tracking-wider uppercase'>
            Simulated (模擬預測)
          </span>
          <div className='flex items-baseline gap-1'>
            <span
              className={cn(
                'text-3xl font-black font-mono tracking-tight',
                showRed ? 'text-rose-600' : 'text-emerald-600'
              )}
            >
              {kpi.simulated}
            </span>
            <span className='text-sm font-bold text-slate-400'>{kpi.unit}</span>
          </div>
        </div>

        <div className='flex flex-col items-end'>
          <div className='flex items-center gap-1.5 mb-1.5 text-[11px] font-bold text-slate-400'>
            <span>基準線:</span>
            <span className='font-mono'>
              {kpi.baseline} {kpi.unit}
            </span>
          </div>
          <div
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-black font-mono border shadow-sm',
              showRed
                ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100/50'
                : 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100/50'
            )}
          >
            {kpi.diffStr}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- 主元件 ---
export default function App() {
  const [scenarios, setScenarios] = useState<Scenario[]>(mockScenarios)
  const [activeScenarioId, setActiveScenarioId] = useState<string>(
    mockScenarios[0].id
  )

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isParamModalOpen, setIsParamModalOpen] = useState(false)

  // Form states
  const [scenarioForm] = Form.useForm()
  const [paramForm] = Form.useForm()
  const [selectedParamCategory, setSelectedParamCategory] =
    useState<ParamCategory>('訂單參數')

  const activeScenario = useMemo(
    () => scenarios.find(s => s.id === activeScenarioId),
    [scenarios, activeScenarioId]
  )

  // 模擬執行演算法
  const handleRunSimulation = () => {
    if (!activeScenario) return

    // 更新狀態為模擬中
    setScenarios(prev =>
      prev.map(s =>
        s.id === activeScenario.id ? { ...s, status: '模擬運算中' } : s
      )
    )

    // 假裝需要時間跑排程演算法 (Heuristic / Genetic Algorithm)
    setTimeout(() => {
      message.success({
        content: 'APS 模擬排程引擎運算完成！',
        className: 'custom-message'
      })

      setScenarios(prev =>
        prev.map(s => {
          if (s.id === activeScenario.id) {
            return {
              ...s,
              status: '分析完成',
              kpis: [
                {
                  metric: '整體訂單達交率 (OTD)',
                  baseline: 99.1,
                  simulated: 88.5,
                  unit: '%',
                  isBetter: false,
                  diffStr: '-10.6%'
                },
                {
                  metric: '設備綜合效率 (OEE)',
                  baseline: 78.0,
                  simulated: 74.2,
                  unit: '%',
                  isBetter: false,
                  diffStr: '-3.8%'
                },
                {
                  metric: '總延遲時間 (Total Tardiness)',
                  baseline: 0,
                  simulated: 96,
                  unit: 'hrs',
                  isBetter: false,
                  diffStr: '+96 hrs'
                }
              ],
              impactedOrders: [
                {
                  woNumber: 'WO-202604-033',
                  customer: 'E 企業',
                  originalDate: '2026-04-20',
                  newDate: '2026-04-23',
                  delayDays: 3,
                  priority: '高'
                },
                {
                  woNumber: 'WO-202604-034',
                  customer: 'F 系統',
                  originalDate: '2026-04-21',
                  newDate: '2026-04-23',
                  delayDays: 2,
                  priority: '中'
                },
                {
                  woNumber: 'WO-202604-039',
                  customer: 'G 科技',
                  originalDate: '2026-04-22',
                  newDate: '2026-04-24',
                  delayDays: 2,
                  priority: '低'
                }
              ]
            }
          }
          return s
        })
      )
    }, 3000)
  }

  // 處理建立新劇本
  const handleCreateScenario = async () => {
    try {
      const values = await scenarioForm.validateFields()
      const newScenario: Scenario = {
        id: `SIM-${dayjs().format('MMDD')}-00${scenarios.length + 1}`,
        name: values.name,
        description: values.description,
        status: '草稿',
        createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
        parameters: []
      }
      setScenarios([newScenario, ...scenarios])
      setActiveScenarioId(newScenario.id)
      setIsCreateModalOpen(false)
      scenarioForm.resetFields()
      message.success({
        content: '已建立新情境草稿，請開始加入干擾參數。',
        className: 'custom-message'
      })
    } catch (e) {
      console.log('Validation failed:', e)
    }
  }

  // 處理新增變數參數
  const handleAddParameter = async () => {
    try {
      const values = await paramForm.validateFields()
      let valueStr = ''
      const targetStr = values.target || '全局設定'

      // 根據不同類別組合 value 顯示字串
      if (selectedParamCategory === '訂單參數') {
        valueStr = `Qty: ${values.qty || '-'}, 交期: ${values.date ? values.date.format('MM/DD') : '-'}`
      } else if (selectedParamCategory === '機台參數') {
        valueStr = values.dateRange
          ? `${values.dateRange[0].format('MM/DD')}~${values.dateRange[1].format('MM/DD')}`
          : '設定已套用'
      } else if (selectedParamCategory === '物料參數') {
        valueStr = `預計到料: ${values.arrivalDate ? values.arrivalDate.format('MM/DD') : '-'}`
      } else if (selectedParamCategory === '排程參數') {
        valueStr = values.strategy || '自訂規則'
      } else if (
        selectedParamCategory === '製程參數' ||
        selectedParamCategory === '人力參數' ||
        selectedParamCategory === '批次與換線'
      ) {
        valueStr = values.paramValue || '-'
      }

      const newParam: ScenarioParameter = {
        id: `p-${Date.now()}`,
        category: selectedParamCategory,
        action: values.action,
        target: targetStr,
        value: valueStr
      }

      setScenarios(prev =>
        prev.map(s => {
          if (s.id === activeScenarioId) {
            return {
              ...s,
              parameters: [...s.parameters, newParam],
              status: '草稿'
            } // 變更參數後需重新模擬
          }
          return s
        })
      )

      setIsParamModalOpen(false)
      paramForm.resetFields()
      message.success('已成功注入環境變數參數')
    } catch (e) {
      console.log('Validation failed:', e)
    }
  }

  const handleDeleteParam = (paramId: string) => {
    setScenarios(prev =>
      prev.map(s => {
        if (s.id === activeScenarioId) {
          return {
            ...s,
            parameters: s.parameters.filter(p => p.id !== paramId),
            status: '草稿'
          }
        }
        return s
      })
    )
  }

  // 受影響工單表格欄位
  const columns: ColumnsType<ImpactedOrder> = [
    {
      title: '受擠壓工單',
      dataIndex: 'woNumber',
      key: 'woNumber',
      render: text => (
        <span className='font-mono font-black text-slate-800'>{text}</span>
      )
    },
    {
      title: '客戶名稱',
      dataIndex: 'customer',
      key: 'customer',
      render: text => (
        <span className='text-xs font-bold text-slate-600'>{text}</span>
      )
    },
    {
      title: '原定交期 (Baseline)',
      dataIndex: 'originalDate',
      key: 'originalDate',
      render: text => (
        <span className='font-mono text-xs text-slate-400 line-through'>
          {text}
        </span>
      )
    },
    {
      title: '模擬預測交期 (Simulated)',
      dataIndex: 'newDate',
      key: 'newDate',
      render: text => (
        <span className='font-mono text-xs font-bold text-rose-600 flex items-center gap-1.5'>
          <ArrowRight size={12} /> {text}
        </span>
      )
    },
    {
      title: '衝擊延遲',
      dataIndex: 'delayDays',
      key: 'delayDays',
      render: days => (
        <Tag
          color='error'
          className='m-0 border-none font-bold rounded-md px-2 shadow-sm'
        >
          +{days} 天
        </Tag>
      )
    },
    {
      title: '原工單優先級',
      dataIndex: 'priority',
      key: 'priority',
      render: p => {
        let colorClass = 'text-slate-500 bg-slate-100'
        if (p === '高') colorClass = 'text-rose-600 bg-rose-100'
        if (p === '中') colorClass = 'text-amber-600 bg-amber-100'
        return (
          <span
            className={cn(
              'text-[11px] font-black px-2.5 py-0.5 rounded shadow-sm',
              colorClass
            )}
          >
            {p}
          </span>
        )
      }
    }
  ]

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          borderRadius: 12,
          borderRadiusSM: 6,
          fontFamily: 'Inter, Noto Sans TC, sans-serif'
        } // Indigo-600 base
      }}
    >
      <div className='w-full h-full bg-[#f1f5f9] font-sans text-slate-800 overflow-x-hidden'>
        <div className='mx-auto px-4 pt-4 pb-12 animate-fade-in relative'>
          {/* 玻璃透視頂部導航列 (Sticky Floating Header) */}
          <div className='flex flex-wrap items-center justify-between gap-y-4 bg-white/70 py-3 px-5 rounded-2xl sticky top-0 z-50 backdrop-blur-md shadow-sm border border-white mb-6 transition-all'>
            <div className='flex items-center gap-4'>
              <div className='bg-linear-to-br from-indigo-500 to-cyan-500 p-2.5 rounded-xl shadow-lg shadow-indigo-200/50 text-white shrink-0 hidden sm:block'>
                <GitCompare size={24} />
              </div>
              <div className='flex flex-col'>
                <h1 className='text-xl sm:text-2xl font-black tracking-tight text-slate-800 m-0'>
                  APS 決策情境模擬實驗室 (What-If Analysis)
                </h1>
                <p className='text-xs sm:text-sm font-bold text-slate-500 mt-1 m-0'>
                  自由配置<span className='text-indigo-500 mx-1'>六大維度</span>
                  參數，透過沙盤推演預測未來變局與對達交率之衝擊。
                </p>
              </div>
            </div>
            <Button
              type='primary'
              icon={<Plus size={16} />}
              className='bg-indigo-600 hover:bg-indigo-500 border-none shadow-md shadow-indigo-200 rounded-xl font-bold h-10 px-5 sm:px-6 transition-transform active:scale-95 ml-auto text-[14px]'
              onClick={() => setIsCreateModalOpen(true)}
            >
              <span className='hidden sm:inline'>建立新情境劇本</span>
              <span className='sm:hidden'>建立</span>
            </Button>
          </div>

          {/* 左右分欄核心架構 */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
            {/* 左側：情境劇本列表區 (不懸浮，正常滾動) */}
            <div className='lg:col-span-4 flex flex-col gap-4'>
              <div className='bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-3 h-[800px] overflow-y-auto custom-scrollbar'>
                <h3 className='font-black text-sm text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-3 m-0 sticky top-0 bg-white z-10 flex items-center justify-between'>
                  <span className='flex items-center gap-2'>
                    <FileText size={16} className='text-indigo-400' />{' '}
                    模擬劇本庫
                  </span>
                  <Badge
                    count={scenarios.length}
                    style={{
                      backgroundColor: '#e2e8f0',
                      color: '#475569',
                      boxShadow: 'none'
                    }}
                  />
                </h3>

                <div className='flex flex-col gap-3 mt-1'>
                  {scenarios.map(scenario => {
                    const isActive = scenario.id === activeScenarioId
                    const isDone = scenario.status === '分析完成'
                    const isSimulating = scenario.status === '模擬運算中'
                    return (
                      <div
                        key={scenario.id}
                        onClick={() =>
                          !isSimulating && setActiveScenarioId(scenario.id)
                        }
                        className={cn(
                          'p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group',
                          isActive
                            ? 'border-indigo-500 bg-indigo-50/60 shadow-md shadow-indigo-100/50'
                            : 'border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50',
                          isSimulating &&
                            'opacity-60 cursor-not-allowed border-indigo-300'
                        )}
                      >
                        {isActive && (
                          <div className='absolute left-0 top-0 w-1.5 h-full bg-indigo-500 rounded-l-2xl' />
                        )}
                        <div className='flex justify-between items-start mb-2.5'>
                          <span className='text-[10px] font-mono font-black text-indigo-400/80'>
                            {scenario.id}
                          </span>
                          <Tag
                            className={cn(
                              'm-0 border-none font-bold text-[10px] px-2 py-0.5 rounded-md',
                              isDone
                                ? 'bg-emerald-100 text-emerald-700'
                                : isSimulating
                                  ? 'bg-blue-100 text-blue-700 animate-pulse'
                                  : 'bg-amber-100 text-amber-700'
                            )}
                          >
                            {scenario.status}
                          </Tag>
                        </div>
                        <h4
                          className={cn(
                            'text-[15px] font-black mb-1.5 m-0 tracking-tight leading-tight',
                            isActive ? 'text-indigo-900' : 'text-slate-700'
                          )}
                        >
                          {scenario.name}
                        </h4>
                        <p className='text-xs text-slate-500 font-medium line-clamp-2 m-0 mb-3 leading-relaxed'>
                          {scenario.description || '未提供描述'}
                        </p>
                        <div className='flex items-center justify-between mt-auto pt-2 border-t border-slate-100/50'>
                          <div className='flex items-center gap-1.5 text-[10px] font-bold text-slate-400'>
                            <Clock size={12} /> {scenario.createdAt}
                          </div>
                          <div className='flex gap-1'>
                            {scenario.parameters.slice(0, 3).map((p, i) => {
                              const style = CategoryStyleMap[p.category]
                              const Icon = style.icon
                              return (
                                <div
                                  key={i}
                                  className={cn(
                                    'p-1 rounded bg-white border',
                                    style.border,
                                    style.color
                                  )}
                                >
                                  <Icon size={10} />
                                </div>
                              )
                            })}
                            {scenario.parameters.length > 3 && (
                              <div className='p-1 rounded bg-slate-100 text-slate-400 text-[10px] font-bold border border-slate-200'>
                                +{scenario.parameters.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 右側：變數配置與分析結果區 */}
            <div className='lg:col-span-8 flex flex-col gap-6'>
              {activeScenario ? (
                <>
                  {/* 面板 1：動態變數配置台 */}
                  <div className='bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden relative'>
                    <div className='h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 w-full' />

                    <div className='p-6 sm:p-8'>
                      <div className='flex flex-wrap items-start justify-between gap-4 mb-6'>
                        <div className='max-w-2xl'>
                          <div className='flex items-center gap-3 mb-2'>
                            <h2 className='text-2xl font-black text-slate-800 m-0 tracking-tight'>
                              {activeScenario.name}
                            </h2>
                            {activeScenario.status === '草稿' && (
                              <Tag
                                color='warning'
                                className='border-none font-bold shadow-sm'
                              >
                                未執行運算
                              </Tag>
                            )}
                          </div>
                          <p className='text-sm font-bold text-slate-500 m-0 leading-relaxed'>
                            {activeScenario.description}
                          </p>
                        </div>

                        {activeScenario.status !== '分析完成' ? (
                          <Button
                            type='primary'
                            size='large'
                            icon={
                              activeScenario.status === '模擬運算中' ? (
                                <RefreshCw className='animate-spin' size={18} />
                              ) : (
                                <PlayCircle size={18} />
                              )
                            }
                            loading={activeScenario.status === '模擬運算中'}
                            onClick={handleRunSimulation}
                            className='bg-indigo-600 hover:bg-indigo-500 border-none shadow-xl shadow-indigo-200/50 rounded-xl font-black px-8 h-12 tracking-wide text-[15px]'
                            disabled={activeScenario.parameters.length === 0}
                          >
                            {activeScenario.status === '模擬運算中'
                              ? '排程引擎推演中...'
                              : '開始推演模擬 (Run)'}
                          </Button>
                        ) : (
                          <div className='flex gap-3'>
                            <Button
                              className='rounded-xl font-bold text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-indigo-600 h-11 px-5 shadow-sm'
                              onClick={() =>
                                setScenarios(prev =>
                                  prev.map(s =>
                                    s.id === activeScenario.id
                                      ? {
                                          ...s,
                                          status: '草稿',
                                          kpis: undefined,
                                          impactedOrders: undefined
                                        }
                                      : s
                                  )
                                )
                              }
                            >
                              重新配置變數
                            </Button>
                            <Button
                              type='primary'
                              icon={<Save size={16} />}
                              className='bg-emerald-500 hover:bg-emerald-400 border-none shadow-md shadow-emerald-200 rounded-xl font-bold h-11 px-6'
                              onClick={() =>
                                message.success(
                                  '太棒了！模擬方案已成功轉換為正式排程。'
                                )
                              }
                            >
                              發布為正式排程
                            </Button>
                          </div>
                        )}
                      </div>

                      <Divider className='my-5 border-slate-100' />

                      <div className='flex items-center justify-between mb-4'>
                        <h3 className='text-sm font-black text-slate-700 m-0 flex items-center gap-2'>
                          <Settings2 size={18} className='text-indigo-500' />
                          環境干擾變數配置 (Simulation Parameters)
                        </h3>
                        {activeScenario.status === '草稿' && (
                          <Button
                            type='dashed'
                            className='h-8 rounded-lg font-bold text-indigo-600 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 flex items-center gap-1 px-4'
                            onClick={() => setIsParamModalOpen(true)}
                          >
                            <Plus size={14} /> 新增干擾參數
                          </Button>
                        )}
                      </div>

                      {activeScenario.parameters.length === 0 ? (
                        <div className='bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-400'>
                          <SlidersHorizontal
                            size={32}
                            className='mb-2 opacity-30'
                          />
                          <span className='font-bold text-sm'>
                            尚未加入任何干擾變數，請點擊右上方新增。
                          </span>
                        </div>
                      ) : (
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                          {activeScenario.parameters.map(p => {
                            const style = CategoryStyleMap[p.category]
                            const IconComp = style.icon

                            return (
                              <div
                                key={p.id}
                                className={cn(
                                  'px-4 py-3 rounded-2xl border bg-white flex items-start gap-3 relative group transition-all hover:shadow-md',
                                  style.border
                                )}
                              >
                                <div
                                  className={cn(
                                    'p-2 rounded-xl flex-shrink-0 mt-0.5',
                                    style.bg,
                                    style.color
                                  )}
                                >
                                  <IconComp size={18} />
                                </div>
                                <div className='flex flex-col flex-grow pr-6'>
                                  <div className='flex items-center gap-2 mb-1'>
                                    <span
                                      className={cn(
                                        'text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded',
                                        style.bg,
                                        style.color
                                      )}
                                    >
                                      {p.category}
                                    </span>
                                  </div>
                                  <span className='text-sm font-black text-slate-800'>
                                    {p.action}
                                  </span>
                                  <div className='text-xs font-bold text-slate-500 mt-1 flex flex-col gap-0.5'>
                                    <span>
                                      對象:{' '}
                                      <span className='font-mono text-slate-700'>
                                        {p.target}
                                      </span>
                                    </span>
                                    <span>
                                      數值:{' '}
                                      <span className='text-indigo-600'>
                                        {p.value}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                                {activeScenario.status === '草稿' && (
                                  <button
                                    onClick={() => handleDeleteParam(p.id)}
                                    className='absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer'
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 面板 2：動態運算與分析結果 */}
                  {activeScenario.status === '模擬運算中' ? (
                    <div className='bg-white/60 rounded-3xl border border-slate-200/60 shadow-sm p-16 flex flex-col items-center justify-center min-h-[350px] backdrop-blur-sm'>
                      <div className='relative mb-6'>
                        <div className='w-20 h-20 border-[5px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin'></div>
                        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-sm'>
                          <Zap
                            size={24}
                            className='text-indigo-500 animate-pulse'
                          />
                        </div>
                      </div>
                      <h3 className='text-xl font-black text-slate-800 tracking-tight'>
                        APS 多維度矩陣運算中...
                      </h3>
                      <p className='text-sm font-bold text-slate-400 mt-2'>
                        正在綜合考量 人力/製程/機台/物料 等多變數進行推演
                      </p>
                      <Progress
                        percent={99}
                        status='active'
                        strokeColor='#4f46e5'
                        className='w-64 mt-6'
                        showInfo={false}
                      />
                    </div>
                  ) : activeScenario.status === '分析完成' &&
                    activeScenario.kpis ? (
                    <div className='space-y-6 animate-fade-in'>
                      {/* KPI Dashboard */}
                      <div>
                        <h3 className='text-[15px] font-black text-slate-800 mb-4 flex items-center gap-2'>
                          <AlertTriangle size={18} className='text-rose-500' />
                          模擬後整體效能衝擊評估 (KPI Impact Analysis)
                        </h3>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
                          {activeScenario.kpis.map((kpi, idx) => (
                            <KPICard key={idx} kpi={kpi} />
                          ))}
                        </div>
                      </div>

                      {/* 影響清單 Table */}
                      <Card
                        className='shadow-sm border border-slate-200/80 rounded-3xl overflow-hidden bg-white'
                        styles={{ body: { padding: 0 } }}
                      >
                        <div className='bg-gradient-to-r from-rose-50 to-white p-5 border-b border-rose-100/50 flex items-center justify-between'>
                          <div className='flex items-center gap-2.5 text-rose-600 text-sm font-black tracking-wide'>
                            <div className='bg-rose-100 p-1.5 rounded-lg'>
                              <CalendarDays size={18} />
                            </div>
                            高風險警告：交期受排擠/延遲之工單列表
                          </div>
                          <Tag
                            color='error'
                            className='m-0 border-none font-bold rounded-md px-3 py-1 shadow-sm'
                          >
                            預測將有{' '}
                            {activeScenario.impactedOrders?.length || 0}{' '}
                            筆工單受影響
                          </Tag>
                        </div>

                        <div className='p-2 sm:p-5'>
                          <Table<ImpactedOrder>
                            columns={columns}
                            dataSource={activeScenario.impactedOrders}
                            pagination={false}
                            rowKey='woNumber'
                            size='middle'
                          />
                        </div>
                      </Card>
                    </div>
                  ) : (
                    <div className='bg-slate-50/50 rounded-3xl border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center min-h-[350px] text-slate-400'>
                      <div className='bg-white p-4 rounded-full shadow-sm mb-4'>
                        <FlaskConical size={40} className='text-slate-300' />
                      </div>
                      <span className='font-bold text-[15px] text-slate-500'>
                        配置完畢後，請點擊上方「開始推演模擬」。
                      </span>
                      <span className='text-xs font-medium mt-1'>
                        系統將為您計算出基準線與模擬後的差異報表。
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className='bg-white rounded-3xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center min-h-[500px] text-slate-400'>
                  <span className='font-bold'>
                    請由左側選擇或建立一個情境劇本
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* --- Modal 1: 新增情境劇本 --- */}
          <Modal
            title={
              <div className='flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-4 mb-2 mt-1'>
                <div className='bg-indigo-100 p-2 rounded-xl shadow-inner shadow-indigo-200/50'>
                  <FlaskConical size={20} className='text-indigo-600' />
                </div>
                <span className='font-black text-xl tracking-tight'>
                  建立新模擬劇本 (New Scenario)
                </span>
              </div>
            }
            open={isCreateModalOpen}
            onOk={handleCreateScenario}
            onCancel={() => setIsCreateModalOpen(false)}
            okText='建立劇本'
            cancelText='取消'
            okButtonProps={{
              className:
                'bg-indigo-600 hover:bg-indigo-500 border-none shadow-md shadow-indigo-200 rounded-xl font-bold px-8 h-11'
            }}
            cancelButtonProps={{
              className:
                'rounded-xl font-bold text-slate-500 border-slate-200 px-6 h-11 hover:bg-slate-50'
            }}
            className='custom-edit-modal'
            width={600}
          >
            <Form form={scenarioForm} layout='vertical' className='mt-4 mb-2'>
              <Form.Item
                name='name'
                label={
                  <span className='font-bold text-slate-700'>劇本名稱</span>
                }
                rules={[{ required: true, message: '必填' }]}
              >
                <Input
                  className='h-11 rounded-xl text-sm border-slate-300 focus:bg-indigo-50/30'
                  placeholder='例如: 國慶連假停機保養產能評估'
                />
              </Form.Item>
              <Form.Item
                name='description'
                label={
                  <span className='font-bold text-slate-700'>
                    描述與假設前提
                  </span>
                }
              >
                <Input.TextArea
                  rows={3}
                  className='rounded-xl text-sm border-slate-300 p-3 focus:bg-indigo-50/30'
                  placeholder='簡單描述此情境要測試的業務前提...'
                />
              </Form.Item>
            </Form>
          </Modal>

          {/* --- Modal 2: 動態新增參數配置 --- */}
          <Modal
            title={
              <div className='flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-4 mb-2 mt-1'>
                <div className='bg-indigo-100 p-2 rounded-xl shadow-inner shadow-indigo-200/50'>
                  <SlidersHorizontal size={20} className='text-indigo-600' />
                </div>
                <span className='font-black text-xl tracking-tight'>
                  注入環境干擾變數
                </span>
              </div>
            }
            open={isParamModalOpen}
            onOk={handleAddParameter}
            onCancel={() => setIsParamModalOpen(false)}
            okText='確認加入'
            cancelText='取消'
            okButtonProps={{
              className:
                'bg-indigo-600 hover:bg-indigo-500 border-none shadow-md shadow-indigo-200 rounded-xl font-bold px-8 h-11'
            }}
            cancelButtonProps={{
              className:
                'rounded-xl font-bold text-slate-500 border-slate-200 px-6 h-11 hover:bg-slate-50'
            }}
            className='custom-edit-modal top-10'
            width={720}
            destroyOnClose
            afterOpenChange={open => {
              if (open) {
                setSelectedParamCategory('訂單參數')
                paramForm.resetFields()
              }
            }}
          >
            <div className='mt-4 mb-6'>
              <span className='text-xs font-black text-slate-500 uppercase tracking-widest mb-3 block'>
                Step 1. 選擇變數維度
              </span>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                {(Object.keys(CategoryStyleMap) as ParamCategory[]).map(
                  category => {
                    const style = CategoryStyleMap[category]
                    const Icon = style.icon
                    const isSelected = selectedParamCategory === category
                    return (
                      <div
                        key={category}
                        onClick={() => {
                          setSelectedParamCategory(category)
                          paramForm.resetFields()
                        }}
                        className={cn(
                          'cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all',
                          isSelected
                            ? `border-indigo-500 bg-indigo-50/50 shadow-sm shadow-indigo-100`
                            : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                        )}
                      >
                        <div
                          className={cn(
                            'p-2 rounded-lg',
                            isSelected ? style.bg : 'bg-slate-100'
                          )}
                        >
                          <Icon
                            size={20}
                            className={
                              isSelected ? style.color : 'text-slate-400'
                            }
                          />
                        </div>
                        <span
                          className={cn(
                            'text-xs font-black',
                            isSelected ? 'text-indigo-900' : 'text-slate-500'
                          )}
                        >
                          {category}
                        </span>
                      </div>
                    )
                  }
                )}
              </div>
            </div>

            <Divider className='border-slate-100 my-4' />

            <Form form={paramForm} layout='vertical' className='mb-2'>
              <span className='text-xs font-black text-slate-500 uppercase tracking-widest mb-4 block'>
                Step 2. 配置詳細參數值 ({selectedParamCategory})
              </span>

              <div className='grid grid-cols-2 gap-x-5'>
                {/* 根據選擇的 Category 動態渲染表單 */}
                {selectedParamCategory === '訂單參數' && (
                  <>
                    <Form.Item
                      name='action'
                      label={
                        <span className='font-bold text-slate-700'>
                          執行動作
                        </span>
                      }
                      rules={[{ required: true }]}
                    >
                      <Select
                        className='h-11 rounded-xl font-bold'
                        placeholder='選擇動作'
                      >
                        <Select.Option value='急單強制插排'>
                          急單強制插排
                        </Select.Option>
                        <Select.Option value='交期要求提前'>
                          交期要求提前
                        </Select.Option>
                        <Select.Option value='訂單取消/抽單'>
                          訂單取消/抽單
                        </Select.Option>
                        <Select.Option value='數量臨時追加'>
                          數量臨時追加
                        </Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name='target'
                      label={
                        <span className='font-bold text-slate-700'>
                          目標工單/客戶
                        </span>
                      }
                      rules={[{ required: true }]}
                    >
                      <Input
                        className='h-11 rounded-xl border-slate-300'
                        placeholder='例如: WO-99812 或 客戶代碼'
                      />
                    </Form.Item>
                    <Form.Item
                      name='qty'
                      label={
                        <span className='font-bold text-slate-700'>
                          變更數量 (可選)
                        </span>
                      }
                    >
                      <Input
                        type='number'
                        className='h-11 rounded-xl border-slate-300'
                        placeholder='輸入數量 PCS'
                      />
                    </Form.Item>
                    <Form.Item
                      name='date'
                      label={
                        <span className='font-bold text-slate-700'>
                          期望交期 (可選)
                        </span>
                      }
                    >
                      <DatePicker
                        className='h-11 rounded-xl border-slate-300 w-full'
                        placeholder='選擇日期'
                      />
                    </Form.Item>
                  </>
                )}

                {selectedParamCategory === '機台參數' && (
                  <>
                    <Form.Item
                      name='action'
                      label={
                        <span className='font-bold text-slate-700'>
                          執行動作
                        </span>
                      }
                      rules={[{ required: true }]}
                    >
                      <Select
                        className='h-11 rounded-xl font-bold'
                        placeholder='選擇動作'
                      >
                        <Select.Option value='設備突發故障'>
                          設備突發故障停機
                        </Select.Option>
                        <Select.Option value='預防性保養'>
                          預防性保養 (計畫內)
                        </Select.Option>
                        <Select.Option value='產能擴充/加班'>
                          產能擴充 / 週末加班
                        </Select.Option>
                        <Select.Option value='效率調降(降速)'>
                          效率調降(降速生產)
                        </Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name='target'
                      label={
                        <span className='font-bold text-slate-700'>
                          目標設備/產線
                        </span>
                      }
                      rules={[{ required: true }]}
                    >
                      <Select
                        className='h-11 rounded-xl'
                        placeholder='選擇機台'
                      >
                        <Select.Option value='SMT-LINE-01'>
                          SMT-LINE-01
                        </Select.Option>
                        <Select.Option value='CNC-MC-12'>
                          CNC-MC-12
                        </Select.Option>
                        <Select.Option value='ASSY-LINE-A'>
                          ASSY-LINE-A (組裝線)
                        </Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name='dateRange'
                      label={
                        <span className='font-bold text-slate-700'>
                          影響時間區間
                        </span>
                      }
                      className='col-span-2'
                      rules={[{ required: true }]}
                    >
                      <RangePicker
                        showTime
                        className='h-11 rounded-xl border-slate-300 w-full'
                      />
                    </Form.Item>
                  </>
                )}

                {selectedParamCategory === '物料參數' && (
                  <>
                    <Form.Item
                      name='action'
                      label={
                        <span className='font-bold text-slate-700'>
                          執行動作
                        </span>
                      }
                      rules={[{ required: true }]}
                    >
                      <Select
                        className='h-11 rounded-xl font-bold'
                        placeholder='選擇動作'
                      >
                        <Select.Option value='交期遞延'>
                          供應商延遲交貨
                        </Select.Option>
                        <Select.Option value='料件短缺(盤損)'>
                          料件短缺/良率異常
                        </Select.Option>
                        <Select.Option value='啟用替代料'>
                          啟用 BOM 替代料件
                        </Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name='target'
                      label={
                        <span className='font-bold text-slate-700'>
                          目標料號 (Part No.)
                        </span>
                      }
                      rules={[{ required: true }]}
                    >
                      <Input
                        className='h-11 rounded-xl border-slate-300 font-mono'
                        placeholder='輸入料號'
                      />
                    </Form.Item>
                    <Form.Item
                      name='arrivalDate'
                      label={
                        <span className='font-bold text-slate-700'>
                          更新後預計到料日
                        </span>
                      }
                      className='col-span-2'
                    >
                      <DatePicker
                        className='h-11 rounded-xl border-slate-300 w-1/2'
                        placeholder='選擇延遲後的日期'
                      />
                    </Form.Item>
                  </>
                )}

                {selectedParamCategory === '排程參數' && (
                  <>
                    <Form.Item
                      name='action'
                      label={
                        <span className='font-bold text-slate-700'>
                          執行動作
                        </span>
                      }
                      rules={[{ required: true }]}
                    >
                      <Select
                        className='h-11 rounded-xl font-bold'
                        placeholder='選擇動作'
                      >
                        <Select.Option value='變更排程策略'>
                          變更整體排程權重策略
                        </Select.Option>
                        <Select.Option value='開啟替代邏輯'>
                          開啟跨線/替代料生產
                        </Select.Option>
                        <Select.Option value='鎖定既有計畫'>
                          鎖定未來3天排程不變
                        </Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name='strategy'
                      label={
                        <span className='font-bold text-slate-700'>
                          切換策略值
                        </span>
                      }
                      rules={[{ required: true }]}
                    >
                      <Select
                        className='h-11 rounded-xl'
                        placeholder='選擇新策略'
                      >
                        <Select.Option value='達交率優先 (OTD First)'>
                          達交率優先 (OTD First)
                        </Select.Option>
                        <Select.Option value='換線最少優先 (Minimize Setup)'>
                          換線次數最少優先
                        </Select.Option>
                        <Select.Option value='設備利用率最大化'>
                          設備利用率最大化
                        </Select.Option>
                      </Select>
                    </Form.Item>
                    <div className='col-span-2 flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2'>
                      <div>
                        <span className='font-bold text-slate-700 block text-sm'>
                          允許跨線生產 (Cross-line Routing)
                        </span>
                        <span className='text-xs text-slate-500'>
                          若主力機台滿載，自動尋找次要機台替代。
                        </span>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </>
                )}

                {selectedParamCategory === '製程參數' && (
                  <>
                    <Form.Item
                      name='action'
                      label={
                        <span className='font-bold text-slate-700'>
                          執行動作
                        </span>
                      }
                      rules={[{ required: true }]}
                    >
                      <Select
                        className='h-11 rounded-xl font-bold'
                        placeholder='選擇動作'
                      >
                        <Select.Option value='變更標準工時 (CT)'>
                          變更標準工時 (CT)
                        </Select.Option>
                        <Select.Option value='調整預期良率'>
                          調整預期良率 (Yield Rate)
                        </Select.Option>
                        <Select.Option value='變更生產途程 (Routing)'>
                          變更生產途程 (Routing)
                        </Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name='target'
                      label={
                        <span className='font-bold text-slate-700'>
                          目標製程/產品
                        </span>
                      }
                      rules={[{ required: true }]}
                    >
                      <Input
                        className='h-11 rounded-xl border-slate-300'
                        placeholder='例如: PCBA主板 或 迴焊段'
                      />
                    </Form.Item>
                    <Form.Item
                      name='paramValue'
                      label={
                        <span className='font-bold text-slate-700'>
                          設定數值
                        </span>
                      }
                      className='col-span-2'
                      rules={[{ required: true }]}
                    >
                      <Input
                        className='h-11 rounded-xl border-slate-300 w-1/2'
                        placeholder='例如: CT 減少 15% 或 良率降至 85%'
                      />
                    </Form.Item>
                  </>
                )}

                {selectedParamCategory === '人力參數' && (
                  <>
                    <Form.Item
                      name='action'
                      label={
                        <span className='font-bold text-slate-700'>
                          執行動作
                        </span>
                      }
                      rules={[{ required: true }]}
                    >
                      <Select
                        className='h-11 rounded-xl font-bold'
                        placeholder='選擇動作'
                      >
                        <Select.Option value='增加臨時人力'>
                          增加臨時支援人力
                        </Select.Option>
                        <Select.Option value='人員缺勤/請假'>
                          人員突發缺勤/請假
                        </Select.Option>
                        <Select.Option value='跨線支援調度'>
                          跨線支援調度
                        </Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name='target'
                      label={
                        <span className='font-bold text-slate-700'>
                          目標班別/產線
                        </span>
                      }
                      rules={[{ required: true }]}
                    >
                      <Select
                        className='h-11 rounded-xl'
                        placeholder='選擇產線'
                      >
                        <Select.Option value='SMT-LINE-01'>
                          SMT-LINE-01
                        </Select.Option>
                        <Select.Option value='ASSY-LINE-A'>
                          ASSY-LINE-A (組裝線)
                        </Select.Option>
                        <Select.Option value='PKG-01'>
                          PKG-01 (包裝線)
                        </Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name='paramValue'
                      label={
                        <span className='font-bold text-slate-700'>
                          設定數值
                        </span>
                      }
                      className='col-span-2'
                      rules={[{ required: true }]}
                    >
                      <Input
                        className='h-11 rounded-xl border-slate-300 w-1/2'
                        placeholder='例如: 早班增加 3 人 或 減少 5 人'
                      />
                    </Form.Item>
                  </>
                )}

                {selectedParamCategory === '批次與換線' && (
                  <>
                    <Form.Item
                      name='action'
                      label={
                        <span className='font-bold text-slate-700'>
                          執行動作
                        </span>
                      }
                      rules={[{ required: true }]}
                    >
                      <Select
                        className='h-11 rounded-xl font-bold'
                        placeholder='選擇動作'
                      >
                        <Select.Option value='調整最小批量'>
                          調整最小批量 (MOQ / Lot Size)
                        </Select.Option>
                        <Select.Option value='強制合併工單'>
                          強制合併同料號工單 (Batching)
                        </Select.Option>
                        <Select.Option value='允許大單拆批'>
                          允許大單拆批 (Lot Splitting)
                        </Select.Option>
                        <Select.Option value='縮短換線時間'>
                          縮短換線時間 (Setup Reduction)
                        </Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name='target'
                      label={
                        <span className='font-bold text-slate-700'>
                          目標料號/產品族
                        </span>
                      }
                      rules={[{ required: true }]}
                    >
                      <Input
                        className='h-11 rounded-xl border-slate-300 font-mono'
                        placeholder='例如: PCBA-V2 系列 或 特定料號'
                      />
                    </Form.Item>
                    <Form.Item
                      name='paramValue'
                      label={
                        <span className='font-bold text-slate-700'>
                          設定數值/規則
                        </span>
                      }
                      className='col-span-2'
                      rules={[{ required: true }]}
                    >
                      <Input
                        className='h-11 rounded-xl border-slate-300 w-1/2'
                        placeholder='例如: MOQ 設為 500 或 換線時間 -20%'
                      />
                    </Form.Item>
                  </>
                )}
              </div>
            </Form>
          </Modal>

          <style>{`
            /* Scrollbar Style */
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

            /* Modal Style */
            .custom-edit-modal .ant-modal-content {
              border-radius: 24px;
              padding: 24px;
              border: 1px solid #e2e8f0;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
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
