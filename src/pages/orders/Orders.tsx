import { Typography, Space } from 'antd'
import { Sparkles } from 'lucide-react'

import OrderManage from '@/pages/orders/order_manage/OrderManage.tsx'
import WorkOrderManage from '@/pages/orders/wo_manage/WorkOrderManage.tsx'
import ProgressTracking from '@/pages/orders/progress_tracking/ProgressTracking.tsx'

const { Title, Paragraph } = Typography

export default function OrderModuleOverview() {
  return (
    <div className='min-h-screen bg-[#f8fafc] animate-fade-in custom-scrollbar overflow-y-auto mb-20'>
      {/* Hero Section */}
      <header className='p-8 lg:px-12 mx-auto'>
        <Space orientation='vertical' size={4}>
          <div className='flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full w-fit mb-4 border border-indigo-100'>
            <Sparkles size={14} className='fill-indigo-600' />
            <span className='text-[10px] font-black uppercase tracking-[0.2em]'>
              APS Core Engine
            </span>
          </div>
          <Title className='m-0 font-black text-slate-900 tracking-tighter text-4xl lg:text-5xl'>
            訂單與工單管理核心 <span className='text-indigo-600'>.</span>
          </Title>
          <Paragraph className='text-slate-400 text-base max-w-2xl mt-4 font-medium leading-relaxed'>
            整合全球訂單流入、工單拆解與實時生產追蹤。透過智慧演算法進行插單衝擊分析與工單合併優化，確保交期達成率與機台稼動率的最大化。
          </Paragraph>
        </Space>
      </header>

      {/* 區塊 1: 訂單管理 */}
      <OrderManage />

      {/* 區塊 2: 工單管理 */}
      <WorkOrderManage />

      {/* 區塊 3: 進度追蹤 */}
      <ProgressTracking />

      <style>{`
        .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

        /* 針對不同色塊的微調 */
        .ant-typography-h3 { margin-bottom: 0 !important; }
      `}</style>
    </div>
  )
}
