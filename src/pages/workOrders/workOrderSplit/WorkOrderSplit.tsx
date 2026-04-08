import React, { useState, useMemo } from 'react'
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
  message,
  Input,
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
  MousePointer2
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

// --- 模擬待拆分工單庫資料 ---
const mockParentOrders: ParentWorkOrder[] = [
  {
    id: 'MO-2026-0422',
    item: 'IC-7022 M3 Pro Mainboard',
    totalQty: 1000,
    originalDeadline: '2026-04-15',
    status: 'Pending',
    priority: 'High'
  },
  {
    id: 'MO-2026-0425',
    item: 'PN-4500 Power Module X1',
    totalQty: 2500,
    originalDeadline: '2026-04-18',
    status: 'Partial',
    priority: 'Medium'
  },
  {
    id: 'MO-2026-0428',
    item: 'CH-9921 Aluminum Chassis',
    totalQty: 500,
    originalDeadline: '2026-04-20',
    status: 'Pending',
    priority: 'Low'
  },
  {
    id: 'MO-2026-0430',
    item: 'BT-1020 Lithium Battery',
    totalQty: 8000,
    originalDeadline: '2026-04-22',
    status: 'Pending',
    priority: 'High'
  },
  {
    id: 'MO-2026-0502',
    item: 'DS-3301 OLED Display',
    totalQty: 1200,
    originalDeadline: '2026-04-25',
    status: 'Partial',
    priority: 'Medium'
  }
]

