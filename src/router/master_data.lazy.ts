import { lazy } from 'react'

export const MasterData = lazy(
  () => import('@/pages/master_data/MasterData.tsx')
)

export const MDProduct = lazy(
  () => import('@/pages/master_data/md_product/MDProduct.tsx')
)

export const MDResource = lazy(
  () => import('@/pages/master_data/md_resource/MDResource.tsx')
)
