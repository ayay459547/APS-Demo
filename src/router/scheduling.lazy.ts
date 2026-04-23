import { lazy } from 'react'

export const Scheduling = lazy(
  () => import('@/pages/scheduling/Scheduling.tsx')
)

/**
 * 排程作業執行
 */
export const SchedulingTask = lazy(
  () => import('@/pages/scheduling/sch_task/SchedulingTask.tsx')
)

export const SchedulingRun = lazy(
  () => import('@/pages/scheduling/sch_task/sch_run/SchedulingRun.tsx')
)
export const SchedulingGantt = lazy(
  () => import('@/pages/scheduling/sch_task/sch_gantt/SchedulingGantt.tsx')
)
export const SchedulingAI = lazy(
  () => import('@/pages/scheduling/sch_task/sch_ai/SchedulingAI.tsx')
)

/**
 * 邏輯運算配置
 */
export const SchedulingSet = lazy(
  () => import('@/pages/scheduling/sch_set/SchedulingSet.tsx')
)

export const SchedulingRules = lazy(
  () => import('@/pages/scheduling/sch_set/sch_rules/SchedulingRules.tsx')
)
export const SchedulingParams = lazy(
  () => import('@/pages/scheduling/sch_set/sch_params/SchedulingParams.tsx')
)

/**
 * 排程決斷中心
 */
export const SchedulingRes = lazy(
  () => import('@/pages/scheduling/sch_res/SchedulingRes.tsx')
)

export const ResAnalysis = lazy(
  () => import('@/pages/scheduling/sch_res/res_analysis/ResAnalysis.tsx')
)
export const ResHistory = lazy(
  () => import('@/pages/scheduling/sch_res/res_history/ResHistory.tsx')
)
