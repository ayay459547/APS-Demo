import {
  ListTodo,
  Package,
  CalendarDays,
  AreaChart,
  AlertTriangle,
  Settings,
  LayoutDashboard
} from 'lucide-react'
import type { JSX, ComponentType } from 'react'
import { lazy, Suspense } from 'react'
import type { MenuProps } from 'antd'
import { Skeleton } from 'antd'

import DashboardContent from '@/pages/dashboard/DashboardContent.tsx'
import NotFound from '@/pages/NotFound.tsx'

// 訂單與工單 - 訂單管理
const OrderList = lazy(() => import('@/pages/orders/orderList/OrderList'))
const OrderRush = lazy(() => import('@/pages/orders/orderRush/OrderRush'))
const VisualOrderRush = lazy(
  () => import('@/pages/orders/visualOrderRush/VisualOrderRush')
)

// 訂單與工單 - 工單管理
const WorkOrderList = lazy(
  () => import('@/pages/workOrders/workOrderList/WorkOrderList')
)
const WorkOrderSplit = lazy(
  () => import('@/pages/workOrders/workOrderSplit/WorkOrderSplit.tsx')
)
const WorkOrderMerge = lazy(
  () => import('@/pages/workOrders/workOrderMerge/WorkOrderMerge')
)

// 排程分析 - 視覺化
const GanttChart = lazy(
  () => import('@/pages/visualization/ganttChart/GanttChart')
)
const LoadChart = lazy(
  () => import('@/pages/visualization/loadChart/LoadChart')
)

// 排程分析 - 分析
const MachineBottleneck = lazy(
  () => import('@/pages/analysis/machineBottleneck/MachineBottleneck')
)
const MaterialBottleneck = lazy(
  () => import('@/pages/analysis/materialBottleneck/MaterialBottleneck')
)

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
  {
    id: 'orders',
    label: '訂單與工單',
    icon: ListTodo,
    children: [
      {
        id: 'order_manage',
        label: '訂單管理',
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
        children: [
          { id: 'wo_list', label: '工單列表', element: <WorkOrderList /> },
          { id: 'wo_split', label: '工單拆分', element: <WorkOrderSplit /> },
          { id: 'wo_merge', label: '工單合併', element: <WorkOrderMerge /> }
        ]
      },
      {
        id: 'tracking',
        label: '進度追蹤',
        children: [
          { id: 'wo_status', label: '工單狀態' },
          { id: 'wo_progress', label: '生產進度' }
        ]
      }
    ]
  },
  {
    id: 'master_data',
    label: '基礎資料',
    icon: Package,
    children: [
      {
        id: 'product',
        label: '商品',
        children: [
          { id: 'p_list', label: '商品列表' },
          { id: 'p_create', label: '建立商品' }
        ]
      },
      {
        id: 'bom',
        label: 'BOM',
        children: [
          { id: 'bom_struct', label: 'BOM結構' },
          { id: 'bom_ver', label: '版本管理' }
        ]
      },
      {
        id: 'routing',
        label: '製程',
        children: [
          { id: 'r_setup', label: '製程設定' },
          { id: 'r_seq', label: '工序順序' }
        ]
      },
      {
        id: 'machine',
        label: '設備',
        children: [
          { id: 'm_list', label: '設備列表' },
          { id: 'm_cap', label: '產能設定' }
        ]
      },
      {
        id: 'labor',
        label: '人力',
        children: [
          { id: 'l_skill', label: '技能矩陣' },
          { id: 'l_shift', label: '班表設定' }
        ]
      }
    ]
  },
  {
    id: 'scheduling',
    label: '排程管理',
    icon: CalendarDays,
    children: [
      {
        id: 'sch_task',
        label: '排程作業',
        children: [
          { id: 'run', label: '執行排程' },
          { id: 'rerun', label: '重新排程' }
        ]
      },
      {
        id: 'sch_set',
        label: '排程設定',
        children: [
          { id: 'rules', label: '規則設定' },
          { id: 'params', label: '參數設定' }
        ]
      },
      {
        id: 'sch_res',
        label: '排程結果',
        children: [
          { id: 'res_list', label: '結果列表' },
          { id: 'res_ver', label: '排程版本' }
        ]
      }
    ]
  },
  {
    id: 'planning_board',
    label: '排程分析',
    icon: AreaChart,
    children: [
      {
        id: 'visualization',
        label: '視覺化',
        children: [
          { id: 'gantt_chart', label: '甘特圖', element: <GanttChart /> },
          { id: 'load_chart', label: '負載圖', element: <LoadChart /> }
        ]
      },
      {
        id: 'analysis',
        label: '分析',
        children: [
          {
            id: 'machine_bottleneck',
            label: '機台瓶頸分析',
            element: <MachineBottleneck />
          },
          {
            id: 'material_bottleneck',
            label: '物料瓶頸分析',
            element: <MaterialBottleneck />
          }
        ]
      },
      {
        id: 'simulation',
        label: '模擬',
        children: [
          { id: 'whatif', label: '情境模擬' },
          { id: 'compare', label: '方案比較' }
        ]
      }
    ]
  },
  {
    id: 'execution',
    label: '現場與異常',
    icon: AlertTriangle,
    children: [
      {
        id: 'monitoring',
        label: '現場監控',
        children: [
          { id: 'm_status', label: '設備狀態' },
          { id: 'w_prog', label: '工單進度' },
          { id: 'wip', label: '在製品' }
        ]
      },
      {
        id: 'materials',
        label: '物料狀態',
        children: [
          { id: 'inventory', label: '庫存查詢' },
          { id: 'shortage', label: '缺料分析' }
        ]
      },
      {
        id: 'exception',
        label: '異常管理',
        children: [
          { id: 'delayed', label: '延誤訂單' },
          { id: 'breakdown', label: '設備故障' }
        ]
      }
    ]
  },
  {
    id: 'settings',
    label: '系統設定',
    icon: Settings,
    children: [
      {
        id: 'users',
        label: '使用者管理',
        children: [{ id: 'u_list', label: '使用者列表' }]
      },
      {
        id: 'permissions',
        label: '權限管理',
        children: [{ id: 'roles', label: '權限設定' }]
      },
      {
        id: 'sys_set',
        label: '系統設定',
        children: [
          { id: 'sys_params', label: '排程參數' },
          { id: 'integration', label: '系統整合' }
        ]
      }
    ]
  }
]

export type ComponentMapItem = {
  id: string
  label: string
  icon: ComponentType<any> | null
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

  const traverse = (items: MenuItem[]) => {
    items.forEach(item => {
      const hasElement = typeof item.element === 'object'

      // 寫入當前節點到 Map
      map[item.id] = {
        id: item.id,
        label: item.label,
        icon: item.icon || null,
        element: hasElement ? (
          <Suspense
            key={item.id}
            fallback={
              <div className='p-6'>
                <Skeleton />
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
      if (item.children && item.children.length > 0) {
        traverse(item.children)
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
