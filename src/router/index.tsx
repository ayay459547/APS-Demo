import type { RouteObject } from 'react-router-dom'
import { useRoutes } from 'react-router-dom'

import Layout from '@/layout/Layout.tsx'
import NotFound from '@/pages/NotFound.tsx'

import type { MenuItem } from './constants.tsx'
import { MENU_DATA, COMPONENT_MAP, dashboardMenuItem } from './constants.tsx'

function generateRoutes(menu: MenuItem[], parentPath = ''): RouteObject[] {
  return menu.flatMap(item => {
    const currentPath = `${parentPath}/${item.id}`

    // 有 children → 繼續遞迴
    if (item.children) {
      return generateRoutes(item.children, currentPath)
    }

    // 沒 children → leaf node
    return [
      {
        path: currentPath,
        element: COMPONENT_MAP[item.id].element
      }
    ]
  })
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
