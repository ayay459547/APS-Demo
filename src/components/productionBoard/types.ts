// --- 現場數據定義 ---
export interface LineData {
  id: string
  lineName: string
  status: 'RUNNING' | 'ALARM' | 'IDLE' | 'SETUP'
  currentOrder: string
  productName: string
  target: number
  actual: number
  oee: number
  operator: string
}
