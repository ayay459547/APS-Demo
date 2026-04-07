import { useState } from 'react'
import {
  LayoutDashboard,
  ChartLine,
  ListTodo,
  Package,
  CalendarDays,
  AreaChart,
  AlertTriangle,
  Settings,
  X
} from 'lucide-react'
import { clsx } from 'clsx'
import { useNavigate } from 'react-router-dom'
import { Menu, ConfigProvider } from 'antd'
import type { MenuProps } from 'antd'

// --- 系統選單資料結構 ---
const menuData = [
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
          { id: 'o_create', label: '建立訂單' },
          { id: 'o_detail', label: '訂單明細' }
        ]
      },
      {
        id: 'wo_manage',
        label: '工單管理',
        children: [
          { id: 'wo_list', label: '工單列表' },
          { id: 'wo_create', label: '建立工單' },
          { id: 'wo_detail', label: '工單明細' }
        ]
      },
      {
        id: 'control',
        label: '訂單控制',
        children: [
          { id: 'priority', label: '優先級設定' },
          { id: 'rush', label: '插單管理' }
        ]
      },
      {
        id: 'adjustment',
        label: '工單調整',
        children: [
          { id: 'split', label: '工單拆分' },
          { id: 'merge', label: '工單合併' }
        ]
      },
      {
        id: 'tracking',
        label: '進度追蹤',
        children: [
          { id: 'status', label: '工單狀態' },
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
        id: 'viz',
        label: '視覺化',
        children: [
          { id: 'gantt-chart', label: '甘特圖' },
          { id: 'load-chart', label: '負載圖' }
        ]
      },
      {
        id: 'analysis',
        label: '分析',
        children: [{ id: 'bottleneck', label: '瓶頸分析' }]
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

type MenuItem = Required<MenuProps>['items'][number]

interface Props {
  sidebarOpen: boolean
  setSidebarOpen: (isOpen: boolean) => void

  mobileMenuOpen: boolean
  setMobileMenuOpen: (isOpen: boolean) => void

  activeMenu: string
  setActiveMenu: (menu: string) => void
}

export default function Sidebar({
  sidebarOpen,
  // setSidebarOpen,
  mobileMenuOpen,
  setMobileMenuOpen,
  activeMenu,
  setActiveMenu
}: Props) {
  const navigate = useNavigate()

  // 控制 Ant Design Menu 的展開項目
  const [openKeys, setOpenKeys] = useState<string[]>(['dashboard'])
  const [prevActiveMenu, setPrevActiveMenu] = useState(activeMenu)

  // 當從外部變更 activeMenu 時，自動展開對應的父選單
  // 透過 Render 階段更新 State，取代 useEffect 避免 linter 警告與二次渲染
  if (activeMenu !== prevActiveMenu) {
    setPrevActiveMenu(activeMenu)
    if (activeMenu && sidebarOpen) {
      const keys = activeMenu.split('+')
      if (keys.length >= 2) {
        const level1Key = keys[0]
        const level2Key = `${keys[0]}+${keys[1]}`
        const newKeys = new Set([...openKeys, level1Key, level2Key])
        setOpenKeys(Array.from(newKeys))
      }
    }
  }

  // 動態生成 Ant Design 需要的 items 陣列結構
  const items: MenuItem[] = [
    {
      key: 'dashboard',
      icon: <LayoutDashboard size={20} />,
      label: '總覽'
    },
    // 將我們自己定義的 menuData 轉換成 Ant Design 格式
    ...menuData.map(level1 => ({
      key: level1.id,
      icon: <level1.icon size={20} />,
      label: level1.label,
      children: level1.children.map(level2 => ({
        key: `${level1.id}+${level2.id}`,
        label: level2.label,
        children: level2.children.map(level3 => ({
          key: `${level1.id}+${level2.id}+${level3.id}`,
          label: level3.label
        }))
      }))
    }))
  ]

  // 處理選單點擊
  const handleMenuClick: MenuProps['onClick'] = e => {
    setActiveMenu(e.key)

    if (e.key === 'dashboard') {
      navigate('')
    } else {
      // 由於我們的 key 是 "level1+level2+level3"
      const parts = e.key.split('+')
      // 我們只需要取最後一段當作 route 導向路徑
      const route = parts[parts.length - 1]
      navigate(route)
    }

    // 手機版點擊後自動收起
    if (window.innerWidth < 1024) {
      setMobileMenuOpen(false)
    }
  }

  const onOpenChange: MenuProps['onOpenChange'] = keys => {
    setOpenKeys(keys)
  }

  return (
    <aside
      className={clsx(
        'fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 flex flex-col',
        'transition-all duration-300 ease-in-out',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        sidebarOpen ? 'w-64' : 'w-20' // w-20 等於 80px，這正是 Ant Design Menu 收合狀態的預設寬度
      )}
    >
      {/* LOGO 區塊 */}
      <div className='h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0'>
        <div
          className='flex items-center gap-3 overflow-hidden cursor-pointer'
          onClick={() => {
            setActiveMenu('dashboard')
            navigate('')
          }}
        >
          <div className='w-8 h-8 rounded-lg text-blue-600 bg-blue-50 flex items-center justify-center shrink-0'>
            <ChartLine />
          </div>
          {sidebarOpen && (
            <span className='font-bold text-xl text-blue-700 whitespace-nowrap'>
              APS
              <span className='text-slate-800'>-DEMO</span>
            </span>
          )}
        </div>
        <button
          className='lg:hidden text-slate-400 hover:text-slate-600'
          onClick={() => setMobileMenuOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      {/* 選單列表 */}
      <div className='flex-1 overflow-y-auto py-4 scrollbar-hide'>
        {/* 使用 ConfigProvider 客製化 Ant Design 主題，
          讓它的顏色與圓角貼近原先自定義的 Tailwind Style 
        */}
        <ConfigProvider
          theme={{
            components: {
              Menu: {
                itemSelectedBg: '#eff6ff', // Tailwind blue-50
                itemSelectedColor: '#1d4ed8', // Tailwind blue-700
                itemHoverBg: '#f8fafc', // Tailwind slate-50
                itemColor: '#475569', // Tailwind slate-600
                itemBorderRadius: 8,
                subMenuItemBg: '#ffffff',
                itemMarginInline: 12
              }
            }
          }}
        >
          <Menu
            mode='inline'
            inlineCollapsed={!sidebarOpen}
            selectedKeys={[activeMenu]}
            openKeys={sidebarOpen ? openKeys : undefined} // 收合時交由 Ant Design 原生自動處理懸浮視窗的 Open
            onOpenChange={onOpenChange}
            onClick={handleMenuClick}
            items={items}
            style={{ borderRight: 'none' }} // 移除 Antd 預設的右邊框，改由外層 aside 控制
          />
        </ConfigProvider>
      </div>

      {/* 底部使用者簡介 */}
      {sidebarOpen && (
        <div className='p-4 border-t border-slate-100 shrink-0'>
          <div className='flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100'>
            <div className='w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shadow-sm shrink-0'>
              SA
            </div>
            <div className='overflow-hidden'>
              <p className='text-sm font-bold text-slate-700 truncate'>
                System Admin
              </p>
              <p className='text-xs text-slate-400 font-medium truncate'>
                admin@aps.local
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
