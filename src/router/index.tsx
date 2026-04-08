import type { RouteObject } from 'react-router-dom'
import { useRoutes } from 'react-router-dom'
import Layout from '@/layout/Layout.tsx'

// 儀錶板
import DashboardContent from '@/pages/dashboard/DashboardContent.tsx'

// 訂單與工單 - 訂單管理
import OrderList from '@/pages/orders/order-list/OrderList.tsx'

// 排程分析 - 視覺化
import GanttChart from '@/pages/visualization/gantt-chart/GanttChart.tsx'
import LoadChart from '@/pages/visualization/load-chart/LoadChart.tsx'

// 排程分析 - 分析
import MachineBottleneck from '@/pages/analysis/machine-bottleneck/MachineBottleneck.tsx'
import MaterialBottleneck from '@/pages/analysis/material-bottleneck/MaterialBottleneck.tsx'

// 功能尚未開發
import NotFound from '@/pages/NotFound.tsx'

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardContent /> },

      { path: 'o_list', element: <OrderList /> },

      { path: 'gantt_chart', element: <GanttChart /> },
      { path: 'load_chart', element: <LoadChart /> },

      { path: 'machine_bottleneck', element: <MachineBottleneck /> },
      { path: 'material_bottleneck', element: <MaterialBottleneck /> },

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
