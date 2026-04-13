import { Typography, Space } from 'antd'
import { Bot } from 'lucide-react'

import SchedulingTask from './sch_task/SchedulingTask.tsx'
import SchedulingSet from './sch_set/SchedulingSet.tsx'
import SchedulingRes from './sch_res/SchedulingRes.tsx'

const { Title, Paragraph } = Typography

// --- 主元件 ---
export default function App() {
  return (
    <div className='min-h-screen bg-[#fcfdff] animate-fade-in custom-scrollbar overflow-y-auto pb-20'>
      {/* Hero Section */}
      <header className='p-8 lg:px-12 mx-auto'>
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

      {/* 區塊 1: 排程作業 - 執行中心 */}
      <SchedulingTask />

      {/* 區塊 2: 排程設定 - 大腦配置 */}
      <SchedulingSet />

      {/* 區塊 3: 排程結果 - 決策輔助 */}
      <SchedulingRes />

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
