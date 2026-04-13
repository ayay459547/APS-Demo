import { lazy } from 'react'

export const Execution = lazy(() => import('@/pages/execution/Execution.tsx'))

export const Operations = lazy(
  () => import('@/pages/execution/operations/Operations.tsx')
)

export const Monitoring = lazy(
  () => import('@/pages/execution/monitoring/Monitoring.tsx')
)

export const Exception = lazy(
  () => import('@/pages/execution/exception/Exception.tsx')
)
