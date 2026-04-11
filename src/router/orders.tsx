import { ListTodo } from 'lucide-react'
import { lazy } from 'react'

import type { MenuItem } from './constants.tsx'

const Orders = lazy(() => import('@/pages/orders/Orders.tsx'))

/** 訂單管理 */
const OrderManage = lazy(
  () => import('@/pages/orders/order_manage/OrderManage.tsx')
)
const OrderList = lazy(
  () => import('@/pages/orders/order_manage/orderList/OrderList.tsx')
)
const OrderRush = lazy(
  () => import('@/pages/orders/order_manage/orderRush/OrderRush.tsx')
)
const VisualOrderRush = lazy(
  () =>
    import('@/pages/orders/order_manage/visualOrderRush/VisualOrderRush.tsx')
)

/** 工單管理 */
const WorkOrderManage = lazy(
  () => import('@/pages/orders/wo_manage/WorkOrderManage.tsx')
)
const WorkOrderList = lazy(
  () => import('@/pages/orders/wo_manage/workOrderList/WorkOrderList.tsx')
)
const WorkOrderSplit = lazy(
  () => import('@/pages/orders/wo_manage/workOrderSplit/WorkOrderSplit.tsx')
)
const WorkOrderMerge = lazy(
  () => import('@/pages/orders/wo_manage/workOrderMerge/WorkOrderMerge.tsx')
)

/** 進度追蹤 */
const ProgressTracking = lazy(
  () => import('@/pages/orders/progress_tracking/ProgressTracking.tsx')
)

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
        { id: 'wo_status', label: '工單狀態' },
        { id: 'wo_progress', label: '生產進度' }
      ]
    }
  ]
}
