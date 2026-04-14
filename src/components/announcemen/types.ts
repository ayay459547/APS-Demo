export type AnnouncementType =
  | 'Safety'
  | 'Maintenance'
  | 'System'
  | 'Info'
  | 'Production'
  | 'Quality'

export type AnnouncementLevel = 'normal' | 'important' | 'critical'

export interface Announcement {
  id: string
  type: AnnouncementType
  level: AnnouncementLevel
  title: string
  content: string
  time: string
  isNew: boolean
}
