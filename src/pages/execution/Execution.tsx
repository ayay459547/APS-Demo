import React from 'react'
import { Card, Typography, Row, Col, Button, Tag, Space } from 'antd'
import {
  Activity,
  Cpu,
  ClipboardPen,
  Repeat,
  ShieldCheck,
  PackageSearch,
  ClockAlert,
  Hammer,
  ArrowRight,
  Gauge,
  TriangleAlert,
  Terminal
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

const { Title, Paragraph, Text } = Typography

/**
 * 樣式合併工具函數 (Project Standard)
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- 子元件：功能卡片 ---
interface FeatureCardProps {
  id: string
  label: string
  icon: React.ElementType
  description: string
  tag?: string
  tagColor?: string
  isNew?: boolean
  activeColor: 'slate' | 'emerald' | 'amber' | 'rose'
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  label,
  icon: Icon,
  description,
  tag,
  tagColor = 'blue',
  isNew,
  activeColor
}) => {
  const colorMap = {
    slate:
      'group-hover:bg-slate-800 group-hover:text-white group-hover:shadow-slate-200 hover:border-slate-300',
    emerald:
      'group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-emerald-200 hover:border-emerald-300',
    amber:
      'group-hover:bg-amber-500 group-hover:text-white group-hover:shadow-amber-100 hover:border-amber-300',
    rose: 'group-hover:bg-rose-600 group-hover:text-white group-hover:shadow-rose-200 hover:border-rose-300'
  }

  const textHoverMap = {
    slate: 'group-hover:text-slate-800',
    emerald: 'group-hover:text-emerald-600',
    amber: 'group-hover:text-amber-600',
    rose: 'group-hover:text-rose-600'
  }

  return (
    <Card
      hoverable
      className='h-full border border-slate-100 shadow-sm transition-all duration-300 rounded-3xl group relative overflow-hidden bg-white'
      styles={{ body: { padding: '24px' } }}
    >
      {/* 背景大圖示裝飾 */}
      <div className='absolute -bottom-6 -right-6 p-4 opacity-[0.015] group-hover:opacity-[0.05] transition-opacity'>
        <Icon size={120} />
      </div>

      <div className='relative z-10'>
        <div className='flex justify-between items-start mb-6'>
          <div
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md',
              'bg-slate-50 text-slate-500',
              colorMap[activeColor]
            )}
          >
            <Icon size={22} />
          </div>
          {isNew && (
            <div className='bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-rose-100 animate-pulse'>
              關鍵功能
            </div>
          )}
        </div>

        <Title
          level={5}
          className='m-0 mb-2 font-black text-slate-800 tracking-tight flex items-center gap-2'
        >
          {label}
          {tag && (
            <Tag
              color={tagColor}
              className='border-none rounded-md text-[8px] font-bold uppercase px-1.5'
            >
              {tag}
            </Tag>
          )}
        </Title>

        <Paragraph className='text-slate-400 text-[11px] leading-relaxed mb-6 h-9 overflow-hidden line-clamp-2 font-medium'>
          {description}
        </Paragraph>

        <Button
          variant='text'
          className={cn(
            'p-0 flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.15em] transition-all',
            textHoverMap[activeColor]
          )}
        >
          開啟功能 <ArrowRight size={14} />
        </Button>
      </div>
    </Card>
  )
}

