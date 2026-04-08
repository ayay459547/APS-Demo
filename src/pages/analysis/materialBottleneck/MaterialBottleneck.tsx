import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  PackageX,
  AlertTriangle,
  Download,
  Boxes,
  ShoppingCart,
  TrendingDown,
  Settings,
  AlertCircle
} from 'lucide-react'

// --- 型別定義 (Type Definitions) ---
type MaterialCategory = 'RAW_MATERIAL' | 'COMPONENT' | 'PACKAGING'

interface BaseMaterial {
  id: string
  name: string
  category: MaterialCategory
  safetyStock: number
  leadTimeDays: number // 採購前置時間
}

interface Material extends BaseMaterial {
  currentStock: number
}

interface ShortageStat extends Material {
  requiredQuantity: number
  shortageQuantity: number
  fulfillmentRate: number // 齊套率 (%)
  impactedWorkOrders: number
  status: 'CRITICAL' | 'WARNING' | 'HEALTHY'
}

// --- 設定與常數 ---
const BASE_MATERIALS: Omit<BaseMaterial, 'id'>[] = [
  {
    name: '鋁合金板 6061-T6',
    category: 'RAW_MATERIAL',
    safetyStock: 500,
    leadTimeDays: 14
  },
  {
    name: '鈦合金圓棒 Ti-6Al-4V',
    category: 'RAW_MATERIAL',
    safetyStock: 200,
    leadTimeDays: 30
  },
  {
    name: '不鏽鋼鋼捲 SUS304',
    category: 'RAW_MATERIAL',
    safetyStock: 1000,
    leadTimeDays: 10
  },
  {
    name: '高精度伺服馬達 750W',
    category: 'COMPONENT',
    safetyStock: 50,
    leadTimeDays: 45
  },
  {
    name: '工業級步進馬達',
    category: 'COMPONENT',
    safetyStock: 100,
    leadTimeDays: 20
  },
  {
    name: '微型光電傳感器',
    category: 'COMPONENT',
    safetyStock: 300,
    leadTimeDays: 15
  },
  {
    name: 'PLC 控制晶片',
    category: 'COMPONENT',
    safetyStock: 150,
    leadTimeDays: 60
  },
  {
    name: '深溝球軸承 6204',
    category: 'COMPONENT',
    safetyStock: 1000,
    leadTimeDays: 7
  },
  {
    name: '防靜電抗震包裝盒',
    category: 'PACKAGING',
    safetyStock: 2000,
    leadTimeDays: 5
  },
  {
    name: '工業級真空密封袋',
    category: 'PACKAGING',
    safetyStock: 5000,
    leadTimeDays: 3
  },
  {
    name: '高強度固定螺絲組',
    category: 'COMPONENT',
    safetyStock: 10000,
    leadTimeDays: 14
  }
]

const MATERIALS: Material[] = Array.from({ length: 50 }, (_, i) => {
  const base = BASE_MATERIALS[i % BASE_MATERIALS.length]
  return {
    id: `MAT-${String(i + 1).padStart(4, '0')}`,
    name: `${base.name} (型號-${String((i % 5) + 1)})`,
    category: base.category,
    safetyStock: base.safetyStock,
    leadTimeDays: base.leadTimeDays,
    // 模擬當前庫存 (有些充足，有些低於安全庫存)
    currentStock: Math.floor(Math.random() * base.safetyStock * 3)
  }
})

// --- 資料生成引擎 ---
const generateMockShortageData = (): ShortageStat[] => {
  return MATERIALS.map(mat => {
    // 模擬未來 30 天的需求量
    const requiredQuantity = Math.floor(Math.random() * mat.safetyStock * 4)
    const shortageQuantity = Math.max(0, requiredQuantity - mat.currentStock)
    const fulfillmentRate =
      requiredQuantity === 0
        ? 100
        : Math.min(100, Math.round((mat.currentStock / requiredQuantity) * 100))

    // 計算受影響工單數 (缺料越多，影響工單通常越多)
    const impactedWorkOrders =
      shortageQuantity > 0 ? Math.floor(Math.random() * 15) + 1 : 0

    let status: ShortageStat['status'] = 'HEALTHY'
    if (fulfillmentRate < 50 || mat.currentStock < mat.safetyStock * 0.5)
      status = 'CRITICAL'
    else if (fulfillmentRate < 85 || mat.currentStock < mat.safetyStock)
      status = 'WARNING'

    return {
      ...mat,
      requiredQuantity,
      shortageQuantity,
      fulfillmentRate,
      impactedWorkOrders,
      status
    }
  })
}

