import type { LineStatus, LineData } from './types'

// --- 狀態設定配置 ---
export const statusConfig: Record<
  LineStatus,
  {
    border: string
    text: string
    label: string
    statusColor: string
    bgLight: string
    animate?: string
  }
> = {
  RUNNING: {
    border: '!border-l-emerald-500',
    text: 'text-emerald-500',
    bgLight: 'bg-emerald-50',
    label: '生產中',
    statusColor: 'success'
  },
  ALARM: {
    border: '!border-l-rose-500',
    text: 'text-rose-600',
    bgLight: 'bg-rose-50',
    label: '異常',
    animate: 'animate-pulse',
    statusColor: 'error'
  },
  IDLE: {
    border: '!border-l-amber-400',
    text: 'text-amber-500',
    bgLight: 'bg-amber-50',
    label: '待料',
    statusColor: 'warning'
  },
  SETUP: {
    border: '!border-l-blue-500',
    text: 'text-blue-500',
    bgLight: 'bg-blue-50',
    label: '調機',
    statusColor: 'processing'
  }
}

const statuses: LineStatus[] = ['RUNNING', 'ALARM', 'IDLE', 'SETUP']

const generateMockLines = (count = 30): LineData[] => {
  return Array.from({ length: count }).map((_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)]

    return {
      id: `L${i + 1}`,
      lineName: `產線 ${i + 1}`,
      status,
      currentOrder: `MO-2604-${String(i + 1).padStart(3, '0')}`,
      productName: `Product-${i % 10}`,
      target: Math.floor(Math.random() * 2000) + 200,
      actual: Math.floor(Math.random() * 1500),
      oee: Number((Math.random() * 50 + 50).toFixed(1)),
      yieldRate: Number((Math.random() * 10 + 90).toFixed(1)),
      uph: Math.floor(Math.random() * 400),
      operator: `Operator-${i}`,
      eta: `${10 + (i % 8)}:${(i * 7) % 60}`,
      nextOrder: `MO-2604-${String(i + 2).padStart(3, '0')}`,
      alertMsg:
        status === 'ALARM' ? '設備異常 / 物料問題 / 品質異常' : undefined
    }
  })
}

// --- 強化版假資料 ---
export const MOCK_LINES: LineData[] = generateMockLines()
