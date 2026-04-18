import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Card,
  Button,
  Tag,
  DatePicker,
  Select,
  Badge,
  Divider,
  App
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
  ArrowDown,
  Filter,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import dayjs from 'dayjs'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 樣式合併工具函數
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
const products = [
  { code: 'IC-7022', name: 'M3 Pro Mainboard' },
  { code: 'PN-4500', name: 'Power Module X1' },
  { code: 'CH-9921', name: 'Aluminum Chassis v4' },
  { code: 'BT-1020', name: 'Lithium Battery Pack' },
  { code: 'DS-3301', name: 'OLED Display Unit' },
  { code: 'MT-8812', name: 'Micro Motor' },
  { code: 'LN-1050', name: 'Optical Lens' },
  { code: 'CB-2200', name: 'Flex Cable Unit' }
]

// --- 模擬海量待合併工單庫 (2000 筆) ---
const generateMockSourceOrders = (count: number): WorkOrder[] => {
  return Array.from({ length: count }).map((_, i) => {
    const product = products[i % products.length]
    const date = new Date('2026-04-10')
    date.setDate(date.getDate() + Math.floor(Math.random() * 20))

    return {
      id: `MO-2026-${(i + 1).toString().padStart(4, '0')}`,
      itemCode: product.code,
      itemName: product.name,
      qty: Math.floor(Math.random() * 800) + 100,
      deadline: date.toISOString().split('T')[0],
      status: 'Pending'
    }
  })
}

const mockSourceOrders = generateMockSourceOrders(2000)

