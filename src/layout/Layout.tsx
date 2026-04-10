import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const location = useLocation()

  let activeMenu = location.pathname.replace(/^\//, '')
  if (location.pathname === '/') {
    activeMenu = 'dashboard'
  }

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
          activeMenu={activeMenu}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
        {/* 右側主畫面區 */}
        <main className='flex-1 flex flex-col min-w-0 h-screen overflow-hidden'>
          {/* 頂部導航列 (Header) */}
          <Header
            setMobileMenuOpen={setMobileMenuOpen}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          {/* 內容區塊 */}
          <div className='flex-1 overflow-auto  bg-slate-50/50 relative'>
            <Outlet />
          </div>
        </main>
      </div>
    </>
  )
}
