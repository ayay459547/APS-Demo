import { lazy } from 'react'

export const Scheduling = lazy(
  () => import('@/pages/scheduling/Scheduling.tsx')
)

export const SchedulingTask = lazy(
  () => import('@/pages/scheduling/sch_task/SchedulingTask.tsx')
)
export const SchedulingSet = lazy(
  () => import('@/pages/scheduling/sch_set/SchedulingSet.tsx')
)
export const SchedulingRes = lazy(
  () => import('@/pages/scheduling/sch_res/SchedulingRes.tsx')
)
