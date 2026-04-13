import { AlertTriangle } from 'lucide-react'

import type { MenuItem } from './constants.tsx'
import {
  Execution,
  Operations,
  Monitoring,
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
        { id: 'reporting', label: '生產報工' },
        { id: 'changeover', label: '換線作業' },
        { id: 'quality_check', label: '首末檢/巡檢' } // 新增：確保閉環管理
      ]
    },
    {
      id: 'monitoring',
      label: '現場即時監控', // 這是資料輸出端 (Output)
      element: <Monitoring />,
      children: [
        { id: 'm_status', label: '設備運行狀態' },
        { id: 'w_prog', label: '工單達成進度' },
        { id: 'wip_flow', label: '在製品(WIP)追蹤' },
        { id: 'material_readiness', label: '齊料即時分析' } // 將物料整合至此
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
