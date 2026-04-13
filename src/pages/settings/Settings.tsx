import { Typography, Row, Col, Space } from 'antd'
import { Users, ShieldCheck, Lock, Network, ServerCog } from 'lucide-react'

import FeatureCard from '@/components/featureCard/FeatureCard.tsx'
import { COMPONENT_MAP } from '@/router/constants.tsx'

const { Title, Paragraph, Text } = Typography

export default function App() {
  return (
    <div className='min-h-screen bg-[#fcfdff] p-8 lg:p-12 animate-fade-in custom-scrollbar overflow-y-auto'>
      {/* Hero Section */}
      <header className='mx-auto mb-16'>
        <Space orientation='vertical' size={4}>
          <div className='flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg w-fit mb-4 shadow-sm border border-slate-200'>
            <Lock size={14} className='text-indigo-600' />
            <span className='text-[9px] font-black uppercase tracking-[0.25em]'>
              Governance Protocol
            </span>
          </div>
          <Title className='m-0 font-black text-slate-900 tracking-tighter text-4xl lg:text-5xl'>
            {COMPONENT_MAP['settings'].label}{' '}
            <span className='text-indigo-600'>.</span>
          </Title>
          <Text className='text-slate-400 text-xs font-black uppercase tracking-[0.4em] block mt-2 opacity-60'>
            System Administration & Connectivity
          </Text>
          <Paragraph className='text-slate-400 text-base max-w-2xl mt-6 font-medium leading-relaxed'>
            構建安全、穩定且開放的 APS
            數位生態。管理使用者存取權限、定義全域安全規範，並透過標準 API
            實現與企業現有 IT 環境的高效協同。
          </Paragraph>
        </Space>
      </header>

      <div className='mx-auto space-y-20 pb-20'>
        {/* 區塊 1: 帳號與權限 - Governance */}
        <section>
          <div className='flex items-center gap-4 mb-8'>
            <div className='w-1.5 h-6 bg-slate-900 rounded-full' />
            <div>
              <Title
                level={4}
                className='m-0 font-black text-slate-800 tracking-tight'
              >
                存取與身分管理
              </Title>
              <Text className='text-slate-300 text-[9px] font-black uppercase tracking-[0.4em]'>
                Identity & Access
              </Text>
            </div>
          </div>
          <Row gutter={[20, 20]}>
            <Col xs={24} md={12}>
              <FeatureCard
                id='users'
                label={COMPONENT_MAP['users'].label}
                to={COMPONENT_MAP['users'].url}
                icon={Users}
                description='全生命週期帳號管理，支援多租戶、多組織架構下的用戶身分定義。'
                tag='User Lifecycle'
                tagColor='navy'
              />
            </Col>
            <Col xs={24} md={12}>
              <FeatureCard
                id='permissions'
                label={COMPONENT_MAP['permissions'].label}
                to={COMPONENT_MAP['permissions'].url}
                icon={ShieldCheck}
                description='基於角色的存取控制 (RBAC)，精確定義模組、頁面乃至欄位級別的授權。'
                tag='Policy Control'
                tagColor='indigo'
                isNew
              />
            </Col>
          </Row>
        </section>

        {/* 區塊 2: 系統整合 - Connectivity */}
        <section>
          <div className='flex items-center gap-4 mb-8'>
            <div className='w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.2)]' />
            <div>
              <Title
                level={4}
                className='m-0 font-black text-slate-800 tracking-tight'
              >
                系統協同整合
              </Title>
              <Text className='text-slate-300 text-[9px] font-black uppercase tracking-[0.4em]'>
                External Connectivity
              </Text>
            </div>
          </div>
          <Row gutter={[20, 20]}>
            <Col xs={24} md={24}>
              <FeatureCard
                id='integration'
                label={COMPONENT_MAP['integration'].label}
                to={COMPONENT_MAP['integration'].url}
                icon={Network}
                description='標準 API/Webhook 配置中樞，橋接 ERP、MES 與 WMS，實現跨系統的即時數據流動。'
                tag='Connectivity'
                tagColor='blue'
              />
            </Col>
          </Row>
        </section>

        {/* 底部裝飾區塊：系統健康與審計 */}
        <section className='bg-slate-50 p-8 lg:p-12 rounded-[40px] border border-slate-100 relative overflow-hidden group'>
          <div className='absolute top-0 right-0 w-80 h-80 bg-white rounded-full -mr-32 -mt-32 blur-3xl opacity-50' />
          <Row gutter={[48, 48]} align='middle'>
            <Col xs={24} lg={14}>
              <div className='flex items-center gap-3 mb-6'>
                <ServerCog className='text-indigo-600' size={24} />
                <Text className='text-slate-500 font-bold text-xs uppercase tracking-[0.3em]'>
                  System Health Index: 99.9%
                </Text>
              </div>
              <Title
                level={2}
                className='m-0 font-black text-slate-900 tracking-tight leading-tight mb-4 text-3xl'
              >
                安全治理，<span className='text-indigo-600'>架構之魂。</span>
              </Title>
              <Paragraph className='text-slate-400 text-sm leading-relaxed max-w-xl'>
                系統設定模組不只是開關的集合，它是企業排程數據的守門員。透過細粒度的審計日誌與高強度的整合協議，確保每一筆產能調整都具備可追溯性與法律合規性。
              </Paragraph>
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