// --- 主元件 ---
export default function App() {
  return (
    <div className='min-h-screen bg-[#f8fafc] p-8 lg:p-12 animate-fade-in custom-scrollbar overflow-y-auto'>
      {/* Hero Section */}
      <header className='mx-auto mb-16'>
        <Space orientation='vertical' size={4}>
          <div className='flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg w-fit mb-4 shadow-xl border border-slate-700'>
            <Terminal size={14} className='text-amber-400' />
            <span className='text-[9px] font-black uppercase tracking-[0.25em]'>
              Execution Protocol v8.4
            </span>
          </div>
          <Title className='m-0 font-black text-slate-900 tracking-tighter text-4xl lg:text-5xl'>
            現場執行與異常調度 <span className='text-amber-500'>.</span>
          </Title>
          <Text className='text-slate-400 text-xs font-black uppercase tracking-[0.4em] block mt-2 opacity-60'>
            Execution & Monitoring Center
          </Text>
          <Paragraph className='text-slate-400 text-base max-w-2xl mt-6 font-medium leading-relaxed'>
            APS
            系統的實戰終端。實現從生產報工、資源監控到異常告警的數字化閉環，確保排程計畫在充滿變數的現場環境中精準降落。
          </Paragraph>
        </Space>
      </header>

      <div className='mx-auto space-y-24 pb-20'>
        {/* 區塊 1: 現場作業執法 - Input */}
        <section>
          <div className='flex items-center gap-4 mb-8'>
            <div className='w-1.5 h-6 bg-slate-800 rounded-full' />
            <div>
              <Title
                level={4}
                className='m-0 font-black text-slate-800 tracking-tight'
              >
                現場作業執法
              </Title>
              <Text className='text-slate-300 text-[9px] font-black uppercase tracking-[0.4em]'>
                Operations Input
              </Text>
            </div>
          </div>
          <Row gutter={[20, 20]}>
            <Col xs={24} md={8}>
              <FeatureCard
                id='reporting'
                label='生產報工'
                icon={ClipboardPen}
                description='即時上報完工數量、良品與廢品資訊，確保系統掌握最新產出。'
                tag='Data Entry'
                activeColor='slate'
              />
            </Col>
            <Col xs={24} md={8}>
              <FeatureCard
                id='changeover'
                label='換線作業'
                icon={Repeat}
                description='標準化換線流程引導，統計換模損耗工時，優化排程參數。'
                tag='Setup'
                activeColor='slate'
              />
            </Col>
            <Col xs={24} md={8}>
              <FeatureCard
                id='quality_check'
                label='首末檢 / 巡檢'
                icon={ShieldCheck}
                description='閉環品質抽檢機制，品質異常時自動觸發停機與重排建議。'
                tag='Quality'
                tagColor='emerald'
                activeColor='slate'
                isNew
              />
            </Col>
          </Row>
        </section>

        {/* 區塊 2: 現場即時監控 - Output */}
        <section>
          <div className='flex items-center gap-4 mb-8'>
            <div className='w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]' />
            <div>
              <Title
                level={4}
                className='m-0 font-black text-slate-800 tracking-tight'
              >
                現場即時監控
              </Title>
              <Text className='text-slate-300 text-[9px] font-black uppercase tracking-[0.4em]'>
                Live Monitoring
              </Text>
            </div>
          </div>
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} xl={6}>
              <FeatureCard
                id='m_status'
                label='設備運行狀態'
                icon={Cpu}
                description='透過 PLC 連結即時獲取機台運轉、待機、維修或異常狀態。'
                tag='IoT'
                tagColor='blue'
                activeColor='emerald'
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <FeatureCard
                id='w_prog'
                label='工單達成進度'
                icon={Gauge}
                description='視覺化呈現工單預計完工日與實際進度的偏差值，預警延遲。'
                tag='Progress'
                activeColor='emerald'
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <FeatureCard
                id='wip_flow'
                label='在製品(WIP)追蹤'
                icon={Activity}
                description='全場 WIP 水位監控，識別各工段間的堆積與流動速率瓶頸。'
                tag='Visibility'
                activeColor='emerald'
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <FeatureCard
                id='material_readiness'
                label='齊料即時分析'
                icon={PackageSearch}
                description='結合倉儲數據，即時判斷下一站點之物料供應是否到位。'
                tag='Supply'
                tagColor='orange'
                activeColor='emerald'
              />
            </Col>
          </Row>
        </section>

        {/* 區塊 3: 異常調度中心 - Action */}
        <section>
          <div className='flex items-center gap-4 mb-8'>
            <div className='w-1.5 h-6 bg-rose-600 rounded-full shadow-[0_0_15px_rgba(225,29,72,0.3)]' />
            <div>
              <Title
                level={4}
                className='m-0 font-black text-slate-800 tracking-tight'
              >
                異常調度中心
              </Title>
              <Text className='text-slate-300 text-[9px] font-black uppercase tracking-[0.4em]'>
                Action Center
              </Text>
            </div>
          </div>
          <Row gutter={[20, 20]}>
            <Col xs={24} md={8}>
              <FeatureCard
                id='delayed'
                label='延誤預警中心'
                icon={ClockAlert}
                description='智慧預測訂單延誤風險，自動標識受影響的下游客戶需求。'
                tag='Risk Control'
                tagColor='rose'
                activeColor='rose'
                isNew
              />
            </Col>
            <Col xs={24} md={8}>
              <FeatureCard
                id='breakdown'
                label='設備故障報修'
                icon={Hammer}
                description='一鍵啟動設備報修，自動凍結產能並重新計算受影響排程。'
                tag='Maintenance'
                activeColor='rose'
              />
            </Col>
            <Col xs={24} md={8}>
              <FeatureCard
                id='material_shortage'
                label='缺料中斷告警'
                icon={TriangleAlert}
                description='檢測到斷料風險時，系統自動發出警告並建議調整備案。'
                tag='Alert'
                activeColor='amber'
              />
            </Col>
          </Row>
        </section>
      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .ant-typography { margin-bottom: 0 !important; }
      `}</style>
    </div>
  )
}
