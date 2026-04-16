import { lazy } from 'react'

export const MasterData = lazy(
  () => import('@/pages/master_data/MasterData.tsx')
)

/** 產品與物料結構 */
export const MDProduct = lazy(
  () => import('@/pages/master_data/md_product/MDProduct.tsx')
)
export const ProductList = lazy(
  () => import('@/pages/master_data/md_product/product_list/ProductList.tsx')
)
export const BOMStruct = lazy(
  () => import('@/pages/master_data/md_product/bom_struct/BOMStruct.tsx')
)
export const RoutingFlow = lazy(
  () => import('@/pages/master_data/md_product/routing_flow/RoutingFlow.tsx')
)

/** 生產資源建模 */
export const MDResource = lazy(
  () => import('@/pages/master_data/md_resource/MDResource.tsx')
)
export const MachineCenter = lazy(
  () =>
    import('@/pages/master_data/md_resource/machine_center/MachineCenter.tsx')
)
export const LaborSkill = lazy(
  () => import('@/pages/master_data/md_resource/labor_skill/LaborSkill.tsx')
)
