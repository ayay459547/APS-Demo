import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Card,
  Button,
  InputNumber,
  Progress,
  Tag,
  DatePicker,
  Select,
  Badge,
  Tooltip,
  Empty,
  App,
  Popover
} from 'antd'
import {
  Scissors,
  Plus,
  Trash2,
  Cpu,
  Clock,
  Layers,
  Save,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MousePointer2,
  Filter,
  Loader2
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
interface SubWorkOrder {
  id: string
  qty: number
  machineId: string
  startDate: string
  endDate: string
}

interface ParentWorkOrder {
  id: string
  item: string
  totalQty: number
  originalDeadline: string
  status: 'Pending' | 'Partial' | 'Completed'
  priority: 'High' | 'Medium' | 'Low'
}

const machines = ['CNC-01', 'CNC-05', 'SMT-A2', 'ASM-L1', 'Tst-Z9']
const products = [
  'IC-7022 M3 Pro Mainboard',
  'PN-4500 Power Module X1',
  'CH-9921 Aluminum Chassis',
  'BT-1020 Lithium Battery',
  'DS-3301 OLED Display',
  'MT-8812 Micro Motor',
  'LN-1050 Optical Lens',
  'CB-2200 Flex Cable Unit'
]

// --- 模擬海量待拆分工單庫資料 (2000 筆) ---
const generateMockParentOrders = (count: number): ParentWorkOrder[] => {
  const statuses: ('Pending' | 'Partial')[] = ['Pending', 'Partial']
  const priorities: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low']

  return Array.from({ length: count }).map((_, i) => {
    const idNum = i + 1
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const priority = priorities[Math.floor(Math.random() * priorities.length)]
    const item = products[Math.floor(Math.random() * products.length)]

    // 產生隨機未來日期
    const date = new Date('2026-04-10')
    date.setDate(date.getDate() + Math.floor(Math.random() * 30))

    return {
      id: `MO-2026-${idNum.toString().padStart(4, '0')}`,
      item,
      totalQty: Math.floor(Math.random() * 9500) + 500,
      originalDeadline: date.toISOString().split('T')[0],
      status,
      priority
    }
  })
}

const mockParentOrders = generateMockParentOrders(2000)

const WorkOrderSplit: React.FC = () => {
  const [selectedParent, setSelectedParent] = useState<ParentWorkOrder | null>(
    null
  )

  // 搜尋與篩選狀態
  const [searchKey, setSearchKey] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'Pending' | 'Partial'
  >('ALL')

  const [loading, setLoading] = useState(false)
  const [subOrders, setSubOrders] = useState<SubWorkOrder[]>([])

  // 自製虛擬列表狀態
  const listContainerRef = useRef<HTMLDivElement>(null)
  const [listHeight, setListHeight] = useState(600)
  const [scrollTop, setScrollTop] = useState(0)

  const ITEM_HEIGHT = 110 // 預估每個卡片含間距的高度 (98px + 12px padding)
  const OVERSCAN = 5 // 上下額外渲染的數量，防止滾動白畫面

  const { message } = App.useApp()

  // 監聽虛擬列表容器高度
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

  // 處理滾動更新位置
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  // 搜尋防抖 (Debounce)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchKey)
      setIsSearching(false)
      setScrollTop(0) // 搜尋時重置滾動位置
      if (listContainerRef.current) {
        listContainerRef.current.scrollTop = 0
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [searchKey])

  // 執行多維度過濾
  const filteredOrders = useMemo(() => {
    let result = mockParentOrders

    // 1. 關鍵字過濾
    if (debouncedSearch.trim() !== '') {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        o => o.id.toLowerCase().includes(q) || o.item.toLowerCase().includes(q)
      )
    }

    // 2. 狀態過濾
    if (statusFilter !== 'ALL') {
      result = result.filter(o => o.status === statusFilter)
    }

    return result
  }, [debouncedSearch, statusFilter])

  // 計算可視範圍內的渲染節點
  const visibleItems = useMemo(() => {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN
    )
    const endIndex = Math.min(
      filteredOrders.length - 1,
      Math.ceil((scrollTop + listHeight) / ITEM_HEIGHT) + OVERSCAN
    )

    const items = []
    for (let i = startIndex; i <= endIndex; i++) {
      if (filteredOrders[i]) {
        items.push({ index: i, item: filteredOrders[i] })
      }
    }
    return items
  }, [scrollTop, listHeight, filteredOrders])

  const handleSelectParent = useCallback((order: ParentWorkOrder) => {
    setLoading(true)
    setSelectedParent(order)
    // 切換單子後清空拆分區塊
    setTimeout(() => {
      setSubOrders([])
      setLoading(false)
    }, 400)
  }, [])

  const splitQtySum = useMemo(
    () => subOrders.reduce((sum, item) => sum + (item.qty || 0), 0),
    [subOrders]
  )
  const remainingQty = selectedParent
    ? selectedParent.totalQty - splitQtySum
    : 0
  const isBalanced = selectedParent
    ? splitQtySum === selectedParent.totalQty
    : false

  // 提交排程邏輯
  const handleExecuteSplit = () => {
    setLoading(true)
    const hide = message.loading('正在寫入拆分排程數據...', 0)
    setTimeout(() => {
      hide()
      message.success('工單拆分排程下達完成')
      setSubOrders([]) // 提交後清空資料
      setSelectedParent(null) // 回到初始狀態
      setLoading(false)
    }, 1500)
  }

  const addSubOrder = () => {
    if (!selectedParent) return
    if (remainingQty <= 0) {
      message.warning('分配數量已達上限，無法新增。')
      return
    }
    const newId = `SO-${(subOrders.length + 1).toString().padStart(3, '0')}`
    setSubOrders([
      ...subOrders,
      {
        id: newId,
        qty: remainingQty > 100 ? 100 : remainingQty,
        machineId: machines[0],
        startDate: dayjs().format('YYYY-MM-DD'),
        endDate: dayjs().add(3, 'day').format('YYYY-MM-DD')
      }
    ])
  }

  const removeSubOrder = (id: string) =>
    setSubOrders(subOrders.filter(o => o.id !== id))

  const updateQty = (id: string, value: number | null) =>
    setSubOrders(
      subOrders.map(o => (o.id === id ? { ...o, qty: value || 0 } : o))
    )

  const aiSuggestionContent = (
    <div className='w-80 p-1'>
      <div className='flex items-center gap-2 mb-4 border-b border-slate-100 pb-2'>
        <Sparkles size={16} className='text-violet-600' />
        <span className='font-bold text-slate-800 text-sm'>
          APS 智慧建議系統
        </span>
      </div>
      <div className='space-y-4'>
        <p className='text-xs text-slate-500 leading-relaxed'>
          母單{' '}
          <span className='font-bold text-slate-700'>{selectedParent?.id}</span>{' '}
          建議拆分為 <span className='text-violet-600 font-bold'>3 個子單</span>{' '}
          併行作業。
        </p>
      </div>
    </div>
  )

  return (
    <div className='flex h-full min-h-[600px] w-full bg-[#f8fafc] overflow-hidden animate-fade-in relative font-sans'>
      {/* 全畫面 Loading 遮罩 */}
      {loading && (
        <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-110 flex items-center justify-center animate-in fade-in duration-300'>
          <div className='flex flex-col items-center gap-3'>
            <div className='w-12 h-12 border-4 border-violet-100 border-t-violet-500 rounded-full animate-spin' />
            <span className='text-xs font-black text-violet-600 tracking-widest uppercase'>
              Syncing Workspace...
            </span>
          </div>
        </div>
      )}

      {/* 左欄：側邊虛擬渲染清單 */}
      <aside className='w-[340px] bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-[2px_0_8px_rgba(0,0,0,0.02)] z-30'>
        {/* 頂部固定區域 (標題與過濾器) */}
        <div className='p-4 border-b border-slate-100 bg-slate-50/50 shrink-0 z-10'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-violet-200'>
                <Scissors size={16} />
              </div>
              <span className='font-black text-slate-800 text-sm tracking-tight'>
                待拆分母單 ({mockParentOrders.length})
              </span>
            </div>
            <Badge
              count={filteredOrders.length}
              style={{ backgroundColor: '#8b5cf6', boxShadow: 'none' }}
              overflowCount={9999}
            />
          </div>

          {/* 過濾器與搜尋框 */}
          <div className='flex flex-col gap-3'>
            <div className='relative w-full'>
              <Search
                size={14}
                className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'
              />
              <input
                type='text'
                placeholder='搜尋編號、產品名稱...'
                value={searchKey}
                onChange={e => {
                  setSearchKey(e.target.value)
                  setIsSearching(true)
                }}
                className='w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-slate-700 placeholder:text-slate-400'
              />
              {isSearching && (
                <Loader2
                  size={14}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-violet-500 animate-spin'
                />
              )}
            </div>

            {/* --- 更新：狀態快捷過濾標籤 (Tags) --- */}
            <div className='flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar'>
              <Filter size={14} className='text-slate-400 shrink-0 mr-1' />
              {[
                { value: 'ALL', label: '全部' },
                { value: 'Pending', label: '待拆分' },
                { value: 'Partial', label: '部分拆分' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setStatusFilter(opt.value as any)
                    // 重置滾動條位置
                    setScrollTop(0)
                    if (listContainerRef.current)
                      listContainerRef.current.scrollTop = 0
                  }}
                  className={cn(
                    'whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all border outline-none',
                    statusFilter === opt.value
                      ? 'bg-violet-100 text-violet-700 border-violet-200 shadow-sm ring-1 ring-violet-200'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 自製虛擬滾動列表區域 */}
        <div
          className='flex-1 relative bg-slate-50/30 overflow-y-auto custom-scrollbar'
          ref={listContainerRef}
          onScroll={handleScroll}
        >
          {filteredOrders.length === 0 ? (
            <div className='absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2'>
              <Search size={32} className='text-slate-300' />
              <p className='text-sm'>沒有符合的母工單</p>
            </div>
          ) : (
            <div
              style={{
                height: filteredOrders.length * ITEM_HEIGHT,
                position: 'relative'
              }}
            >
              {visibleItems.map(({ index, item }) => {
                const isSelected = selectedParent?.id === item.id

                return (
                  <div
                    key={item.id}
                    className='px-3 py-1.5'
                    style={{
                      position: 'absolute',
                      top: index * ITEM_HEIGHT,
                      height: ITEM_HEIGHT,
                      width: '100%'
                    }}
                  >
                    <div
                      onClick={() => handleSelectParent(item)}
                      className={cn(
                        'group h-full p-4 rounded-2xl cursor-pointer transition-all border relative overflow-hidden flex flex-col justify-between',
                        isSelected
                          ? 'bg-violet-50 border-violet-300 shadow-sm ring-1 ring-violet-200'
                          : 'bg-white border-slate-200 hover:border-violet-300 hover:shadow-sm'
                      )}
                    >
                      <div className='flex justify-between items-start mb-1'>
                        <Tag
                          color={
                            item.status === 'Partial' ? 'warning' : 'default'
                          }
                          className='m-0 text-[10px] rounded-md font-bold px-2 border-none'
                        >
                          {item.status === 'Partial' ? '部分拆分' : '待拆分'}
                        </Tag>
                        <span className='text-[10px] font-mono font-bold text-slate-400 group-hover:text-violet-500 transition-colors'>
                          {item.id}
                        </span>
                      </div>
                      <h4 className='font-bold text-slate-700 text-sm truncate mb-1'>
                        {item.item}
                      </h4>
                      <div className='flex justify-between items-end text-[10px] text-slate-500'>
                        <span className='flex items-center gap-1'>
                          <Clock size={10} className='text-slate-400' />{' '}
                          {item.originalDeadline}
                        </span>
                        <span className='text-slate-800 font-black text-xs'>
                          {item.totalQty.toLocaleString()}{' '}
                          <span className='font-normal text-slate-400 text-[9px]'>
                            PCS
                          </span>
                        </span>
                      </div>

                      {/* 裝飾條 */}
                      {isSelected && (
                        <div className='absolute left-0 top-0 bottom-0 w-1 bg-violet-500' />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </aside>

      {/* 右欄：主工作台 */}
      <main className='flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative'>
        {/* 精簡型 Header */}
        <header className='h-14 flex items-center justify-end px-8 bg-white border-b border-slate-200 sticky top-0 z-[100] shrink-0 shadow-sm'>
          {selectedParent && (
            <div className='flex items-center gap-3 animate-in fade-in slide-in-from-right-2'>
              <Popover
                content={aiSuggestionContent}
                trigger='click'
                placement='bottomRight'
                rootClassName='custom-stats-popover'
              >
                <Button
                  type='primary'
                  size='small'
                  icon={<Sparkles size={14} />}
                  className='!rounded-lg !h-8 !w-8 flex items-center justify-center shadow-none bg-violet-100 text-violet-600 hover:!bg-violet-200 border-none'
                />
              </Popover>

              <div className='flex items-center bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 h-8 whitespace-nowrap shadow-inner'>
                <span className='text-[9px] text-slate-500 font-black uppercase tracking-tight mr-2'>
                  Split Balance:
                </span>
                <span className='text-xs font-black text-slate-800 mr-1'>
                  {splitQtySum.toLocaleString()} /{' '}
                  {selectedParent.totalQty.toLocaleString()}
                </span>
                {!isBalanced ? (
                  <AlertCircle
                    size={12}
                    className='text-amber-500 animate-pulse'
                  />
                ) : (
                  <CheckCircle2 size={12} className='text-emerald-500' />
                )}
              </div>

              <Button
                type='primary'
                size='small'
                disabled={subOrders.length === 0 || loading}
                onClick={handleExecuteSplit}
                icon={<Save size={14} />}
                className={cn(
                  '!rounded-lg !hover:!bg-violet-500 !border-none !h-8 !px-5 !font-bold shadow-md hover:shadow-lg transition-all !text-xs disabled:shadow-none',
                  subOrders.length === 0 || loading
                    ? '!bg-slate-300 !text-slate-500'
                    : '!bg-violet-600'
                )}
              >
                提交排程
              </Button>
            </div>
          )}
        </header>

        {/* 視覺化編輯區畫布 */}
        <div className='flex-1 overflow-y-auto p-8 custom-scrollbar'>
          {!selectedParent ? (
            <div className='h-full flex flex-col items-center justify-center text-slate-300 animate-in fade-in zoom-in-95 duration-700'>
              <div className='w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100'>
                <MousePointer2 size={36} className='text-slate-300' />
              </div>
              <h3 className='text-lg font-black text-slate-400 uppercase tracking-widest'>
                請先選取待拆分母單
              </h3>
              <p className='text-sm text-slate-400 mt-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100'>
                點擊左側清單中的工單，即可進入拆分模擬模式
              </p>
            </div>
          ) : (
            <div className='flex flex-col xl:flex-row gap-8 items-start max-w-[1200px] mx-auto pb-20'>
              {/* 母單卡片 (Sticky on Desktop) */}
              <div className='w-full xl:w-72 shrink-0 xl:sticky xl:top-8'>
                <Card
                  className='rounded-[28px] border-none shadow-xl bg-slate-900 text-white overflow-hidden relative'
                  styles={{ body: { padding: '24px' } }}
                >
                  <div className='absolute -bottom-6 -right-6 p-4 opacity-5 pointer-events-none'>
                    <Layers size={120} />
                  </div>
                  <div className='relative z-10 space-y-6'>
                    <div>
                      <Tag
                        color='#8b5cf6'
                        className='m-0 border-none text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm'
                      >
                        Primary Order
                      </Tag>
                      <h3 className='text-2xl font-black mt-3 tracking-tight'>
                        {selectedParent.id}
                      </h3>
                      <p className='text-[11px] text-slate-400 font-medium leading-relaxed mt-3 opacity-80'>
                        {selectedParent.item}
                      </p>
                    </div>
                    <div className='bg-white/5 p-4 rounded-[20px] border border-white/10 space-y-4'>
                      <div>
                        <div className='flex justify-between text-[9px] font-black mb-1.5 text-slate-500 uppercase tracking-wider'>
                          <span>GOAL</span>
                          <span className='text-white'>
                            {selectedParent.totalQty.toLocaleString()}
                          </span>
                        </div>
                        <Progress
                          percent={Math.min(
                            (splitQtySum / selectedParent.totalQty) * 100,
                            100
                          )}
                          showInfo={false}
                          strokeColor='#8b5cf6'
                          railColor='rgba(255,255,255,0.1)'
                          size={{ height: 6 }}
                        />
                      </div>
                      <div className='flex justify-between items-center py-1'>
                        <div className='text-center'>
                          <div className='text-[8px] text-slate-500 font-bold uppercase tracking-wider'>
                            Assigned
                          </div>
                          <div className='text-base font-black text-violet-400 mt-0.5'>
                            {splitQtySum.toLocaleString()}
                          </div>
                        </div>
                        <div className='h-6 w-[1px] bg-white/10' />
                        <div className='text-center'>
                          <div className='text-[8px] text-slate-500 font-bold uppercase tracking-wider'>
                            Remaining
                          </div>
                          <div
                            className={cn(
                              'text-base font-black mt-0.5',
                              remainingQty === 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            )}
                          >
                            {remainingQty.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center gap-2 text-[10px] text-slate-300 font-bold bg-white/5 p-3 rounded-xl border border-white/5'>
                      <Clock size={14} className='text-violet-400 shrink-0' />
                      <span>
                        Deadline:{' '}
                        <span className='text-white'>
                          {selectedParent.originalDeadline}
                        </span>
                      </span>
                    </div>
                  </div>
                </Card>

                <Button
                  block
                  type='dashed'
                  icon={<Plus size={16} />}
                  onClick={addSubOrder}
                  className='mt-6 !h-12 !rounded-[20px] font-black transition-all bg-white border-2 border-slate-200 text-violet-600 hover:!border-violet-400 hover:!text-violet-500 shadow-sm'
                >
                  新增拆分節點
                </Button>
              </div>

              {/* 子單列表 */}
              <div className='flex-1 space-y-4 w-full'>
                {subOrders.length === 0 ? (
                  <div className='bg-white border-2 border-dashed border-slate-200 rounded-[28px] p-16 xl:p-24 flex flex-col items-center text-slate-300 shadow-sm animate-in zoom-in-95 duration-500'>
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={false}
                    />
                    <p className='mt-4 font-black text-[12px] uppercase tracking-widest text-slate-400'>
                      目前尚未分配任何子工單
                    </p>
                    <p className='text-[11px] text-slate-400 mt-1 bg-slate-50 px-3 py-1 rounded-md'>
                      請點擊左側「新增拆分節點」開始進行產能分配
                    </p>
                  </div>
                ) : (
                  subOrders.map((sub, index) => (
                    <div
                      key={sub.id}
                      className='animate-in fade-in slide-in-from-bottom-4 duration-300'
                    >
                      <Card
                        className='rounded-3xl border-none shadow-sm hover:shadow-md transition-shadow bg-white border-l-[6px] border-l-violet-500 overflow-hidden'
                        styles={{ body: { padding: '20px 24px' } }}
                      >
                        {/* 頁首：Index, Title 與 垃圾桶 */}
                        <div className='flex items-center justify-between mb-5'>
                          <div className='flex items-center gap-3'>
                            <div className='w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-black text-sm shadow-inner shrink-0'>
                              {index + 1}
                            </div>
                            <div className='min-w-0'>
                              <div className='text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1'>
                                Sub-Process
                              </div>
                              <div className='text-sm font-black text-slate-800 tracking-tight'>
                                {sub.id}
                              </div>
                            </div>
                          </div>

                          <Tooltip title='移除此拆分節點'>
                            <Button
                              type='text'
                              danger
                              icon={<Trash2 size={16} />}
                              onClick={() => removeSubOrder(sub.id)}
                              className='hover:bg-rose-50 rounded-xl flex items-center justify-center h-9 w-9 transition-colors shrink-0'
                            />
                          </Tooltip>
                        </div>

                        {/* 輸入區：數量、機台、時段 */}
                        <div className='grid grid-cols-1 md:grid-cols-12 gap-5'>
                          {/* 數量分配：佔 3/12 */}
                          <div className='md:col-span-3'>
                            <div className='text-[10px] text-slate-500 font-bold uppercase mb-1.5 flex items-center gap-1.5 tracking-wider'>
                              <Layers size={12} className='text-violet-500' />{' '}
                              分配數量
                            </div>
                            <InputNumber
                              min={1}
                              value={sub.qty}
                              onChange={val => updateQty(sub.id, val)}
                              className='!w-full rounded-xl font-black text-violet-600 h-10 shadow-sm custom-input-number'
                              controls={false}
                            />
                          </div>

                          {/* 機台選擇：佔 3/12 */}
                          <div className='md:col-span-4 lg:col-span-3'>
                            <div className='text-[10px] text-slate-500 font-bold uppercase mb-1.5 flex items-center gap-1.5 tracking-wider'>
                              <Cpu size={12} className='text-violet-500' />{' '}
                              指定機台
                            </div>
                            <Select
                              defaultValue={sub.machineId}
                              className='w-full custom-select-split-compact h-10 shadow-sm'
                              options={machines.map(m => ({
                                label: m,
                                value: m
                              }))}
                            />
                          </div>

                          {/* 時段範圍：佔 6/12 */}
                          <div className='md:col-span-5 lg:col-span-6'>
                            <div className='text-[10px] text-slate-500 font-bold uppercase mb-1.5 flex items-center gap-1.5 tracking-wider'>
                              <Clock size={12} className='text-violet-500' />{' '}
                              生產預估時段
                            </div>
                            <DatePicker.RangePicker
                              defaultValue={[
                                dayjs(sub.startDate),
                                dayjs(sub.endDate)
                              ]}
                              className='w-full rounded-xl border-slate-200 h-10 shadow-sm custom-range-picker'
                              inputReadOnly
                              separator={
                                <span className='text-slate-300 mx-1'>-</span>
                              }
                            />
                          </div>
                        </div>
                      </Card>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        /* 全域滾動條優化 */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }

        /* Antd 元件樣式微調 */
        .ant-input-number.custom-input-number:hover,
        .ant-input-number.custom-input-number-focused,
        .custom-range-picker:hover,
        .custom-range-picker.ant-picker-focused {
           border-color: #8b5cf6 !important;
           box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1) !important;
        }
        .custom-select-split-compact .ant-select-selector {
          border-radius: 12px !important;
          height: 40px !important;
          align-items: center;
          font-weight: 700 !important;
          color: #334155 !important;
        }
        .custom-select-filter .ant-select-selector {
           border-radius: 8px !important;
        }
        .custom-stats-popover .ant-popover-inner {
          border-radius: 16px !important;
          padding: 16px !important;
          box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.15) !important;
          border: 1px solid #ede9fe;
        }

        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

export default WorkOrderSplit
