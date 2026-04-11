import { CalendarDays } from 'lucide-react'
import { lazy } from 'react'

import type { MenuItem } from './constants.tsx'

const Scheduling = lazy(() => import('@/pages/scheduling/Scheduling.tsx'))

export const schedulingMenuItem: MenuItem = {
  id: 'scheduling',
  label: '排程管理',
  icon: CalendarDays,
  element: <Scheduling />,
  children: [
    {
      id: 'sch_task',
      label: '排程作業執行',
      children: [
        { id: 'sch_run', label: '執行生產排程' },
        { id: 'sch_gantt', label: '交互式甘特圖' },
        { id: 'sch_ai', label: 'AI智能排程' }
      ]
    },
    {
      id: 'sch_set',
      label: '邏輯運算配置',
      children: [
        { id: 'rules', label: '排程規則定義' },
        { id: 'params', label: '生產參數配置' }
      ]
    },
    {
      id: 'sch_res',
      label: '排程決斷中心',
      children: [
        { id: 'res_list', label: '排程結果分析' },
        { id: 'res_ver', label: '多版本對比' }
      ]
    }
  ]
}
