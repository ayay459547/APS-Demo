// --- 型別定義 ---
export type LineStatus = 'RUNNING' | 'ALARM' | 'IDLE' | 'SETUP'

export interface LineData {
  id: string
  lineName: string
  status: LineStatus
  currentOrder: string
  productName: string
  target: number
  actual: number
  oee: number
  // 新增：高階生管指標
  yieldRate: number // 直通良率 (FPY)
  uph: number // 每小時產出 (Units Per Hour)
  operator: string
  eta: string // 預計完工時間
  nextOrder: string // 下一工單 (供備料參考)
  alertMsg?: string // 異常原因
}
