import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  ConfigProvider,
  Button,
  Tag,
  Badge,
  Select,
  message,
  Progress,
  Drawer,
  Empty,
  Tooltip,
  Statistic,
  Card,
  Space,
  Popover
} from 'antd'
import {
  AlertTriangle,
  Undo2,
  ArchiveRestore,
  ArrowRight,
  Zap,
  Search,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Gauge,
  Factory,
  Layers,
  MonitorPlay,
  BarChart3,
  Box,
  ClipboardList,
  Maximize2,
  Minimize2
} from 'lucide-react'
import dayjs from 'dayjs'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// --- TypeScript 型別定義 ---
export type Priority = 'Urgent' | 'High' | 'Normal'

export interface WorkOrder {
  id: string
  customer: string
  itemName: string
  plannedQty: number
  priority: Priority
  expectedStartHour?: number
}

export interface Machine {
  id: string
  name: string
  type: string
  process: string
  factory: string
}

export interface Task {
  id: string
  woId: string
  stepName: string
  machine: string
  machineType: string
  startHour: number
  duration: number
  priority: Priority
  isConflict?: boolean
  lane?: number
}

export interface DragPreview {
  trackId: string
  startHour: number
}

// 虛擬列表列型別 (Union Type)
export interface BaseRow {
  type: 'level1' | 'level2' | 'track'
  id: string
}

export interface Level1Row extends BaseRow {
  type: 'level1'
  label: string
  icon: React.ReactNode
  count: number
}

export interface Level2Row extends BaseRow {
  type: 'level2'
  parentId: string
  label: string
  icon: React.ReactNode
  count: number
}

export interface TrackRow extends BaseRow {
  type: 'track'
  parentId: string
  label: string
  subLabel: string
  tasks: Task[]
  height: number
  maxLane: number
}

export type FlatRow = Level1Row | Level2Row | TrackRow

// --- 工具函數 ---
function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes))
}

// --- 常數定義 ---
const BASE_DATE = dayjs().startOf('day').add(8, 'hour')
const TOTAL_DAYS = 20
const TOTAL_HOURS = 24 * TOTAL_DAYS
const HOUR_WIDTH = 56
const ROW_BASE_HEIGHT = 56
const SIDEBAR_WIDTH = 320
const HEADER_HEIGHT = 80

// 擴充機台庫
const MACHINES: Machine[] = Array.from({ length: 30 }).map((_, i) => {
  const typeMap = [
    { type: '切割', process: '下料', prefix: 'LSR', name: '超高速雷射' },
    { type: '成型', process: '折彎', prefix: 'BND', name: '智能折彎單元' },
    { type: 'CNC', process: '精銑', prefix: 'CNC', name: '五軸加工中心' },
    { type: '組立', process: '銲接', prefix: 'WLD', name: '自動銲接機器人' },
    { type: '品檢', process: '檢驗', prefix: 'QCS', name: 'AI視覺檢測站' }
  ]
  const cat = typeMap[i % typeMap.length]
  return {
    id: `${cat.prefix}-${String(Math.floor(i / typeMap.length) + 1).padStart(3, '0')}`,
    name: `${cat.name} ${Math.floor(i / typeMap.length) + 1}號機`,
    type: cat.type,
    process: cat.process,
    factory: i % 2 === 0 ? '一廠 (精密製造)' : '二廠 (組裝檢驗)'
  }
})

const STEP_NAMES = [...new Set(MACHINES.map(m => m.process))]

// --- 巨量假資料生成 ---
const generateWorkOrders = (count: number): WorkOrder[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `WO-${2026}${String(i + 1).padStart(4, '0')}`,
    customer: ['SpaceX', 'Tesla Giga', 'NVIDIA', 'Apple', 'ASML'][
      Math.floor(Math.random() * 5)
    ],
    itemName: [
      '衛星支架',
      '電池外殼',
      'AI 伺服器機殼',
      '鈦金屬中框',
      'EUV 反射鏡座'
    ][Math.floor(Math.random() * 5)],
    plannedQty: Math.floor(Math.random() * 500) + 10,
    priority:
      Math.random() > 0.95 ? 'Urgent' : Math.random() > 0.7 ? 'High' : 'Normal'
  }))
}

const generateInitialTasks = (orders: WorkOrder[]): Task[] => {
  const tasks: Task[] = []
  let taskIdCounter = 1

  const machineAvailableHour: Record<string, number> = {}
  MACHINES.forEach(m => (machineAvailableHour[m.id] = 0))

  const sortedOrders = [...orders]
    .map(wo => ({
      ...wo,
      expectedStartHour: Math.floor(Math.random() * (TOTAL_HOURS - 150))
    }))
    .sort((a, b) => (a.expectedStartHour ?? 0) - (b.expectedStartHour ?? 0))

  sortedOrders.forEach(wo => {
    let currentWoHour = wo.expectedStartHour ?? 0
    const numSteps = Math.floor(Math.random() * 3) + 2

    for (let i = 0; i < numSteps; i++) {
      const stepName = STEP_NAMES[Math.floor(Math.random() * STEP_NAMES.length)]

      const capableMachines = MACHINES.filter(m => m.process === stepName)
      capableMachines.sort(
        (a, b) =>
          (machineAvailableHour[a.id] || 0) - (machineAvailableHour[b.id] || 0)
      )
      const machine = capableMachines[0]

      const duration = Math.floor(Math.random() * 6) + 2

      let startHour = Math.max(
        currentWoHour,
        machineAvailableHour[machine.id] || 0
      )
      startHour = Math.ceil(startHour * 2) / 2

      tasks.push({
        id: `T-${taskIdCounter++}`,
        woId: wo.id,
        stepName: stepName,
        machine: machine.id,
        machineType: machine.type,
        startHour,
        duration,
        priority: wo.priority
      })

      machineAvailableHour[machine.id] = startHour + duration + 0.5
      currentWoHour = startHour + duration + 0.5
    }
  })
  return tasks
}