const WorkOrderSplit: React.FC = () => {
  // 修正：預設不選取任何母單
  const [selectedParent, setSelectedParent] = useState<ParentWorkOrder | null>(
    null
  )
  const [searchKey, setSearchKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [subOrders, setSubOrders] = useState<SubWorkOrder[]>([])

  const handleSelectParent = (order: ParentWorkOrder) => {
    setLoading(true)
    setSelectedParent(order)
    // 切換單子後清空拆分區塊
    setTimeout(() => {
      setSubOrders([])
      setLoading(false)
    }, 400)
  }

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

  const filteredOrders = useMemo(
    () =>
      mockParentOrders.filter(
        o =>
          o.id.includes(searchKey) ||
          o.item.toLowerCase().includes(searchKey.toLowerCase())
      ),
    [searchKey]
  )

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
    <div className='flex h-full w-full bg-[#f8fafc] overflow-hidden animate-fade-in relative'>
      {/* 全畫面 Loading 遮罩 */}
      {loading && (
        <div className='absolute inset-0 bg-white/60 backdrop-blur-sm z-[110] flex items-center justify-center animate-in fade-in duration-300'>
          <div className='flex flex-col items-center gap-3'>
            <div className='w-12 h-12 border-4 border-violet-100 border-t-violet-500 rounded-full animate-spin' />
            <span className='text-xs font-black text-violet-600 tracking-widest uppercase'>
              Syncing Workspace...
            </span>
          </div>
        </div>
      )}

      {/* 左欄：側邊清單 */}
      <aside className='w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm z-30'>
        <div className='p-5 border-b border-slate-100 bg-slate-50/50'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-violet-100'>
                <Scissors size={18} />
              </div>
              <span className='font-black text-slate-800 text-sm tracking-tight'>
                工單拆分工作台
              </span>
            </div>
            <Badge
              count={filteredOrders.length}
              style={{ backgroundColor: '#8b5cf6' }}
            />
          </div>
          <Input
            prefix={<Search size={14} className='text-slate-400' />}
            placeholder='搜尋母工單編號...'
            className='rounded-xl h-10 border-slate-200'
            onChange={e => setSearchKey(e.target.value)}
          />
        </div>

        <div className='flex-1 overflow-y-auto p-3 custom-scrollbar'>
          {filteredOrders.map(item => (
            <div
              key={item.id}
              onClick={() => handleSelectParent(item)}
              className={cn(
                'group p-4 mb-3 rounded-2xl cursor-pointer transition-all border relative overflow-hidden',
                selectedParent?.id === item.id
                  ? 'bg-violet-50 border-violet-200 ring-1 ring-violet-200 shadow-sm'
                  : 'bg-white border-slate-100 hover:border-violet-200'
              )}
            >
              <div className='flex justify-between items-center mb-1.5'>
                <Tag
                  color={item.status === 'Partial' ? 'warning' : 'default'}
                  className='m-0 text-[9px] rounded-md font-bold px-2'
                >
                  {item.status === 'Partial' ? '部分拆分' : '待拆分'}
                </Tag>
                <span className='text-[10px] font-mono text-slate-300'>
                  #{item.id.split('-').pop()}
                </span>
              </div>
              <h4 className='font-bold text-slate-700 text-sm truncate mb-2'>
                {item.item}
              </h4>
              <div className='flex justify-between items-end text-[10px] text-slate-400'>
                <span>{item.id}</span>
                <span className='text-slate-800 font-black'>
                  {item.totalQty.toLocaleString()}{' '}
                  <span className='font-normal text-slate-400'>PCS</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* 右欄：主工作台 */}
      <main className='flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative'>
        {/* 精簡型 Header */}
        <header className='h-14 flex items-center justify-end px-8 bg-white border-b border-slate-200 sticky top-0 z-[100] shrink-0'>
          {selectedParent && (
            <div className='flex items-center gap-3 animate-in fade-in slide-in-from-right-2'>
              <Popover
                content={aiSuggestionContent}
                trigger='click'
                placement='bottomRight'
                classNames={{ root: 'custom-stats-popover' }}
              >
                <Button
                  variant='filled'
                  color='primary'
                  size='small'
                  icon={<Sparkles size={14} />}
                  className='rounded-lg h-8 w-8 flex items-center justify-center shadow-none border-none'
                />
              </Popover>

              <div className='flex items-center bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 h-8 whitespace-nowrap'>
                <span className='text-[9px] text-slate-400 font-black uppercase tracking-tight mr-2'>
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
                variant='solid'
                color='primary'
                size='small'
                disabled={subOrders.length === 0 || loading}
                onClick={handleExecuteSplit}
                icon={<Save size={14} />}
                className='rounded-lg border-none h-8 px-5 font-bold shadow-sm hover:opacity-90 transition-all text-xs'
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
              <div className='w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6'>
                <MousePointer2 size={32} className='text-slate-200' />
              </div>
              <h3 className='text-lg font-black text-slate-400 uppercase tracking-widest'>
                請先選取待拆分母單
              </h3>
              <p className='text-xs text-slate-300 mt-2'>
                點擊左側清單中的工單，即可進入拆分模擬模式
              </p>
            </div>
          ) : (
            <div className='flex flex-col xl:flex-row gap-10 items-start max-w-[1200px] mx-auto pb-20'>
              {/* 母單卡片 */}
              <div className='w-full xl:w-72 shrink-0'>
                <Card
                  className='rounded-[28px] border-none shadow-xl bg-slate-900 text-white overflow-hidden relative'
                  styles={{ body: { padding: '24px' } }}
                >
                  <div className='absolute -bottom-6 -right-6 p-4 opacity-5'>
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
                          trailColor='rgba(255,255,255,0.1)'
                          size={{ height: 6 }}
                        />
                      </div>
                      <div className='flex justify-between items-center py-1'>
                        <div className='text-center'>
                          <div className='text-[8px] text-slate-500 font-bold uppercase'>
                            Assigned
                          </div>
                          <div className='text-base font-black text-violet-400'>
                            {splitQtySum.toLocaleString()}
                          </div>
                        </div>
                        <div className='h-6 w-[1px] bg-white/10' />
                        <div className='text-center'>
                          <div className='text-[8px] text-slate-500 font-bold uppercase'>
                            Remaining
                          </div>
                          <div
                            className={cn(
                              'text-base font-black mt-1',
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
                    <div className='flex items-center gap-2 text-[10px] text-slate-500 font-bold bg-white/5 p-2.5 rounded-xl border border-white/5'>
                      <Clock size={12} className='text-violet-400' /> Deadline:{' '}
                      {selectedParent.originalDeadline}
                    </div>
                  </div>
                </Card>
                <Button
                  block
                  variant='dashed'
                  color='primary'
                  icon={<Plus size={16} />}
                  onClick={addSubOrder}
                  className='mt-6 !h-12 !rounded-[20px] font-black transition-all bg-white border-2'
                >
                  新增拆分節點
                </Button>
              </div>

              {/* 子單列表：佈局優化 */}
              <div className='flex-1 space-y-5 w-full'>
                {subOrders.length === 0 ? (
                  <div className='bg-white border-2 border-dashed border-slate-100 rounded-[28px] p-24 flex flex-col items-center text-slate-300 shadow-sm animate-in zoom-in-95 duration-500'>
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={false}
                    />
                    <p className='mt-4 font-black text-[11px] uppercase tracking-widest text-slate-400'>
                      目前尚未分配任何子工單
                    </p>
                    <p className='text-[10px] text-slate-300 mt-1'>
                      請點擊左側「新增拆分節點」開始進行產能分配
                    </p>
                  </div>
                ) : (
                  subOrders.map((sub, index) => (
                    <div key={sub.id}>
                      <Card
                        className='rounded-[24px] border-none shadow-sm hover:shadow-md transition-all bg-white border-l-[8px] border-l-violet-500 overflow-hidden'
                        styles={{ body: { padding: '24px' } }}
                      >
                        {/* 頁首：Index, Title 與 垃圾桶 (垃圾桶移動到右上方) */}
                        <div className='flex items-center justify-between mb-6'>
                          <div className='flex items-center gap-4'>
                            <div className='w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-violet-100 shrink-0'>
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
                              variant='text'
                              color='danger'
                              icon={<Trash2 size={18} />}
                              onClick={() => removeSubOrder(sub.id)}
                              className='hover:bg-rose-50 rounded-xl flex items-center justify-center h-10 w-10 transition-colors shrink-0'
                            />
                          </Tooltip>
                        </div>

                        {/* 輸入區：數量、機台、時段 (獨立於下一行) */}
                        <div className='grid grid-cols-1 md:grid-cols-12 gap-6'>
                          {/* 數量分配：佔 3/12 */}
                          <div className='md:col-span-3'>
                            <div className='text-[10px] text-slate-400 font-black uppercase mb-2 flex items-center gap-1.5 tracking-wider'>
                              <Layers size={12} className='text-violet-500' />{' '}
                              分配數量
                            </div>
                            <InputNumber
                              min={1}
                              value={sub.qty}
                              onChange={val => updateQty(sub.id, val)}
                              className='!w-full rounded-lg font-black text-violet-600 h-10 shadow-sm'
                              controls={false}
                            />
                          </div>

                          {/* 機台選擇：佔 3/12 */}
                          <div className='md:col-span-3'>
                            <div className='text-[10px] text-slate-400 font-black uppercase mb-2 flex items-center gap-1.5 tracking-wider'>
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
                          <div className='md:col-span-6'>
                            <div className='text-[10px] text-slate-400 font-black uppercase mb-2 flex items-center gap-1.5 tracking-wider'>
                              <Clock size={12} className='text-violet-500' />{' '}
                              生產預估時段
                            </div>
                            <DatePicker.RangePicker
                              defaultValue={[
                                dayjs(sub.startDate),
                                dayjs(sub.endDate)
                              ]}
                              className='w-full rounded-lg border-slate-200 h-10 shadow-sm'
                              size='middle'
                              inputReadOnly
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
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .ant-input-number:hover, .ant-input-number-focused, .ant-select:not(.ant-select-disabled):hover .ant-select-selector, .ant-picker:hover, .ant-picker-focused {
           border-color: #8b5cf6 !important;
        }
        .custom-select-split-compact .ant-select-selector {
          border-radius: 8px !important;
          height: 40px !important;
          font-weight: 700 !important;
        }
        .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

export default WorkOrderSplit