const WorkOrderMerge: React.FC = () => {
  const [selectedOrders, setSelectedOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(false)

  // 搜尋與篩選狀態
  const [searchKey, setSearchKey] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [selectedItemCode, setSelectedItemCode] = useState<string>('ALL')
  const [isTagsExpanded, setIsTagsExpanded] = useState(false) // 控制標籤展開/收起

  // 自製虛擬列表狀態
  const listContainerRef = useRef<HTMLDivElement>(null)
  const [listHeight, setListHeight] = useState(600)
  const [scrollTop, setScrollTop] = useState(0)

  const ITEM_HEIGHT = 130 // 每個卡片含間距的高度
  const OVERSCAN = 5 // 上下預留渲染數量
  const MAX_VISIBLE_TAGS = 2 // 預設顯示的標籤數量 (不含「全部」)

  const { message } = App.useApp()

  // 監聽虛擬列表高度
  useEffect(() => {
    if (!listContainerRef.current) return
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setListHeight(entry.contentRect.height)
      }
    })
    resizeObserver.observe(listContainerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // 處理滾動
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  // 搜尋防抖處理
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchKey)
      setIsSearching(false)
      setScrollTop(0) // 搜尋時重置位置
      if (listContainerRef.current) {
        listContainerRef.current.scrollTop = 0
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [searchKey])

  // 執行過濾邏輯
  const filteredOrders = useMemo(() => {
    let result = mockSourceOrders

    // 1. 產品類別過濾
    if (selectedItemCode !== 'ALL') {
      result = result.filter(o => o.itemCode === selectedItemCode)
    }

    // 2. 關鍵字過濾
    if (debouncedSearch.trim() !== '') {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        o =>
          o.id.toLowerCase().includes(q) || o.itemName.toLowerCase().includes(q)
      )
    }

    return result
  }, [debouncedSearch, selectedItemCode])

  // 計算目前可視的項目
  const visibleItems = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN)
    const end = Math.min(
      filteredOrders.length - 1,
      Math.ceil((scrollTop + listHeight) / ITEM_HEIGHT) + OVERSCAN
    )

    const items = []
    for (let i = start; i <= end; i++) {
      if (filteredOrders[i]) {
        items.push({ index: i, item: filteredOrders[i] })
      }
    }
    return items
  }, [scrollTop, listHeight, filteredOrders])

  // 計算合併後的數據
  const totalMergedQty = useMemo(
    () => selectedOrders.reduce((sum, o) => sum + o.qty, 0),
    [selectedOrders]
  )

  const setupTimeSaved = useMemo(
    () => Math.max(0, (selectedOrders.length - 1) * 45),
    [selectedOrders]
  )

  const earliestDeadline = useMemo(() => {
    if (selectedOrders.length === 0) return '-'
    return selectedOrders.reduce(
      (min, o) => (dayjs(o.deadline).isBefore(dayjs(min)) ? o.deadline : min),
      selectedOrders[0].deadline
    )
  }, [selectedOrders])

  // 加入合併桶
  const addToMerge = useCallback(
    (order: WorkOrder) => {
      setSelectedOrders(prev => {
        if (prev.some(o => o.id === order.id)) return prev

        if (prev.length > 0 && prev[0].itemCode !== order.itemCode) {
          message.error('不同產品代碼的工單無法合併生產')
          return prev
        }

        return [...prev, order]
      })
    },
    [message]
  )

  // 從合併桶移除
  const removeFromMerge = (id: string) => {
    setSelectedOrders(prev => prev.filter(o => o.id !== id))
  }

  // 執行合併計畫
  const handleExecuteMerge = () => {
    setLoading(true)
    const hide = message.loading('正在合併工單並重新規劃產能...', 0)
    setTimeout(() => {
      hide()
      message.success('工單合併成功，已生成新的統一工單')
      setSelectedOrders([])
      setLoading(false)
    }, 1500)
  }

  return (
    <div className='flex h-full min-h-[600px] bg-[#f8fafc] overflow-hidden animate-fade-in font-sans text-slate-800'>
      {/* 左欄：待合併候選池 (自製虛擬滾動) */}
      <aside className='w-[360px] bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-[2px_0_8px_rgba(0,0,0,0.02)] z-30'>
        <div className='p-5 border-b border-slate-100 bg-slate-50/50 shrink-0'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-emerald-200'>
                <Merge size={18} />
              </div>
              <span className='font-black text-slate-800 text-sm tracking-tight'>
                待合併工單庫 ({mockSourceOrders.length})
              </span>
            </div>
            <Badge
              count={filteredOrders.length}
              style={{ backgroundColor: '#10b981', boxShadow: 'none' }}
              overflowCount={9999}
            />
          </div>

          <div className='flex flex-col gap-3'>
            <div className='relative'>
              <Search
                size={14}
                className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'
              />
              <input
                type='text'
                placeholder='搜尋編號或產品...'
                value={searchKey}
                onChange={e => {
                  setSearchKey(e.target.value)
                  setIsSearching(true)
                }}
                className='w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-slate-700 placeholder:text-slate-400 shadow-sm'
              />
              {isSearching && (
                <Loader2
                  size={14}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-spin'
                />
              )}
            </div>

            {/* 產品過濾標籤 (換行與展開收起) */}
            <div className='flex flex-col gap-1.5 shrink-0'>
              <div className='flex items-center gap-2 mb-0.5'>
                <Filter size={12} className='text-slate-400' />
                <span className='text-[10px] font-black text-slate-400 uppercase tracking-widest'>
                  Product Filter
                </span>
              </div>

              <div className='flex flex-wrap gap-1.5 transition-all duration-300'>
                <button
                  onClick={() => {
                    setSelectedItemCode('ALL')
                    setScrollTop(0)
                    if (listContainerRef.current)
                      listContainerRef.current.scrollTop = 0
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full text-[10px] font-black transition-all border outline-none',
                    selectedItemCode === 'ALL'
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm ring-1 ring-emerald-200'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                  )}
                >
                  全部
                </button>

                {(isTagsExpanded
                  ? products
                  : products.slice(0, MAX_VISIBLE_TAGS)
                ).map(p => (
                  <button
                    key={p.code}
                    onClick={() => {
                      setSelectedItemCode(p.code)
                      setScrollTop(0)
                      if (listContainerRef.current)
                        listContainerRef.current.scrollTop = 0
                    }}
                    className={cn(
                      'px-3 py-1 rounded-full text-[10px] font-black transition-all border outline-none',
                      selectedItemCode === p.code
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm ring-1 ring-emerald-200'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                    )}
                  >
                    {p.code}
                  </button>
                ))}

                {/* 展開 / 收起按鈕 */}
                {products.length > MAX_VISIBLE_TAGS && (
                  <button
                    onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                    className='text-[10px] text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 px-2 py-1 rounded-full transition-colors hover:bg-emerald-50 font-black'
                  >
                    {isTagsExpanded
                      ? '收起'
                      : `更多 (${products.length - MAX_VISIBLE_TAGS})`}
                    {isTagsExpanded ? (
                      <ChevronUp size={12} />
                    ) : (
                      <ChevronDown size={12} />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 虛擬滾動列表區域 */}
        <div
          className='flex-1 relative bg-slate-50/30 overflow-y-auto custom-scrollbar'
          ref={listContainerRef}
          onScroll={handleScroll}
        >
          {filteredOrders.length === 0 ? (
            <div className='absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2'>
              <Search size={32} className='text-slate-300' />
              <p className='text-sm'>沒有符合的工單資料</p>
            </div>
          ) : (
            <div
              style={{
                height: filteredOrders.length * ITEM_HEIGHT,
                position: 'relative'
              }}
            >
              {visibleItems.map(({ index, item }) => {
                const isAdded = selectedOrders.some(o => o.id === item.id)
                const isItemMismatch =
                  selectedOrders.length > 0 &&
                  selectedOrders[0].itemCode !== item.itemCode

                return (
                  <div
                    key={item.id}
                    className='px-4 py-2'
                    style={{
                      position: 'absolute',
                      top: index * ITEM_HEIGHT,
                      height: ITEM_HEIGHT,
                      width: '100%'
                    }}
                  >
                    <div
                      onClick={() =>
                        !isAdded && !isItemMismatch && addToMerge(item)
                      }
                      className={cn(
                        'group h-full p-4 rounded-2xl cursor-pointer transition-all border relative overflow-hidden flex flex-col justify-between shadow-sm bg-white',
                        isAdded
                          ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                          : isItemMismatch
                            ? 'bg-white border-slate-100 opacity-40 cursor-not-allowed grayscale'
                            : 'border-slate-100 hover:border-emerald-300 hover:shadow-md'
                      )}
                    >
                      <div className='flex justify-between items-center mb-1'>
                        <span className='text-[9px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 uppercase tracking-wider'>
                          {item.itemCode}
                        </span>
                        {isAdded ? (
                          <CheckCircle2
                            size={14}
                            className='text-emerald-500'
                          />
                        ) : (
                          <span className='text-[10px] font-mono font-bold text-slate-300 group-hover:text-emerald-400 transition-colors'>
                            {item.id}
                          </span>
                        )}
                      </div>
                      <h4 className='font-bold text-slate-700 text-sm truncate mb-2'>
                        {item.itemName}
                      </h4>
                      <div className='flex justify-between items-end text-[10px] text-slate-400'>
                        <div className='flex items-center gap-1.5 font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded'>
                          <Clock size={10} /> {item.deadline}
                        </div>
                        <div className='text-right'>
                          <div className='text-slate-800 font-black text-sm leading-none'>
                            {item.qty.toLocaleString()}
                          </div>
                          <div className='font-bold uppercase text-[8px] mt-1'>
                            PCS
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </aside>

      {/* 右欄：合併工作台 */}
      <main className='flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative'>
        <header className='h-14 flex items-center justify-end px-8 bg-white border-b border-slate-200 sticky top-0 z-[100] shadow-sm shrink-0'>
          <div className='flex items-center gap-3 animate-in fade-in slide-in-from-right-2'>
            {/* 節省效能指標 */}
            <div className='flex items-center bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 h-8 shadow-inner'>
              <Sparkles
                size={14}
                className='text-emerald-500 mr-2 animate-pulse'
              />
              <span className='text-[9px] text-emerald-600 font-black uppercase tracking-tight mr-2'>
                Est. Setup Time Saved:
              </span>
              <span className='text-xs font-black text-emerald-700'>
                {setupTimeSaved} MIN
              </span>
            </div>

            <div className='h-6 w-[1px] bg-slate-200 mx-1' />

            <Button
              type='primary'
              size='small'
              disabled={selectedOrders.length < 2 || loading}
              loading={loading}
              onClick={handleExecuteMerge}
              icon={<Save size={14} />}
              className={cn(
                '!rounded-lg  !hover:!bg-emerald-500 !border-none !h-8 !px-6 !font-bold shadow-md hover:shadow-lg transition-all !text-xs',
                selectedOrders.length < 2 || loading
                  ? '!bg-slate-200 !text-slate-400'
                  : '!bg-emerald-600'
              )}
            >
              執行合併計畫
            </Button>
          </div>
        </header>

        <div className='flex-1 overflow-y-auto p-8 custom-scrollbar'>
          <div className='max-w-[1000px] mx-auto'>
            {selectedOrders.length === 0 ? (
              <div className='h-[65vh] flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-[40px] animate-in fade-in zoom-in-95 duration-700 shadow-sm'>
                <div className='w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100'>
                  <Merge size={40} className='text-slate-200' />
                </div>
                <h3 className='font-black text-slate-400 uppercase tracking-widest text-sm'>
                  Merge Bucket is Empty
                </h3>
                <p className='text-slate-400 text-xs mt-3 text-center bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100'>
                  從左側候選池點擊工單，開始進行生產整合與換線優化
                </p>
              </div>
            ) : (
              <div className='flex flex-col xl:flex-row gap-8 items-center xl:items-start pb-20 relative'>
                {/* 來源工單列表 (多方) */}
                <div className='w-full xl:w-[320px] space-y-3 shrink-0'>
                  <div className='px-4 py-1 flex items-center justify-between'>
                    <span className='text-[10px] font-black text-slate-400 uppercase tracking-widest'>
                      Candidate Batches
                    </span>
                    <Badge
                      count={selectedOrders.length}
                      style={{ backgroundColor: '#10b981', boxShadow: 'none' }}
                    />
                  </div>
                  {selectedOrders.map((order, idx) => (
                    <div
                      key={order.id}
                      className='animate-in slide-in-from-left-4 fade-in duration-300'
                    >
                      <Card
                        className='rounded-2xl border-none shadow-sm hover:shadow-md transition-all bg-white relative group border-l-4 border-l-emerald-500 overflow-hidden'
                        styles={{ body: { padding: '16px 20px' } }}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-4'>
                            <div className='w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs shadow-inner shrink-0'>
                              {idx + 1}
                            </div>
                            <div className='min-w-0'>
                              <div className='text-sm font-black text-slate-700 leading-none truncate'>
                                {order.id}
                              </div>
                              <div className='text-[10px] text-slate-400 mt-1.5 font-medium'>
                                <span className='text-slate-800 font-bold'>
                                  {order.qty}
                                </span>{' '}
                                PCS • Due{' '}
                                <span className='text-amber-500'>
                                  {order.deadline}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            type='text'
                            danger
                            size='small'
                            icon={<Trash2 size={16} />}
                            onClick={() => removeFromMerge(order.id)}
                            className='hover:bg-rose-50 rounded-xl h-9 w-9 flex items-center justify-center transition-colors'
                          />
                        </div>
                      </Card>
                    </div>
                  ))}

                  <div className='p-6 border-2 border-dashed border-slate-100 rounded-[28px] flex flex-col items-center justify-center text-slate-300 bg-white/40 transition-all hover:border-emerald-200 mt-6 group'>
                    <Plus
                      size={24}
                      className='mb-2 opacity-30 group-hover:scale-110 transition-transform'
                    />
                    <span className='text-[11px] font-black uppercase tracking-widest text-slate-400'>
                      繼續點擊左側加入
                    </span>
                  </div>
                </div>

                {/* 中間匯流箭頭 */}
                <div className='flex xl:flex-col items-center justify-center py-4 xl:pt-24 shrink-0'>
                  <div className='hidden xl:flex flex-col items-center gap-10'>
                    <div className='w-1 h-20 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full animate-pulse opacity-50' />
                    <div className='bg-emerald-600 p-2 rounded-full shadow-lg shadow-emerald-200 animate-in zoom-in duration-500'>
                      <ArrowRight size={20} className='text-white' />
                    </div>
                  </div>
                  <div className='xl:hidden'>
                    <ArrowDown
                      size={32}
                      className='text-emerald-500 animate-bounce'
                    />
                  </div>
                </div>

                {/* 合併後的目標工單 (一方) - 微調尺寸 */}
                <div className='w-full xl:w-[380px] shrink-0 xl:sticky xl:top-24'>
                  <Card
                    className='rounded-4xl border-none shadow-2xl bg-slate-900 text-white overflow-hidden relative group'
                    styles={{ body: { padding: '32px' } }}
                  >
                    <div className='absolute -bottom-10 -right-10 p-4 opacity-5 group-hover:scale-125 transition-transform duration-1000 pointer-events-none'>
                      <Layers size={150} />
                    </div>

                    <div className='relative z-10 space-y-8'>
                      <div>
                        <Tag
                          color='#10b981'
                          className='m-0 border-none text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm'
                        >
                          Target Unified Order
                        </Tag>
                        <h3 className='text-3xl font-black mt-4 tracking-tight leading-none text-emerald-400'>
                          MO-UNI-{dayjs().format('MMDD')}
                        </h3>
                        <p className='text-xs text-slate-400 font-medium mt-4 leading-relaxed opacity-90'>
                          <span className='text-white font-bold'>
                            {selectedOrders[0]?.itemCode}
                          </span>{' '}
                          | {selectedOrders[0]?.itemName}
                        </p>
                      </div>

                      <div className='bg-white/5 p-6 rounded-3xl border border-white/10 space-y-6 shadow-inner'>
                        <div className='flex justify-between items-end'>
                          <div className='text-left'>
                            <div className='text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2'>
                              Consolidated Qty
                            </div>
                            <div className='text-3xl font-black text-white leading-none'>
                              {totalMergedQty.toLocaleString()}{' '}
                              <span className='text-xs font-medium text-slate-500 ml-1'>
                                PCS
                              </span>
                            </div>
                          </div>
                          <div className='text-right'>
                            <div className='text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2'>
                              Orders
                            </div>
                            <div className='text-xl font-black text-emerald-400'>
                              x{selectedOrders.length}
                            </div>
                          </div>
                        </div>

                        <Divider className='border-white/10 m-0' />

                        <div className='space-y-5'>
                          <div>
                            <div className='text-[10px] text-slate-500 font-black uppercase mb-2 flex items-center gap-2 tracking-widest'>
                              <Cpu size={12} className='text-emerald-500' />{' '}
                              Target Resource
                            </div>
                            <Select
                              defaultValue={machines[0]}
                              className='w-full h-10 custom-select-merge-dark'
                              classNames={{
                                popup: { root: 'custom-select-popup-dark' }
                              }}
                              options={machines.map(m => ({
                                label: m,
                                value: m
                              }))}
                            />
                          </div>
                          <div>
                            <div className='text-[10px] text-slate-500 font-black uppercase mb-2 flex items-center gap-2 tracking-widest'>
                              <Clock size={12} className='text-emerald-500' />{' '}
                              Final Deadline
                            </div>
                            <DatePicker
                              className='w-full h-10 rounded-xl bg-white/5 border-white/10 text-white hover:border-emerald-500'
                              defaultValue={dayjs(earliestDeadline)}
                              format='YYYY-MM-DD'
                              allowClear={false}
                            />
                            <div className='mt-2.5 text-[9px] text-amber-400 flex items-center gap-2 bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/20'>
                              <AlertCircle size={10} /> 基於最早交期自動鎖定
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
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }

        /* Antd Select Dark Style Override */
        .custom-select-merge-dark .ant-select-selector {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          border-radius: 12px !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
        }
        .custom-select-merge-dark .ant-select-selection-item {
          font-weight: 800 !important;
          font-size: 13px !important;
          color: #10b981 !important;
        }
        .custom-select-popup-dark {
          background-color: #1e293b !important;
          border: 1px solid #334155 !important;
          border-radius: 12px !important;
        }
        .custom-select-popup-dark .ant-select-item {
          color: #94a3b8 !important;
        }
        .custom-select-popup-dark .ant-select-item-option-selected {
          background-color: #334155 !important;
          color: white !important;
        }

        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

export default WorkOrderMerge
