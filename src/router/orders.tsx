import { ListTodo } from 'lucide-react'

import type { MenuItem } from './constants.tsx'

import {
  Orders,
  OrderManage,
  OrderList,
  OrderRush,
  VisualOrderRush,
  WorkOrderManage,
  WorkOrderList,
  WorkOrderSplit,
  WorkOrderMerge,
  ProgressTracking,
  WorkOrderStatus,
  WorkOrderProgress
} from './orders.lazy.ts'

export const ordersMenuItem: MenuItem = {
  id: 'orders',
  label: '訂單與工單',
  icon: ListTodo,
  element: <Orders />,
  children: [
    {
      id: 'order_manage',
      label: '訂單管理',
      element: <OrderManage />,
      children: [
        { id: 'o_list', label: '訂單列表', element: <OrderList /> },
        { id: 'o_rush', label: '插單管理', element: <OrderRush /> },
        {
          id: 'o_visual_rush',
          label: '視覺化插單',
          element: <VisualOrderRush />
        }
      ]
    },
    {
      id: 'wo_manage',
      label: '工單管理',
      element: <WorkOrderManage />,
      children: [
        { id: 'wo_list', label: '工單列表', element: <WorkOrderList /> },
        { id: 'wo_split', label: '工單拆分', element: <WorkOrderSplit /> },
        { id: 'wo_merge', label: '工單合併', element: <WorkOrderMerge /> }
      ]
    },
    {
      id: 'progress_tracking',
      label: '進度追蹤',
      element: <ProgressTracking />,
      children: [
        { id: 'wo_status', label: '工單狀態', element: <WorkOrderStatus /> },
        { id: 'wo_progress', label: '生產進度', element: <WorkOrderProgress /> }
      ]
    }
  ]
}
