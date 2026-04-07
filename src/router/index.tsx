import type { RouteObject } from 'react-router-dom'
import { useRoutes } from 'react-router-dom'
import Layout from '@/layout/Layout.tsx'

import DashboardContent from '@/pages/DashboardContent.tsx'

import GanttChart from '@/pages/GanttChart.tsx'
import LoadChart from '@/pages/LoadChart.tsx'

import NotFound from '@/pages/NotFound.tsx'

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardContent /> },
      { path: 'gantt-chart', element: <GanttChart /> },
      { path: 'load-chart', element: <LoadChart /> },
      // { path: 'about', element: <About /> },
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
