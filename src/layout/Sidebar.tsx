import { useState } from 'react'
import { ChartLine, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useNavigate } from 'react-router-dom'
import { Menu, ConfigProvider } from 'antd'
import type { MenuProps } from 'antd'

import { ANT_MENU_ITEMS } from '@/router/constants'

interface Props {
  activeMenu: string

  sidebarOpen: boolean
  setSidebarOpen: (isOpen: boolean) => void

  mobileMenuOpen: boolean
  setMobileMenuOpen: (isOpen: boolean) => void
}

export default function Sidebar({
  activeMenu,
  sidebarOpen,
  // setSidebarOpen,
  mobileMenuOpen,
  setMobileMenuOpen
}: Props) {
  const navigate = useNavigate()

  // 控制 Ant Design Menu 的展開項目
  const getOpenKeys = (path: string) => {
    const parts = path.split('/')
    const keys: string[] = []
    if (parts.length >= 1) keys.push(parts[0])
    if (parts.length >= 2) keys.push(`${parts[0]}/${parts[1]}`)
    return keys
  }

  const [openKeys, setOpenKeys] = useState<MenuProps['openKeys'] | null>(null)

  const derivedOpenKeys: MenuProps['openKeys'] = getOpenKeys(activeMenu)

  // 處理選單點擊
  const handleMenuClick: MenuProps['onClick'] = e => {
    navigate(e.key === 'dashboard' ? '/' : e.key)

    // 手機版點擊後自動收起
    if (window.innerWidth < 1024) {
      setMobileMenuOpen(false)
    }
  }

  return (
    <aside
      className={clsx(
        'fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 flex flex-col',
        'transition-all duration-300 ease-in-out',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        sidebarOpen ? 'w-64' : 'w-20' // w-20 等於 80px，這正是 Ant Design Menu 收合狀態的預設寬度
      )}
    >
      {/* LOGO 區塊 */}
      <div className='h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0'>
        <div
          className='flex items-center gap-3 overflow-hidden cursor-pointer'
          onClick={() => navigate('/')}
        >
          <div className='w-8 h-8 rounded-lg text-blue-600 bg-blue-50 flex items-center justify-center shrink-0'>
            <ChartLine />
          </div>
          {sidebarOpen && (
            <span className='font-bold text-xl text-blue-700 whitespace-nowrap'>
              APS
              <span className='text-slate-800'>-DEMO</span>
            </span>
          )}
        </div>
        <button
          className='lg:hidden text-slate-400 hover:text-slate-600'
          onClick={() => setMobileMenuOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      {/* 選單列表 */}
      <div className='flex-1 overflow-y-auto py-4 scrollbar-hide'>
        {/* 使用 ConfigProvider 客製化 Ant Design 主題，
          讓它的顏色與圓角貼近原先自定義的 Tailwind Style
        */}
        <ConfigProvider
          theme={{
            components: {
              Menu: {
                itemSelectedBg: '#eff6ff', // Tailwind blue-50
                itemSelectedColor: '#1d4ed8', // Tailwind blue-700
                itemHoverBg: '#f8fafc', // Tailwind slate-50
                itemColor: '#475569', // Tailwind slate-600
                itemBorderRadius: 8,
                subMenuItemBg: '#ffffff',
                itemMarginInline: 12
              }
            }
          }}
        >
          <Menu
            mode='inline'
            inlineCollapsed={!sidebarOpen}
            selectedKeys={[activeMenu]}
            openKeys={
              sidebarOpen
                ? openKeys !== null
                  ? openKeys
                  : derivedOpenKeys
                : []
            }
            onOpenChange={setOpenKeys}
            onClick={handleMenuClick}
            items={ANT_MENU_ITEMS}
          />
        </ConfigProvider>
      </div>

      {/* 底部資訊 */}
      {sidebarOpen && (
        <div className='p-2 border-t border-slate-100 shrink-0'>
          <div className='flex justify-center items-center bg-slate-50 p-2 rounded-xl border border-slate-100'>
            <p className='text-xs text-slate-400 font-medium truncate'>
              Copyright (c) 2026
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}
