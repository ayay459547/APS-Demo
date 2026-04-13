import { lazy } from 'react'

export const PlanningAnalysis = lazy(
  () => import('@/pages/planning_analysis/PlanningAnalysis.tsx')
)

/** 視覺化 */
export const Visualization = lazy(
  () => import('@/pages/planning_analysis/visualization/Visualization.tsx')
)
export const GanttChart = lazy(
  () =>
    import('@/pages/planning_analysis/visualization/gantt_chart/GanttChart.tsx')
)
export const LoadChart = lazy(
  () =>
    import('@/pages/planning_analysis/visualization/load_chart/LoadChart.tsx')
)

/** 分析 */
export const Analysis = lazy(
  () => import('@/pages/planning_analysis/analysis/Analysis.tsx')
)
export const MachineBottleneck = lazy(
  () =>
    import('@/pages/planning_analysis/analysis/machine_bottleneck/MachineBottleneck.tsx')
)
export const MaterialBottleneck = lazy(
  () =>
    import('@/pages/planning_analysis/analysis/material_bottleneck/MaterialBottleneck.tsx')
)

/** 模擬實驗室 */
export const Simulation = lazy(
  () => import('@/pages/planning_analysis/simulation/Simulation.tsx')
)
