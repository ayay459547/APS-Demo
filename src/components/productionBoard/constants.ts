import type { LineData } from './types'

export const statusConfig: Record<
  LineData['status'],
  {
    border: string
    text: string
    label: string
    statusColor: string
    animate?: string
  }
> = {
  RUNNING: {
    border: 'border-l-emerald-500',
    text: 'text-emerald-500',
    label: '生產中',
    statusColor: 'success'
  },
  ALARM: {
    border: 'border-l-rose-500',
    text: 'text-rose-500',
    label: '異常',
    animate: 'animate-pulse',
    statusColor: 'error'
  },
  IDLE: {
    border: 'border-l-amber-500',
    text: 'text-amber-500',
    label: '待料',
    statusColor: 'warning'
  },
  SETUP: {
    border: 'border-l-blue-500',
    text: 'text-blue-500',
    label: '調機',
    statusColor: 'processing'
  }
}

export const MOCK_LINES: LineData[] = [
  {
    id: 'L1',
    lineName: 'SMT 自動貼片 A 線',
    status: 'RUNNING',
    currentOrder: 'MO-260408-01',
    productName: 'M3 Pro Mainboard',
    target: 500,
    actual: 428,
    oee: 92.5,
    operator: '陳大文'
  },
  {
    id: 'L2',
    lineName: 'CNC 精密加工 B 線',
    status: 'ALARM',
    currentOrder: 'MO-260408-05',
    productName: 'Aluminum Chassis',
    target: 200,
    actual: 85,
    oee: 45.2,
    operator: '李小龍'
  },
  {
    id: 'L3',
    lineName: '雷射切割 C 線',
    status: 'RUNNING',
    currentOrder: 'MO-260408-12',
    productName: 'Heat Sink v2',
    target: 1200,
    actual: 1150,
    oee: 98.1,
    operator: '張學友'
  },
  {
    id: 'L4',
    lineName: '自動焊接手臂 D 線',
    status: 'IDLE',
    currentOrder: 'MO-260408-20',
    productName: 'Power Module X1',
    target: 800,
    actual: 620,
    oee: 82.4,
    operator: '王嘉爾'
  },
  {
    id: 'L5',
    lineName: '組裝測試 E 線',
    status: 'RUNNING',
    currentOrder: 'MO-260408-09',
    productName: 'OLED Display Unit',
    target: 450,
    actual: 320,
    oee: 88.4,
    operator: '劉德華'
  },
  {
    id: 'L6',
    lineName: '出貨包裝 F 線',
    status: 'SETUP',
    currentOrder: 'MO-260408-15',
    productName: 'Retail Pack Box',
    target: 1000,
    actual: 120,
    oee: 75.0,
    operator: '周杰倫'
  },
  {
    id: 'L7',
    lineName: '注塑成型 G 線',
    status: 'RUNNING',
    currentOrder: 'MO-260408-22',
    productName: 'Plastic Casing B',
    target: 2000,
    actual: 1850,
    oee: 95.3,
    operator: '林志玲'
  },
  {
    id: 'L8',
    lineName: '電鍍處理 H 線',
    status: 'RUNNING',
    currentOrder: 'MO-260408-25',
    productName: 'Chrome Plate Z',
    target: 300,
    actual: 210,
    oee: 89.2,
    operator: '彭于晏'
  }
]
