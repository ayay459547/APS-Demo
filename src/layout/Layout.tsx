import { useState } from 'react'
import {
  LayoutDashboard,
  Bell,
  MonitorPlay,
  ChevronRight,
  Menu
} from 'lucide-react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Badge, Modal } from 'antd'

import ProductionBoardHeader from '@/components/productionBoard/ProductionBoardHeader.tsx'
import ProductionBoard from '@/components/productionBoard/ProductionBoard.tsx'
import ProductionBoardFooter from '@/components/productionBoard/ProductionBoardFooter.tsx'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [activeMenu, setActiveMenu] = useState('dashboard-overview-kpi')

  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className='min-h-screen bg-slate-50/50 flex font-sans text-slate-800'>
        {/* 行動版側邊欄遮罩 */}
        {mobileMenuOpen && (
          <div
            className='fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity'
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        {/* 側邊導航欄 (Sidebar) */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
        />
        {/* 右側主畫面區 */}
        <main className='flex-1 flex flex-col min-w-0 h-screen overflow-hidden'>
          {/* 頂部導航列 (Header) */}
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
              <div
                className='relative cursor-pointer'
                onClick={() => setIsModalOpen(true)}
              >
                <Badge dot status='processing'>
                  <MonitorPlay
                    size={20}
                    className='text-slate-500 hover:text-blue-600 transition-colors'
                  />
                </Badge>
              </div>
              <div className='relative cursor-pointer'>
                <Badge dot>
                  <Bell
                    size={20}
                    className='text-slate-500 hover:text-blue-600 transition-colors'
                  />
                </Badge>
              </div>
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

          {/* 內容區塊 */}
          <div className='flex-1 overflow-auto  bg-slate-50/50 relative'>
            <Outlet />
          </div>
        </main>
      </div>

      <Modal
        open={isModalOpen}
        closable
        style={{
          width: '100%',
          top: 0,
          left: 0,
          margin: 0
        }}
        styles={{
          wrapper: {
            width: '100dvw',
            height: '100dvh'
          },
          container: {
            width: '100dvw',
            height: '100dvh',
            overflow: 'hidden',
            borderRadius: 0
          },
          body: {
            width: '100%',
            height: 'calc(100% - 100px)'
          }
        }}
        title={<ProductionBoardHeader />}
        footer={<ProductionBoardFooter />}
        onCancel={() => setIsModalOpen(false)}
      >
        <ProductionBoard />
      </Modal>
    </>
  )
}
