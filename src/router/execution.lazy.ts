import { lazy } from 'react'

export const Execution = lazy(() => import('@/pages/execution/Execution.tsx'))

/**
 * 現場作業執法
 */
export const Operations = lazy(
  () => import('@/pages/execution/operations/Operations.tsx')
)

export const Reporting = lazy(
  () => import('@/pages/execution/operations/reporting/Reporting.tsx')
)
export const Changeover = lazy(
  () => import('@/pages/execution/operations/changeover/Changeover.tsx')
)
export const QualityCheck = lazy(
  () => import('@/pages/execution/operations/quality_check/QualityCheck.tsx')
)

/**
 * 現場即時監控
 */
export const Monitoring = lazy(
  () => import('@/pages/execution/monitoring/Monitoring.tsx')
)
export const MachineStatus = lazy(
  () => import('@/pages/execution/monitoring/m_status/ＭachineStatus.tsx')
)
export const WorkOrderProgress = lazy(
  () => import('@/pages/execution/monitoring/w_prog/WorkOrderProgress.tsx')
)
export const WIPFlow = lazy(
  () => import('@/pages/execution/monitoring/wip_flow/WIPFlow.tsx')
)
export const MaterialReadiness = lazy(
  () =>
    import('@/pages/execution/monitoring/material_readiness/MaterialReadiness.tsx')
)

/**
 * 異常調度中心
 */
export const Exception = lazy(
  () => import('@/pages/execution/exception/Exception.tsx')
)

export const Delayed = lazy(
  () => import('@/pages/execution/exception/delayed/Delayed.tsx')
)
export const Breakdown = lazy(
  () => import('@/pages/execution/exception/breakdown/Breakdown.tsx')
)
export const MaterialShortage = lazy(
  () =>
    import('@/pages/execution/exception/material_shortage/MaterialShortage.tsx')
)
