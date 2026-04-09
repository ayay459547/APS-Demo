import type { Announcement } from './types'

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    type: 'Safety',
    title: '全廠勞安演習通知',
    content:
      '明日上午 10:00 將進行消防演習，請各產線班組維持機台在安全待機狀態。',
    time: '2026-04-09 14:00',
    isNew: true
  },
  {
    id: '2',
    type: 'Maintenance',
    title: 'CNC-B區 高壓冷卻系統維護',
    content: '本週五晚班將針對 CNC 005-008 號機進行濾網更換，預計停機 2 小時。',
    time: '2026-04-09 11:30',
    isNew: true
  },
  {
    id: '3',
    type: 'System',
    title: 'APS 系統版本更新通知 v3.1',
    content: '本次更新優化了甘特圖渲染效能，並新增了現場報工防錯機制。',
    time: '2026-04-08 17:20',
    isNew: false
  },
  {
    id: '4',
    type: 'Info',
    title: 'Q1 生產達標激勵獎金公佈',
    content: '恭喜 SMT A 線連三個月良率突破 99.8%，獎勵金將隨本月薪資發放。',
    time: '2026-04-08 09:00',
    isNew: false
  }
]
