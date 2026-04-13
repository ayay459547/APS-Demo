import type { RouteObject } from 'react-router-dom'
import { useRoutes } from 'react-router-dom'

import Layout from '@/layout/Layout.tsx'
import NotFound from '@/pages/NotFound.tsx'

import type { MenuItem } from './constants.tsx'
import { MENU_DATA, COMPONENT_MAP, dashboardMenuItem } from './constants.tsx'

/**
 * 遞迴產生「完全攤平」的 React Router 陣列
 */
function generateRoutes(menu: MenuItem[], parentPath = ''): RouteObject[] {
  return menu.reduce((acc: RouteObject[], item) => {
    // 組合當前的絕對路徑 (例如: "orders" 或 "orders/order_manage")
    const currentPath = parentPath ? `${parentPath}/${item.id}` : item.id

    // 1. 將「當前這個節點」作為一個獨立的 Route 加入陣列
    acc.push({
      path: currentPath,
      // 每個節點都有專屬畫面，從 COMPONENT_MAP 中取得 (若未設定則顯示 NotFound)
      element: COMPONENT_MAP[item.id]?.element
    })

    // 2. 如果有子節點，繼續遞迴，並將子節點的 Route 陣列也攤平塞進來
    if (item.children && item.children.length > 0) {
      acc.push(...generateRoutes(item.children, currentPath))
    }

    return acc
  }, [])
}

const childrenRoutes = generateRoutes(MENU_DATA)

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      // 儀錶板
      { index: true, element: dashboardMenuItem.element },
      // 系統功能
      ...childrenRoutes,
      // 功能尚未開發
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
]

export default function Router() {
  return useRoutes(routes)
}
