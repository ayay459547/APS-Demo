import { Typography, Space } from 'antd'
import { Terminal } from 'lucide-react'

import Operations from './operations/Operations.tsx'
import Monitoring from './monitoring/Monitoring.tsx'
import Exception from './exception/Exception.tsx'

const { Title, Paragraph, Text } = Typography

// --- 主元件 ---
export default function App() {
  return (
    <div className='min-h-screen bg-[#f8fafc] animate-fade-in custom-scrollbar overflow-y-auto pb-20'>
      {/* Hero Section */}
      <header className='p-8 lg:px-12 mx-auto'>
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

      {/* 區塊 1: 現場作業執法 - Input */}
      <Operations />

      {/* 區塊 2: 現場即時監控 - Output */}
      <Monitoring />

      {/* 區塊 3: 異常調度中心 - Action */}
      <Exception />

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
