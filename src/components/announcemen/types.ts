// --- 公告模組型別與模擬數據 ---
export interface Announcement {
  id: string
  type: 'Safety' | 'System' | 'Maintenance' | 'Info'
  title: string
  content: string
  time: string
  isNew: boolean
}
