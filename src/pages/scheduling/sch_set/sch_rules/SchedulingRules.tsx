import { useState } from 'react'
import {
  ConfigProvider,
  Button,
  Tag,
  message,
  Slider,
  Switch,
  InputNumber,
  Divider,
  Card,
  Space
} from 'antd'
import {
  Save,
  Settings2,
  Calendar,
  Clock,
  MoveDown,
  Package,
  Wrench,
  Users,
  Combine,
  SplitSquareHorizontal,
  Group,
  Gauge,
  Sparkles,
  Activity,
  ShieldCheck,
  Zap,
  List
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// --- 工具函數 ---
function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes))
}

// --- 介面設計 ---
export default function APSSchedulingRules() {
  const [isSaving, setIsSaving] = useState(false)

  // 參數狀態
  const [dispatchRule, setDispatchRule] = useState<string>('EDD')
  const [batchingRule, setBatchingRule] = useState<string>('ITEM')
  const [timeParams, setTimeParams] = useState({
    setupTime: 30,
    safeDays: 3,
    maxBatchWait: 24
  })
  const [ruleWeights, setRuleWeights] = useState({ otd: 80, oee: 60, cost: 40 })
  const [hardConstraints, setHardConstraints] = useState({
    material: true,
    tooling: false,
    labor: false
  })

  // 模擬儲存動作
  const handleSave = () => {
    setIsSaving(true)
    message.loading({
      content: '正在將排程規則寫入系統核心...',
      key: 'saveRule'
    })
    setTimeout(() => {
      setIsSaving(false)
      message.success({
        content: '排程參數與規則已成功發布！',
        key: 'saveRule',
        duration: 3
      })
    }, 1500)
  }

  // 模擬 AI 一鍵優化
  const handleAiOptimize = () => {
    message.loading({
      content: 'AI 正在分析歷史訂單與產能數據...',
      key: 'aiOptimize'
    })
    setTimeout(() => {
      // 自動調整為產能最佳化參數
      setDispatchRule('SPT')
      setBatchingRule('FAMILY')
      setTimeParams({ setupTime: 20, safeDays: 2, maxBatchWait: 48 })
      setRuleWeights({ otd: 70, oee: 95, cost: 85 })
      message.success({
        content: 'AI 已為您推薦「產能與成本最佳化」參數模組！',
        key: 'aiOptimize',
        duration: 3
      })
    }, 2000)
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5', // Indigo-600
          borderRadius: 8,
          fontFamily: '"Inter", "Noto Sans TC", sans-serif'
        }
      }}
    >
      <div className='w-full h-full  text-slate-800 flex flex-col'>
        {/* --- 頂部 Header --- */}
        <header className='h-[72px] bg-white/50 backdrop-blur-sm border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-50 '>
          <div className='flex items-center gap-4'>
            <div className='w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200'>
              <Settings2 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className='text-xl font-black tracking-tight text-slate-800 m-0'>
                排程策略與參數配置
              </h1>
              <p className='text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest'>
                Global Scheduling Parameters & Rules
              </p>
            </div>
          </div>

          <Space size='middle'>
            <Button
              icon={<Sparkles size={16} />}
              onClick={handleAiOptimize}
              className='font-bold border-indigo-200 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 shadow-sm'
            >
              AI 智能推薦參數
            </Button>
            <Button
              type='primary'
              icon={<Save size={16} />}
              loading={isSaving}
              onClick={handleSave}
              className='font-bold px-6 shadow-md shadow-indigo-200 border-none bg-indigo-600 hover:bg-indigo-500 transition-all'
            >
              儲存並發布規則
            </Button>
          </Space>
        </header>

        {/* --- 主內容區塊 (Dashboard Layout) --- */}
        <main className='flex-1 p-6 overflow-y-auto custom-scrollbar'>
          <div className='max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6'>
            {/* 左側欄：核心邏輯與策略 (佔 7 格) */}
            <div className='xl:col-span-7 flex flex-col gap-6'>
              {/* 1. 批次與合單策略 */}
              <Card
                title={
                  <div className='flex items-center gap-2'>
                    <Combine size={18} className='text-indigo-600' />{' '}
                    <span className='font-black text-[15px]'>
                      批次與合單策略 (Batching Strategy)
                    </span>
                  </div>
                }
                extra={
                  <Tag color='blue' className='m-0 border-none font-bold'>
                    降低換線成本
                  </Tag>
                }
                bordered={false}
                className='shadow-sm rounded-2xl border border-slate-200'
                styles={{
                  header: {
                    borderBottom: '1px solid #f1f5f9',
                    padding: '16px 24px'
                  },
                  body: { padding: '24px' }
                }}
              >
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6'>
                  {[
                    {
                      id: 'LFL',
                      label: '逐單生產',
                      desc: 'Lot-for-Lot',
                      icon: <SplitSquareHorizontal size={24} />,
                      activeColor: 'blue'
                    },
                    {
                      id: 'ITEM',
                      label: '同品號合併',
                      desc: '節省一般換線',
                      icon: <Combine size={24} />,
                      activeColor: 'blue'
                    },
                    {
                      id: 'FAMILY',
                      label: '群組特徵合併',
                      desc: '同模具/同屬性',
                      icon: <Group size={24} />,
                      activeColor: 'blue'
                    }
                  ].map(rule => (
                    <div
                      key={rule.id}
                      onClick={() => setBatchingRule(rule.id)}
                      className={cn(
                        'border-2 rounded-xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200',
                        batchingRule === rule.id
                          ? 'border-blue-500 bg-blue-50/60 shadow-md shadow-blue-100 scale-[1.02]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <div
                        className={cn(
                          'p-3 rounded-full transition-colors',
                          batchingRule === rule.id
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        {rule.icon}
                      </div>
                      <div className='flex flex-col items-center text-center'>
                        <span
                          className={cn(
                            'font-black text-[14px]',
                            batchingRule === rule.id
                              ? 'text-blue-700'
                              : 'text-slate-700'
                          )}
                        >
                          {rule.label}
                        </span>
                        <span className='text-xs font-bold text-slate-400 mt-1'>
                          {rule.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 合單時間窗設定 */}
                <div
                  className={cn(
                    'bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center justify-between transition-all duration-500',
                    batchingRule === 'LFL'
                      ? 'opacity-50 grayscale pointer-events-none'
                      : 'opacity-100 shadow-sm'
                  )}
                >
                  <div className='flex flex-col'>
                    <span className='text-[14px] font-black text-slate-700 flex items-center gap-2'>
                      <Clock size={16} className='text-slate-400' />{' '}
                      最大允許等待合單時間 (Time Window)
                    </span>
                    <span className='text-xs text-slate-500 mt-1 font-medium'>
                      限制工單為了等待與其他工單合併生產，而允許延遲的最大時數。
                    </span>
                  </div>
                  <InputNumber
                    min={0}
                    max={120}
                    value={timeParams.maxBatchWait}
                    onChange={v =>
                      setTimeParams({ ...timeParams, maxBatchWait: v || 0 })
                    }
                    addonAfter='小時'
                    className='font-bold text-lg w-32'
                    size='large'
                  />
                </div>
              </Card>

              {/* 2. 基礎派工邏輯 */}
              <Card
                title={
                  <div className='flex items-center gap-2'>
                    <List size={18} className='text-indigo-600' />{' '}
                    <span className='font-black text-[15px]'>
                      站點派工優先權 (Dispatching Rules)
                    </span>
                  </div>
                }
                bordered={false}
                className='shadow-sm rounded-2xl border border-slate-200'
                styles={{
                  header: {
                    borderBottom: '1px solid #f1f5f9',
                    padding: '16px 24px'
                  },
                  body: { padding: '24px' }
                }}
              >
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                  {[
                    {
                      id: 'EDD',
                      label: '交期優先 (EDD)',
                      desc: '最早交期工單優先排入',
                      icon: <Calendar size={24} />
                    },
                    {
                      id: 'SPT',
                      label: '最短工時 (SPT)',
                      desc: '快速釋放產能、減少在製品',
                      icon: <Zap size={24} />
                    },
                    {
                      id: 'FIFO',
                      label: '先進先出 (FIFO)',
                      desc: '依據訂單進件順序排產',
                      icon: <MoveDown size={24} />
                    }
                  ].map(rule => (
                    <div
                      key={rule.id}
                      onClick={() => setDispatchRule(rule.id)}
                      className={cn(
                        'border-2 rounded-xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200',
                        dispatchRule === rule.id
                          ? 'border-indigo-500 bg-indigo-50/60 shadow-md shadow-indigo-100 scale-[1.02]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <div
                        className={cn(
                          'p-3 rounded-full transition-colors',
                          dispatchRule === rule.id
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        {rule.icon}
                      </div>
                      <div className='flex flex-col items-center text-center'>
                        <span
                          className={cn(
                            'font-black text-[14px]',
                            dispatchRule === rule.id
                              ? 'text-indigo-700'
                              : 'text-slate-700'
                          )}
                        >
                          {rule.label}
                        </span>
                        <span className='text-xs font-bold text-slate-400 mt-1'>
                          {rule.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 3. 時間與緩衝參數 */}
              <Card
                title={
                  <div className='flex items-center gap-2'>
                    <Clock size={18} className='text-indigo-600' />{' '}
                    <span className='font-black text-[15px]'>
                      基本時間與緩衝 (Time Parameters)
                    </span>
                  </div>
                }
                bordered={false}
                className='shadow-sm rounded-2xl border border-slate-200'
                styles={{
                  header: {
                    borderBottom: '1px solid #f1f5f9',
                    padding: '16px 24px'
                  },
                  body: { padding: '24px' }
                }}
              >
                <div className='flex flex-col gap-5'>
                  <div className='flex items-center justify-between'>
                    <div className='flex flex-col'>
                      <span className='text-[14px] font-black text-slate-700'>
                        預設換線與清機時間 (Default Setup Time)
                      </span>
                      <span className='text-xs text-slate-500 mt-0.5'>
                        當不同產品特徵切換時，系統預設保留的機台設定時間。
                      </span>
                    </div>
                    <InputNumber
                      min={0}
                      max={240}
                      value={timeParams.setupTime}
                      onChange={v =>
                        setTimeParams({ ...timeParams, setupTime: v || 0 })
                      }
                      addonAfter='分鐘'
                      className='font-bold w-32'
                      size='large'
                    />
                  </div>
                  <Divider className='my-1 border-slate-100' />
                  <div className='flex items-center justify-between'>
                    <div className='flex flex-col'>
                      <span className='text-[14px] font-black text-slate-700'>
                        交期安全防護網 (Delivery Safe Buffer)
                      </span>
                      <span className='text-xs text-slate-500 mt-0.5'>
                        系統排程的最晚完工日，必須早於客戶承諾交期多少天。
                      </span>
                    </div>
                    <InputNumber
                      min={0}
                      max={30}
                      value={timeParams.safeDays}
                      onChange={v =>
                        setTimeParams({ ...timeParams, safeDays: v || 0 })
                      }
                      addonAfter='天'
                      className='font-bold w-32'
                      size='large'
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* 右側欄：AI 權重與硬約束 (佔 5 格) */}
            <div className='xl:col-span-5 flex flex-col gap-6'>
              {/* 4. AI 優化權重 */}
              <Card
                title={
                  <div className='flex items-center gap-2'>
                    <Gauge size={18} className='text-indigo-600' />{' '}
                    <span className='font-black text-[15px]'>
                      AI 多目標優化權重 (Heuristic Weights)
                    </span>
                  </div>
                }
                extra={
                  <Activity
                    size={16}
                    className='text-indigo-400 animate-pulse'
                  />
                }
                bordered={false}
                className='shadow-sm rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-indigo-50/30'
                styles={{
                  header: {
                    borderBottom: '1px solid #f1f5f9',
                    padding: '16px 24px'
                  },
                  body: { padding: '24px' }
                }}
              >
                <div className='flex flex-col gap-8'>
                  {/* OTD */}
                  <div className='group'>
                    <div className='flex justify-between items-end mb-2'>
                      <div className='flex flex-col'>
                        <span className='text-sm font-black text-slate-700'>
                          準時達交率 (On-Time Delivery)
                        </span>
                        <span className='text-xs text-slate-400 font-medium mt-0.5'>
                          盡可能延遲低優先級工單以確保交期。
                        </span>
                      </div>
                      <span className='text-lg font-black text-emerald-500'>
                        {ruleWeights.otd}%
                      </span>
                    </div>
                    <Slider
                      value={ruleWeights.otd}
                      onChange={val =>
                        setRuleWeights({ ...ruleWeights, otd: val })
                      }
                      trackStyle={{ backgroundColor: '#10b981', height: 6 }}
                      handleStyle={{
                        borderColor: '#10b981',
                        width: 16,
                        height: 16,
                        marginTop: -5
                      }}
                      railStyle={{ height: 6 }}
                    />
                  </div>

                  {/* OEE */}
                  <div className='group'>
                    <div className='flex justify-between items-end mb-2'>
                      <div className='flex flex-col'>
                        <span className='text-sm font-black text-slate-700'>
                          設備稼動率 (Overall Equipment Effectiveness)
                        </span>
                        <span className='text-xs text-slate-400 font-medium mt-0.5'>
                          主動填補設備空檔，但可能增加在製品庫存。
                        </span>
                      </div>
                      <span className='text-lg font-black text-blue-500'>
                        {ruleWeights.oee}%
                      </span>
                    </div>
                    <Slider
                      value={ruleWeights.oee}
                      onChange={val =>
                        setRuleWeights({ ...ruleWeights, oee: val })
                      }
                      trackStyle={{ backgroundColor: '#3b82f6', height: 6 }}
                      handleStyle={{
                        borderColor: '#3b82f6',
                        width: 16,
                        height: 16,
                        marginTop: -5
                      }}
                      railStyle={{ height: 6 }}
                    />
                  </div>

                  {/* COST */}
                  <div className='group'>
                    <div className='flex justify-between items-end mb-2'>
                      <div className='flex flex-col'>
                        <span className='text-sm font-black text-slate-700'>
                          換線與製造成本 (Setup Cost)
                        </span>
                        <span className='text-xs text-slate-400 font-medium mt-0.5'>
                          犧牲部分交期以強制合併生產，減少清機次數。
                        </span>
                      </div>
                      <span className='text-lg font-black text-amber-500'>
                        {ruleWeights.cost}%
                      </span>
                    </div>
                    <Slider
                      value={ruleWeights.cost}
                      onChange={val =>
                        setRuleWeights({ ...ruleWeights, cost: val })
                      }
                      trackStyle={{ backgroundColor: '#f59e0b', height: 6 }}
                      handleStyle={{
                        borderColor: '#f59e0b',
                        width: 16,
                        height: 16,
                        marginTop: -5
                      }}
                      railStyle={{ height: 6 }}
                    />
                  </div>
                </div>
              </Card>

              {/* 5. 硬約束條件 */}
              <Card
                title={
                  <div className='flex items-center gap-2'>
                    <ShieldCheck size={18} className='text-indigo-600' />{' '}
                    <span className='font-black text-[15px]'>
                      絕對硬約束 (Hard Constraints)
                    </span>
                  </div>
                }
                extra={
                  <Tag color='error' className='m-0 border-none font-bold'>
                    排程絕對受限
                  </Tag>
                }
                bordered={false}
                className='shadow-sm rounded-2xl border border-rose-100'
                styles={{
                  header: {
                    borderBottom: '1px solid #fff1f2',
                    padding: '16px 24px',
                    backgroundColor: '#fffbfb',
                    borderRadius: '16px 16px 0 0'
                  },
                  body: { padding: '20px 24px' }
                }}
              >
                <div className='flex flex-col gap-4'>
                  <div className='bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm hover:border-indigo-300 transition-colors group'>
                    <div className='flex items-center gap-4'>
                      <div className='p-2.5 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors'>
                        <Package size={20} />
                      </div>
                      <div className='flex flex-col'>
                        <span className='text-[14px] font-black text-slate-700'>
                          物料齊套約束 (Material Ready)
                        </span>
                        <span className='text-xs text-slate-400 mt-0.5'>
                          缺料工單強制延後至預計到料日後開工。
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={hardConstraints.material}
                      onChange={val =>
                        setHardConstraints({
                          ...hardConstraints,
                          material: val
                        })
                      }
                    />
                  </div>

                  <div className='bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm hover:border-indigo-300 transition-colors group'>
                    <div className='flex items-center gap-4'>
                      <div className='p-2.5 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors'>
                        <Wrench size={20} />
                      </div>
                      <div className='flex flex-col'>
                        <span className='text-[14px] font-black text-slate-700'>
                          治具與模具約束 (Tooling Life)
                        </span>
                        <span className='text-xs text-slate-400 mt-0.5'>
                          模具壽命低於 5% 強制排入維護計畫。
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={hardConstraints.tooling}
                      onChange={val =>
                        setHardConstraints({ ...hardConstraints, tooling: val })
                      }
                    />
                  </div>

                  <div className='bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm hover:border-indigo-300 transition-colors group'>
                    <div className='flex items-center gap-4'>
                      <div className='p-2.5 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors'>
                        <Users size={20} />
                      </div>
                      <div className='flex flex-col'>
                        <span className='text-[14px] font-black text-slate-700'>
                          人力技能約束 (Labor Skills)
                        </span>
                        <span className='text-xs text-slate-400 mt-0.5'>
                          特許製程絕對受限於當班具備證照之人力。
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={hardConstraints.labor}
                      onChange={val =>
                        setHardConstraints({ ...hardConstraints, labor: val })
                      }
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #f8fafc; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}</style>
      </div>
    </ConfigProvider>
  )
}
