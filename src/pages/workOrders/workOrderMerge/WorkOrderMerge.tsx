import React, { useState, useMemo } from 'react'
import {
  Card,
  Button,
  Tag,
  DatePicker,
  Select,
  Badge,
  Divider,
  Empty,
  message,
  Input
} from 'antd'
import {
  Merge,
  Trash2,
  Cpu,
  Clock,
  Layers,
  Save,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Plus,
  ArrowDown
} from 'lucide-react'
import dayjs from 'dayjs'

// --- 型別定義 ---
interface WorkOrder {
  id: string
  itemCode: string
  itemName: string
  qty: number
  deadline: string
  status: 'Pending'
}

const machines = ['CNC-01', 'CNC-05', 'SMT-A2', 'ASM-L1', 'Tst-Z9']

// --- 模擬待合併工單庫 (以產品分類) ---
const mockSourceOrders: WorkOrder[] = [
  {
    id: 'MO-2026-0501',
    itemCode: 'IC-7022',
    itemName: 'M3 Pro Mainboard',
    qty: 150,
    deadline: '2026-04-10',
    status: 'Pending'
  },
  {
    id: 'MO-2026-0502',
    itemCode: 'IC-7022',
    itemName: 'M3 Pro Mainboard',
    qty: 200,
    deadline: '2026-04-12',
    status: 'Pending'
  },
  {
    id: 'MO-2026-0503',
    itemCode: 'IC-7022',
    itemName: 'M3 Pro Mainboard',
    qty: 300,
    deadline: '2026-04-15',
    status: 'Pending'
  },
  {
    id: 'MO-2026-0601',
    itemCode: 'PN-4500',
    itemName: 'Power Module X1',
    qty: 500,
    deadline: '2026-04-18',
    status: 'Pending'
  },
  {
    id: 'MO-2026-0602',
    itemCode: 'PN-4500',
    itemName: 'Power Module X1',
    qty: 450,
    deadline: '2026-04-20',
    status: 'Pending'
  }
]

