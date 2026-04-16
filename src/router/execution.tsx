import { AlertTriangle } from 'lucide-react'

import type { MenuItem } from './constants.tsx'
import {
  Execution,
  Operations,
  Reporting,
  Changeover,
  QualityCheck,
  Monitoring,
  MachineStatus,
  WorkOrderProgress,
  WIPFlow,
  MaterialReadiness,
  Exception
} from './execution.lazy.ts'

export const executionMenuItem: MenuItem = {
  id: 'execution',
  label: '現場與異常', // 建議更名為「現場執行與監控」
  icon: AlertTriangle,
  element: <Execution />,
  children: [
    {
      id: 'operations',
      label: '現場作業執法', // 這是資料輸入端 (Input)
      element: <Operations />,
      children: [
        { id: 'reporting', label: '生產報工', element: <Reporting /> },
        { id: 'changeover', label: '換線作業', element: <Changeover /> },
        { id: 'quality_check', label: '首末檢/巡檢', element: <QualityCheck /> }
      ]
    },
    {
      id: 'monitoring',
      label: '現場即時監控', // 這是資料輸出端 (Output)
      element: <Monitoring />,
      children: [
        { id: 'm_status', label: '設備運行狀態', element: <MachineStatus /> },
        { id: 'w_prog', label: '工單達成進度', element: <WorkOrderProgress /> },
        { id: 'wip_flow', label: '在製品(WIP)追蹤', element: <WIPFlow /> },
        {
          id: 'material_readiness',
          label: '齊料即時分析',
          element: <MaterialReadiness />
        }
      ]
    },
    {
      id: 'exception',
      label: '異常調度中心', // 這是決策端 (Action)
      element: <Exception />,
      children: [
        { id: 'delayed', label: '延誤預警中心' },
        { id: 'breakdown', label: '設備故障報修' },
        { id: 'material_shortage', label: '缺料中斷告警' }
      ]
    }
  ]
}
