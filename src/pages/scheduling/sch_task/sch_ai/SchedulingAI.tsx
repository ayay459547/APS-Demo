import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  ConfigProvider,
  Button,
  Tag,
  Badge,
  Select,
  message,
  Drawer,
  Empty,
  Tooltip,
  Statistic,
  Card,
  Space,
  Popover,
  Modal
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
  BarChart3,
  Box,
  ClipboardList,
  Maximize2,
  Minimize2,
  Bot,
  Sparkles,
  CheckCircle2,
  Play,
  Cpu,
  Activity
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

export interface BaseRow {
  type: 'level1' | 'level2' | 'track'
  id: string
}

export interface Level1Row extends BaseRow {
  type: 'level1'
  label: string
  icon: React.ReactNode
  count: number
  minHour?: number
  maxHour?: number
}

export interface Level2Row extends BaseRow {
  type: 'level2'
  parentId: string
  label: string
  icon: React.ReactNode
  count: number
  minHour?: number
  maxHour?: number
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

// --- AI 互動節點型別 ---
export type AiStep = 1 | 2 | 3 | 4
export type AiLogType = 'log' | 'prompt' | 'user' | 'system'
export interface AiLog {
  id: string
  type: AiLogType
  text: string
  options?: {
    label: string
    value: string
    icon?: React.ReactNode
    color?: string
    bgClass?: string
  }[]
}

// --- 工具函數 ---
function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes))
}

const generateId = () =>
  Math.random().toString(36).substring(2, 11) + Date.now().toString(36)

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

