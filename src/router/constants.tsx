import { LayoutDashboard } from 'lucide-react'
import type { JSX, ComponentType } from 'react'
import { Suspense } from 'react'
import type { MenuProps } from 'antd'
import { Skeleton } from 'antd'

import DashboardContent from '@/pages/dashboard/DashboardContent.tsx'
import NotFound from '@/pages/NotFound.tsx'

import { ordersMenuItem } from './orders.tsx'
import { masterDataMenuItem } from './master_data.tsx'
import { schedulingMenuItem } from './scheduling.tsx'
import { planningAnalysisMenuItem } from './planning_analysis.tsx'
import { executionMenuItem } from './execution.tsx'
import { settingsMenuItem } from './settings.tsx'

export interface MenuItem {
  id: string
  label: string
  icon?: ComponentType<any>
  element?: JSX.Element
  children?: MenuItem[]
}

export const dashboardMenuItem: Required<MenuItem> = {
  id: 'dashboard',
  icon: LayoutDashboard,
  label: '總覽',
  element: <DashboardContent />,
  children: []
}

/**
 * 系統選單資料結構
 */
export const MENU_DATA: MenuItem[] = [
  ordersMenuItem,
  masterDataMenuItem,
  schedulingMenuItem,
  planningAnalysisMenuItem,
  executionMenuItem,
  settingsMenuItem
]

export type ComponentMapItem = {
  id: string
  label: string
  icon: ComponentType<any> | null
  url: string
  element: JSX.Element
}

/**
 * 遞迴函數：將樹狀的 MENU_DATA 轉換為扁平的 Record 對應表
 * 若未設定 element，則預設給予 <NotFound />
 */
const generateComponentMap = (
  menuData: MenuItem[]
): Record<string, ComponentMapItem> => {
  const map: Record<string, ComponentMapItem> = {}

  const traverse = (items: MenuItem[], parentPath = '') => {
    items.forEach(item => {
      const currentPath = parentPath ? `${parentPath}/${item.id}` : item.id

      const hasElement = typeof item.element === 'object'

      // 寫入當前節點到 Map
      map[item.id] = {
        id: item.id,
        label: item.label,
        icon: item.icon || null,
        url: currentPath,
        element: hasElement ? (
          <Suspense
            key={item.id}
            fallback={
              <div className='p-6'>
                <Skeleton active />
              </div>
            }
          >
            {item.element}
          </Suspense>
        ) : (
          <NotFound />
        )
      }

      // 若有子節點，繼續遞迴
      if (Array.isArray(item.children) && item.children.length > 0) {
        traverse(item.children, currentPath)
      }
    })
  }

  traverse(menuData)
  return map
}

// 產生最終的 COMPONENT_MAP
export const COMPONENT_MAP: Record<string, ComponentMapItem> =
  generateComponentMap(MENU_DATA)

// 動態生成 Ant Design 需要的 items 陣列結構
export const ANT_MENU_ITEMS: MenuProps['items'] = [
  {
    key: dashboardMenuItem.id,
    icon: <dashboardMenuItem.icon size={20} />,
    label: dashboardMenuItem.label
  },
  // 將我們自己定義的 MENU_DATA 轉換成 Ant Design 格式
  ...MENU_DATA.map(level1 => {
    // 確保 Icon 作為 React 元件使用時是大寫開頭
    const IconComponent = level1.icon
    return {
      key: level1.id,
      icon: IconComponent ? <IconComponent size={20} /> : undefined,
      label: level1.label,
      children: level1.children?.map(level2 => ({
        key: `${level1.id}/${level2.id}`,
        label: level2.label,
        children: level2.children?.map(level3 => ({
          key: `${level1.id}/${level2.id}/${level3.id}`,
          label: level3.label
        }))
      }))
    }
  })
]
