import { Settings } from 'lucide-react'
import { lazy } from 'react'

import type { MenuItem } from './constants.tsx'

const SettingsPage = lazy(() => import('@/pages/settings/Settings.tsx'))

export const settingsMenuItem: MenuItem = {
  id: 'settings',
  label: '系統設定',
  icon: Settings,
  element: <SettingsPage />,
  children: [
    { id: 'users', label: '使用者管理' },
    { id: 'permissions', label: '權限管理' },
    { id: 'integration', label: '系統整合' }
  ]
}