const WorkOrderMerge: React.FC = () => {
  const [selectedOrders, setSelectedOrders] = useState<WorkOrder[]>([])
  const [searchKey, setSearchKey] = useState('')
  const [loading, setLoading] = useState(false)

  // 計算合併後的數據
  const totalMergedQty = useMemo(
    () => selectedOrders.reduce((sum, o) => sum + o.qty, 0),
    [selectedOrders]
  )
  const setupTimeSaved = useMemo(
    () => Math.max(0, (selectedOrders.length - 1) * 45),
    [selectedOrders]
  ) // 假設換線一次 45 分鐘
  const earliestDeadline = useMemo(() => {
    if (selectedOrders.length === 0) return '-'
    return selectedOrders.reduce(
      (min, o) => (dayjs(o.deadline).isBefore(dayjs(min)) ? o.deadline : min),
      selectedOrders[0].deadline
    )
  }, [selectedOrders])

  // 加入合併桶
  const addToMerge = (order: WorkOrder) => {
    if (selectedOrders.some(o => o.id === order.id)) {
      message.info('此工單已在合併清單中')
      return
    }
    if (
      selectedOrders.length > 0 &&
      selectedOrders[0].itemCode !== order.itemCode
    ) {
      message.error('不同產品代碼的工單無法合併生產')
      return
    }
    setSelectedOrders([...selectedOrders, order])
  }

  // 從合併桶移除
  const removeFromMerge = (id: string) => {
    setSelectedOrders(selectedOrders.filter(o => o.id !== id))
  }

  // 執行合併計畫並清空資料
  const handleExecuteMerge = () => {
    setLoading(true)
    const hide = message.loading('正在合併工單並重新排程...', 0)

    // 模擬非同步處理
    setTimeout(() => {
      hide()
      message.success('工單合併成功，已生成新的統一工單。')
      setSelectedOrders([]) // 清空面板資料
      setLoading(false)
    }, 1500)
  }

  const filteredOrders = useMemo(
    () =>
      mockSourceOrders.filter(
        o =>
          o.id.includes(searchKey) ||
          o.itemName.toLowerCase().includes(searchKey.toLowerCase())
      ),
    [searchKey]
  )

  return (
    <div className='flex h-full bg-[#f8fafc] overflow-hidden animate-fade-in'>
      {/* 左欄：待合併候選池 */}
      <aside className='w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm z-30'>
        <div className='p-5 border-b border-slate-100 bg-slate-50/50'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-emerald-100'>
                <Merge size={18} />
              </div>
              <span className='font-black text-slate-800 text-sm tracking-tight'>
                待合併工單庫
              </span>
            </div>
            <Badge
              count={filteredOrders.length}
              style={{ backgroundColor: '#10b981' }}
            />
          </div>
          <Input
            prefix={<Search size={14} className='text-slate-400' />}
            placeholder='搜尋編號或產品...'
            classNames={{ root: 'rounded-xl border-slate-200 h-10' }}
            onChange={e => setSearchKey(e.target.value)}
          />
        </div>

        <div className='flex-1 overflow-y-auto p-3 custom-scrollbar'>
          {filteredOrders.map(item => {
            const isAdded = selectedOrders.some(o => o.id === item.id)
            return (
              <div
                key={item.id}
                onClick={() => !isAdded && addToMerge(item)}
                className={`group p-4 mb-3 rounded-2xl cursor-pointer transition-all border relative overflow-hidden ${
                  isAdded
                    ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                    : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-sm'
                }`}
              >
                <div className='flex justify-between items-center mb-1.5'>
                  <span className='text-[9px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase'>
                    {item.itemCode}
                  </span>
                  {isAdded && (
                    <CheckCircle2 size={14} className='text-emerald-500' />
                  )}
                </div>
                <h4 className='font-bold text-slate-700 text-sm truncate mb-2'>
                  {item.itemName}
                </h4>
                <div className='flex justify-between items-end text-[10px] text-slate-400'>
                  <div className='space-y-1'>
                    <div>{item.id}</div>
                    <div className='flex items-center gap-1 font-medium text-amber-500'>
                      <Clock size={10} /> {item.deadline}
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-slate-800 font-black'>
                      {item.qty.toLocaleString()}
                    </div>
                    <div className='font-bold uppercase text-[8px]'>PCS</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </aside>

      {/* 右欄：合併工作台 */}
      <main className='flex-1 flex flex-col min-w-0 bg-[#f8fafc]'>
        <header className='h-14 flex items-center justify-end px-8 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm shrink-0'>
          <div className='flex items-center gap-3'>
            {/* 節省效能指標 */}
            <div className='flex items-center bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 h-8'>
              <Sparkles size={14} className='text-emerald-500 mr-2' />
              <span className='text-[9px] text-emerald-600 font-black uppercase tracking-tight mr-2'>
                Est. Time Saved:
              </span>
              <span className='text-xs font-black text-emerald-700'>
                {setupTimeSaved} MIN
              </span>
            </div>

            <div className='h-6 w-[1px] bg-slate-200 mx-1' />

            <Button
              variant='solid'
              color='primary'
              size='small'
              disabled={selectedOrders.length < 2 || loading}
              loading={loading}
              onClick={handleExecuteMerge}
              icon={<Save size={14} />}
              classNames={{
                root: 'rounded-lg border-none h-8 px-5 font-bold shadow-emerald-100 bg-emerald-600 hover:bg-emerald-700 transition-all text-xs'
              }}
            >
              執行合併計畫
            </Button>
          </div>
        </header>

        <div className='flex-1 overflow-y-auto p-8 custom-scrollbar'>
          <div className='max-w-[1000px] mx-auto'>
            {selectedOrders.length === 0 ? (
              <div className='h-[60vh] flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-100 rounded-[32px] animate-in fade-in zoom-in-95 duration-500'>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={false}
                />
                <h3 className='mt-4 font-black text-slate-400 uppercase tracking-widest text-sm'>
                  Merge Bucket is Empty
                </h3>
                <p className='text-slate-400 text-xs mt-2 text-center'>
                  從左側面板點擊工單，開始進行生產整合
                </p>
              </div>
            ) : (
              <div className='flex flex-col xl:flex-row gap-6 items-center xl:items-start pb-20 relative'>
                {/* 來源工單列表 (多方) */}
                <div className='w-full xl:w-[320px] space-y-3 shrink-0'>
                  <div className='px-4 py-2 flex items-center justify-between'>
                    <span className='text-[10px] font-black text-slate-400 uppercase tracking-widest'>
                      Source Orders
                    </span>
                    <Badge
                      count={selectedOrders.length}
                      style={{ backgroundColor: '#10b981' }}
                    />
                  </div>
                  {selectedOrders.map((order, idx) => (
                    <div key={order.id}>
                      <Card
                        classNames={{
                          root: 'rounded-2xl border-none shadow-sm hover:shadow-md transition-all bg-white relative group'
                        }}
                        styles={{
                          body: { padding: '16px 20px' }
                        }}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-4'>
                            <div className='w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs'>
                              {idx + 1}
                            </div>
                            <div>
                              <div className='text-sm font-black text-slate-700 leading-none'>
                                {order.id}
                              </div>
                              <div className='text-[10px] text-slate-400 mt-1 font-medium'>
                                {order.qty} PCS • Due {order.deadline}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant='text'
                            color='danger'
                            size='small'
                            icon={<Trash2 size={14} />}
                            onClick={() => removeFromMerge(order.id)}
                            classNames={{
                              root: 'rounded-lg h-8 w-8 flex items-center justify-center'
                            }}
                          />
                        </div>
                      </Card>
                    </div>
                  ))}

                  {/* 提示文字區域 */}
                  <div className='p-5 border-2 border-dashed border-slate-100 rounded-[24px] flex flex-col items-center justify-center text-slate-300 bg-slate-50/40 transition-colors group mt-6'>
                    <Plus
                      size={20}
                      className='mb-2 opacity-40 group-hover:scale-110 transition-transform'
                    />
                    <span className='text-[11px] font-bold uppercase tracking-widest'>
                      點擊左側面板加入更多
                    </span>
                    <p className='text-[10px] mt-1 opacity-60'>
                      僅支援相同產品代碼合併
                    </p>
                  </div>
                </div>

                {/* 中間匯流箭頭 */}
                <div className='flex xl:flex-col items-center justify-center py-4 xl:pt-24 shrink-0'>
                  <div className='hidden xl:flex flex-col items-center gap-10'>
                    <div className='w-1 h-20 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full animate-pulse' />
                    <div className='bg-emerald-600 p-2 rounded-full shadow-lg shadow-emerald-200'>
                      <ArrowRight
                        size={24}
                        className='text-white rotate-90 xl:rotate-0'
                      />
                    </div>
                  </div>
                  <div className='xl:hidden'>
                    <ArrowDown
                      size={32}
                      className='text-emerald-500 animate-bounce'
                    />
                  </div>
                </div>

                {/* 合併後的目標工單 (一方) */}
                <div className='w-full xl:w-[400px] shrink-0'>
                  <Card
                    classNames={{
                      root: 'rounded-[32px] border-none shadow-2xl bg-slate-900 text-white overflow-hidden relative group'
                    }}
                    styles={{ body: { padding: '32px' } }}
                  >
                    <div className='absolute -bottom-10 -right-10 p-4 opacity-5 group-hover:scale-125 transition-transform duration-1000'>
                      <Layers size={160} />
                    </div>

                    <div className='relative z-10 space-y-8'>
                      <div>
                        <Tag
                          color='#10b981'
                          className='m-0 border-none text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded'
                        >
                          Target Unified Order
                        </Tag>
                        <h3 className='text-3xl font-black mt-4 tracking-tight leading-none text-emerald-400'>
                          MO-COMB-{dayjs().format('MMDD')}
                        </h3>
                        <p className='text-xs text-slate-400 font-medium mt-4 leading-relaxed opacity-80'>
                          {selectedOrders[0]?.itemCode} |{' '}
                          {selectedOrders[0]?.itemName}
                        </p>
                      </div>

                      <div className='bg-white/5 p-6 rounded-[24px] border border-white/10 space-y-6 shadow-inner'>
                        <div className='flex justify-between items-end'>
                          <div className='text-left'>
                            <div className='text-[10px] text-slate-500 font-black uppercase tracking-widest'>
                              Total Qty
                            </div>
                            <div className='text-3xl font-black text-white leading-none mt-2'>
                              {totalMergedQty.toLocaleString()}
                            </div>
                          </div>
                          <div className='text-right'>
                            <div className='text-[10px] text-slate-500 font-black uppercase tracking-widest'>
                              Sub-Batches
                            </div>
                            <div className='text-lg font-black text-emerald-400 mt-1'>
                              {selectedOrders.length}
                            </div>
                          </div>
                        </div>

                        <Divider className='border-white/10 m-0' />

                        <div className='space-y-4'>
                          <div>
                            <div className='text-[10px] text-slate-500 font-black uppercase mb-2 flex items-center gap-2'>
                              <Cpu size={12} className='text-emerald-500' />{' '}
                              Target Resource
                            </div>
                            <Select
                              defaultValue={machines[0]}
                              className='w-full h-10 custom-select-merge-dark'
                              options={machines.map(m => ({
                                label: m,
                                value: m
                              }))}
                            />
                          </div>
                          <div>
                            <div className='text-[10px] text-slate-500 font-black uppercase mb-2 flex items-center gap-2'>
                              <Clock size={12} className='text-emerald-500' />{' '}
                              Unified Deadline
                            </div>
                            <DatePicker
                              className='w-full h-10 rounded-xl'
                              defaultValue={dayjs(earliestDeadline)}
                            />
                            <div className='mt-2 text-[9px] text-amber-500 flex items-center gap-1'>
                              <AlertCircle size={10} /> 基於最早交期{' '}
                              {earliestDeadline} 自動設定
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

        .custom-select-merge-dark .ant-select-selector {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          border-radius: 12px !important;
        }

        .custom-stats-popover .ant-popover-inner {
          border-radius: 20px !important;
          padding: 16px !important;
          box-shadow: 0 15px 30px -5px rgba(16, 185, 129, 0.15) !important;
          border: 1px solid #d1fae5;
        }

        .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

export default WorkOrderMerge
