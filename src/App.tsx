import { useState, useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import {
  LayoutDashboard,
  ChartLine,
  Navigation,
  ListTodo,
  Package,
  CalendarDays,
  AreaChart,
  AlertTriangle,
  Settings,
  Bell,
  BellRing,
  EllipsisVertical,
  Zap,
  Truck,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'
import AntDesignLogo from './assets/ant-design.svg'
import { clsx } from 'clsx'
import { Button } from 'antd'
import './App.scss'

// --- 🧭 1. 系統選單資料結構 (三層式) ---
const menuData = [
  {
    id: 'dashboard',
    label: '總覽',
    icon: LayoutDashboard,
    children: [
      {
        id: 'overview',
        label: '系統總覽',
        children: [
          { id: 'kpi', label: 'KPI 指標' },
          { id: 'progress', label: '生產進度' },
          { id: 'alerts', label: '異常通知' }
        ]
      }
    ]
  },
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
          { id: 'gantt', label: '甘特圖' },
          { id: 'load', label: '負載圖' }
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

// --- 📊 2. Dashboard 內容元件 (高質感 UI + ECharts) ---
const DashboardContent = () => {
  const chartRef = useRef(null)

  useEffect(() => {
    let myChart: any = null
    if (chartRef.current) {
      myChart = echarts.init(chartRef.current)
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: '#e2e8f0',
          textStyle: { color: '#1e293b' }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '15%',
          containLabel: true
        },
        xAxis: [
          {
            type: 'category',
            data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            axisLine: { lineStyle: { color: '#cbd5e1' } },
            axisLabel: { color: '#64748b' }
          }
        ],
        yAxis: [
          {
            type: 'value',
            name: 'OEE (%)',
            min: 60,
            max: 100,
            nameTextStyle: { color: '#64748b', padding: [0, 0, 0, 20] },
            axisLabel: { color: '#64748b' },
            splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
          }
        ],
        series: [
          {
            name: '目標稼動率',
            type: 'line',
            data: [85, 85, 85, 85, 85, 85, 85],
            itemStyle: { color: '#f59e0b' },
            lineStyle: { width: 2, type: 'dashed' },
            symbol: 'none'
          },
          {
            name: '實際 OEE',
            type: 'bar',
            barWidth: '40%',
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#3b82f6' },
                { offset: 1, color: '#1d4ed8' }
              ]),
              borderRadius: [4, 4, 0, 0]
            },
            data: [78, 82, 88, 91, 86, 75, 80]
          }
        ]
      }
      myChart.setOption(option)

      const handleResize = () => {
        if (myChart) {
          myChart.resize()
        }
      }
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        if (myChart) {
          myChart.dispose()
        }
      }
    }
  }, [])

  return (
    <div className='space-y-6 animate-fade-in pb-10'>
      {/* 英雄歡迎區 (Hero Section) */}
      <div className='hero-bg rounded-2xl p-8 md:p-10 text-white shadow-soft animate-fade-in'>
        <div className='shape shape-1'></div>
        <div className='shape shape-2'></div>
        <div className='shape shape-3'></div>

        <div className='relative z-10 flex flex-col md:flex-row items-center justify-between gap-6'>
          <div>
            <div className='flex items-center gap-3 mb-2 opacity-90'>
              <span className='bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm'>
                System Ready
              </span>
              <Navigation />
              <span className='text-sm'>智慧製造中心</span>
            </div>
            <h1 className='text-3xl md:text-4xl font-bold mb-3 tracking-tight'>
              歡迎使用 APS 先進排程系統
            </h1>
            <p className='text-blue-100 max-w-xl text-sm md:text-base leading-relaxed'>
              整合生產資訊、優化排程邏輯。透過數據驅動的決策，協助您達成最佳化機台稼動率與準時交貨目標。
            </p>
          </div>

          <div className='hidden md:flex bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-xl items-center gap-4'>
            <div className='w-12 h-12 p-1 bg-white rounded-xl flex items-center justify-center text-brand-600 shadow-inner'>
              <img src={AntDesignLogo} alt='Ant Design Logo' />
            </div>
            <div>
              <h3 className='font-bold text-lg tracking-wider'>
                Ant <span className='text-red-300'>Design</span>
              </h3>
              <p className='text-xs text-blue-200'>React UI Framework</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI 指標卡片 (4欄響應式) */}
      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5'>
        {[
          {
            title: '平均稼動率 (OEE)',
            value: '87.5%',
            trend: '+2.1%',
            icon: Zap,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            iconColor: 'text-emerald-500',
            isAlert: false
          },
          {
            title: '準時交貨率 (OTD)',
            value: '94.2%',
            trend: '+0.8%',
            icon: Truck,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            iconColor: 'text-blue-500',
            isAlert: false
          },
          {
            title: '執行中工單',
            value: '1,284',
            unit: '筆',
            icon: ClipboardList,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            iconColor: 'text-indigo-500',
            isAlert: false
          },
          {
            title: '設備異常警報',
            value: '3',
            unit: '需立即處置',
            icon: AlertTriangle,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            iconColor: 'text-rose-500',
            isAlert: true
          }
        ].map((kpi, idx) => (
          <div
            key={idx}
            className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 relative overflow-hidden group cursor-pointer flex items-center justify-between ${kpi.isAlert ? 'ring-1 ring-rose-200' : ''}`}
          >
            <div>
              <p className='text-sm text-slate-500 mb-1'>{kpi.title}</p>
              <div className='flex items-baseline gap-2'>
                <span className='text-3xl font-bold text-slate-800 tracking-tight'>
                  {kpi.value}
                </span>
                {kpi.trend && (
                  <span
                    className={`text-sm font-bold ${kpi.color} bg-white/50 px-1.5 rounded`}
                  >
                    {kpi.trend}
                  </span>
                )}
                {kpi.unit && (
                  <span
                    className={`text-xs font-semibold ${kpi.isAlert ? 'text-rose-500' : 'text-slate-400'}`}
                  >
                    {kpi.unit}
                  </span>
                )}
              </div>
            </div>
            <div className={`p-2.5 rounded-4xl ${kpi.bg} shadow-inner`}>
              <kpi.icon size={24} className={kpi.iconColor} />
            </div>
          </div>
        ))}
      </div>

      {/* 核心功能快捷卡片 */}

      {/* 數據圖表與異常面板 */}
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
        {/* 左側 ECharts 渲染區塊 */}
        <div className='xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col'>
          <div className='flex justify-between items-center mb-8'>
            <div>
              <h3 className='text-lg font-bold text-slate-800'>
                近七日機台整體設備效率 (OEE)
              </h3>
              <p className='text-sm text-slate-400 mt-1'>
                廠區 A - 核心製程機群
              </p>
            </div>
            <Button shape='circle' variant='text' color='default'>
              <EllipsisVertical />
            </Button>
          </div>
          {/* Chart Container */}
          <div className='flex-1 min-h-[280px] w-full relative'>
            <div
              ref={chartRef}
              className='absolute inset-0 w-full h-full'
            ></div>
          </div>
        </div>

        {/* 右側 異常警報 */}
        <div className='flex flex-col gap-6'>
          <div className='relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex-1 overflow-hidden'>
            <div className='absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 to-red-600'></div>

            <div className='flex justify-between items-center mb-5 border-b border-slate-100 pb-4'>
              <h3 className='text-lg font-bold text-slate-800 flex items-center gap-2'>
                <BellRing className='text-rose-500' size={20} /> 異常警報
              </h3>
              <span className='bg-rose-100 text-rose-700 px-2.5 py-1 rounded-md text-xs font-bold animate-pulse'>
                3 筆未讀
              </span>
            </div>

            <div className='space-y-3'>
              {[
                {
                  eq: '機台 EQ-004 溫度異常',
                  desc: '超出安全閥值，影響排程。',
                  time: '10:23 AM',
                  type: 'critical'
                },
                {
                  eq: '物料 M-109 短缺預警',
                  desc: '安全庫存低於 5%。',
                  time: '09:15 AM',
                  type: 'warning'
                },
                {
                  eq: '訂單 WO-202611 延誤',
                  desc: '預估完工時間超過交期。',
                  time: '08:42 AM',
                  type: 'warning'
                }
              ].map((alert, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border ${alert.type === 'critical' ? 'bg-rose-50/50 border-rose-100 hover:bg-rose-50' : 'bg-amber-50/50 border-amber-100 hover:bg-amber-50'} transition-colors cursor-pointer`}
                >
                  <div className='flex justify-between items-start mb-1'>
                    <h4
                      className={`text-sm font-bold ${alert.type === 'critical' ? 'text-rose-700' : 'text-amber-700'}`}
                    >
                      {alert.eq}
                    </h4>
                    <span
                      className={`text-[10px] font-semibold ${alert.type === 'critical' ? 'text-rose-400' : 'text-amber-500'}`}
                    >
                      {alert.time}
                    </span>
                  </div>
                  <p
                    className={`text-xs ${alert.type === 'critical' ? 'text-rose-600/80' : 'text-amber-600/80'} leading-relaxed font-medium`}
                  >
                    {alert.desc}
                  </p>
                </div>
              ))}
            </div>

            <Button
              color='default'
              variant='filled'
              size='large'
              className='mt-4 w-full'
            >
              前往警報中心處理
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- 🏢 3. 系統主佈局與側邊欄元件 ---
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState([
    'dashboard',
    'dashboard-overview'
  ])
  const [activeMenu, setActiveMenu] = useState('dashboard-overview-kpi')

  // 切換選單展開/收合狀態
  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    )
  }

  // 處理選單點擊
  const handleMenuClick = (
    level1Id: string,
    level2Id: string,
    level3Id: string
  ) => {
    setActiveMenu(`${level1Id}-${level2Id}-${level3Id}`)
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
    <div className='min-h-screen bg-slate-50/50 flex font-sans text-slate-800'>
      {/* 行動版側邊欄遮罩 */}
      {mobileMenuOpen && (
        <div
          className='fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity'
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 側邊導航欄 (Sidebar) */}
      <aside
        className={clsx(
          'fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 flex flex-col',
          'transition-all duration-300 ease-in-out',
          mobileMenuOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* LOGO 區塊 */}
        <div className='h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0'>
          <div
            className='flex items-center gap-3 overflow-hidden cursor-pointer'
            onClick={() => setSidebarOpen(!sidebarOpen)}
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

      {/* 右側主畫面區 */}
      <main className='flex-1 flex flex-col min-w-0 h-screen overflow-hidden'>
        {/* 頂部導航列 (Header) */}
        <header className='h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-30 shrink-0'>
          <div className='flex items-center gap-4'>
            <button
              className='lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100'
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <button
              className='hidden lg:block p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors'
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={20} />
            </button>

            {/* 麵包屑導航 */}
            <div className='hidden sm:flex items-center text-sm font-medium text-slate-500 gap-2'>
              <LayoutDashboard size={16} className='text-blue-500' />
              <ChevronRight size={14} className='text-slate-300' />
              <span>總覽</span>
              <ChevronRight size={14} className='text-slate-300' />
              <span className='text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded-md'>
                系統總覽 / KPI 指標
              </span>
            </div>
          </div>

          <div className='flex items-center gap-4 md:gap-6'>
            <div className='relative cursor-pointer'>
              <Bell
                size={20}
                className='text-slate-500 hover:text-blue-600 transition-colors'
              />
              <span className='absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full'></span>
            </div>
            <div className='h-6 w-px bg-slate-200 hidden sm:block'></div>
            <div className='flex items-center gap-3 cursor-pointer group'>
              <div className='text-right hidden sm:block'>
                <p className='text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors'>
                  Chen Chan Hsieh
                </p>
                <p className='text-xs text-slate-400 font-medium'>研發部</p>
              </div>
              <img
                src='https://avatars.githubusercontent.com/u/31943807?v=4'
                alt='Avatar'
                className='w-9 h-9 rounded-full border-2 border-white shadow-sm group-hover:border-blue-200 transition-all'
              />
            </div>
          </div>
        </header>

        {/* 內容區塊 */}
        <div className='flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-slate-50/50 relative'>
          {/* 判斷目前選擇的頁面，預設顯示 Dashboard */}
          {activeMenu === 'dashboard-overview-kpi' ? (
            <DashboardContent />
          ) : (
            <div className='h-full flex flex-col items-center justify-center text-slate-400 animate-fade-in'>
              <div className='w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4'>
                <Settings size={40} className='text-slate-300' />
              </div>
              <h2 className='text-xl font-bold text-slate-600 mb-2'>
                模組開發中
              </h2>
              <p className='text-sm'>
                您目前點擊的是 {activeMenu.replace(/-/g, ' > ')}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
