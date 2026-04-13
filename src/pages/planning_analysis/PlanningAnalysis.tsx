import { Typography, Space } from 'antd'
import { LineChart } from 'lucide-react'

import Visualization from './visualization/Visualization.tsx'
import Analysis from './analysis/Analysis.tsx'
import Simulation from './simulation/Simulation.tsx'

const { Title, Paragraph } = Typography

export default function PlanningAnalysis() {
  return (
    <div className='min-h-screen bg-[#fcfdff] animate-fade-in custom-scrollbar overflow-y-auto pb-20'>
      {/* Hero Section */}
      <header className='p-8 lg:px-12 mx-auto'>
        <Space orientation='vertical' size={4}>
          <div className='flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full w-fit mb-4 border border-blue-100 shadow-sm'>
            <LineChart size={14} />
            <p className='text-[10px] font-black uppercase tracking-[0.2em]'>
              Diagnostic Intelligence Suite
            </p>
          </div>
          <Title className='m-0 font-black text-slate-900 tracking-tighter text-4xl lg:text-5xl'>
            排程決策與瓶頸分析 <span className='text-blue-600'>.</span>
          </Title>
          <Paragraph className='text-slate-400 text-base max-w-2xl mt-4 font-medium leading-relaxed'>
            超越數據展示，實現決策智慧。透過全方位的視覺化視窗與模擬引擎，識別隱藏的瓶頸點並對比最優排程方案。
          </Paragraph>
        </Space>
      </header>

      {/* 區塊 1: 視覺化視窗 - 把排程「看清楚」 */}
      <Visualization />

      {/* 區塊 2: 深度分析 - 找到問題「在那裡」 */}
      <Analysis />

      {/* 區塊 3: 模擬實驗室 - 測試「怎麼做」 */}
      <Simulation />

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