const MOCK_ORDERS = generateWorkOrders(500)
const MOCK_TASKS = generateInitialTasks(MOCK_ORDERS)

const getDefaultExpandedGroups = (mode: string): Set<string> => {
  if (mode === 'MACHINE_TYPE') {
    return new Set([...new Set(MACHINES.map(m => m.type))])
  } else if (mode === 'PROCESS') {
    return new Set([...new Set(MACHINES.map(m => m.process))])
  } else if (mode === 'WORK_ORDER') {
    return new Set(MOCK_ORDERS.map(o => o.id).slice(0, 10))
  }
  return new Set()
}

// --- 高效能元件 (React.memo 緩存機制) ---

const GridBackground = React.memo(() => (
  <div className='absolute inset-0 pointer-events-none z-0 flex'>
    <div className='shrink-0' style={{ width: SIDEBAR_WIDTH }} />
    <div className='flex-1 relative'>
      {Array.from({ length: TOTAL_HOURS / 4 + 1 }).map((_, i) => (
        <div
          key={i}
          className='absolute h-full border-r border-slate-300/80 border-dashed'
          style={{ left: i * 4 * HOUR_WIDTH }}
        />
      ))}
      {Array.from({ length: TOTAL_DAYS + 1 }).map((_, i) => (
        <div
          key={`day-${i}`}
          className='absolute h-full border-r-2 border-slate-400/80 z-0'
          style={{ left: i * 24 * HOUR_WIDTH }}
        />
      ))}
    </div>
  </div>
))

interface GanttRowItemProps {
  row: FlatRow
  top: number
  height: number
  isExpanded: boolean
  groupMode: string
  searchText: string
  draggingTaskId: string | null
  activeDragPreview: DragPreview | null
  draggedTaskDuration: number | null
  onToggleGroup: (id: string) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>, trackId: string) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>, trackId: string) => void
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void
  onDragEnd: () => void
}

