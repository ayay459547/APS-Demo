import React from 'react'
import { Card, Typography, Row, Col, Button, Tag, Space } from 'antd'
import {
  GanttChartSquare,
  BarChart3,
  Zap,
  GitCompare,
  ArrowRight,
  Box,
  LineChart,
  Microscope
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
    {/* 背景大圖示裝飾 - 採用 Blue/Indigo 色系 */}
    <div className='absolute -bottom-6 -right-6 p-4 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity rotate-12 group-hover:rotate-0 duration-700 text-blue-600'>
      <Icon size={140} />
    </div>

    <div className='relative z-10'>
      <div className='flex justify-between items-start mb-6'>
        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg',
            'bg-slate-50 text-slate-600 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-blue-200'
          )}
        >
          <Icon size={24} />
        </div>
        {isNew && (
          <div className='bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse'>
            Analytical
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
        className='p-0 flex items-center gap-2 font-bold text-xs group-hover:gap-3 transition-all text-blue-600'
      >
        查看數據洞察 <ArrowRight size={14} />
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
          <div className='flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full w-fit mb-4 border border-blue-100 shadow-sm'>
            <LineChart size={14} />
            <span className='text-[10px] font-black uppercase tracking-[0.2em]'>
              Diagnostic Intelligence Suite
            </span>
          </div>
          <Title className='m-0 font-black text-slate-900 tracking-tighter text-4xl lg:text-5xl'>
            排程決策與瓶頸分析 <span className='text-blue-600'>.</span>
          </Title>
          <Paragraph className='text-slate-400 text-base max-w-2xl mt-4 font-medium leading-relaxed'>
            超越數據展示，實現決策智慧。透過全方位的視覺化視窗與模擬引擎，識別隱藏的瓶頸點並對比最優排程方案。
          </Paragraph>
        </Space>
      </header>

      <div className='mx-auto space-y-20 pb-20'>
        {/* 區塊 1: 視覺化視窗 - 把排程「看清楚」 */}
        <section>
          <div className='flex items-center gap-4 mb-8'>
            <div className='w-1.5 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]' />
            <div>
              <Title
                level={3}
                className='m-0 font-black text-slate-800 tracking-tight'
              >
                視覺化排程視窗
              </Title>
              <Text className='text-slate-400 text-xs font-bold uppercase tracking-widest'>
                Multi-dimensional View
              </Text>
            </div>
          </div>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <FeatureCard
                id='gantt_chart'
                label='精緻甘特圖'
                icon={GanttChartSquare}
                description='動態追蹤工單與資源的對應關係，支援多維度切換與衝突檢索。'
                tag='Resource Timeline'
                tagColor='blue'
              />
            </Col>
            <Col xs={24} md={12}>
              <FeatureCard
                id='load_chart'
                label='資源負荷圖'
                icon={BarChart3}
                description='即時掌握機台稼動趨勢，識別產能過載與閒置熱區。'
                tag='Capacity Load'
                tagColor='cyan'
              />
            </Col>
          </Row>
        </section>

        {/* 區塊 2: 深度分析 - 找到問題「在那裡」 */}
        <section>
          <div className='flex items-center gap-4 mb-8'>
            <div className='w-1.5 h-8 bg-indigo-500 rounded-full' />
            <div>
              <Title
                level={3}
                className='m-0 font-black text-slate-800 tracking-tight'
              >
                深度瓶頸診斷
              </Title>
              <Text className='text-slate-400 text-xs font-bold uppercase tracking-widest'>
                Bottleneck Diagnostics
              </Text>
            </div>
          </div>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <FeatureCard
                id='machine_bottleneck'
                label='機台瓶頸分析'
                icon={Microscope}
                description='自動偵測產線中的約束資源，量化各機台對交期達成率的影響力。'
                tag='Constraint Mining'
                tagColor='indigo'
                isNew
              />
            </Col>
            <Col xs={24} md={12}>
              <FeatureCard
                id='material_bottleneck'
                label='物料瓶頸分析'
                icon={Box}
                description='整合庫存與欠料預估，找出因缺料而受阻的生產路徑。'
                tag='Supply Risk'
                tagColor='purple'
              />
            </Col>
          </Row>
        </section>

        {/* 區塊 3: 模擬實驗室 - 測試「怎麼做」 */}
        <section>
          <div className='flex items-center gap-4 mb-8'>
            <div className='w-1.5 h-8 bg-slate-900 rounded-full' />
            <div>
              <Title
                level={3}
                className='m-0 font-black text-slate-800 tracking-tight'
              >
                排程模擬實驗室
              </Title>
              <Text className='text-slate-400 text-xs font-bold uppercase tracking-widest'>
                Simulation & Optimization
              </Text>
            </div>
          </div>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <FeatureCard
                id='whatif'
                label='情境模擬 (What-if)'
                icon={Zap}
                description='模擬設備突發故障、訂單取消或產能變動下的系統恢復力測試。'
                tag='Resilience Test'
                tagColor='gold'
              />
            </Col>
            <Col xs={24} md={12}>
              <FeatureCard
                id='compare'
                label='方案優劣對比'
                icon={GitCompare}
                description='多個排程版本並列分析，量化成本、交期與稼動率的最佳平衡。'
                tag='Scenario Comparison'
                tagColor='orange'
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
