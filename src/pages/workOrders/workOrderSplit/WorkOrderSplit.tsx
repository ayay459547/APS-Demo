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
  Sparkles
} from 'lucide-react'
import dayjs from 'dayjs'

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
  const [selectedParent, setSelectedParent] = useState<ParentWorkOrder>(
    mockParentOrders[2]
  )
  const [searchKey, setSearchKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [subOrders, setSubOrders] = useState<SubWorkOrder[]>([
    {
      id: 'SO-001',
      qty: 250,
      machineId: 'CNC-01',
      startDate: '2026-04-01',
      endDate: '2026-04-05'
    }
  ])

  const handleSelectParent = (order: ParentWorkOrder) => {
    setLoading(true)
    setSelectedParent(order)
    // 模擬非同步數據切換
    setTimeout(() => {
      setSubOrders([
        {
          id: 'SO-001',
          qty: Math.floor(order.totalQty / 2),
          machineId: machines[0],
          startDate: dayjs().format('YYYY-MM-DD'),
          endDate: dayjs().add(3, 'day').format('YYYY-MM-DD')
        }
      ])
      setLoading(false)
    }, 300)
  }

  const splitQtySum = useMemo(
    () => subOrders.reduce((sum, item) => sum + (item.qty || 0), 0),
    [subOrders]
  )
  const remainingQty = selectedParent.totalQty - splitQtySum
  const isBalanced = splitQtySum === selectedParent.totalQty

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

  const removeSubOrder = (id: string) => {
    setSubOrders(subOrders.filter(o => o.id !== id))
  }

  const updateQty = (id: string, value: number | null) => {
    setSubOrders(
      subOrders.map(o => (o.id === id ? { ...o, qty: value || 0 } : o))
    )
  }

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
          <span className='font-bold text-slate-700'>{selectedParent.id}</span>{' '}
          建議拆分為 <span className='text-violet-600 font-bold'>3 個子單</span>{' '}
          以優化產能。
        </p>
        <div className='grid grid-cols-2 gap-2 text-center'>
          <div className='bg-slate-50 p-2 rounded-xl border border-slate-100'>
            <div className='text-[9px] text-slate-400 font-bold uppercase mb-1'>
              Capacity
            </div>
            <div className='text-xs font-black text-emerald-600'>12,000</div>
          </div>
          <div className='bg-slate-50 p-2 rounded-xl border border-slate-100'>
            <div className='text-[9px] text-slate-400 font-bold uppercase mb-1'>
              LeadTime
            </div>
            <div className='text-xs font-black text-violet-600'>-1.5 D</div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className='flex h-full bg-[#f8fafc] overflow-hidden animate-fade-in'>
      {/* 左欄：工單瀏覽池 */}
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
            classNames={{ root: 'rounded-xl border-slate-200 h-10' }}
            onChange={e => setSearchKey(e.target.value)}
          />
        </div>

        <div className='flex-1 overflow-y-auto p-3 custom-scrollbar'>
          {filteredOrders.map(item => (
            <div
              key={item.id}
              onClick={() => handleSelectParent(item)}
              className={`group p-4 mb-3 rounded-2xl cursor-pointer transition-all border relative overflow-hidden ${
                selectedParent.id === item.id
                  ? 'bg-violet-50 border-violet-200 ring-2 ring-violet-50'
                  : 'bg-white border-slate-100 hover:border-violet-200 hover:shadow-sm'
              }`}
            >
              <div className='flex justify-between items-center mb-2'>
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                    item.status === 'Partial'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.status === 'Partial' ? '部分拆分' : '待拆分'}
                </span>
                <span className='text-[10px] font-mono text-slate-300'>
                  #{item.id.split('-').pop()}
                </span>
              </div>
              <h4 className='font-bold text-slate-700 text-sm truncate mb-2'>
                {item.item}
              </h4>
              <div className='flex justify-between items-end text-[10px] text-slate-400'>
                <span>{item.id}</span>
                <div className='text-right'>
                  <div className='text-slate-800 font-black'>
                    {item.totalQty.toLocaleString()}
                  </div>
                  <div className='font-bold uppercase text-[8px]'>
                    Planned PCS
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* 右欄：主工作台 */}
      <main className='relative flex-1 flex flex-col min-w-0 bg-[#f8fafc]'>
        {/* 全畫面 Loading 遮罩 (修正：移至 main 最外層以覆蓋 Header) */}
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

        {/* 精簡型 Header：移除文字，採用語義化 Button 寫法 */}
        <header className='h-14 flex items-center justify-end px-8 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm shrink-0'>
          <div className='flex items-center gap-3'>
            {/* AI 建議：variant="filled" color="primary" */}
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
                classNames={{ root: 'rounded-lg h-8 px-2.5 shadow-none' }}
              />
            </Popover>

            {/* 平衡指示器 */}
            <div className='flex items-center bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 h-8'>
              <div className='flex items-center gap-2'>
                <span className='text-[9px] text-slate-400 font-black uppercase tracking-tight'>
                  Split Balance:
                </span>
                <span className='text-xs font-black text-slate-800'>
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
            </div>

            {/* 提交按鈕：variant="solid" color="primary" */}
            <Button
              variant='solid'
              color='primary'
              size='small'
              disabled={!isBalanced || loading}
              icon={<Save size={14} />}
              classNames={{
                root: 'rounded-lg h-8 px-5 font-bold shadow-violet-100 hover:opacity-90 transition-all text-xs border-none'
              }}
            >
              提交排程
            </Button>
          </div>
        </header>

        {/* 視覺化編輯畫布 */}
        <div className='flex-1 overflow-y-auto p-6 custom-scrollbar relative'>
          <div className='flex flex-col xl:flex-row gap-10 items-start max-w-[1100px] mx-auto pb-20'>
            {/* 母單卡片 (非浮動) */}
            <div className='w-full xl:w-72 shrink-0'>
              <Card
                classNames={{
                  root: 'rounded-[28px] border-none shadow-2xl bg-slate-900 text-white overflow-hidden relative'
                }}
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

                  <div className='bg-white/5 p-4 rounded-[20px] border border-white/10 space-y-5 backdrop-blur-sm'>
                    <div>
                      <div className='flex justify-between text-[9px] font-black mb-1.5 uppercase text-slate-500 tracking-widest'>
                        <span>Goal</span>
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
                        railColor='rgba(255,255,255,0.05)'
                        size={{ height: 6 }}
                      />
                    </div>

                    <div className='flex justify-between items-center py-1'>
                      <div className='text-left'>
                        <div className='text-[8px] text-slate-500 uppercase font-black tracking-widest'>
                          Assigned
                        </div>
                        <div className='text-base font-black text-violet-400 mt-1'>
                          {splitQtySum.toLocaleString()}
                        </div>
                      </div>
                      <div className='h-8 w-[1px] bg-white/10 mx-1' />
                      <div className='text-right'>
                        <div className='text-[8px] text-slate-500 uppercase font-black tracking-widest'>
                          Remaining
                        </div>
                        <div
                          className={`text-base font-black mt-1 ${remainingQty === 0 ? 'text-emerald-400' : 'text-rose-400'}`}
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

              {/* 新增節點按鈕：variant="dashed" color="primary" */}
              <Button
                block
                variant='dashed'
                color='primary'
                icon={<Plus size={16} />}
                onClick={addSubOrder}
                classNames={{
                  root: 'mt-6 h-12 rounded-[20px] font-black transition-all flex items-center justify-center gap-2 bg-white'
                }}
              >
                <span>新增拆分節點</span>
              </Button>
            </div>

            {/* 子工單列表：緊湊版 */}
            <div className='flex flex-col gap-4 flex-1 space-y-4 w-full'>
              {subOrders.length === 0 ? (
                <div className='bg-white border-2 border-dashed border-slate-100 rounded-[28px] p-20 flex flex-col items-center text-slate-300'>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={false}
                  />
                  <p className='mt-4 font-black text-[11px] uppercase tracking-widest text-slate-400'>
                    Workspace Empty
                  </p>
                </div>
              ) : (
                subOrders.map((sub, index) => (
                  <Card
                    key={sub.id}
                    classNames={{
                      root: 'rounded-[24px] border-none shadow-sm hover:shadow-md transition-all bg-white border-l-[8px] border-l-violet-500'
                    }}
                    styles={{ body: { padding: '20px' } }}
                  >
                    <div className='flex flex-wrap flex-col xl:flex-row xl:items-center gap-6'>
                      <div className='flex items-center gap-4 shrink-0 w-full'>
                        <div className='w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-violet-100'>
                          {index + 1}
                        </div>
                        <div>
                          <div className='text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1'>
                            Sub-Process
                          </div>
                          <div className='text-sm font-black text-slate-800 tracking-tight'>
                            {sub.id}
                          </div>
                        </div>
                      </div>

                      <div className='flex-1'>
                        <div className='text-[10px] text-slate-400 font-black uppercase mb-1.5 flex items-center gap-1.5 tracking-wider'>
                          <Layers size={12} className='text-violet-500' /> 數量
                        </div>
                        <InputNumber
                          min={1}
                          value={sub.qty}
                          onChange={val => updateQty(sub.id, val)}
                          classNames={{
                            root: 'w-full rounded-lg border-slate-200 font-black text-violet-600 h-9'
                          }}
                          controls={false}
                        />
                      </div>

                      <div className='flex-1'>
                        <div className='text-[10px] text-slate-400 font-black uppercase mb-1.5 flex items-center gap-1.5 tracking-wider'>
                          <Cpu size={12} className='text-violet-500' /> 機台
                        </div>
                        <Select
                          defaultValue={sub.machineId}
                          classNames={{
                            root: 'w-full custom-select-split-compact h-9'
                          }}
                          options={machines.map(m => ({ label: m, value: m }))}
                        />
                      </div>

                      <div className='flex-[1.2]'>
                        <div className='text-[10px] text-slate-400 font-black uppercase mb-1.5 flex items-center gap-1.5 tracking-wider'>
                          <Clock size={12} className='text-violet-500' />{' '}
                          預估時段
                        </div>
                        <DatePicker.RangePicker
                          defaultValue={[
                            dayjs(sub.startDate),
                            dayjs(sub.endDate)
                          ]}
                          classNames={{
                            root: 'w-full rounded-lg border-slate-200 h-9'
                          }}
                          size='small'
                        />
                      </div>

                      <div className='shrink-0 flex items-center self-end xl:self-center'>
                        <Tooltip title='移除'>
                          <Button
                            variant='text'
                            color='danger'
                            icon={<Trash2 size={18} />}
                            onClick={() => removeSubOrder(sub.id)}
                            classNames={{
                              root: 'hover:bg-rose-50 rounded-xl flex items-center justify-center h-10 w-10 transition-colors'
                            }}
                          />
                        </Tooltip>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

        .ant-input-number:hover, .ant-input-number-focused { border-color: #8b5cf6 !important; }
        .ant-select:not(.ant-select-disabled):hover .ant-select-selector { border-color: #8b5cf6 !important; }
        .ant-picker:hover, .ant-picker-focused { border-color: #8b5cf6 !important; }

        .custom-select-split-compact .ant-select-selector {
          border-radius: 8px !important;
          height: 36px !important;
          font-weight: 700 !important;
          font-size: 13px !important;
          padding: 4px 8px !important;
        }

        .custom-stats-popover .ant-popover-inner {
          border-radius: 20px !important;
          padding: 16px !important;
          box-shadow: 0 15px 30px -5px rgba(139, 92, 246, 0.15) !important;
          border: 1px solid #ede9fe;
        }

        .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

export default WorkOrderSplit
