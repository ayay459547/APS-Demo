import type { AnnouncementType, AnnouncementLevel, Announcement } from './types'

const titles = [
  '全廠勞安演習通知',
  '設備預防保養計畫',
  'APS 系統更新',
  '產線效率提升公告',
  '品質異常通報',
  '物料短缺預警',
  '緊急插單通知',
  'OEE 改善專案啟動'
]

const contents = [
  '請相關單位配合執行，確保生產安全與穩定。',
  '本次作業預計影響產能，請提前調整排程。',
  '已優化系統效能與資料同步機制。',
  '請現場主管加強巡檢與品質控管。',
  '已偵測到異常數據，請立即處理。',
  '倉儲與採購單位請加速補料。',
  '請優先處理此訂單，避免延誤交期。',
  '改善計畫將於本週開始執行。'
]

const types: AnnouncementType[] = [
  'Safety',
  'Maintenance',
  'System',
  'Info',
  'Production',
  'Quality'
]

const levels: AnnouncementLevel[] = ['normal', 'important', 'critical']

export const generateMockAnnouncements = (count = 10): Announcement[] => {
  return Array.from({ length: count }).map((_, i) => {
    const type = types[i % types.length]
    const level = levels[Math.floor(Math.random() * levels.length)]

    const date = new Date('2026-04-01')
    date.setDate(date.getDate() + Math.floor(Math.random() * 10))
    date.setHours(Math.floor(Math.random() * 24))
    date.setMinutes(Math.floor(Math.random() * 60))

    return {
      id: String(i + 1),
      type,
      level,
      title: titles[i % titles.length],
      content: contents[Math.floor(Math.random() * contents.length)],
      time: date.toISOString().replace('T', ' ').slice(0, 16),
      isNew: Math.random() > 0.6
    }
  })
}

// --- 公告模組型別與模擬數據 ---
export const MOCK_ANNOUNCEMENTS: Announcement[] = generateMockAnnouncements()
