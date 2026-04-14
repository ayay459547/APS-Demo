import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import {
  Navigation,
  AlertTriangle,
  BellRing,
  EllipsisVertical,
  Zap,
  Truck,
  ClipboardList
} from 'lucide-react'
import AntDesignLogo from '@/assets/ant-design.svg'
import FeatureCards from './FeatureCards.tsx'
import { Button } from 'antd'

// --- Dashboard 內容元件 (高質感 UI + ECharts) ---
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
    <div className='space-y-6 animate-fade-in pb-10 p-2 md:p-6 lg:p-8'>
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
      <FeatureCards />

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
              className='mt-4 w-full !text-xs'
            >
              前往警報中心處理
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardContent
