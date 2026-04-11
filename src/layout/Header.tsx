import { LayoutDashboard, ChevronRight, Menu } from 'lucide-react'
// import { Breadcrumb } from 'antd'

import ProductionBoard from '@/components/productionBoard/ProductionBoard.tsx'
import Announcemen from '@/components/announcemen/Announcemen.tsx'

interface Props {
  setMobileMenuOpen: (isOpen: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (isOpen: boolean) => void
}

const Header: React.FC<Props> = ({
  setMobileMenuOpen,
  sidebarOpen,
  setSidebarOpen
}) => {
  return (
    <header className='h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-30 shrink-0'>
      <div className='flex items-center gap-4'>
        <button
          className='lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100'
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>
        <button
          className='hidden lg:block p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors'
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={20} />
        </button>

        {/* 麵包屑導航 */}
        <div className='hidden sm:flex items-center text-sm font-medium text-slate-500 gap-2'>
          <LayoutDashboard size={16} className='text-blue-500' />
          <ChevronRight size={14} className='text-slate-300' />
          <span>總覽</span>
          <ChevronRight size={14} className='text-slate-300' />
          <span className='text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded-md'>
            系統總覽 / KPI 指標
          </span>
        </div>
      </div>

      <div className='flex items-center gap-4 md:gap-6'>
        {/* 現場看板 */}
        <ProductionBoard />
        {/* 系統公告 */}
        <Announcemen />

        <div className='h-6 w-px bg-slate-200 hidden sm:block'></div>
        <div className='flex items-center gap-3 cursor-pointer group'>
          <div className='text-right hidden sm:block'>
            <p className='text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors'>
              Chen Chan Hsieh
            </p>
            <p className='text-xs text-slate-400 font-medium'>研發部</p>
          </div>
          <img
            src='https://avatars.githubusercontent.com/u/31943807?v=4'
            alt='Avatar'
            className='w-9 h-9 rounded-full border-2 border-white shadow-sm group-hover:border-blue-200 transition-all'
          />
        </div>
      </div>
    </header>
  )
}

export default Header
