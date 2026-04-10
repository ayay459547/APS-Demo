import {
  ListTodo,
  Package,
  CalendarDays,
  AreaChart,
  AlertTriangle,
  Settings
} from 'lucide-react'

// --- 系統選單資料結構 ---
export const MENU_DATA = [
  {
    id: 'orders',
    label: '訂單與工單',
    icon: ListTodo,
    children: [
      {
        id: 'order_manage',
        label: '訂單管理',
        children: [
          { id: 'o_list', label: '訂單列表' },
          { id: 'o_rush', label: '插單管理' },
          { id: 'o_visual_rush', label: '視覺化插單' }
        ]
      },
      {
        id: 'wo_manage',
        label: '工單管理',
        children: [
          { id: 'wo_list', label: '工單列表' },
          { id: 'wo_split', label: '工單拆分' },
          { id: 'wo_merge', label: '工單合併' }
        ]
      },
      {
        id: 'tracking',
        label: '進度追蹤',
        children: [
          { id: 'wo_status', label: '工單狀態' },
          { id: 'wo_progress', label: '生產進度' }
        ]
      }
    ]
  },
  {
    id: 'master_data',
    label: '基礎資料',
    icon: Package,
    children: [
      {
        id: 'product',
        label: '商品',
        children: [
          { id: 'p_list', label: '商品列表' },
          { id: 'p_create', label: '建立商品' }
        ]
      },
      {
        id: 'bom',
        label: 'BOM',
        children: [
          { id: 'bom_struct', label: 'BOM結構' },
          { id: 'bom_ver', label: '版本管理' }
        ]
      },
      {
        id: 'routing',
        label: '製程',
        children: [
          { id: 'r_setup', label: '製程設定' },
          { id: 'r_seq', label: '工序順序' }
        ]
      },
      {
        id: 'machine',
        label: '設備',
        children: [
          { id: 'm_list', label: '設備列表' },
          { id: 'm_cap', label: '產能設定' }
        ]
      },
      {
        id: 'labor',
        label: '人力',
        children: [
          { id: 'l_skill', label: '技能矩陣' },
          { id: 'l_shift', label: '班表設定' }
        ]
      }
    ]
  },
  {
    id: 'scheduling',
    label: '排程管理',
    icon: CalendarDays,
    children: [
      {
        id: 'sch_task',
        label: '排程作業',
        children: [
          { id: 'run', label: '執行排程' },
          { id: 'rerun', label: '重新排程' }
        ]
      },
      {
        id: 'sch_set',
        label: '排程設定',
        children: [
          { id: 'rules', label: '規則設定' },
          { id: 'params', label: '參數設定' }
        ]
      },
      {
        id: 'sch_res',
        label: '排程結果',
        children: [
          { id: 'res_list', label: '結果列表' },
          { id: 'res_ver', label: '排程版本' }
        ]
      }
    ]
  },
  {
    id: 'planning_board',
    label: '排程分析',
    icon: AreaChart,
    children: [
      {
        id: 'visualization',
        label: '視覺化',
        children: [
          { id: 'gantt_chart', label: '甘特圖' },
          { id: 'load_chart', label: '負載圖' }
        ]
      },
      {
        id: 'analysis',
        label: '分析',
        children: [
          { id: 'machine_bottleneck', label: '機台瓶頸分析' },
          { id: 'material_bottleneck', label: '物料瓶頸分析' }
        ]
      },
      {
        id: 'simulation',
        label: '模擬',
        children: [
          { id: 'whatif', label: '情境模擬' },
          { id: 'compare', label: '方案比較' }
        ]
      }
    ]
  },
  {
    id: 'execution',
    label: '現場與異常',
    icon: AlertTriangle,
    children: [
      {
        id: 'monitoring',
        label: '現場監控',
        children: [
          { id: 'm_status', label: '設備狀態' },
          { id: 'w_prog', label: '工單進度' },
          { id: 'wip', label: '在製品' }
        ]
      },
      {
        id: 'materials',
        label: '物料狀態',
        children: [
          { id: 'inventory', label: '庫存查詢' },
          { id: 'shortage', label: '缺料分析' }
        ]
      },
      {
        id: 'exception',
        label: '異常管理',
        children: [
          { id: 'delayed', label: '延誤訂單' },
          { id: 'breakdown', label: '設備故障' }
        ]
      }
    ]
  },
  {
    id: 'settings',
    label: '系統設定',
    icon: Settings,
    children: [
      {
        id: 'users',
        label: '使用者管理',
        children: [{ id: 'u_list', label: '使用者列表' }]
      },
      {
        id: 'permissions',
        label: '權限管理',
        children: [{ id: 'roles', label: '權限設定' }]
      },
      {
        id: 'sys_set',
        label: '系統設定',
        children: [
          { id: 'sys_params', label: '排程參數' },
          { id: 'integration', label: '系統整合' }
        ]
      }
    ]
  }
]