const generateInitialTasks = (
  orders: WorkOrder[],
  planType: 'speed' | 'balanced' | 'cost' = 'balanced'
): Task[] => {
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

      let durationBase = Math.floor(Math.random() * 6) + 2
      if (planType === 'speed') durationBase = Math.max(1, durationBase - 1)
      if (planType === 'cost') durationBase += 1

      const duration = durationBase

      let startHour = Math.max(
        currentWoHour,
        machineAvailableHour[machine.id] || 0
      )

      if (planType === 'speed' && Math.random() > 0.8) {
        startHour = Math.max(0, startHour - 2)
      }

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

          <div className='flex-1 relative h-full overflow-hidden pointer-events-none'>
            {row.minHour !== undefined && row.maxHour !== undefined && (
              <div
                className='absolute top-1/2 -translate-y-1/2 h-[8px] bg-slate-400/40 rounded-full border border-slate-400/60 shadow-sm'
                style={{
                  left: row.minHour * HOUR_WIDTH,
                  width:
                    Math.max(
                      0,
                      Math.min(
                        row.maxHour - row.minHour,
                        TOTAL_HOURS - row.minHour
                      )
                    ) * HOUR_WIDTH
                }}
              />
            )}
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
            className='flex-1 relative h-full'
            onDragOver={e => onDragOver(e, row.id)}
            onDrop={e => onDrop(e, row.id)}
          >
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

            {row.tasks.map((task: Task) => {
              if (task.startHour >= TOTAL_HOURS) return null

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
              )

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
                      width: displayDuration * HOUR_WIDTH,
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
        className='relative'
      >
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

        <div style={{ position: 'relative', height: totalContentHeight }}>
          <GridBackground />

          {flatRows.map((row: FlatRow, index: number) => {
            const { top, height } = rowPositions[index]

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
export default function App() {
  const [isCalculated, setIsCalculated] = useState<boolean>(false)
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

  // === 全新 AI 智能排程狀態 (Agent Loop - Light Mode) ===
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false)
  const [aiStep, setAiStep] = useState<AiStep>(1)
  const [aiLogs, setAiLogs] = useState<AiLog[]>([])
  const [aiSelectedStrategy, setAiSelectedStrategy] = useState<
    'speed' | 'balanced' | 'cost'
  >('balanced')

  const dragOffsetHourRef = useRef<number>(0)
  const aiLogEndRef = useRef<HTMLDivElement>(null)
  const aiTimersRef = useRef<number[]>([])

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

  // === AI Agent 互動流程核心 ===

  useEffect(() => {
    if (aiLogEndRef.current) {
      aiLogEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [aiLogs])

  const clearAiTimers = () => {
    aiTimersRef.current.forEach(window.clearTimeout)
    aiTimersRef.current = []
  }

  const handleCancelAiCopilot = () => {
    clearAiTimers()
    setIsAiModalOpen(false)
    message.info('已中止 AI 智能排程決策程序')
  }

  const handleOpenAiCopilot = () => {
    clearAiTimers()
    setIsAiModalOpen(true)
    setAiStep(1)
    setAiLogs([
      {
        id: generateId(),
        type: 'system',
        text: `APS 智能排程引擎連線成功 • ${dayjs().format('YYYY/MM/DD HH:mm')}`
      },
      {
        id: generateId(),
        type: 'log',
        text: '正在解析 500 筆工單主檔與 BOM 結構...'
      },
      {
        id: generateId(),
        type: 'log',
        text: '正在載入 30 台設備產能限制與維保參數...'
      }
    ])

    const t1 = window.setTimeout(() => {
      setAiLogs(prev => [
        ...prev,
        {
          id: 'prompt1',
          type: 'prompt',
          text: '【分析報告】偵測到瓶頸站「五軸 CNC 加工中心」產能吃緊。請問是否允許 AI 進行「跨廠區調度」以紓解瓶頸？',
          options: [
            {
              label: '允許跨廠區調度',
              value: 'allow',
              icon: <Play size={16} />,
              color: 'text-indigo-600',
              bgClass: 'bg-indigo-50'
            },
            {
              label: '嚴格限制於原廠區',
              value: 'strict',
              icon: <AlertTriangle size={16} />,
              color: 'text-slate-600',
              bgClass: 'bg-slate-50'
            }
          ]
        }
      ])
    }, 1500)
    aiTimersRef.current.push(t1)
  }

  const handleAiInteract = (step: AiStep, value: string, label: string) => {
    clearAiTimers()
    setAiLogs(prev => [
      ...prev.filter(l => l.type !== 'prompt'),
      { id: generateId(), type: 'user', text: `${label}` }
    ])

    if (step === 1) {
      setAiStep(2)
      const t1 = window.setTimeout(() => {
        setAiLogs(prev => [
          ...prev,
          {
            id: generateId(),
            type: 'log',
            text: `已套用約束條件：${value === 'allow' ? '啟用全域廠區調度' : '限制本地廠區排程'}。`
          },
          {
            id: generateId(),
            type: 'log',
            text: '正在建立多目標優化 (Multi-Objective Optimization) 數學模型...'
          }
        ])
      }, 600)
      aiTimersRef.current.push(t1)

      const t2 = window.setTimeout(() => {
        setAiLogs(prev => [
          ...prev,
          {
            id: 'prompt2',
            type: 'prompt',
            text: '請指示本次排程的主要權重方向 (Strategy Weights)：',
            options: [
              {
                label: '產能極大化 (Speed) - 容許微小衝突',
                value: 'speed',
                icon: <Gauge size={16} />,
                color: 'text-indigo-600',
                bgClass: 'bg-indigo-50'
              },
              {
                label: '準時達交優先 (Balanced) - 零衝突',
                value: 'balanced',
                icon: <CheckCircle2 size={16} />,
                color: 'text-emerald-600',
                bgClass: 'bg-emerald-50'
              },
              {
                label: '換線成本最優化 (Cost) - 批量合併',
                value: 'cost',
                icon: <Factory size={16} />,
                color: 'text-amber-600',
                bgClass: 'bg-amber-50'
              }
            ]
          }
        ])
      }, 2000)
      aiTimersRef.current.push(t2)
    } else if (step === 2) {
      setAiStep(3)
      setAiSelectedStrategy(value as 'speed' | 'balanced' | 'cost')

      const t1 = window.setTimeout(() => {
        setAiLogs(prev => [
          ...prev,
          { id: generateId(), type: 'log', text: `套用 ${label} 策略。` },
          {
            id: generateId(),
            type: 'log',
            text: '啟動基因演算法 (GA) 求解...'
          },
          {
            id: generateId(),
            type: 'log',
            text: '正在探索 1,428,570 種可能的排程路徑...'
          }
        ])
      }, 500)
      aiTimersRef.current.push(t1)

      const t2 = window.setTimeout(() => {
        setAiLogs(prev => [
          ...prev,
          {
            id: generateId(),
            type: 'log',
            text: 'Pareto 最佳前緣 (Pareto Front) 收斂完成！'
          }
        ])
      }, 2500)
      aiTimersRef.current.push(t2)

      const t3 = window.setTimeout(() => {
        setAiStep(4)
        setAiLogs(prev => [
          ...prev,
          {
            id: 'prompt3',
            type: 'prompt',
            text: `已為您萃取出最佳生產排程，預估全廠稼動率將達最佳狀態。是否將此方案發布並渲染至畫布？`,
            options: [
              {
                label: '確認套用並渲染',
                value: 'apply',
                icon: <Zap size={16} />,
                color: 'text-white',
                bgClass: 'bg-blue-600 hover:bg-blue-700'
              },
              {
                label: '取消並捨棄',
                value: 'cancel',
                icon: <Undo2 size={16} />,
                color: 'text-slate-600',
                bgClass: 'bg-slate-100 hover:bg-slate-200'
              }
            ]
          }
        ])
      }, 3500)
      aiTimersRef.current.push(t3)
    } else if (step === 4) {
      if (value === 'apply') {
        const newTasks = generateInitialTasks(MOCK_ORDERS, aiSelectedStrategy)
        setMasterTasks(newTasks)
        setDraftTasks(newTasks)
        setIsCalculated(true)
        setIsAiModalOpen(false)
        message.success(
          `已成功套用【${aiSelectedStrategy} 策略】，排程畫布已同步更新！`
        )
      } else {
        handleCancelAiCopilot()
      }
    }
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

        const typeTasks = tasksWithLanes.filter(t =>
          mInType.some(m => m.id === t.machine)
        )
        let minHour: number | undefined
        let maxHour: number | undefined
        if (typeTasks.length > 0) {
          minHour = Math.min(...typeTasks.map(t => t.startHour))
          maxHour = Math.max(...typeTasks.map(t => t.startHour + t.duration))
        }

        rows.push({
          type: 'level1',
          id: type,
          label: `${type} 設備區`,
          icon: <Box size={16} />,
          count: mInType.length,
          minHour,
          maxHour
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

        const processTasks = tasksWithLanes.filter(t =>
          mInProcess.some(m => m.id === t.machine)
        )
        let minHour: number | undefined
        let maxHour: number | undefined
        if (processTasks.length > 0) {
          minHour = Math.min(...processTasks.map(t => t.startHour))
          maxHour = Math.max(...processTasks.map(t => t.startHour + t.duration))
        }

        rows.push({
          type: 'level1',
          id: process,
          label: `${process} 加工製程`,
          icon: <Factory size={16} />,
          count: mInProcess.length,
          minHour,
          maxHour
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

        let minHour: number | undefined
        let maxHour: number | undefined
        if (woTasks.length > 0) {
          minHour = Math.min(...woTasks.map(t => t.startHour))
          maxHour = Math.max(...woTasks.map(t => t.startHour + t.duration))
        }

        rows.push({
          type: 'level1',
          id: wo.id,
          label: `${wo.id} - ${wo.customer}`,
          icon: <ClipboardList size={16} />,
          count: woTasks.length,
          minHour,
          maxHour
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
      <div className='w-full h-full bg-[#f8fafc] flex flex-col overflow-hidden text-slate-800 p-3 sm:p-5 gap-3 sm:gap-4 relative'>
        {/* --- 懸浮頂層指揮塔 --- */}
        <header className='h-[72px] bg-white border border-slate-200 rounded-2xl px-6 flex items-center justify-between shrink-0 z-[60] shadow-sm'>
          <div className='flex items-center gap-8'>
            <div className='flex items-center gap-4'>
              <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200'>
                <Cpu size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className='text-xl font-black tracking-tight text-slate-800 m-0 flex items-center gap-2'>
                  <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600'>
                    AI{' '}
                  </span>
                  先進排程系統
                </h1>
                <p className='text-[10px] font-black text-slate-400 mt-0.5 uppercase tracking-widest'>
                  Smart Manufacturing Center
                </p>
              </div>
            </div>

            {isCalculated && stats && (
              <div className='hidden lg:flex items-center gap-4'>
                <Popover
                  content={
                    <div className='flex items-center p-2 gap-6'>
                      <div className='flex items-center gap-3'>
                        <div className='p-2 bg-blue-50 rounded-lg text-blue-600'>
                          <Gauge size={20} strokeWidth={2.5} />
                        </div>
                        <Statistic
                          title='平均稼動率'
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
                        <div className='p-2 bg-rose-50 rounded-lg text-rose-600'>
                          <AlertTriangle size={20} strokeWidth={2.5} />
                        </div>
                        <Statistic
                          title='設備異常警報'
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
                        <div className='p-2 bg-amber-50 rounded-lg text-amber-600'>
                          <Zap size={20} strokeWidth={2.5} />
                        </div>
                        <Statistic
                          title='執行中特急工單'
                          value={stats.urgent}
                          suffix='筆'
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
                    className='font-bold h-10 px-5 border-slate-300 shadow-sm text-slate-600 hover:text-blue-600 hover:border-blue-400 rounded-lg'
                  >
                    KPI 總覽
                  </Button>
                </Popover>
              </div>
            )}
          </div>

          <div className='flex items-center gap-3'>
            <Button
              type='primary'
              icon={<Sparkles size={16} />}
              onClick={handleOpenAiCopilot}
              className='font-bold h-10 px-6 shadow-md shadow-blue-200 border-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition-all rounded-lg'
            >
              AI 智能決策分析
            </Button>
          </div>
        </header>

        {/* --- 懸浮次導航與過濾器 --- */}
        {isCalculated && (
          <div className='h-14 bg-white border border-slate-200 rounded-xl px-4 flex items-center justify-between shrink-0 z-[55] shadow-sm'>
            <div className='flex items-center gap-3'>
              <div className='flex items-center bg-slate-50 rounded-lg px-3 py-1.5 w-52 sm:w-64 border border-slate-200 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-sm transition-all'>
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
                  className='border-rose-200 text-rose-600 font-bold px-3 py-1 rounded-md text-[11px] flex items-center gap-1.5 shadow-sm m-0 bg-rose-50'
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
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                  )}
                >
                  異動暫存區
                </Button>
              </Badge>
            </Space>
          </div>
        )}

        {/* --- 懸浮雙軸虛擬甘特圖核心 --- */}
        <main className='flex-1 relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col'>
          {!isCalculated ? (
            <div className='w-full h-full flex flex-col items-center justify-center bg-slate-50/50'>
              <div className='relative mb-6'>
                <div className='absolute inset-0 bg-blue-200 blur-3xl opacity-30 animate-pulse' />
                <LayoutDashboard
                  size={100}
                  className='text-slate-300 relative'
                  strokeWidth={1}
                />
              </div>
              <h2 className='text-xl font-black text-slate-700 m-0'>
                等待載入排程數據
              </h2>
              <p className='text-slate-500 font-bold mt-2 text-sm'>
                請點擊上方「AI 智能決策分析」，透過數據驅動達成最佳化機台稼動率
              </p>
            </div>
          ) : (
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

        {/* === AI 智能排程中心 (Agent Loop 互動式對話助手 - 亮色主題) === */}
        <Modal
          open={isAiModalOpen}
          closable={true}
          maskClosable={true}
          onCancel={handleCancelAiCopilot}
          footer={null}
          width={1000}
          centered
          className='ai-copilot-modal'
          styles={{
            root: {
              padding: 0,
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: 'transparent'
            },
            mask: {
              backdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(241, 245, 249, 0.6)'
            }
          }}
        >
          {/* 移除了 shadow-2xl，讓內部不帶額外陰影，依賴 Modal 原生陰影 */}
          <div className='flex h-[650px] w-full relative bg-white'>
            {/* 左側：架構拓撲圖 (Flow Diagram) */}
            <div className='w-[30%] bg-slate-50 flex flex-col border-r border-slate-200'>
              <div className='px-6 py-5 border-b border-slate-200 flex flex-col bg-white'>
                <span className='text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1.5'>
                  <Activity size={12} /> Agent Loop
                </span>
                <span className='text-lg font-black text-slate-800'>
                  APS 決策引擎
                </span>
              </div>
              <div className='flex-1 p-8 flex flex-col gap-8 relative'>
                <div className='absolute left-10 top-12 bottom-12 w-0.5 bg-slate-200' />

                {[
                  {
                    step: 1,
                    label: '初始化與約束診斷',
                    sub: 'Context & Constraints'
                  },
                  {
                    step: 2,
                    label: '優化目標與權重設定',
                    sub: 'Multi-Objective Strategy'
                  },
                  {
                    step: 3,
                    label: '啟動演算法尋優',
                    sub: 'Genetic Algorithm Solver'
                  },
                  { step: 4, label: '決策方案套用', sub: 'Schedule Deployment' }
                ].map(node => (
                  <div
                    key={node.step}
                    className={cn(
                      'flex items-start gap-4 relative z-10 transition-all duration-500',
                      aiStep >= node.step
                        ? 'opacity-100'
                        : 'opacity-40 grayscale'
                    )}
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center border-[3px] shadow-sm shrink-0 transition-colors',
                        aiStep === node.step
                          ? 'bg-blue-600 border-blue-100 ring-4 ring-blue-600/20'
                          : aiStep > node.step
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'bg-white border-slate-300'
                      )}
                    >
                      {aiStep > node.step && (
                        <CheckCircle2 size={12} className='text-white' />
                      )}
                    </div>
                    <div
                      className={cn(
                        'flex flex-col',
                        aiStep === node.step &&
                          'scale-105 origin-left transition-transform'
                      )}
                    >
                      <span
                        className={cn(
                          'font-black text-sm transition-colors',
                          aiStep === node.step
                            ? 'text-blue-600'
                            : 'text-slate-700'
                        )}
                      >
                        {node.label}
                      </span>
                      <span className='text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5'>
                        {node.sub}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 右側：互動式 AI 助手對話區 (Chat UI) */}
            <div className='w-[70%] bg-white flex flex-col relative'>
              {/* 頂部 Header */}
              <div className='h-14 bg-white/90 backdrop-blur flex items-center px-6 border-b border-slate-100 shrink-0 justify-between z-10'>
                <div className='flex items-center gap-2 text-blue-600 font-bold'>
                  <Bot size={20} />{' '}
                  <span className='text-[15px]'>AI 排程決策助理</span>
                </div>
                <Badge
                  status='processing'
                  text={
                    <span className='text-xs text-slate-500 font-bold'>
                      System Ready
                    </span>
                  }
                />
              </div>

              {/* 對話紀錄 Body */}
              <div className='flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-slate-50/50'>
                {aiLogs.map(log => {
                  if (log.type === 'system') {
                    return (
                      <div
                        key={log.id}
                        className='text-center text-[11px] text-slate-400 font-bold my-2 bg-slate-100/50 py-1 px-3 rounded-full self-center'
                      >
                        {log.text}
                      </div>
                    )
                  }
                  if (log.type === 'user') {
                    return (
                      <div
                        key={log.id}
                        className='self-end bg-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm max-w-[80%] text-[13px] font-medium animate-[fadeIn_0.3s_ease-out]'
                      >
                        {log.text}
                      </div>
                    )
                  }
                  if (log.type === 'log') {
                    return (
                      <div
                        key={log.id}
                        className='flex gap-3 text-slate-600 text-[13px] animate-[fadeIn_0.3s_ease-out]'
                      >
                        <Sparkles
                          size={16}
                          className='mt-0.5 text-blue-400 shrink-0 opacity-70'
                        />
                        <div className='bg-white border border-slate-100 px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm leading-relaxed'>
                          {log.text}
                        </div>
                      </div>
                    )
                  }
                  if (log.type === 'prompt') {
                    return (
                      <div
                        key={log.id}
                        className='flex flex-col gap-3 max-w-[90%] animate-[fadeIn_0.5s_ease-out]'
                      >
                        <div className='flex gap-3 text-slate-800 text-[14px] font-bold leading-relaxed'>
                          <Bot
                            size={18}
                            className='mt-0.5 text-blue-600 shrink-0'
                          />
                          {log.text}
                        </div>
                        <div className='flex flex-col gap-2 pl-7 mt-1'>
                          {log.options?.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() =>
                                handleAiInteract(aiStep, opt.value, opt.label)
                              }
                              className='flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all text-left group outline-none'
                            >
                              <div className='flex items-center gap-3'>
                                <span
                                  className={cn(
                                    'p-2 rounded-lg transition-colors',
                                    opt.bgClass,
                                    opt.color
                                  )}
                                >
                                  {opt.icon}
                                </span>
                                <span className='font-bold text-slate-700 text-[13px]'>
                                  {opt.label}
                                </span>
                              </div>
                              <ChevronRight
                                size={16}
                                className='text-slate-300 group-hover:text-blue-500 transition-colors'
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  }
                  return null
                })}

                {/* 閃爍 Loading 指示器 */}
                {(aiStep === 1 || aiStep === 3) &&
                  !aiLogs[aiLogs.length - 1]?.options && (
                    <div className='flex gap-2 items-center pl-1 text-blue-400'>
                      <span
                        className='w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce'
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className='w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce'
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className='w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce'
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  )}
                <div ref={aiLogEndRef} className='h-2' />
              </div>
            </div>
          </div>
        </Modal>

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
                className='font-bold px-8 h-10 shadow-md shadow-blue-200 border-none bg-blue-600 hover:bg-blue-500'
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
              <div className='bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold p-3 rounded-lg mb-2'>
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
                      <span className='text-sm font-black font-mono text-blue-600'>
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
          @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
          
          .custom-scrollbar::-webkit-scrollbar { width: 12px; height: 12px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 3px solid #f1f5f9; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          
          .ai-copilot-modal .ant-modal-content { padding: 0 !important; }
          .ai-copilot-modal .ant-modal-close { top: 12px; right: 12px; }
          
          .custom-select .ant-select-selector {
            border-radius: 8px !important;
            border-color: transparent !important;
            background-color: #f8fafc !important;
            box-shadow: none !important;
          }
          .custom-select:hover .ant-select-selector { border-color: #93c5fd !important; }
          .custom-select.ant-select-focused .ant-select-selector {
            border-color: #3b82f6 !important;
            background-color: #fff !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
          }
        `}</style>
      </div>
    </ConfigProvider>
  )
}