const GanttRowItem = React.memo(
  ({
    row,
    top,
    height,
    isExpanded,
    groupMode,
    searchText,
    draggingTaskId,
    activeDragPreview,
    draggedTaskDuration,
    onToggleGroup,
    onDragOver,
    onDrop,
    onDragStart,
    onDragEnd
  }: GanttRowItemProps) => {
    if (row.type === 'level1' || row.type === 'level2') {
      const isLevel1 = row.type === 'level1'
      return (
        <div
          className={cn(
            'absolute w-full flex items-center border-b border-slate-200 cursor-pointer transition-colors z-20',
            isLevel1
              ? 'bg-slate-100 hover:bg-slate-200/80'
              : 'bg-slate-50 hover:bg-slate-100'
          )}
          style={{ top, height }}
          onClick={() => onToggleGroup(row.id)}
        >
          <div
            className={cn(
              'sticky left-0 h-full flex items-center border-r border-slate-200 shadow-[8px_0_24px_-6px_rgba(0,0,0,0.15)] shrink-0 z-40',
              isLevel1 ? 'px-4 bg-slate-100' : 'pl-8 pr-4 bg-slate-50'
            )}
            style={{ width: SIDEBAR_WIDTH }}
          >
            {isExpanded ? (
              <ChevronDown size={16} className='text-slate-500 shrink-0' />
            ) : (
              <ChevronRight size={16} className='text-slate-500 shrink-0' />
            )}
            <div
              className={cn(
                'flex items-center gap-2 ml-2 truncate text-slate-800',
                isLevel1 ? 'font-black text-sm' : 'font-bold text-xs'
              )}
            >
              <span className='text-indigo-600/80'>{row.icon}</span>
              {row.label}
            </div>
            <Tag className='ml-auto border-none bg-white text-slate-500 font-mono font-bold text-[10px] px-1.5 shadow-sm rounded'>
              {row.count} {groupMode === 'WORK_ORDER' ? '道' : '台'}
            </Tag>
          </div>
        </div>
      )
    }

    if (row.type === 'track') {
      return (
        <div
          className='absolute w-full flex border-b border-slate-200 group/row hover:bg-indigo-50/20 transition-colors z-10'
          style={{ top, height }}
        >
          <div
            className='sticky left-0 h-full flex flex-col justify-center pl-14 pr-4 border-r border-slate-200 bg-white group-hover/row:bg-indigo-50/80 transition-colors shadow-[8px_0_24px_-6px_rgba(0,0,0,0.15)] shrink-0 z-40'
            style={{ width: SIDEBAR_WIDTH }}
          >
            <span className='text-xs font-black text-slate-800 truncate'>
              {row.label}
            </span>
            <span className='text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5 font-mono'>
              {row.subLabel}
            </span>
          </div>

          <div
            className='flex-1 relative h-full' // 移除 overflow-hidden，靠數學截斷保護邊界並保留陰影！
            onDragOver={e => onDragOver(e, row.id)}
            onDrop={e => onDrop(e, row.id)}
          >
            {/* 拖拽預覽 */}
            {activeDragPreview &&
              draggedTaskDuration &&
              (() => {
                const displayDragDuration = Math.min(
                  draggedTaskDuration,
                  TOTAL_HOURS - activeDragPreview.startHour
                )
                if (displayDragDuration <= 0) return null
                return (
                  <div
                    className='absolute rounded-lg border-2 border-dashed border-indigo-400 bg-indigo-100/50 z-30 pointer-events-none flex items-center justify-center shadow-inner'
                    style={{
                      left: activeDragPreview.startHour * HOUR_WIDTH,
                      width: displayDragDuration * HOUR_WIDTH,
                      top: 10,
                      height: 36
                    }}
                  >
                    <span className='text-[10px] font-black text-indigo-500 bg-white/80 px-2 rounded shadow-sm'>
                      放置於{' '}
                      {BASE_DATE.add(
                        activeDragPreview.startHour,
                        'hour'
                      ).format('MM/DD HH:mm')}
                    </span>
                  </div>
                )
              })()}

            {/* 實際任務方塊 */}
            {row.tasks.map((task: Task) => {
              if (task.startHour >= TOTAL_HOURS) return null // 若超出邊界，不渲染

              const isDragging = draggingTaskId === task.id
              const searchMatch =
                searchText === '' ||
                task.woId.toLowerCase().includes(searchText.toLowerCase())
              const opacityClass = searchMatch
                ? isDragging
                  ? 'opacity-30 grayscale'
                  : 'opacity-100'
                : 'opacity-10 grayscale pointer-events-none'

              const baseStyle = task.isConflict
                ? 'bg-rose-100 border-[1.5px] border-rose-500 text-rose-800 shadow-rose-200 hover:border-rose-600'
                : task.priority === 'Urgent'
                  ? 'bg-amber-400 border-[1.5px] border-amber-600 text-amber-900 shadow-amber-200'
                  : 'bg-white border-[1.5px] border-slate-400 text-slate-700 shadow-slate-200 hover:border-indigo-500'

              const topOffset = 12 + (task.lane || 0) * 36
              const displayDuration = Math.min(
                task.duration,
                TOTAL_HOURS - task.startHour
              ) // 動態截斷寬度

              return (
                <Tooltip
                  key={task.id}
                  title={
                    <div className='flex flex-col gap-1 text-xs'>
                      <strong className='text-white font-mono'>
                        {task.woId}
                      </strong>
                      <span>
                        客戶：
                        {MOCK_ORDERS.find(o => o.id === task.woId)?.customer}
                      </span>
                      {groupMode === 'WORK_ORDER' && (
                        <span>機台：{task.machine}</span>
                      )}
                      <span>時長：{task.duration} 小時</span>
                      <span>
                        期間：
                        {BASE_DATE.add(task.startHour, 'hour').format(
                          'MM/DD HH:mm'
                        )}{' '}
                        ~{' '}
                        {BASE_DATE.add(
                          task.startHour + task.duration,
                          'hour'
                        ).format('MM/DD HH:mm')}
                      </span>
                    </div>
                  }
                  mouseEnterDelay={0.4}
                >
                  <div
                    draggable
                    onDragStart={e => onDragStart(e, task.id)}
                    onDragEnd={onDragEnd}
                    className={cn(
                      'absolute rounded-md border shadow-sm flex flex-col justify-center px-2 py-1 transition-all cursor-grab active:cursor-grabbing overflow-hidden z-20 hover:shadow-md hover:z-30 hover:-translate-y-0.5',
                      baseStyle,
                      opacityClass,
                      task.isConflict &&
                        !isDragging &&
                        'animate-[pulse_2s_ease-in-out_infinite]'
                    )}
                    style={{
                      left: task.startHour * HOUR_WIDTH,
                      width: displayDuration * HOUR_WIDTH, // 使用裁切後的寬度
                      top: topOffset,
                      height: 32
                    }}
                  >
                    <div className='flex items-center justify-between gap-1 w-full h-full'>
                      <div className='flex flex-col min-w-0 flex-1'>
                        <span className='text-[10px] font-black font-mono truncate leading-none mb-0.5'>
                          {task.woId}
                        </span>
                        {task.duration > 2 && (
                          <span className='text-[9px] font-bold opacity-70 truncate leading-none'>
                            {BASE_DATE.add(task.startHour, 'hour').format(
                              'HH:mm'
                            )}
                          </span>
                        )}
                      </div>
                      {task.isConflict && (
                        <AlertTriangle
                          size={12}
                          className='shrink-0 text-rose-500'
                          strokeWidth={3}
                        />
                      )}
                      {!task.isConflict && task.priority === 'Urgent' && (
                        <Zap size={10} className='shrink-0 opacity-80' />
                      )}
                    </div>
                  </div>
                </Tooltip>
              )
            })}
          </div>
        </div>
      )
    }
    return null
  }
)

