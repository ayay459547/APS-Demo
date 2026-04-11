import { ChevronRight, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { BreadcrumbProps } from 'antd'
import { Breadcrumb } from 'antd'

import ProductionBoard from '@/components/productionBoard/ProductionBoard.tsx'
import Announcemen from '@/components/announcemen/Announcemen.tsx'
import { COMPONENT_MAP, dashboardMenuItem } from '@/router/constants.tsx'

interface Props {
  activeMenu: string

  setMobileMenuOpen: (isOpen: boolean) => void

  sidebarOpen: boolean
  setSidebarOpen: (isOpen: boolean) => void
}

const Header: React.FC<Props> = ({
  activeMenu,
  setMobileMenuOpen,
  sidebarOpen,
  setSidebarOpen
}) => {
  const getBreadcrumbItems = (path: string): BreadcrumbProps['items'] => {
    const parts = path.split('/')
    const items: BreadcrumbProps['items'] = []
    // 首頁
    if (parts.length === 0) {
      return [
        {
          title: <dashboardMenuItem.icon />
        },
        {
          title: dashboardMenuItem.label
        }
      ]
    }
    // 系統功能
    const level1Item = COMPONENT_MAP[parts[0]]
    const level2Item = COMPONENT_MAP[parts[1]]
    const level3Item = COMPONENT_MAP[parts[2]]
    if (typeof level1Item === 'object') {
      const linkTo = `/${level1Item.id}`

      items.push({
        title: <Link to={linkTo}>{level1Item.label}</Link>
      })
    }
    if (typeof level2Item === 'object') {
      const linkTo = `/${level1Item.id}/${level2Item.id}`
      items.push({
        title: <Link to={linkTo}>{level2Item.label}</Link>
      })
    }
    if (typeof level3Item === 'object') {
      const linkTo = `/${level1Item.id}/${level2Item.id}/${level3Item.id}`
      items.push({
        title: <Link to={linkTo}>{level3Item.label}</Link>
      })
    }
    return items
  }

  const breadcrumbItems: BreadcrumbProps['items'] =
    getBreadcrumbItems(activeMenu)

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
        <Breadcrumb
          items={breadcrumbItems}
          separator={<ChevronRight size={'1rem'} className='mt-0.5' />}
          className='hidden sm:block'
        />
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
