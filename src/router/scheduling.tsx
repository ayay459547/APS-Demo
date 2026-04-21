import { CalendarDays } from 'lucide-react'

import type { MenuItem } from './constants.tsx'
import {
  Scheduling,
  SchedulingTask,
  SchedulingRun,
  SchedulingGantt,
  SchedulingAI,
  SchedulingSet,
  SchedulingRes
} from './scheduling.lazy.ts'

export const schedulingMenuItem: MenuItem = {
  id: 'scheduling',
  label: '排程管理',
  icon: CalendarDays,
  element: <Scheduling />,
  children: [
    {
      id: 'sch_task',
      label: '排程作業執行',
      element: <SchedulingTask />,
      children: [
        { id: 'sch_run', label: '執行生產排程', element: <SchedulingRun /> },
        {
          id: 'sch_gantt',
          label: '交互式甘特圖',
          element: <SchedulingGantt />
        },
        { id: 'sch_ai', label: 'AI 智能排程', element: <SchedulingAI /> }
      ]
    },
    {
      id: 'sch_set',
      label: '邏輯運算配置',
      element: <SchedulingSet />,
      children: [
        { id: 'sch_rules', label: '排程規則定義' },
        { id: 'sch_params', label: '生產參數配置' }
      ]
    },
    {
      id: 'sch_res',
      label: '排程決斷中心',
      element: <SchedulingRes />,
      children: [
        { id: 'res_list', label: '排程結果分析' },
        { id: 'res_ver', label: '多版本對比' }
      ]
    }
  ]
}
