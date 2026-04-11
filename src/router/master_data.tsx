import { Package } from 'lucide-react'
import { lazy } from 'react'

import type { MenuItem } from './constants.tsx'

const MasterData = lazy(() => import('@/pages/master_data/MasterData.tsx'))

export const masterDataMenuItem: MenuItem = {
  id: 'master_data',
  label: '基礎資料',
  icon: Package,
  element: <MasterData />,
  children: [
    {
      id: 'md_product',
      label: '產品與物料結構',
      children: [
        { id: 'product_list', label: '商品資料管理' },
        { id: 'bom_struct', label: 'BOM 管理' },
        { id: 'routing_flow', label: '標準製程管理' }
      ]
    },
    {
      id: 'md_resource',
      label: '生產資源建模',
      children: [
        { id: 'machine_center', label: '設備資源管理' },
        { id: 'labor_skill', label: '人力資源管理' }
      ]
    }
  ]
}
