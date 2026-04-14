import { lazy } from 'react'

/** 訂單與工單 */
export const Orders = lazy(() => import('@/pages/orders/Orders.tsx'))

/** 訂單管理 */
export const OrderManage = lazy(
  () => import('@/pages/orders/order_manage/OrderManage.tsx')
)

export const OrderList = lazy(
  () => import('@/pages/orders/order_manage/orderList/OrderList.tsx')
)
export const OrderRush = lazy(
  () => import('@/pages/orders/order_manage/orderRush/OrderRush.tsx')
)
export const VisualOrderRush = lazy(
  () =>
    import('@/pages/orders/order_manage/visualOrderRush/VisualOrderRush.tsx')
)

/** 工單管理 */
export const WorkOrderManage = lazy(
  () => import('@/pages/orders/wo_manage/WorkOrderManage.tsx')
)

export const WorkOrderList = lazy(
  () => import('@/pages/orders/wo_manage/workOrderList/WorkOrderList.tsx')
)
export const WorkOrderSplit = lazy(
  () => import('@/pages/orders/wo_manage/workOrderSplit/WorkOrderSplit.tsx')
)
export const WorkOrderMerge = lazy(
  () => import('@/pages/orders/wo_manage/workOrderMerge/WorkOrderMerge.tsx')
)

/** 進度追蹤 */
export const ProgressTracking = lazy(
  () => import('@/pages/orders/progress_tracking/ProgressTracking.tsx')
)

export const WorkOrderStatus = lazy(
  () => import('@/pages/orders/progress_tracking/wo_status/WorkOrderStatus.tsx')
)
export const WorkOrderProgress = lazy(
  () =>
    import('@/pages/orders/progress_tracking/wo_progress/WorkOrderProgress.tsx')
)
