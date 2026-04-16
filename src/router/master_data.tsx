import { Package } from 'lucide-react'

import type { MenuItem } from './constants.tsx'
import {
  MasterData,
  MDProduct,
  ProductList,
  BOMStruct,
  RoutingFlow,
  MDResource,
  MachineCenter,
  LaborSkill
} from './master_data.lazy.ts'

export const masterDataMenuItem: MenuItem = {
  id: 'master_data',
  label: '基礎資料',
  icon: Package,
  element: <MasterData />,
  children: [
    {
      id: 'md_product',
      label: '產品與物料結構',
      element: <MDProduct />,
      children: [
        { id: 'product_list', label: '商品資料管理', element: <ProductList /> },
        { id: 'bom_struct', label: 'BOM 管理', element: <BOMStruct /> },
        { id: 'routing_flow', label: '標準製程管理', element: <RoutingFlow /> }
      ]
    },
    {
      id: 'md_resource',
      label: '生產資源建模',
      element: <MDResource />,
      children: [
        {
          id: 'machine_center',
          label: '設備資源管理',
          element: <MachineCenter />
        },
        { id: 'labor_skill', label: '人力資源管理', element: <LaborSkill /> }
      ]
    }
  ]
}
