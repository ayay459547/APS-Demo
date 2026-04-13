import React from 'react'
import { Card, Typography, Row, Col, Button, Tag, Space } from 'antd'
import {
  Box,
  GitMerge,
  Route,
  Cpu,
  Users,
  Database,
  ArrowRight,
  ClipboardCheck
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
    {/* 背景大圖示裝飾 - 採用 Teal 色系 */}
    <div className='absolute -bottom-6 -right-6 p-4 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity rotate-12 group-hover:rotate-0 duration-700 text-emerald-600'>
      <Icon size={140} />
    </div>

    <div className='relative z-10'>
      <div className='flex justify-between items-start mb-6'>
        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg',
            'bg-slate-50 text-slate-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-emerald-200'
          )}
        >
          <Icon size={24} />
        </div>
        {isNew && (
          <div className='bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest'>
            Core Data
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
        className='p-0 flex items-center gap-2 font-bold text-xs group-hover:gap-3 transition-all text-emerald-600'
      >
        管理資料庫 <ArrowRight size={14} />
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
          <div className='flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full w-fit mb-4 border border-emerald-100 shadow-sm'>
            <Database size={14} className='fill-emerald-600' />
            <span className='text-[10px] font-black uppercase tracking-[0.2em]'>
              Foundation System Architecture
            </span>
          </div>
          <Title className='m-0 font-black text-slate-900 tracking-tighter text-4xl lg:text-5xl'>
            生產建模基礎資料 <span className='text-emerald-600'>.</span>
          </Title>
          <Paragraph className='text-slate-400 text-base max-w-2xl mt-4 font-medium leading-relaxed'>
            構建工廠的數位孿生模型。精確定義產品結構、工藝路徑與資源能力，為 AI
            排程引擎提供高質量的原始數據支撐。
          </Paragraph>
        </Space>
      </header>

      <div className='mx-auto space-y-20 pb-20'>
        {/* 區塊 1: 產品與結構 - 定義「做什麼」 */}
        <section>
          <div className='flex items-center gap-4 mb-8'>
            <div className='w-1.5 h-8 bg-emerald-600 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]' />
            <div>
              <Title
                level={3}
                className='m-0 font-black text-slate-800 tracking-tight'
              >
                產品與物料結構
              </Title>
              <Text className='text-slate-400 text-xs font-bold uppercase tracking-widest'>
                Product Intelligence
              </Text>
            </div>
          </div>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <FeatureCard
                id='product_list'
                label='商品資料管理'
                icon={Box}
                description='定義成品、半成品與原料屬性，包含生產前置時間與標準批量設定。'
                tag='SKU Definition'
              />
            </Col>
            <Col xs={24} md={8}>
              <FeatureCard
                id='bom_struct'
                label='BOM 物料清單'
                icon={GitMerge}
                description='多階層 BOM 架構管理，支援版本控管與替代料件邏輯設定。'
                tag='Structured Data'
                tagColor='emerald'
                isNew
              />
            </Col>
            <Col xs={24} md={8}>
              <FeatureCard
                id='routing'
                label='標準製程管理'
                icon={Route}
                description='定義標準工序流（Routing），精確配置每一站點的標準工時（Standard Time）。'
                tag='Process Flow'
                tagColor='teal'
              />
            </Col>
          </Row>
        </section>

        {/* 區塊 2: 生產資源 - 定義「用誰做」 */}
        <section>
          <div className='flex items-center gap-4 mb-8'>
            <div className='w-1.5 h-8 bg-slate-700 rounded-full' />
            <div>
              <Title
                level={3}
                className='m-0 font-black text-slate-800 tracking-tight'
              >
                生產資源建模
              </Title>
              <Text className='text-slate-400 text-xs font-bold uppercase tracking-widest'>
                Resource Capacity
              </Text>
            </div>
          </div>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <FeatureCard
                id='machine'
                label='設備資源管理'
                icon={Cpu}
                description='機台有限產能參數設定，包含換模換線損失、保養日曆與機台群組定義。'
                tag='Finite Capacity'
                tagColor='orange'
              />
            </Col>
            <Col xs={24} md={12}>
              <FeatureCard
                id='labor'
                label='人力資源管理'
                icon={Users}
                description='班別配置與技能矩陣（Skill Matrix）管理，將人力作為排程的約束條件。'
                tag='Human Capital'
                tagColor='indigo'
              />
            </Col>
          </Row>
        </section>

        {/* 區塊 3: 數據標準與品質 */}
        <section className='bg-emerald-50/30 p-10 rounded-[40px] border border-emerald-100'>
          <Row gutter={[48, 48]} align='middle'>
            <Col xs={24} lg={10}>
              <div className='relative'>
                <div className='bg-white p-8 rounded-4xl shadow-xl relative z-10 border border-emerald-50'>
                  <Title
                    level={4}
                    className='font-black text-slate-800 mb-6 flex items-center gap-2'
                  >
                    <ClipboardCheck className='text-emerald-600' />
                    數據健康度分析
                  </Title>
                  <div className='space-y-6'>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs font-bold text-slate-500 uppercase tracking-widest'>
                        BOM 完整性
                      </span>
                      <span className='text-sm font-black text-emerald-600'>
                        99.8%
                      </span>
                    </div>
                    <div className='h-2 bg-slate-100 rounded-full overflow-hidden'>
                      <div className='h-full bg-emerald-500 w-[99.8%]' />
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs font-bold text-slate-500 uppercase tracking-widest'>
                        工時數據準確率
                      </span>
                      <span className='text-sm font-black text-blue-600'>
                        94.2%
                      </span>
                    </div>
                    <div className='h-2 bg-slate-100 rounded-full overflow-hidden'>
                      <div className='h-full bg-blue-500 w-[94.2%]' />
                    </div>
                  </div>
                </div>
                {/* 裝飾背景 */}
                <div className='absolute -top-4 -right-4 w-full h-full bg-emerald-100/50 rounded-4xl z-0' />
              </div>
            </Col>
            <Col xs={24} lg={14}>
              <Title
                level={2}
                className='font-black text-slate-900 tracking-tight mb-6'
              >
                垃圾進，垃圾出。
                <br />
                <span className='text-emerald-600 font-black underline decoration-emerald-200'>
                  數據品質
                </span>{' '}
                是排程的關鍵。
              </Title>
              <Paragraph className='text-slate-500 text-sm leading-relaxed mb-8'>
                基礎資料模組不只是存儲中心，更是生產規則的審核器。系統會自動偵測
                BOM 的循環引用、工時的極端離群值以及無效的資源配置，確保進入 AI
                引擎的每一條數據都符合製造實務。
              </Paragraph>
              <div className='flex flex-wrap gap-4'>
                <Button
                  variant='solid'
                  color='primary'
                  className='rounded-xl bg-emerald-600 h-10 px-6 font-bold border-none shadow-lg shadow-emerald-100'
                >
                  開始數據審核
                </Button>
                <Button
                  variant='outlined'
                  color='default'
                  className='rounded-xl h-10 px-6 font-bold border-slate-200'
                >
                  匯入 ERP 資料
                </Button>
              </div>
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
