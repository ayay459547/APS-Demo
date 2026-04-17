import { AreaChart } from 'lucide-react'

import type { MenuItem } from './constants.tsx'
import {
  PlanningAnalysis,
  Visualization,
  GanttChart,
  LoadChart,
  Analysis,
  MachineBottleneck,
  MaterialBottleneck,
  Simulation,
  WhatIf,
  Compare
} from './planning_analysis.lazy.ts'

export const planningAnalysisMenuItem: MenuItem = {
  id: 'planning_analysis',
  label: '排程分析',
  icon: AreaChart,
  element: <PlanningAnalysis />,
  children: [
    {
      id: 'visualization',
      label: '視覺化',
      element: <Visualization />,
      children: [
        { id: 'gantt_chart', label: '甘特圖', element: <GanttChart /> },
        { id: 'load_chart', label: '負載圖', element: <LoadChart /> }
      ]
    },
    {
      id: 'analysis',
      label: '瓶頸診斷',
      element: <Analysis />,
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
      element: <Simulation />,
      children: [
        { id: 'whatif', label: '情境模擬', element: <WhatIf /> },
        { id: 'compare', label: '方案優劣對比', element: <Compare /> }
      ]
    }
  ]
}