const VirtualScrollArea = ({
  flatRows,
  rowPositions,
  totalContentHeight,
  expandedGroups,
  groupMode,
  searchText,
  draggingTaskId,
  dragPreview,
  draftTasks,
  onToggleGroup,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  handleExpandAll,
  handleCollapseAll
}: any) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState<number>(0)
  const [viewportHeight, setViewportHeight] = useState<number>(800)

  useEffect(() => {
    if (!scrollContainerRef.current) return
    const observer = new ResizeObserver(entries => {
      setViewportHeight(entries[0].contentRect.height)
    })
    observer.observe(scrollContainerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={scrollContainerRef}
      className='w-full h-full overflow-auto custom-scrollbar relative bg-[#f8fafc]'
      onScroll={(e: React.UIEvent<HTMLDivElement>) =>
        setScrollTop(e.currentTarget.scrollTop)
      }
    >
      <div
        style={{
          width: SIDEBAR_WIDTH + TOTAL_HOURS * HOUR_WIDTH,
          height: HEADER_HEIGHT + totalContentHeight
        }}
        className='relative' // 移除 overflow-hidden，讓 Sticky 定位可以正常運作！
      >
        {/* --- 雙軸固定頭部 --- */}
        <div
          className='sticky top-0 left-0 z-50 flex flex-col bg-white/95 backdrop-blur shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border-b border-slate-200'
          style={{
            width: SIDEBAR_WIDTH + TOTAL_HOURS * HOUR_WIDTH,
            height: HEADER_HEIGHT
          }}
        >
          <div className='flex h-10 border-b border-slate-200'>
            <div
              className='sticky left-0 z-[55] bg-slate-50 border-r border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-[8px_0_24px_-6px_rgba(0,0,0,0.15)]'
              style={{ width: SIDEBAR_WIDTH }}
            >
              <span className='text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2'>
                <Layers size={14} /> 資源視角
              </span>
              <div className='flex items-center gap-1'>
                <Tooltip title='全部展開' mouseEnterDelay={0.5}>
                  <Button
                    size='small'
                    type='text'
                    className='text-slate-500 hover:text-indigo-600 px-1 hover:bg-slate-200'
                    onClick={handleExpandAll}
                  >
                    <Maximize2 size={14} />
                  </Button>
                </Tooltip>
                <Tooltip title='全部收合' mouseEnterDelay={0.5}>
                  <Button
                    size='small'
                    type='text'
                    className='text-slate-500 hover:text-indigo-600 px-1 hover:bg-slate-200'
                    onClick={handleCollapseAll}
                  >
                    <Minimize2 size={14} />
                  </Button>
                </Tooltip>
              </div>
            </div>
            <div className='flex-1 relative'>
              {Array.from({ length: TOTAL_DAYS }).map((_, i) => (
                <div
                  key={i}
                  className='absolute h-full flex items-center px-4 border-r border-slate-200 font-black text-xs text-slate-800 bg-white'
                  style={{ left: i * 24 * HOUR_WIDTH, width: 24 * HOUR_WIDTH }}
                >
                  {BASE_DATE.add(i, 'day').format('MM月DD日 (dddd)')}
                </div>
              ))}
            </div>
          </div>
          <div className='flex h-10 border-b border-slate-200'>
            <div
              className='sticky left-0 z-[55] bg-white border-r border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-[8px_0_24px_-6px_rgba(0,0,0,0.15)]'
              style={{ width: SIDEBAR_WIDTH }}
            >
              <span className='text-[10px] font-bold text-slate-400'>
                設備清單
              </span>
              <div className='flex gap-1.5'>
                <Tooltip title='正常'>
                  <div className='w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm' />
                </Tooltip>
                <Tooltip title='衝突'>
                  <div className='w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-sm' />
                </Tooltip>
              </div>
            </div>
            <div className='flex-1 relative bg-slate-50/50'>
              {Array.from({ length: TOTAL_HOURS / 4 + 1 }).map((_, i) => (
                <div
                  key={i}
                  className='absolute h-full border-r border-slate-200/60 flex items-center px-1.5 text-[10px] font-mono font-black text-slate-400'
                  style={{ left: i * 4 * HOUR_WIDTH }}
                >
                  {BASE_DATE.add(i * 4, 'hour').format('HH:mm')}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- 虛擬渲染主體 --- */}
        <div style={{ position: 'relative', height: totalContentHeight }}>
          <GridBackground />

          {flatRows.map((row: FlatRow, index: number) => {
            const { top, height } = rowPositions[index]

            // 視窗裁切過濾 (Overscan = 500px)
            if (
              top + height < scrollTop - 500 ||
              top > scrollTop + viewportHeight + 500
            ) {
              return null
            }

            const activeDragPreview =
              draggingTaskId && dragPreview?.trackId === row.id
                ? dragPreview
                : null
            const draggedTaskDuration = activeDragPreview
              ? draftTasks.find((t: Task) => t.id === draggingTaskId)
                  ?.duration || 0
              : null

            return (
              <GanttRowItem
                key={row.id}
                row={row}
                top={top}
                height={height}
                isExpanded={expandedGroups.has(row.id)}
                groupMode={groupMode}
                searchText={searchText}
                draggingTaskId={draggingTaskId}
                activeDragPreview={activeDragPreview}
                draggedTaskDuration={draggedTaskDuration}
                onToggleGroup={onToggleGroup}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

// --- 主畫面入口 (App) ---
export default function SchedulingGantt() {
  const [isCalculated, setIsCalculated] = useState<boolean>(false)
  const [isCalculating, setIsCalculating] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)

  const [groupMode, setGroupMode] = useState<string>('MACHINE_TYPE')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() =>
    getDefaultExpandedGroups('MACHINE_TYPE')
  )
  const [searchText, setSearchText] = useState<string>('')

  const [masterTasks, setMasterTasks] = useState<Task[]>([])
  const [draftTasks, setDraftTasks] = useState<Task[]>([])

  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null)
  const [isStashOpen, setIsStashOpen] = useState<boolean>(false)

  const dragOffsetHourRef = useRef<number>(0)

  const handleGroupModeChange = (newMode: string) => {
    setGroupMode(newMode)
    setExpandedGroups(getDefaultExpandedGroups(newMode))
  }

  const allGroupIds = useMemo(() => {
    if (groupMode === 'MACHINE_TYPE')
      return [...new Set(MACHINES.map(m => m.type))]
    if (groupMode === 'PROCESS')
      return [...new Set(MACHINES.map(m => m.process))]
    if (groupMode === 'WORK_ORDER') return MOCK_ORDERS.map(wo => wo.id)
    return []
  }, [groupMode])

  const handleExpandAll = () => setExpandedGroups(new Set(allGroupIds))
  const handleCollapseAll = () => setExpandedGroups(new Set())

  const handleRunAPS = () => {
    setIsCalculating(true)
    let p = 0
    const interval = window.setInterval(() => {
      p += Math.random() * 20
      if (p >= 100) {
        clearInterval(interval)
        setMasterTasks(MOCK_TASKS)
        setDraftTasks(MOCK_TASKS)
        setIsCalculating(false)
        setIsCalculated(true)
        message.success(
          `AI 排程優化完成！已載入 ${MOCK_ORDERS.length} 筆工單，共 ${MOCK_TASKS.length} 個生產任務節點。`
        )
      }
      setProgress(Math.min(p, 100))
    }, 150)
  }

  const tasksWithLanes = useMemo(() => {
    const updated = draftTasks.map(t => ({ ...t, isConflict: false, lane: 0 }))
    const machineGroups: Record<string, typeof updated> = {}
    const trackGroups: Record<string, typeof updated> = {}

    updated.forEach(t => {
      if (!machineGroups[t.machine]) machineGroups[t.machine] = []
      machineGroups[t.machine].push(t)

      let trackKey = t.machine
      if (groupMode === 'WORK_ORDER') trackKey = `${t.woId}_${t.stepName}`

      if (!trackGroups[trackKey]) trackGroups[trackKey] = []
      trackGroups[trackKey].push(t)
    })

    Object.values(machineGroups).forEach(mTasks => {
      mTasks.sort((a, b) => a.startHour - b.startHour)
      for (let i = 0; i < mTasks.length; i++) {
        for (let j = i + 1; j < mTasks.length; j++) {
          if (
            mTasks[i].startHour + mTasks[i].duration > mTasks[j].startHour &&
            mTasks[i].startHour < mTasks[j].startHour + mTasks[j].duration
          ) {
            mTasks[i].isConflict = true
            mTasks[j].isConflict = true
          }
        }
      }
    })

    Object.values(trackGroups).forEach(tTasks => {
      tTasks.sort((a, b) => a.startHour - b.startHour)
      const laneEnds: number[] = []
      tTasks.forEach(task => {
        let placed = false
        for (let l = 0; l < laneEnds.length; l++) {
          if (laneEnds[l] <= task.startHour) {
            task.lane = l
            laneEnds[l] = task.startHour + task.duration
            placed = true
            break
          }
        }
        if (!placed) {
          task.lane = laneEnds.length
          laneEnds.push(task.startHour + task.duration)
        }
      })
    })

    return updated
  }, [draftTasks, groupMode])

  const stats = useMemo(() => {
    if (!isCalculated) return null
    const conflicts = tasksWithLanes.filter(t => t.isConflict).length
    const urgent = tasksWithLanes.filter(t => t.priority === 'Urgent').length
    const totalHoursFilled = tasksWithLanes.reduce(
      (sum, t) => sum + t.duration,
      0
    )
    const utilization = (
      (totalHoursFilled / (MACHINES.length * TOTAL_HOURS)) *
      100
    ).toFixed(1)
    return { conflicts, urgent, utilization }
  }, [tasksWithLanes, isCalculated])

  const flatRows = useMemo(() => {
    if (!isCalculated) return []
    const rows: FlatRow[] = []

    if (groupMode === 'MACHINE_TYPE') {
      const types = [...new Set(MACHINES.map(m => m.type))]
      types.forEach(type => {
        const mInType = MACHINES.filter(m => m.type === type)
        rows.push({
          type: 'level1',
          id: type,
          label: `${type} 設備區`,
          icon: <Box size={16} />,
          count: mInType.length
        })
        if (expandedGroups.has(type)) {
          mInType.forEach(m => {
            const mTasks = tasksWithLanes.filter(t => t.machine === m.id)
            const maxLane =
              mTasks.length > 0 ? Math.max(...mTasks.map(t => t.lane || 0)) : 0
            const dynamicHeight = Math.max(
              ROW_BASE_HEIGHT,
              24 + (maxLane + 1) * 36
            )
            rows.push({
              type: 'track',
              id: m.id,
              parentId: type,
              label: m.name,
              subLabel: m.id,
              tasks: mTasks,
              height: dynamicHeight,
              maxLane
            })
          })
        }
      })
    } else if (groupMode === 'PROCESS') {
      const processes = [...new Set(MACHINES.map(m => m.process))]
      processes.forEach(process => {
        const mInProcess = MACHINES.filter(m => m.process === process)
        rows.push({
          type: 'level1',
          id: process,
          label: `${process} 加工製程`,
          icon: <Factory size={16} />,
          count: mInProcess.length
        })
        if (expandedGroups.has(process)) {
          mInProcess.forEach(m => {
            const mTasks = tasksWithLanes.filter(t => t.machine === m.id)
            const maxLane =
              mTasks.length > 0 ? Math.max(...mTasks.map(t => t.lane || 0)) : 0
            const dynamicHeight = Math.max(
              ROW_BASE_HEIGHT,
              24 + (maxLane + 1) * 36
            )
            rows.push({
              type: 'track',
              id: m.id,
              parentId: process,
              label: m.name,
              subLabel: m.id,
              tasks: mTasks,
              height: dynamicHeight,
              maxLane
            })
          })
        }
      })
    } else if (groupMode === 'WORK_ORDER') {
      MOCK_ORDERS.forEach(wo => {
        const woTasks = tasksWithLanes.filter(t => t.woId === wo.id)
        if (woTasks.length === 0) return
        rows.push({
          type: 'level1',
          id: wo.id,
          label: `${wo.id} - ${wo.customer}`,
          icon: <ClipboardList size={16} />,
          count: woTasks.length
        })
        if (expandedGroups.has(wo.id)) {
          const stepNames = [...new Set(woTasks.map(t => t.stepName))]
          stepNames.forEach(step => {
            const sTasks = woTasks.filter(t => t.stepName === step)
            const maxLane =
              sTasks.length > 0 ? Math.max(...sTasks.map(t => t.lane || 0)) : 0
            const dynamicHeight = Math.max(
              ROW_BASE_HEIGHT,
              24 + (maxLane + 1) * 36
            )
            rows.push({
              type: 'track',
              id: `${wo.id}_${step}`,
              parentId: wo.id,
              label: step,
              subLabel: '生產製程',
              tasks: sTasks,
              height: dynamicHeight,
              maxLane
            })
          })
        }
      })
    }
    return rows
  }, [isCalculated, groupMode, expandedGroups, tasksWithLanes])

  const rowPositions = useMemo(() => {
    let currentTop = 0
    return flatRows.map(row => {
      const height = row.type === 'track' ? row.height : 48
      const pos = { top: currentTop, height }
      currentTop += height
      return pos
    })
  }, [flatRows])

  const totalContentHeight =
    rowPositions.length > 0
      ? rowPositions[rowPositions.length - 1].top +
        rowPositions[rowPositions.length - 1].height
      : 0

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    setDraggingTaskId(taskId)
    const rect = e.currentTarget.getBoundingClientRect()
    dragOffsetHourRef.current = (e.clientX - rect.left) / HOUR_WIDTH
    e.dataTransfer.effectAllowed = 'move'

    const ghost = e.currentTarget.cloneNode(true) as HTMLElement
    ghost.style.opacity = '0.5'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(
      ghost,
      e.clientX - rect.left,
      e.clientY - rect.top
    )
    setTimeout(() => document.body.removeChild(ghost), 0)
  }

  const onDragOver = (e: React.DragEvent<HTMLDivElement>, trackId: string) => {
    e.preventDefault()
    if (!draggingTaskId) return

    const trackElement = e.currentTarget
    const rect = trackElement.getBoundingClientRect()
    const offsetX = e.clientX - rect.left

    let newStart = offsetX / HOUR_WIDTH - dragOffsetHourRef.current
    newStart = Math.max(0, Math.round(newStart * 2) / 2)

    if (
      !dragPreview ||
      dragPreview.trackId !== trackId ||
      dragPreview.startHour !== newStart
    ) {
      setDragPreview({ trackId, startHour: newStart })
    }
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>, trackId: string) => {
    e.preventDefault()
    if (!draggingTaskId) return
    const finalStart = dragPreview?.startHour || 0

    setDraftTasks(prev =>
      prev.map(t => {
        if (t.id === draggingTaskId) {
          if (groupMode === 'WORK_ORDER') {
            return { ...t, startHour: finalStart }
          } else {
            return { ...t, machine: trackId, startHour: finalStart }
          }
        }
        return t
      })
    )
    setDraggingTaskId(null)
    setDragPreview(null)
    message.success('已調整任務排程，自動重新計算衝突中...')
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          borderRadius: 8,
          fontFamily: '"Inter", "Noto Sans TC", sans-serif'
        }
      }}
    >
      <div className='w-full h-full bg-[#f1f5f9] flex flex-col overflow-hidden text-slate-800 p-3 sm:p-5 gap-3 sm:gap-4 relative'>
        {/* --- 懸浮頂層指揮塔 --- */}
        <header className='h-[72px] bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl px-6 flex items-center justify-between shrink-0 z-[60] shadow-sm'>
          <div className='flex items-center gap-4'>
            <div className='w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200'>
              <MonitorPlay size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className='text-xl font-black tracking-tight text-slate-900 m-0 flex items-center gap-2'>
                APS Elite{' '}
                <span className='text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600'>
                  AI指揮中心
                </span>
              </h1>
              <p className='text-[10px] font-black text-slate-400 mt-0.5 uppercase tracking-widest'>
                Advanced Production Scheduling • v7.5
              </p>
            </div>
          </div>

          {isCalculated && stats && (
            <div className='hidden lg:flex items-center gap-4'>
              <Popover
                content={
                  <div className='flex items-center p-2 gap-6'>
                    <div className='flex items-center gap-3'>
                      <div className='p-2 bg-indigo-100/50 rounded-lg text-indigo-600'>
                        <Gauge size={20} strokeWidth={2.5} />
                      </div>
                      <Statistic
                        title='系統稼動率'
                        value={stats.utilization}
                        suffix='%'
                        valueStyle={{
                          fontSize: 20,
                          fontWeight: 900,
                          color: '#1e293b'
                        }}
                      />
                    </div>
                    <div className='w-px h-8 bg-slate-200' />
                    <div className='flex items-center gap-3'>
                      <div className='p-2 bg-rose-100/50 rounded-lg text-rose-600'>
                        <AlertTriangle size={20} strokeWidth={2.5} />
                      </div>
                      <Statistic
                        title='重疊/衝突數'
                        value={stats.conflicts}
                        valueStyle={{
                          fontSize: 20,
                          fontWeight: 900,
                          color: '#e11d48'
                        }}
                      />
                    </div>
                    <div className='w-px h-8 bg-slate-200' />
                    <div className='flex items-center gap-3'>
                      <div className='p-2 bg-amber-100/50 rounded-lg text-amber-600'>
                        <Zap size={20} strokeWidth={2.5} />
                      </div>
                      <Statistic
                        title='特急工單'
                        value={stats.urgent}
                        valueStyle={{
                          fontSize: 20,
                          fontWeight: 900,
                          color: '#d97706'
                        }}
                      />
                    </div>
                  </div>
                }
                title={
                  <span className='font-black text-slate-800 text-sm'>
                    全廠排程健康度分析
                  </span>
                }
                trigger='click'
                placement='bottomRight'
              >
                <Button
                  icon={<BarChart3 size={16} />}
                  className='font-black h-10 px-5 border-slate-300 shadow-sm text-slate-700 hover:text-indigo-600 hover:border-indigo-400 rounded-lg'
                >
                  KPI 總覽
                </Button>
              </Popover>
            </div>
          )}

          <div className='flex items-center gap-3'>
            {isCalculating ? (
              <div className='w-48 bg-slate-50 p-2 rounded-lg border border-slate-100'>
                <Progress
                  percent={progress}
                  size='small'
                  strokeColor='#4f46e5'
                  showInfo={false}
                />
                <p className='text-[10px] font-black text-center text-indigo-500 animate-pulse mt-1 tracking-widest uppercase'>
                  演算模型執行中
                </p>
              </div>
            ) : (
              <Button
                type='primary'
                icon={<Zap size={16} />}
                onClick={handleRunAPS}
                className='font-black h-10 px-6 shadow-md shadow-indigo-200 border-none bg-indigo-600 hover:bg-indigo-500 transition-all rounded-lg'
              >
                {isCalculated ? '重新生成資料' : '載入排程資料'}
              </Button>
            )}
          </div>
        </header>

        {/* --- 懸浮次導航與過濾器 --- */}
        {isCalculated && (
          <div className='h-14 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl px-4 flex items-center justify-between shrink-0 z-[55] shadow-sm'>
            <div className='flex items-center gap-3'>
              <div className='flex items-center bg-slate-100/80 rounded-lg px-3 py-1.5 w-52 sm:w-64 border border-transparent focus-within:border-indigo-400 focus-within:bg-white focus-within:shadow-sm transition-all'>
                <Search size={14} className='text-slate-400 mr-2' />
                <input
                  placeholder='搜尋工單、機台、客戶...'
                  className='bg-transparent border-none outline-none text-xs font-bold w-full text-slate-700 placeholder:text-slate-400'
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                />
              </div>

              <Select
                value={groupMode}
                onChange={handleGroupModeChange}
                className='w-full sm:w-[260px] font-bold text-xs custom-select'
                options={[
                  {
                    label: '廠區設備 (設備類型 → 機台)',
                    value: 'MACHINE_TYPE'
                  },
                  { label: '製程分佈 (加工製程 → 機台)', value: 'PROCESS' },
                  { label: '工單追蹤 (生產工單 → 製程)', value: 'WORK_ORDER' }
                ]}
              />
            </div>

            <Space>
              {draftTasks.filter(t => t.isConflict).length > 0 && (
                <Tag
                  color='error'
                  className='border-rose-200 text-rose-600 font-bold px-3 py-1 rounded-md text-[11px] flex items-center gap-1.5 shadow-sm m-0'
                >
                  <AlertTriangle size={12} /> 發現排程衝突
                </Tag>
              )}
              <Badge
                count={draftTasks !== masterTasks ? 1 : 0}
                dot
                offset={[-5, 5]}
                color='#f59e0b'
              >
                <Button
                  icon={<ArchiveRestore size={14} />}
                  onClick={() => setIsStashOpen(true)}
                  className={cn(
                    'text-xs font-bold rounded-lg h-9 shadow-sm transition-colors',
                    masterTasks !== draftTasks
                      ? 'bg-amber-50 text-amber-600 border-amber-300 hover:bg-amber-100'
                      : 'bg-white text-slate-600'
                  )}
                >
                  異動暫存區
                </Button>
              </Badge>
            </Space>
          </div>
        )}

        {/* --- 懸浮雙軸虛擬甘特圖核心 --- */}
        <main className='flex-1 relative bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col'>
          {!isCalculated ? (
            <div className='w-full h-full flex flex-col items-center justify-center bg-slate-50/50'>
              <div className='relative mb-6'>
                <div className='absolute inset-0 bg-indigo-300 blur-3xl opacity-20 animate-pulse' />
                <LayoutDashboard
                  size={100}
                  className='text-slate-200 relative'
                  strokeWidth={1}
                />
              </div>
              <h2 className='text-xl font-black text-slate-700 m-0'>
                等待數據載入
              </h2>
              <p className='text-slate-400 font-bold mt-2 text-sm'>
                點擊右上角按鈕，啟動基於智能堆疊演算法的 2D 虛擬渲染引擎
              </p>
            </div>
          ) : (
            // 獨立的虛擬化滾動區域
            <VirtualScrollArea
              flatRows={flatRows}
              rowPositions={rowPositions}
              totalContentHeight={totalContentHeight}
              expandedGroups={expandedGroups}
              groupMode={groupMode}
              searchText={searchText}
              draggingTaskId={draggingTaskId}
              dragPreview={dragPreview}
              draftTasks={draftTasks}
              onToggleGroup={toggleGroup}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragStart={onDragStart}
              onDragEnd={() => setDraggingTaskId(null)}
              handleExpandAll={handleExpandAll}
              handleCollapseAll={handleCollapseAll}
            />
          )}
        </main>

        {/* --- 異動暫存 Drawer --- */}
        <Drawer
          title={
            <div className='flex items-center gap-2 font-black text-lg text-slate-800'>
              <ArchiveRestore className='text-amber-500' />
              待發布排程異動清單
            </div>
          }
          placement='right'
          width={450}
          onClose={() => setIsStashOpen(false)}
          open={isStashOpen}
          styles={{ body: { padding: '16px', background: '#f8fafc' } }}
          footer={
            <div className='flex gap-3 justify-end p-2 bg-white'>
              <Button
                onClick={() => setDraftTasks(masterTasks)}
                className='font-bold'
              >
                捨棄所有變更
              </Button>
              <Button
                type='primary'
                className='font-bold px-8 h-10 shadow-lg shadow-indigo-200 border-none bg-indigo-600 hover:bg-indigo-500'
                onClick={() => {
                  setMasterTasks(draftTasks)
                  setIsStashOpen(false)
                  message.success('變更已成功寫入 ERP 排程核心！')
                }}
              >
                確認批次更新
              </Button>
            </div>
          }
        >
          {masterTasks === draftTasks ? (
            <Empty
              description={
                <span className='font-bold text-slate-400'>
                  目前沒有未儲存的手動異動
                </span>
              }
              className='mt-20'
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div className='flex flex-col gap-3'>
              <div className='bg-amber-100/50 border border-amber-200 text-amber-700 text-xs font-bold p-3 rounded-lg mb-2'>
                您手動調整了排程，點擊「確認批次更新」後將正式生效並重新運算相依關係。
              </div>
              {draftTasks.map(task => {
                const master = masterTasks.find(m => m.id === task.id)
                if (
                  !master ||
                  (master.startHour === task.startHour &&
                    master.machine === task.machine)
                )
                  return null
                return (
                  <Card
                    key={task.id}
                    size='small'
                    bordered={false}
                    className='shadow-sm border border-slate-200 rounded-xl overflow-hidden'
                  >
                    <div className='flex justify-between items-center mb-3 pb-2 border-b border-slate-100'>
                      <span className='text-sm font-black font-mono text-indigo-600'>
                        {task.woId}
                      </span>
                      <Button
                        type='text'
                        size='small'
                        icon={<Undo2 size={12} />}
                        className='text-[10px] font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                        onClick={() => {
                          setDraftTasks(prev =>
                            prev.map(p =>
                              p.id === task.id ? { ...master } : p
                            )
                          )
                        }}
                      >
                        單筆復原
                      </Button>
                    </div>
                    <div className='grid grid-cols-1 gap-2 text-xs font-bold'>
                      <div className='flex items-center justify-between bg-slate-50 p-2 rounded'>
                        <span className='text-slate-400 uppercase tracking-widest text-[10px]'>
                          執行機台
                        </span>
                        <div className='flex items-center gap-2'>
                          <span className='line-through text-slate-300'>
                            {master.machine}
                          </span>
                          <ArrowRight size={12} className='text-amber-500' />
                          <span className='text-slate-700'>{task.machine}</span>
                        </div>
                      </div>
                      <div className='flex items-center justify-between bg-slate-50 p-2 rounded'>
                        <span className='text-slate-400 uppercase tracking-widest text-[10px]'>
                          開始時間
                        </span>
                        <div className='flex items-center gap-2'>
                          <span className='line-through text-slate-300'>
                            {BASE_DATE.add(master.startHour, 'hour').format(
                              'MM/DD HH:mm'
                            )}
                          </span>
                          <ArrowRight size={12} className='text-amber-500' />
                          <span className='text-amber-600'>
                            {BASE_DATE.add(task.startHour, 'hour').format(
                              'MM/DD HH:mm'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </Drawer>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 12px; height: 12px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-left: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0; border-radius: 0 0 16px 0; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 3px solid #f1f5f9; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          
          .custom-select .ant-select-selector {
            border-radius: 8px !important;
            border-color: transparent !important;
            background-color: #f1f5f9 !important;
            box-shadow: none !important;
          }
          .custom-select:hover .ant-select-selector {
            border-color: #c7d2fe !important;
          }
          .custom-select.ant-select-focused .ant-select-selector {
            border-color: #818cf8 !important;
            background-color: #fff !important;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1) !important;
          }
        `}</style>
      </div>
    </ConfigProvider>
  )
}