// --- 主元件 ---
export default function MaterialBottleneck() {
  const [materialStats, setMaterialStats] = useState<ShortageStat[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setTimeout(() => {
        const rawData = generateMockShortageData()
        // 依照齊套率 (越低越嚴重) 與 缺口數量 進行排序
        rawData.sort((a, b) => {
          if (a.fulfillmentRate !== b.fulfillmentRate)
            return a.fulfillmentRate - b.fulfillmentRate
          return b.shortageQuantity - a.shortageQuantity
        })
        setMaterialStats(rawData)
        setLoading(false)
      }, 500)
    }
    loadData()
  }, [])

  // --- 關鍵指標計算 ---
  const overviewStats = useMemo(() => {
    if (materialStats.length === 0)
      return {
        criticalItems: 0,
        impactedWOs: 0,
        belowSafety: 0,
        avgLeadTime: 0
      }

    const criticalItems = materialStats.filter(
      m => m.status === 'CRITICAL'
    ).length
    const impactedWOs = materialStats.reduce(
      (sum, m) => sum + m.impactedWorkOrders,
      0
    )
    const belowSafety = materialStats.filter(
      m => m.currentStock < m.safetyStock
    ).length

    const criticalMaterials = materialStats.filter(m => m.status === 'CRITICAL')
    const avgLeadTime =
      criticalMaterials.length > 0
        ? Math.round(
            criticalMaterials.reduce((sum, m) => sum + m.leadTimeDays, 0) /
              criticalMaterials.length
          )
        : Math.round(
            materialStats.reduce((sum, m) => sum + m.leadTimeDays, 0) /
              materialStats.length
          )

    return { criticalItems, impactedWOs, belowSafety, avgLeadTime }
  }, [materialStats])

  // --- 匯出 CSV 報表功能 ---
  const handleExportCSV = useCallback(() => {
    if (loading || materialStats.length === 0) return

    const headers = [
      '料號',
      '物料名稱',
      '分類',
      '目前庫存',
      '預測需求',
      '缺口數量',
      '齊套率(%)',
      '影響工單(筆)',
      '採購前置天數',
      '狀態'
    ]
    const rows = materialStats.map(m => {
      let statusStr = '庫存健康'
      if (m.status === 'CRITICAL') statusStr = '嚴重缺料'
      else if (m.status === 'WARNING') statusStr = '低於水位'

      let catStr = '其他'
      if (m.category === 'RAW_MATERIAL') catStr = '原物料'
      if (m.category === 'COMPONENT') catStr = '零組件'
      if (m.category === 'PACKAGING') catStr = '包材'

      return [
        m.id,
        m.name,
        catStr,
        m.currentStock.toString(),
        m.requiredQuantity.toString(),
        m.shortageQuantity.toString(),
        m.fulfillmentRate.toString(),
        m.impactedWorkOrders.toString(),
        m.leadTimeDays.toString(),
        statusStr
      ]
    })

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join(
      '\n'
    )

    const bom = new Uint8Array([0xef, 0xbb, 0xbf])
    const blob = new Blob([bom, csvContent], {
      type: 'text/csv;charset=utf-8;'
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `物料齊套與缺料分析報表.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [materialStats, loading])

  return (
    <div className='flex flex-col h-full bg-slate-50 font-sans text-slate-800 overflow-hidden'>
      {/* Module Header */}
      <header className='flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm shrink-0 gap-4 sm:gap-0 z-10'>
        <div className='flex items-center gap-3'>
          <div className='bg-amber-500 p-2 rounded-lg shadow-sm'>
            <PackageX size={24} className='text-white' />
          </div>
          <div>
            <h1 className='text-xl font-bold text-slate-800 tracking-wide flex items-center gap-2'>
              物料齊套與缺口分析{' '}
              <span className='text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider'>
                Material Bottleneck
              </span>
            </h1>
            <p className='text-xs text-slate-500 font-medium tracking-wide mt-1'>
              自動比對排程需求與庫存水位，提前識別斷料風險與供應鏈瓶頸。
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={loading}
          className='w-full sm:w-auto text-sm bg-slate-800 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <Download size={16} /> 匯出缺料報表
        </button>
      </header>

      {/* Main Content Area */}
      <main className='flex-1 relative overflow-auto bg-slate-50 p-4 md:p-8'>
        {loading ? (
          <div className='absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm z-50'>
            <div className='w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mb-6 shadow-lg'></div>
            <p className='text-slate-600 font-bold text-lg mb-2'>
              比對 BOM 表與庫存數據中...
            </p>
            <p className='text-slate-400 text-sm animate-pulse'>
              正在解析 50+ 項關鍵物料齊套率
            </p>
          </div>
        ) : (
          <div className='max-w-7xl mx-auto space-y-6 md:space-y-8'>
            {/* 4 Overview Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6'>
              <div className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow'>
                <span className='text-slate-500 text-sm font-medium flex items-center gap-1.5'>
                  <AlertTriangle size={16} className='text-red-500' />{' '}
                  嚴重缺料品項
                </span>
                <div className='mt-3 text-3xl font-black text-red-600'>
                  {overviewStats.criticalItems}{' '}
                  <span className='text-sm font-medium text-slate-400'>項</span>
                </div>
                <div className='text-xs text-slate-400 mt-2'>
                  齊套率低於 50%
                </div>
              </div>
              <div className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow'>
                <span className='text-slate-500 text-sm font-medium flex items-center gap-1.5'>
                  <Boxes size={16} className='text-amber-500' /> 受影響工單總數
                </span>
                <div className='mt-3 text-3xl font-black text-amber-600'>
                  {overviewStats.impactedWOs}{' '}
                  <span className='text-sm font-medium text-slate-400'>筆</span>
                </div>
                <div className='text-xs text-slate-400 mt-2'>
                  面臨停工或延遲風險
                </div>
              </div>
              <div className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow'>
                <span className='text-slate-500 text-sm font-medium flex items-center gap-1.5'>
                  <TrendingDown size={16} className='text-orange-500' />{' '}
                  低於安全庫存
                </span>
                <div className='mt-3 text-3xl font-black text-orange-500'>
                  {overviewStats.belowSafety}{' '}
                  <span className='text-sm font-medium text-slate-400'>項</span>
                </div>
                <div className='text-xs text-slate-400 mt-2'>
                  需立即觸發請購機制
                </div>
              </div>
              <div className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow'>
                <span className='text-slate-500 text-sm font-medium flex items-center gap-1.5'>
                  <ShoppingCart size={16} className='text-blue-500' />{' '}
                  缺料平均交期 (L/T)
                </span>
                <div className='mt-3 text-3xl font-black text-slate-700'>
                  {overviewStats.avgLeadTime}{' '}
                  <span className='text-sm font-medium text-slate-400'>天</span>
                </div>
                <div className='text-xs text-slate-400 mt-2'>
                  急件催料預估等待期
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8'>
              {/* Left Chart: Top 10 Shortages */}
              <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col'>
                <h3 className='text-lg font-bold text-slate-800 mb-6 flex items-center gap-2'>
                  <PackageX className='text-slate-400' size={20} />
                  Top 10 嚴重缺料排行 (齊套率)
                </h3>
                <div className='space-y-5 flex-1'>
                  {materialStats.slice(0, 10).map((m, i) => (
                    <div key={m.id} className='flex items-center gap-3'>
                      <div className='w-6 text-center font-bold text-slate-400 text-sm'>
                        #{i + 1}
                      </div>
                      <div className='w-24 sm:w-40 truncate flex flex-col'>
                        <span
                          className='font-medium text-slate-700 text-sm truncate'
                          title={m.name}
                        >
                          {m.name}
                        </span>
                        <span className='text-[10px] text-slate-400 font-mono'>
                          缺口: {m.shortageQuantity}
                        </span>
                      </div>
                      <div className='flex-1 h-3 bg-slate-100 rounded-full overflow-hidden flex relative group'>
                        {/* Tooltip for progress bar */}
                        <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10'>
                          庫存 {m.currentStock} / 需求 {m.requiredQuantity}
                        </div>
                        <div
                          className={`h-full transition-all duration-1000 ease-out ${m.fulfillmentRate < 50 ? 'bg-red-500' : m.fulfillmentRate < 85 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                          style={{
                            width: `${Math.max(m.fulfillmentRate, 2)}%`
                          }} // 至少給 2% 寬度讓顏色可見
                        ></div>
                      </div>
                      <div
                        className={`w-12 text-right font-bold text-sm ${m.fulfillmentRate < 50 ? 'text-red-600' : m.fulfillmentRate < 85 ? 'text-amber-600' : 'text-emerald-600'}`}
                      >
                        {m.fulfillmentRate}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Detail List */}
              <div className='bg-white p-0 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden'>
                <div className='p-6 border-b border-slate-100'>
                  <h3 className='text-lg font-bold text-slate-800 flex items-center gap-2'>
                    <Settings className='text-slate-400' size={20} />
                    缺料物料影響明細
                  </h3>
                </div>
                <div className='overflow-x-auto flex-1 p-0'>
                  <table className='w-full text-left text-sm whitespace-nowrap'>
                    <thead className='bg-slate-50 sticky top-0 z-10'>
                      <tr className='border-b border-slate-200 text-slate-500'>
                        <th className='py-3 font-medium px-4'>
                          物料名稱 / 料號
                        </th>
                        <th className='py-3 font-medium px-4 text-right'>
                          缺口數量
                        </th>
                        <th className='py-3 font-medium px-4 text-right'>
                          影響工單
                        </th>
                        <th className='py-3 font-medium px-4 text-right'>
                          交期(L/T)
                        </th>
                        <th className='py-3 font-medium px-4 text-center'>
                          狀態
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {materialStats.slice(0, 10).map(m => (
                        <tr
                          key={m.id}
                          className='border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors'
                        >
                          <td className='py-3 px-4'>
                            <div className='font-bold text-slate-700 truncate max-w-[150px]'>
                              {m.name}
                            </div>
                            <div className='text-[10px] text-slate-400 font-mono'>
                              {m.id}
                            </div>
                          </td>
                          <td className='py-3 px-4 text-right font-mono'>
                            <span
                              className={
                                m.shortageQuantity > 0
                                  ? 'text-red-600 font-bold'
                                  : 'text-slate-600'
                              }
                            >
                              {m.shortageQuantity}
                            </span>
                          </td>
                          <td className='py-3 px-4 text-slate-600 text-right'>
                            {m.impactedWorkOrders}{' '}
                            <span className='text-xs text-slate-400'>筆</span>
                          </td>
                          <td className='py-3 px-4 text-slate-600 text-right'>
                            {m.leadTimeDays}{' '}
                            <span className='text-xs text-slate-400'>天</span>
                          </td>
                          <td className='py-3 px-4 text-center'>
                            <span
                              className={`px-2 py-1 rounded text-[10px] font-bold ${m.status === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' : m.status === 'WARNING' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}
                            >
                              {m.status === 'CRITICAL'
                                ? '嚴重缺料'
                                : m.status === 'WARNING'
                                  ? '低於水位'
                                  : '庫存健康'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Context Warning Box */}
            {overviewStats.criticalItems > 0 && (
              <div className='bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-3 items-start text-sm shadow-sm'>
                <AlertCircle
                  className='text-amber-500 shrink-0 mt-0.5'
                  size={20}
                />
                <div className='text-amber-900 leading-relaxed'>
                  <span className='font-bold text-base block mb-1'>
                    採購與調度建議：
                  </span>
                  系統偵測到{' '}
                  <strong className='mx-1'>
                    {overviewStats.criticalItems}
                  </strong>{' '}
                  項關鍵物料齊套率低於 50%，已直接影響{' '}
                  <strong className='mx-1'>{overviewStats.impactedWOs}</strong>{' '}
                  筆排程工單的投產。 首要缺件{' '}
                  <strong className='bg-white px-1.5 py-0.5 rounded border border-amber-200 mx-1'>
                    {materialStats[0].name}
                  </strong>{' '}
                  的標準交期為 {materialStats[0].leadTimeDays}{' '}
                  天。建議立即匯出報表並聯絡供應商進行急件催促
                  (Expedite)，或通知生管將受影響的工單調整至下個排程週期。
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
