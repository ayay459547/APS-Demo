import type { RouteObject } from 'react-router-dom'
import { useRoutes } from 'react-router-dom'
import Layout from '@/layout/Layout.tsx'

// 儀錶板
import DashboardContent from '@/pages/dashboard/DashboardContent.tsx'

// 訂單與工單 - 訂單管理
import OrderList from '@/pages/orders/orderList/OrderList'
import OrderRush from '@/pages/orders/orderRush/OrderRush'
import VisualOrderRush from '@/pages/orders/visualOrderRush/VisualOrderRush'

// 訂單與工單 - 工單管理
import WorkOrderList from '@/pages/workOrders/workOrderList/WorkOrderList'
import WorkOrderSplit from '@/pages/workOrders/workOrderSplit/WorkOrderSplit.tsx'
import WorkOrderMerge from '@/pages/workOrders/workOrderMerge/WorkOrderMerge'

// 排程分析 - 視覺化
import GanttChart from '@/pages/visualization/ganttChart/GanttChart'
import LoadChart from '@/pages/visualization/loadChart/LoadChart'

// 排程分析 - 分析
import MachineBottleneck from '@/pages/analysis/machineBottleneck/MachineBottleneck'
import MaterialBottleneck from '@/pages/analysis/materialBottleneck/MaterialBottleneck'

// 功能尚未開發
import NotFound from '@/pages/NotFound.tsx'

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardContent /> },

      { path: '/orders/order_manage/o_list', element: <OrderList /> },
      { path: '/orders/order_manage/o_rush', element: <OrderRush /> },
      {
        path: '/orders/order_manage/o_visual_rush',
        element: <VisualOrderRush />
      },

      { path: 'wo_list', element: <WorkOrderList /> },
      { path: 'wo_split', element: <WorkOrderSplit /> },
      { path: 'wo_merge', element: <WorkOrderMerge /> },

      {
        path: '/planning_board/visualization/gantt_chart',
        element: <GanttChart />
      },
      {
        path: '/planning_board/visualization/load_chart',
        element: <LoadChart />
      },

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
