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
  ChevronDown,
  X
} from 'lucide-react'
import { clsx } from 'clsx'
import { useNavigate } from 'react-router-dom'

// --- 系統選單資料結構 ---
const menuData = [
  // {
  //   id: 'dashboard',
  //   label: '總覽',
  //   icon: LayoutDashboard,
  //   children: [
  //     {
  //       id: 'overview',
  //       label: '系統總覽',
  //       children: [
  //         { id: 'kpi', label: 'KPI 指標' },
  //         { id: 'progress', label: '生產進度' },
  //         { id: 'alerts', label: '異常通知' }
  //       ]
  //     }
  //   ]
  // },
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
  const [expandedMenus, setExpandedMenus] = useState([
    'dashboard',
    'dashboard-overview'
  ])

  // 切換選單展開/收合狀態
  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    )
  }

  const navigate = useNavigate()

  // 處理選單點擊
  const handleMenuClick = (
    level1Id: string,
    level2Id: string,
    level3Id: string
  ) => {
    setActiveMenu(`${level1Id}-${level2Id}-${level3Id}`)
    navigate(`${level3Id}`)
    if (window.innerWidth < 1024) {
      setMobileMenuOpen(false)
    }
  }

  // 遞迴渲染選單
  const renderMenu = () => {
    return menuData.map(level1 => {
      const isLevel1Expanded = expandedMenus.includes(level1.id)
      const isLevel1Active = activeMenu.startsWith(level1.id)

      return (
        <div key={level1.id} className='mb-1 px-3'>
          {/* 第一層 */}
          <button
            onClick={() => toggleMenu(level1.id)}
            className={clsx(
              'w-full p-3 rounded-xl',
              'flex items-center justify-between',
              'transition-all duration-200',
              `${
                isLevel1Active && !isLevel1Expanded
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-semibold'
              }`
            )}
          >
            <div className='flex items-center gap-3'>
              <level1.icon
                size={20}
                className={isLevel1Active ? 'text-blue-600' : 'text-slate-400'}
              />
              {sidebarOpen && (
                <span className='text-sm tracking-wide'>{level1.label}</span>
              )}
            </div>
            {sidebarOpen && (
              <ChevronDown
                size={16}
                className={`transition-transform duration-300 text-slate-400 ${isLevel1Expanded ? 'rotate-180' : ''}`}
              />
            )}
          </button>

          {/* 第二層與第三層 */}
          {sidebarOpen && isLevel1Expanded && (
            <div className='mt-1 ml-4 pl-4 border-l-2 border-slate-100 space-y-1'>
              {level1.children.map(level2 => {
                const level2Id = `${level1.id}-${level2.id}`
                const isLevel2Expanded = expandedMenus.includes(level2Id)

                return (
                  <div key={level2.id}>
                    {/* 第二層 */}
                    <button
                      onClick={() => toggleMenu(level2Id)}
                      className='w-full flex items-center justify-between py-2 px-3 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-medium transition-colors'
                    >
                      <span className='text-sm'>{level2.label}</span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-300 ${isLevel2Expanded ? 'rotate-180 text-blue-500' : 'text-slate-300'}`}
                      />
                    </button>

                    {/* 第三層 */}
                    {isLevel2Expanded && (
                      <div className='mt-1 mb-2 ml-2 space-y-1'>
                        {level2.children.map(level3 => {
                          const level3Id = `${level1.id}-${level2.id}-${level3.id}`
                          const isLevel3Active = activeMenu === level3Id

                          return (
                            <button
                              key={level3.id}
                              onClick={() =>
                                handleMenuClick(level1.id, level2.id, level3.id)
                              }
                              className={`w-full text-left py-2 px-4 rounded-lg text-sm transition-all duration-200 relative ${
                                isLevel3Active
                                  ? 'bg-blue-50 text-blue-700 font-bold'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600 font-medium'
                              }`}
                            >
                              {isLevel3Active && (
                                <span className='absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-600 rounded-r-md'></span>
                              )}
                              {level3.label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <aside
      className={clsx(
        'fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 flex flex-col',
        'transition-all duration-300 ease-in-out',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        sidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      {/* LOGO 區塊 */}
      <div className='h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0'>
        <div
          className='flex items-center gap-3 overflow-hidden cursor-pointer'
          onClick={() => {
            toggleMenu('dashboard')
            navigate('')
          }}
        >
          <div className='w-8 h-8 rounded-lg text-brand-600 bg-brand-50 flex items-center justify-center'>
            <ChartLine />
          </div>
          {sidebarOpen && (
            <span className='font-bold text-xl text-blue-700'>
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
        {/* 儀錶板 */}
        <div className='mb-1 px-3'>
          <button
            onClick={() => {
              toggleMenu('dashboard')
              navigate('')
            }}
            className={clsx(
              'w-full p-3 rounded-xl',
              'flex items-center justify-between',
              'transition-all duration-200',
              'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-semibold'
            )}
          >
            <div className='flex items-center gap-3'>
              <LayoutDashboard size={20} className={'text-slate-400'} />
              {sidebarOpen && (
                <span className='text-sm tracking-wide'>總覽</span>
              )}
            </div>
          </button>
        </div>
        {/* 選單 */}
        {renderMenu()}
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
