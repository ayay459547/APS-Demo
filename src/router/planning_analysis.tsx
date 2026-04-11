import { AreaChart } from 'lucide-react'
import { lazy } from 'react'

import type { MenuItem } from './constants.tsx'

const PlanningAnalysis = lazy(
  () => import('@/pages/planning_analysis/PlanningAnalysis.tsx')
)

/** 視覺化 */
const GanttChart = lazy(
  () => import('@/pages/visualization/ganttChart/GanttChart.tsx')
)
const LoadChart = lazy(
  () => import('@/pages/visualization/loadChart/LoadChart.tsx')
)

/** 分析 */
const MachineBottleneck = lazy(
  () => import('@/pages/analysis/machineBottleneck/MachineBottleneck.tsx')
)
const MaterialBottleneck = lazy(
  () => import('@/pages/analysis/materialBottleneck/MaterialBottleneck.tsx')
)

export const planningAnalysisMenuItem: MenuItem = {
  id: 'planning_analysis',
  label: '排程分析',
  icon: AreaChart,
  element: <PlanningAnalysis />,
  children: [
    {
      id: 'visualization',
      label: '視覺化',
      children: [
        { id: 'gantt_chart', label: '甘特圖', element: <GanttChart /> },
        { id: 'load_chart', label: '負載圖', element: <LoadChart /> }
      ]
    },
    {
      id: 'analysis',
      label: '瓶頸診斷',
      children: [
        {
          id: 'machine_bottleneck',
          label: '機台瓶頸分析',
          element: <MachineBottleneck />
        },
        {
          id: 'material_bottleneck',
          label: '物料瓶頸分析',
          element: <MaterialBottleneck />
        }
      ]
    },
    {
      id: 'simulation',
      label: '模擬實驗室',
      children: [
        { id: 'whatif', label: '情境模擬' },
        { id: 'compare', label: '方案優劣對比' }
      ]
    }
  ]
}
