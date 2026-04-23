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
  Space,
  Row,
  Col
} from 'antd'
import {
  Save,
  CalendarDays,
  Clock,
  Sun,
  Moon,
  Factory,
  Activity,
  Wrench,
  ArrowRightLeft,
  TimerReset,
  PackageCheck,
  PackageOpen,
  Cpu
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// --- 工具函數 ---
function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes))
}

// --- 初始狀態定義 ---
const INITIAL_EFFICIENCY = [
  { id: 'LSR', name: '超高速雷射切割', baseSpeed: 100, currentEff: 95 },
  { id: 'BND', name: '智能折彎成型', baseSpeed: 100, currentEff: 88 },
  { id: 'CNC', name: '五軸 CNC 精銑', baseSpeed: 100, currentEff: 85 },
  { id: 'WLD', name: '自動銲接機器人', baseSpeed: 100, currentEff: 92 },
  { id: 'QCS', name: 'AI 視覺檢測站', baseSpeed: 100, currentEff: 98 }
]

export default function APSProductionParameters() {
  const [isSaving, setIsSaving] = useState(false)

  // --- 狀態管理 ---
  // 1. 班別與日曆
  const [shifts, setShifts] = useState({
    dayShift: true,
    nightShift: false,
    weekendOvertime: false
  })

  // 2. 設備效率
  const [efficiencies, setEfficiencies] = useState(INITIAL_EFFICIENCY)

  // 3. 動態換線時間 (單位: 分鐘)
  const [setupTimes, setSetupTimes] = useState({
    baseClear: 15, // 基本清機
    colorChange: 30, // 同模具換色
    toolChange: 60, // 異模具同料
    materialChange: 120 // 異模具異料
  })

  // 4. 物流與前置時間 (單位: 小時)
  const [leadTimes, setLeadTimes] = useState({
    transferTime: 2, // 站間移轉
    qaBuffer: 4 // 品檢前置
  })

  // --- 處理函式 ---
  const handleSave = () => {
    setIsSaving(true)
    message.loading({
      content: '正在同步生產參數至 APS 核心引擎...',
      key: 'saveParams'
    })
    setTimeout(() => {
      setIsSaving(false)
      message.success({
        content: '生產參數配置已成功發布！排程系統將採用新基準運算。',
        key: 'saveParams',
        duration: 3
      })
    }, 1200)
  }

  const updateEfficiency = (id: string, val: number) => {
    setEfficiencies(prev =>
      prev.map(m => (m.id === id ? { ...m, currentEff: val } : m))
    )
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#3b82f6', // Blue-500
          borderRadius: 12,
          fontFamily: '"Inter", "Noto Sans TC", sans-serif'
        }
      }}
    >
      <div className='w-full h-full text-slate-800 flex flex-col overflow-hidden'>
        {/* --- 頂部 Header --- */}
        <header className='h-[72px] bg-white/50 backdrop-blur-sm border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-50 shadow-sm'>
          <div className='flex items-center gap-4'>
            <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200'>
              <Factory size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className='text-xl font-black tracking-tight text-slate-800 m-0'>
                生產參數配置
              </h1>
              <p className='text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest'>
                Factory Production Parameters Setup
              </p>
            </div>
          </div>

          <Space size='middle'>
            <Button
              type='primary'
              icon={<Save size={16} />}
              loading={isSaving}
              onClick={handleSave}
              className='font-bold px-6 shadow-md shadow-blue-200 border-none bg-blue-600 hover:bg-blue-500 transition-all h-9 rounded-lg'
            >
              儲存並同步至系統
            </Button>
          </Space>
        </header>

        {/* --- 主內容區塊 --- */}
        <main className='flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar'>
          <div className='max-w-6xl mx-auto flex flex-col gap-6'>
            {/* 上半部：日曆與效率 (兩欄) */}
            <Row gutter={[24, 24]}>
              {/* 1. 工作日曆與班別 */}
              <Col xs={24} lg={10}>
                <Card
                  title={
                    <div className='flex items-center gap-2 text-slate-800'>
                      <CalendarDays size={18} className='text-blue-500' />
                      <span className='font-black text-[15px]'>
                        工作日曆與班別 (Shift Calendar)
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
                  <div className='flex flex-col gap-4'>
                    {/* 早班 */}
                    <div
                      className={cn(
                        'border-2 rounded-xl p-4 flex items-center justify-between transition-colors',
                        shifts.dayShift
                          ? 'border-blue-400 bg-blue-50/50'
                          : 'border-slate-200 bg-white opacity-60'
                      )}
                    >
                      <div className='flex items-center gap-3'>
                        <div
                          className={cn(
                            'p-2 rounded-lg',
                            shifts.dayShift
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-slate-100 text-slate-400'
                          )}
                        >
                          <Sun size={20} />
                        </div>
                        <div className='flex flex-col'>
                          <span className='font-black text-sm text-slate-700'>
                            標準早班 (Day Shift)
                          </span>
                          <span className='text-xs font-bold text-slate-500 font-mono mt-0.5'>
                            08:00 - 17:00 (8H)
                          </span>
                        </div>
                      </div>
                      <Switch
                        checked={shifts.dayShift}
                        onChange={v => setShifts({ ...shifts, dayShift: v })}
                      />
                    </div>

                    {/* 晚班 */}
                    <div
                      className={cn(
                        'border-2 rounded-xl p-4 flex items-center justify-between transition-colors',
                        shifts.nightShift
                          ? 'border-indigo-400 bg-indigo-50/50'
                          : 'border-slate-200 bg-white opacity-60'
                      )}
                    >
                      <div className='flex items-center gap-3'>
                        <div
                          className={cn(
                            'p-2 rounded-lg',
                            shifts.nightShift
                              ? 'bg-indigo-100 text-indigo-600'
                              : 'bg-slate-100 text-slate-400'
                          )}
                        >
                          <Moon size={20} />
                        </div>
                        <div className='flex flex-col'>
                          <span className='font-black text-sm text-slate-700'>
                            星光晚班 (Night Shift)
                          </span>
                          <span className='text-xs font-bold text-slate-500 font-mono mt-0.5'>
                            20:00 - 05:00 (8H)
                          </span>
                        </div>
                      </div>
                      <Switch
                        checked={shifts.nightShift}
                        onChange={v => setShifts({ ...shifts, nightShift: v })}
                      />
                    </div>

                    <Divider className='my-2 border-slate-100' />

                    {/* 週末加班 */}
                    <div className='flex items-center justify-between px-2'>
                      <div className='flex flex-col'>
                        <span className='font-black text-[13px] text-slate-700'>
                          允許週末加班排產
                        </span>
                        <span className='text-[10px] font-bold text-slate-400 mt-0.5'>
                          若產能吃緊，系統自動將任務排入週六日
                        </span>
                      </div>
                      <Switch
                        checked={shifts.weekendOvertime}
                        onChange={v =>
                          setShifts({ ...shifts, weekendOvertime: v })
                        }
                      />
                    </div>
                  </div>
                </Card>
              </Col>

              {/* 2. 設備標準效率 */}
              <Col xs={24} lg={14}>
                <Card
                  title={
                    <div className='flex items-center gap-2 text-slate-800'>
                      <Activity size={18} className='text-emerald-500' />
                      <span className='font-black text-[15px]'>
                        設備標準效率係數 (Machine Efficiency Factor)
                      </span>
                    </div>
                  }
                  extra={
                    <Tag
                      color='success'
                      className='border-none font-bold bg-emerald-50 text-emerald-600'
                    >
                      動態折算標準工時
                    </Tag>
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
                    {efficiencies.map(machine => (
                      <div key={machine.id} className='group'>
                        <div className='flex justify-between items-end mb-1'>
                          <div className='flex items-center gap-2'>
                            <Cpu size={14} className='text-slate-400' />
                            <span className='text-[13px] font-black text-slate-700'>
                              {machine.name}
                            </span>
                          </div>
                          <div className='flex items-baseline gap-1'>
                            <span
                              className={cn(
                                'text-base font-black font-mono',
                                machine.currentEff >= 95
                                  ? 'text-emerald-500'
                                  : machine.currentEff >= 85
                                    ? 'text-blue-500'
                                    : 'text-amber-500'
                              )}
                            >
                              {machine.currentEff}
                            </span>
                            <span className='text-[10px] font-bold text-slate-400'>
                              %
                            </span>
                          </div>
                        </div>
                        <Slider
                          value={machine.currentEff}
                          min={50}
                          max={120}
                          onChange={val => updateEfficiency(machine.id, val)}
                          trackStyle={{
                            backgroundColor:
                              machine.currentEff >= 95
                                ? '#10b981'
                                : machine.currentEff >= 85
                                  ? '#3b82f6'
                                  : '#f59e0b',
                            height: 6
                          }}
                          handleStyle={{
                            borderColor:
                              machine.currentEff >= 95
                                ? '#10b981'
                                : machine.currentEff >= 85
                                  ? '#3b82f6'
                                  : '#f59e0b',
                            width: 14,
                            height: 14,
                            marginTop: -4
                          }}
                          railStyle={{ height: 6, backgroundColor: '#f1f5f9' }}
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* 下半部：換線與緩衝 (兩欄) */}
            <Row gutter={[24, 24]}>
              {/* 3. 動態換線矩陣 */}
              <Col xs={24} lg={14}>
                <Card
                  title={
                    <div className='flex items-center gap-2 text-slate-800'>
                      <ArrowRightLeft size={18} className='text-indigo-500' />
                      <span className='font-black text-[15px]'>
                        動態換線時間規則 (Setup Matrix Rules)
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
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between transition-all hover:border-indigo-300 group'>
                      <div className='flex flex-col'>
                        <span className='text-[13px] font-black text-slate-700 flex items-center gap-1.5'>
                          <TimerReset
                            size={14}
                            className='text-slate-400 group-hover:text-indigo-500 transition-colors'
                          />{' '}
                          基本清機時間
                        </span>
                        <span className='text-[10px] text-slate-500 mt-1 font-medium'>
                          連續生產間的標準檢查作業
                        </span>
                      </div>
                      <InputNumber
                        min={0}
                        max={120}
                        value={setupTimes.baseClear}
                        onChange={v =>
                          setSetupTimes({ ...setupTimes, baseClear: v || 0 })
                        }
                        suffix='分'
                        className='font-bold w-24'
                      />
                    </div>

                    <div className='bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between transition-all hover:border-indigo-300 group'>
                      <div className='flex flex-col'>
                        <span className='text-[13px] font-black text-slate-700 flex items-center gap-1.5'>
                          <Wrench
                            size={14}
                            className='text-slate-400 group-hover:text-indigo-500 transition-colors'
                          />{' '}
                          同模具換色
                        </span>
                        <span className='text-[10px] text-slate-500 mt-1 font-medium'>
                          不拆卸模具，僅更換表面處理塗料
                        </span>
                      </div>
                      <InputNumber
                        min={0}
                        max={120}
                        value={setupTimes.colorChange}
                        onChange={v =>
                          setSetupTimes({ ...setupTimes, colorChange: v || 0 })
                        }
                        suffix='分'
                        className='font-bold w-24'
                      />
                    </div>

                    <div className='bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between transition-all hover:border-indigo-300 group'>
                      <div className='flex flex-col'>
                        <span className='text-[13px] font-black text-slate-700 flex items-center gap-1.5'>
                          <PackageCheck
                            size={14}
                            className='text-slate-400 group-hover:text-indigo-500 transition-colors'
                          />{' '}
                          異模具同料
                        </span>
                        <span className='text-[10px] text-slate-500 mt-1 font-medium'>
                          需重新架設模具與校正參數
                        </span>
                      </div>
                      <InputNumber
                        min={0}
                        max={240}
                        value={setupTimes.toolChange}
                        onChange={v =>
                          setSetupTimes({ ...setupTimes, toolChange: v || 0 })
                        }
                        suffix='分'
                        className='font-bold w-24'
                      />
                    </div>

                    <div className='bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between transition-all hover:border-indigo-300 group'>
                      <div className='flex flex-col'>
                        <span className='text-[13px] font-black text-rose-600 flex items-center gap-1.5'>
                          <PackageOpen
                            size={14}
                            className='text-rose-400 group-hover:text-rose-500 transition-colors'
                          />{' '}
                          異模具異料
                        </span>
                        <span className='text-[10px] text-slate-500 mt-1 font-medium'>
                          全面清機、換模與進料 (大換線)
                        </span>
                      </div>
                      <InputNumber
                        min={0}
                        max={480}
                        value={setupTimes.materialChange}
                        onChange={v =>
                          setSetupTimes({
                            ...setupTimes,
                            materialChange: v || 0
                          })
                        }
                        suffix='分'
                        className='font-bold w-24'
                      />
                    </div>
                  </div>
                </Card>
              </Col>

              {/* 4. 物流與前置時間 */}
              <Col xs={24} lg={10}>
                <Card
                  title={
                    <div className='flex items-center gap-2 text-slate-800'>
                      <Clock size={18} className='text-amber-500' />
                      <span className='font-black text-[15px]'>
                        物流與緩衝前置期 (Buffers & Lead Times)
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
                  <div className='flex flex-col gap-4'>
                    <div className='flex items-center justify-between p-2'>
                      <div className='flex flex-col'>
                        <span className='font-black text-[14px] text-slate-700'>
                          站點間移轉時間 (Transfer Time)
                        </span>
                        <span className='text-[11px] font-bold text-slate-400 mt-0.5'>
                          工單完成一站後，搬運至下一站的預設耗時。
                        </span>
                      </div>
                      <InputNumber
                        min={0}
                        max={24}
                        value={leadTimes.transferTime}
                        onChange={v =>
                          setLeadTimes({ ...leadTimes, transferTime: v || 0 })
                        }
                        addonAfter='小時'
                        className='font-bold w-28'
                      />
                    </div>

                    <Divider className='my-1 border-slate-100' />

                    <div className='flex items-center justify-between p-2'>
                      <div className='flex flex-col'>
                        <span className='font-black text-[14px] text-slate-700'>
                          品質檢驗前置期 (QA Buffer)
                        </span>
                        <span className='text-[11px] font-bold text-slate-400 mt-0.5'>
                          進入品檢站前，需靜置或冷卻的強制等待時間。
                        </span>
                      </div>
                      <InputNumber
                        min={0}
                        max={48}
                        value={leadTimes.qaBuffer}
                        onChange={v =>
                          setLeadTimes({ ...leadTimes, qaBuffer: v || 0 })
                        }
                        addonAfter='小時'
                        className='font-bold w-28'
                      />
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        </main>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #f8fafc; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

          /* 覆蓋 InputNumber 原生樣式，讓它更融入高級 UI */
          .ant-input-number-group-wrapper .ant-input-number-group-addon {
            background-color: #f1f5f9;
            color: #64748b;
            font-weight: 700;
            font-size: 11px;
            border-color: #e2e8f0;
          }
          .ant-input-number {
            border-color: #e2e8f0;
          }
          .ant-input-number:hover, .ant-input-number-focused {
            border-color: #60a5fa !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
          }
        `}</style>
      </div>
    </ConfigProvider>
  )
}
