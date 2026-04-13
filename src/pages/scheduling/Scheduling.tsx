import React from 'react'
import { Card, Typography, Row, Col, Button, Tag, Space } from 'antd'
import {
  Zap,
  GanttChartSquare,
  Settings2,
  ArrowRight,
  Workflow,
  ShieldCheck,
  FileSearch,
  CopyCheck,
  Bot
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

const { Title, Paragraph, Text } = Typography

/**
 * 樣式合併工具函數
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
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  label,
  icon: Icon,
  description,
  tag,
  tagColor = 'blue',
  isNew
}) => (
  <Card
    hoverable
    className='h-full border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-3xl group relative overflow-hidden bg-white'
    styles={{ body: { padding: '28px' } }}
  >
    {/* 背景大圖示裝飾 */}
    <div className='absolute -bottom-4 -right-4 p-4 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity rotate-12 group-hover:rotate-0 duration-700'>
      <Icon size={120} />
    </div>

    <div className='relative z-10'>
      <div className='flex justify-between items-start mb-6'>
        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg',
            'bg-slate-50 text-slate-600 group-hover:bg-violet-600 group-hover:text-white group-hover:shadow-violet-200'
          )}
        >
          <Icon size={24} />
        </div>
        {isNew && (
          <div className='bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse'>
            AI Core
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
            className='border-none rounded-md text-[9px] font-bold uppercase px-1.5'
          >
            {tag}
          </Tag>
        )}
      </Title>

      <Paragraph className='text-slate-400 text-xs leading-relaxed mb-6 h-10 overflow-hidden line-clamp-2'>
        {description}
      </Paragraph>

      <Button
        variant='text'
        color='primary'
        className='p-0 flex items-center gap-2 font-bold text-xs group-hover:gap-3 transition-all text-violet-600'
      >
        開啟工具 <ArrowRight size={14} />
      </Button>
    </div>
  </Card>
)

// --- 主元件 ---
export default function App() {
  return (
    <div className='min-h-screen bg-[#fcfdff] p-8 lg:p-12 animate-fade-in custom-scrollbar overflow-y-auto'>
      {/* Hero Section */}
      <header className='mx-auto mb-16'>
        <Space orientation='vertical' size={4}>
          <div className='flex items-center gap-2 bg-violet-50 text-violet-600 px-3 py-1 rounded-full w-fit mb-4 border border-violet-100 shadow-sm'>
            <Bot size={14} className='fill-violet-600' />
            <span className='text-[10px] font-black uppercase tracking-[0.2em]'>
              Next-Gen Scheduling Engine
            </span>
          </div>
          <Title className='m-0 font-black text-slate-900 tracking-tighter text-4xl lg:text-5xl'>
            生產排程管理中心 <span className='text-violet-600'>.</span>
          </Title>
          <Paragraph className='text-slate-400 text-base max-w-2xl mt-4 font-medium leading-relaxed'>
            APS 系統的運算大腦。基於有限產能限制與多約束條件，提供從 AI
            自動排程到手動甘特圖微調的全方位解決方案。
          </Paragraph>
        </Space>
      </header>

      <div className='mx-auto space-y-20 pb-20'>
        {/* 區塊 1: 排程作業 - 執行中心 */}
        <section>
          <div className='flex items-center gap-4 mb-8'>
            <div className='w-1.5 h-8 bg-violet-600 rounded-full shadow-[0_0_15px_rgba(124,58,237,0.4)]' />
            <div>
              <Title
                level={3}
                className='m-0 font-black text-slate-800 tracking-tight'
              >
                排程作業執行
              </Title>
              <Text className='text-slate-400 text-xs font-bold uppercase tracking-widest'>
                Scheduling Execution
              </Text>
            </div>
          </div>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <FeatureCard
                id='sch_run'
                label='執行生產排產'
                icon={Workflow}
                description='將已下達工單進行初步派工，根據當前產線負荷進行任務指派。'
                tag='Dispatch'
              />
            </Col>
            <Col xs={24} md={8}>
              <FeatureCard
                id='sch_gantt'
                label='交互式甘特圖'
                icon={GanttChartSquare}
                description='全視覺化拖拽操作，即時反映機台佔用與前後工序關聯。'
                tag='Visualization'
              />
            </Col>
            <Col xs={24} md={8}>
              <FeatureCard
                id='sch_ai'
                label='AI 智能排程'
                icon={Zap}
                description='採用啟發式基因演算法，一鍵尋找滿足交期與成本的最優解。'
                tag='Advanced AI'
                tagColor='purple'
                isNew
              />
            </Col>
          </Row>
        </section>

        {/* 區塊 2: 排程設定 - 大腦配置 */}
        <section>
          <div className='flex items-center gap-4 mb-8'>
            <div className='w-1.5 h-8 bg-indigo-500 rounded-full' />
            <div>
              <Title
                level={3}
                className='m-0 font-black text-slate-800 tracking-tight'
              >
                運算邏輯配置
              </Title>
              <Text className='text-slate-400 text-xs font-bold uppercase tracking-widest'>
                Logic & Constraints
              </Text>
            </div>
          </div>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <FeatureCard
                id='rules'
                label='排程規則定義'
                icon={ShieldCheck}
                description='設定交期優先、稼動率優先或換模成本最低等權重規則。'
                tag='Priority Rules'
                tagColor='cyan'
              />
            </Col>
            <Col xs={24} md={12}>
              <FeatureCard
                id='params'
                label='生產參數配置'
                icon={Settings2}
                description='微調緩衝工時、機台切換效率與人力技能等級等核心參數。'
                tag='Configuration'
                tagColor='orange'
              />
            </Col>
          </Row>
        </section>

        {/* 區塊 3: 排程結果 - 決策輔助 */}
        <section>
          <div className='flex items-center gap-4 mb-8'>
            <div className='w-1.5 h-8 bg-emerald-500 rounded-full' />
            <div>
              <Title
                level={3}
                className='m-0 font-black text-slate-800 tracking-tight'
              >
                排程決斷中心
              </Title>
              <Text className='text-slate-400 text-xs font-bold uppercase tracking-widest'>
                Analysis & Decision
              </Text>
            </div>
          </div>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <FeatureCard
                id='res_list'
                label='排程結果分析'
                icon={FileSearch}
                description='量化排程績效，包含交期達成率預估與機台閒置分析報告。'
                tag='Insights'
                tagColor='gold'
              />
            </Col>
            <Col xs={24} md={12}>
              <FeatureCard
                id='res_ver'
                label='多版本對比 (Simulation)'
                icon={CopyCheck}
                description='保存多個排程情境，對比不同策略對產線造成的衝擊與成本變化。'
                tag='Versioning'
                tagColor='blue'
              />
            </Col>
          </Row>
        </section>
      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

        .ant-card { background: white !important; }
      `}</style>
    </div>
  )
}
