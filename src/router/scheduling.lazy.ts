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

/**
 * 排程決斷中心
 */
export const SchedulingRes = lazy(
  () => import('@/pages/scheduling/sch_res/SchedulingRes.tsx')
)
