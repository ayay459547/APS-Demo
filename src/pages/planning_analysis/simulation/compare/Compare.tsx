import React, { useState, useMemo } from 'react'
import {
  ConfigProvider,
  Button,
  Tag,
  Divider,
  message,
  Modal,
  Form,
  Input,
  Select
} from 'antd'
import {
  GitCompare,
  Scale,
  Trophy,
  CheckCircle2,
  XCircle,
  TrendingDown,
  TrendingUp,
  Clock,
  Target,
  DollarSign,
  Activity,
  Zap,
  Sparkles,
  ChevronRight,
  Plus,
  FlaskConical
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useNavigate } from 'react-router-dom'

import { COMPONENT_MAP } from '@/router/constants.tsx'

/**
 * 樣式合併工具函數
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- 型別定義 ---
export interface KPIData {
  key: string
  label: string
  value: number
  unit: string
  higherIsBetter: boolean
  icon: React.ElementType
}

export interface ScenarioPlan {
  id: string
  name: string
  isBaseline?: boolean
  badge?: { text: string; color: string; icon: React.ElementType }
  description: string
  kpis: KPIData[]
  pros: string[]
  cons: string[]
  themeColor: 'slate' | 'indigo' | 'emerald' | 'fuchsia' | 'cyan' | 'orange'
}

// --- 擬真數據產生器 ---
const initialMockPlans: ScenarioPlan[] = [
  {
    id: 'BASE-001',
    name: '原定生產計畫 (Baseline)',
    isBaseline: true,
    description: '當前系統預設的生產排程，未加入急單插排與任何產能調整。',
    kpis: [
      {
        key: 'otd',
        label: '訂單達交率 (OTD)',
        value: 85.2,
        unit: '%',
        higherIsBetter: true,
        icon: Target
      },
      {
        key: 'oee',
        label: '設備綜合效率 (OEE)',
        value: 76.5,
        unit: '%',
        higherIsBetter: true,
        icon: Activity
      },
      {
        key: 'tardiness',
        label: '總延遲時間',
        value: 124,
        unit: 'hrs',
        higherIsBetter: false,
        icon: Clock
      },
      {
        key: 'cost',
        label: '預估總成本',
        value: 420,
        unit: '萬',
        higherIsBetter: false,
        icon: DollarSign
      },
      {
        key: 'setup',
        label: '總換線次數',
        value: 18,
        unit: '次',
        higherIsBetter: false,
        icon: GitCompare
      }
    ],
    pros: [
      '不需額外支付加班與急單處理費用',
      '現場生產節奏穩定，無頻繁換線風險'
    ],
    cons: ['重要客戶特急單將嚴重遲交 (延遲 5 天)', '整體設備利用率未達最佳化'],
    themeColor: 'slate'
  },
  {
    id: 'SIM-A-001',
    name: '方案 A：達交優先 (急單插排+加班)',
    badge: { text: '最佳整體平衡', color: 'indigo', icon: Trophy },
    description: '強制插入急單，並啟動週末 SMT 產線擴充加班 16 小時。',
    kpis: [
      {
        key: 'otd',
        label: '訂單達交率 (OTD)',
        value: 96.8,
        unit: '%',
        higherIsBetter: true,
        icon: Target
      },
      {
        key: 'oee',
        label: '設備綜合效率 (OEE)',
        value: 88.4,
        unit: '%',
        higherIsBetter: true,
        icon: Activity
      },
      {
        key: 'tardiness',
        label: '總延遲時間',
        value: 24,
        unit: 'hrs',
        higherIsBetter: false,
        icon: Clock
      },
      {
        key: 'cost',
        label: '預估總成本',
        value: 485,
        unit: '萬',
        higherIsBetter: false,
        icon: DollarSign
      },
      {
        key: 'setup',
        label: '總換線次數',
        value: 26,
        unit: '次',
        higherIsBetter: false,
        icon: GitCompare
      }
    ],
    pros: [
      '完美解決 VIP 客戶急單需求，達交率大幅提升',
      'OEE 提升至優良水準 (>85%)'
    ],
    cons: [
      '加班費導致總生產成本上升 (+65萬)',
      '換線次數增加，考驗現場人員切換效率'
    ],
    themeColor: 'indigo'
  },
  {
    id: 'SIM-B-001',
    name: '方案 B：成本最優 (跨線支援+併批)',
    badge: { text: '成本效益最高', color: 'emerald', icon: Zap },
    description:
      '不加班，將急單拆批轉移至閒置的 DIP 線替代生產，並強制合併相似工單。',
    kpis: [
      {
        key: 'otd',
        label: '訂單達交率 (OTD)',
        value: 91.5,
        unit: '%',
        higherIsBetter: true,
        icon: Target
      },
      {
        key: 'oee',
        label: '設備綜合效率 (OEE)',
        value: 82.0,
        unit: '%',
        higherIsBetter: true,
        icon: Activity
      },
      {
        key: 'tardiness',
        label: '總延遲時間',
        value: 68,
        unit: 'hrs',
        higherIsBetter: false,
        icon: Clock
      },
      {
        key: 'cost',
        label: '預估總成本',
        value: 435,
        unit: '萬',
        higherIsBetter: false,
        icon: DollarSign
      },
      {
        key: 'setup',
        label: '總換線次數',
        value: 14,
        unit: '次',
        higherIsBetter: false,
        icon: GitCompare
      }
    ],
    pros: [
      '成本增幅極小 (+15萬)，具備高經濟效益',
      '換線次數最少，現場執行難度低'
    ],
    cons: [
      '急單仍有輕微延遲風險 (約 1-2 天)',
      '跨線生產可能面臨良率波動的隱含風險'
    ],
    themeColor: 'emerald'
  }
]

// --- 輔助計算最大值以繪製比例條 ---
const getMaxKPIs = (plans: ScenarioPlan[]) => {
  const maxValues: Record<string, number> = {}
  plans.forEach(plan => {
    plan.kpis.forEach(kpi => {
      if (!maxValues[kpi.key] || kpi.value > maxValues[kpi.key]) {
        maxValues[kpi.key] = kpi.value
      }
    })
  })
  return maxValues
}

// --- 子組件：動態比較進度條 ---
const ComparisonBar: React.FC<{
  current: KPIData
  baseline: KPIData
  maxValue: number
  themeColor: string
}> = ({ current, baseline, maxValue, themeColor }) => {
  const isBaseline = current.value === baseline.value
  const diff = current.value - baseline.value
  // const diffPercent = baseline.value !== 0 ? (diff / baseline.value) * 100 : 0

  // 判斷好壞 (綠/紅)
  let isPositive = false
  if (diff > 0 && current.higherIsBetter) isPositive = true
  if (diff < 0 && !current.higherIsBetter) isPositive = true

  let isNegative = false
  if (diff < 0 && current.higherIsBetter) isNegative = true
  if (diff > 0 && !current.higherIsBetter) isNegative = true

  const diffColor = isPositive
    ? 'text-emerald-500'
    : isNegative
      ? 'text-rose-500'
      : 'text-slate-400'
  const diffBg = isPositive
    ? 'bg-emerald-50'
    : isNegative
      ? 'bg-rose-50'
      : 'bg-slate-50'

  const barWidth = Math.max((current.value / maxValue) * 100, 2) // 至少 2% 寬度

  const IconComp = current.icon

  return (
    <div className='flex flex-col gap-1.5 mb-5 relative group'>
      <div className='flex items-end justify-between'>
        <span className='text-[11px] font-black text-slate-500 flex items-center gap-1.5'>
          <IconComp size={12} className='opacity-60' />
          {current.label}
        </span>

        <div className='flex items-center gap-2'>
          {!isBaseline && (
            <span
              className={cn(
                'text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5',
                diffColor,
                diffBg
              )}
            >
              {diff > 0 ? '+' : ''}
              {diff % 1 !== 0 ? diff.toFixed(1) : diff}
              {current.higherIsBetter ? (
                diff > 0 ? (
                  <TrendingUp size={10} />
                ) : (
                  <TrendingDown size={10} />
                )
              ) : diff < 0 ? (
                <TrendingDown size={10} />
              ) : (
                <TrendingUp size={10} />
              )}
            </span>
          )}
          <span
            className={cn(
              'text-sm font-black font-mono tracking-tight',
              isBaseline
                ? 'text-slate-700'
                : isPositive
                  ? 'text-emerald-600'
                  : isNegative
                    ? 'text-rose-600'
                    : 'text-slate-700'
            )}
          >
            {current.value}{' '}
            <span className='text-[10px] font-bold text-slate-400'>
              {current.unit}
            </span>
          </span>
        </div>
      </div>

      {/* Visual Bar */}
      <div className='w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex'>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000 ease-out',
            isBaseline ? 'bg-slate-300' : `bg-${themeColor}-500`
          )}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  )
}

