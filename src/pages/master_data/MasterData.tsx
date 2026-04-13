import { Typography, Row, Col, Button, Space } from 'antd'
import { Database, ClipboardCheck } from 'lucide-react'

import MDProduct from './md_product/MDProduct.tsx'
import MDResource from './md_resource/MDResource.tsx'

const { Title, Paragraph } = Typography

export default function App() {
  return (
    <div className='min-h-screen bg-[#fcfdff] animate-fade-in custom-scrollbar overflow-y-auto'>
      {/* Hero Section */}
      <header className='p-8 lg:px-12 mx-auto'>
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

      {/* 區塊 1: 產品與結構 - 定義「做什麼」 */}
      <MDProduct />

      {/* 區塊 2: 生產資源 - 定義「用誰做」 */}
      <MDResource />

      {/* 區塊 3: 數據標準與品質 */}
      <div className='p-8 lg:px-12 mb-10'>
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
                <span className='text-emerald-600 font-black underline decoration-emerald-200'>
                  資料品質
                </span>{' '}
                決定排程品質。
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