// --- 主元件 ---
export default function ScenarioComparison() {
  const navigate = useNavigate()

  const [plans, setPlans] = useState<ScenarioPlan[]>(initialMockPlans)
  const [isPublishing, setIsPublishing] = useState(false)

  // 新增方案 Modal 狀態
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addForm] = Form.useForm()

  const maxValues = useMemo(() => getMaxKPIs(plans), [plans])
  const baselinePlan = plans.find(p => p.isBaseline) || plans[0]

  const handlePublish = (planName: string) => {
    setIsPublishing(true)
    setTimeout(() => {
      setIsPublishing(false)
      message.success({
        content: `已成功核准並發布【${planName}】至正式排程計畫！`,
        className: 'custom-message'
      })
    }, 1500)
  }

  const handleAddPlan = async () => {
    try {
      const values = await addForm.validateFields()

      // 動態生成一組擬真資料來展示
      const availableColors: ('fuchsia' | 'cyan' | 'orange')[] = [
        'fuchsia',
        'cyan',
        'orange'
      ]
      const themeColor = availableColors[plans.length % availableColors.length]

      const newPlan: ScenarioPlan = {
        id: `SIM-NEW-${Date.now().toString().slice(-4)}`,
        name: values.name,
        description: values.description || '使用者自定義載入之情境模擬方案。',
        kpis: [
          {
            key: 'otd',
            label: '訂單達交率 (OTD)',
            value: 89.4,
            unit: '%',
            higherIsBetter: true,
            icon: Target
          },
          {
            key: 'oee',
            label: '設備綜合效率 (OEE)',
            value: 84.1,
            unit: '%',
            higherIsBetter: true,
            icon: Activity
          },
          {
            key: 'tardiness',
            label: '總延遲時間',
            value: 45,
            unit: 'hrs',
            higherIsBetter: false,
            icon: Clock
          },
          {
            key: 'cost',
            label: '預估總成本',
            value: 455,
            unit: '萬',
            higherIsBetter: false,
            icon: DollarSign
          },
          {
            key: 'setup',
            label: '總換線次數',
            value: 21,
            unit: '次',
            higherIsBetter: false,
            icon: GitCompare
          }
        ],
        pros: ['此方案由最新模擬引擎推演生成', '具備特定維度的最佳化潛力'],
        cons: [
          '尚未經過完整的風險壓力測試',
          '可能對局部產線造成未預期的瓶頸轉移'
        ],
        themeColor: themeColor
      }

      setPlans([...plans, newPlan])
      setIsAddModalOpen(false)
      addForm.resetFields()
      message.success({
        content: '新模擬方案已成功載入至對比矩陣！',
        className: 'custom-message'
      })
    } catch (e) {
      console.log('Validation failed:', e)
    }
  }

  const removePlan = (id: string) => {
    setPlans(plans.filter(p => p.id !== id))
    message.info({
      content: '方案已從對比矩陣中移除',
      className: 'custom-message'
    })
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          borderRadius: 12,
          borderRadiusSM: 6,
          fontFamily: 'Inter, Noto Sans TC, sans-serif'
        }
      }}
    >
      <div className='w-full h-full bg-[#f8fafc] font-sans text-slate-800 overflow-x-hidden'>
        <div className='mx-auto px-4 pt-4 pb-12  animate-fade-in relative'>
          {/* 玻璃透視頂部導航列 (Sticky Floating Header) */}
          <div className='flex flex-wrap items-center justify-between gap-y-4 bg-white/70 py-4 px-6 rounded-3xl sticky top-0 z-50 backdrop-blur-xl shadow-lg shadow-slate-200/50 border border-white/80 mb-8 transition-all'>
            <div className='flex items-center gap-4'>
              <div className='bg-linear-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-blue-200/50 text-white shrink-0 hidden sm:block'>
                <Scale size={20} />
              </div>
              <div className='flex flex-col'>
                <h1 className='text-xl sm:text-2xl font-black tracking-tight text-slate-800 m-0'>
                  方案優劣對比 (Scenario Comparison)
                </h1>
                <p className='text-xs sm:text-sm font-bold text-slate-500 mt-1 m-0'>
                  全方位衡量各模擬劇本的{' '}
                  <span className='text-blue-500 mx-1'>
                    達交率、稼動率與成本效益
                  </span>
                  ，找出最佳決策解。
                </p>
              </div>
            </div>
            <div className='flex gap-3 ml-auto'>
              <Button
                type='primary'
                icon={<Plus size={16} />}
                className='bg-indigo-600 hover:bg-indigo-500 border-none shadow-md shadow-indigo-200 rounded-xl font-bold h-11 px-5 transition-transform active:scale-95'
                onClick={() => setIsAddModalOpen(true)}
              >
                載入對比方案
              </Button>
              <Button
                type='default'
                className='rounded-xl font-bold h-11 px-5 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all hidden sm:block'
                onClick={() => {
                  navigate(`/${COMPONENT_MAP?.whatif?.url}`)
                }}
              >
                返回情境模擬
              </Button>
            </div>
          </div>

          {/* AI 智能建議橫幅 (Smart Recommendation Banner) */}
          <div className='bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 rounded-3xl p-[2px] shadow-xl shadow-indigo-200/50 mb-8 relative overflow-hidden group'>
            <div className='absolute inset-0 bg-white/10 blur-xl group-hover:bg-white/20 transition-all duration-700' />
            <div className='bg-white/95 backdrop-blur-xl rounded-[22px] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10'>
              <div className='flex items-center gap-4'>
                <div className='bg-indigo-100 p-3 rounded-2xl flex shrink-0'>
                  <Sparkles
                    size={20}
                    className='text-indigo-600 animate-pulse'
                  />
                </div>
                <div className='flex flex-col'>
                  <span className='font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 text-lg flex items-center gap-2 tracking-tight'>
                    APS 智能決策引擎分析報告
                  </span>
                  <span className='text-sm font-bold text-slate-600 mt-1 leading-relaxed max-w-3xl'>
                    經多維度推演，強烈建議採用{' '}
                    <Tag color='indigo' className='border-none font-black mx-1'>
                      方案 A：達交優先
                    </Tag>
                    。 雖然總成本增加約 15%，但能確保 VIP 客戶急單如期交付，且
                    OEE 達到 88.4%
                    最佳化水準，長期商譽維護效益遠大於短期加班成本。
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 對比矩陣 (Comparison Grid) */}
          <div className='grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 gap-6'>
            {plans.map(plan => {
              const IconBadge = plan.badge?.icon

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'flex flex-col rounded-4xl border-2 transition-all duration-300 relative overflow-hidden bg-white group/card',
                    plan.isBaseline
                      ? 'border-slate-200/80 shadow-sm'
                      : `border-${plan.themeColor}-200 shadow-xl shadow-${plan.themeColor}-100/50 hover:-translate-y-1 hover:shadow-2xl hover:shadow-${plan.themeColor}-200/60`
                  )}
                >
                  {/* Badge Ribbon */}
                  {plan.badge && (
                    <div
                      className={cn(
                        'absolute top-0 inset-x-0 py-2 flex items-center justify-center gap-1.5 font-black text-xs text-white uppercase tracking-widest z-10',
                        `bg-gradient-to-r from-${plan.badge.color}-500 to-${plan.badge.color}-400`
                      )}
                    >
                      {IconBadge && <IconBadge size={14} />}
                      {plan.badge.text}
                    </div>
                  )}

                  {!plan.isBaseline && (
                    <button
                      onClick={() => removePlan(plan.id)}
                      className='absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full opacity-0 group-hover/card:opacity-100 transition-all z-20 cursor-pointer'
                      title='移除此方案'
                    >
                      <XCircle size={18} />
                    </button>
                  )}

                  <div
                    className={cn(
                      'p-6 sm:p-8 flex-grow flex flex-col',
                      plan.badge ? 'pt-14' : ''
                    )}
                  >
                    {/* Header */}
                    <div className='mb-6 pr-6'>
                      <div className='flex items-center gap-2 mb-2'>
                        {plan.isBaseline ? (
                          <div className='bg-slate-100 p-2 rounded-xl text-slate-500'>
                            <GitCompare size={20} />
                          </div>
                        ) : (
                          <div
                            className={cn(
                              `bg-${plan.themeColor}-100 p-2 rounded-xl text-${plan.themeColor}-600`
                            )}
                          >
                            <Trophy size={20} />
                          </div>
                        )}
                        <h2
                          className={cn(
                            'text-xl font-black m-0 tracking-tight',
                            plan.isBaseline
                              ? 'text-slate-700'
                              : `text-${plan.themeColor}-900`
                          )}
                        >
                          {plan.name}
                        </h2>
                      </div>
                      <p className='text-xs font-bold text-slate-500 leading-relaxed m-0 min-h-[40px]'>
                        {plan.description}
                      </p>
                    </div>

                    <Divider className='border-slate-100 my-0 mb-6' />

                    {/* KPIs Comparison */}
                    <div className='flex flex-col flex-grow'>
                      <h3 className='text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4'>
                        效能指標預測 (KPI Projections)
                      </h3>
                      {plan.kpis.map(kpi => (
                        <ComparisonBar
                          key={kpi.key}
                          current={kpi}
                          baseline={
                            baselinePlan.kpis.find(bk => bk.key === kpi.key)!
                          }
                          maxValue={maxValues[kpi.key]}
                          themeColor={plan.themeColor}
                        />
                      ))}
                    </div>

                    <Divider className='border-slate-100 my-6' />

                    {/* Pros & Cons */}
                    <div className='flex flex-col gap-4 mb-8'>
                      <div className='flex flex-col gap-2'>
                        <span className='text-[11px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1'>
                          <CheckCircle2 size={12} /> 方案優勢 (Pros)
                        </span>
                        <ul className='m-0 p-0 pl-1 space-y-2'>
                          {plan.pros.map((pro, i) => (
                            <li
                              key={i}
                              className='flex items-start gap-2 text-xs font-bold text-slate-600 leading-snug'
                            >
                              <div className='mt-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0' />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className='flex flex-col gap-2'>
                        <span className='text-[11px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1'>
                          <XCircle size={12} /> 潛在風險 (Cons)
                        </span>
                        <ul className='m-0 p-0 pl-1 space-y-2'>
                          {plan.cons.map((con, i) => (
                            <li
                              key={i}
                              className='flex items-start gap-2 text-xs font-bold text-slate-600 leading-snug'
                            >
                              <div className='mt-0.5 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0' />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className='mt-auto pt-4'>
                      {plan.isBaseline ? (
                        <Button
                          block
                          size='large'
                          className='h-12 rounded-2xl font-black text-slate-500 border-slate-200 bg-slate-50 hover:bg-slate-100 hover:text-slate-700'
                        >
                          維持原計畫 (不變更)
                        </Button>
                      ) : (
                        <Button
                          type='primary'
                          block
                          size='large'
                          loading={isPublishing}
                          onClick={() => handlePublish(plan.name)}
                          className={cn(
                            'h-12 rounded-2xl font-black border-none transition-transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-2',
                            `bg-${plan.themeColor}-600 hover:bg-${plan.themeColor}-500 shadow-${plan.themeColor}-200/50`
                          )}
                        >
                          核准並發布此方案 <ChevronRight size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 新增方案 Modal */}
          <Modal
            title={
              <div className='flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-4 mb-2 mt-1'>
                <div className='bg-indigo-100 p-2 rounded-xl shadow-inner shadow-indigo-200/50'>
                  <FlaskConical size={20} className='text-indigo-600' />
                </div>
                <span className='font-black text-xl tracking-tight'>
                  載入新方案至對比矩陣
                </span>
              </div>
            }
            open={isAddModalOpen}
            onOk={handleAddPlan}
            onCancel={() => setIsAddModalOpen(false)}
            okText='載入並運算'
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
            destroyOnClose
          >
            <Form form={addForm} layout='vertical' className='mt-4 mb-2'>
              <Form.Item
                name='name'
                label={
                  <span className='font-bold text-slate-700'>
                    選擇模擬劇本 / 方案名稱
                  </span>
                }
                rules={[{ required: true, message: '請選擇或輸入方案名稱' }]}
              >
                <Select
                  className='h-11'
                  placeholder='請選擇歷史已儲存之劇本或自行輸入'
                  mode='tags'
                  maxCount={1}
                  options={[
                    {
                      value: '方案 C：大單拆批 + 部分外包',
                      label: '方案 C：大單拆批 + 部分外包'
                    },
                    {
                      value: '方案 D：機台產能 120% 超載運轉',
                      label: '方案 D：機台產能 120% 超載運轉'
                    },
                    {
                      value: '方案 E：延遲非重要客戶訂單交期',
                      label: '方案 E：延遲非重要客戶訂單交期'
                    }
                  ]}
                />
              </Form.Item>
              <Form.Item
                name='description'
                label={
                  <span className='font-bold text-slate-700'>
                    方案描述與優化目標
                  </span>
                }
              >
                <Input.TextArea
                  rows={3}
                  className='rounded-xl text-sm border-slate-300 p-3 focus:bg-indigo-50/30'
                  placeholder='簡單描述此方案的執行策略，例如：採用外包以消化多餘產能...'
                />
              </Form.Item>
            </Form>
          </Modal>

          <style>{`
            .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(15px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .custom-message .ant-message-notice-content {
              border-radius: 16px;
              padding: 16px 24px;
              font-weight: 900;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }
            /* Modal Style */
            .custom-edit-modal .ant-modal-content {
              border-radius: 24px;
              padding: 24px;
              border: 1px solid #e2e8f0;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            }
          `}</style>
        </div>
      </div>
    </ConfigProvider>
  )
}
