import { Settings } from 'lucide-react'

import type { MenuItem } from './constants.tsx'
import {
  SettingsPage,
  Users,
  Permissions,
  Integration
} from './settings.lazy.ts'

export const settingsMenuItem: MenuItem = {
  id: 'settings',
  label: '系統設定',
  icon: Settings,
  element: <SettingsPage />,
  children: [
    { id: 'users', label: '使用者管理', element: <Users /> },
    { id: 'permissions', label: '權限管理', element: <Permissions /> },
    { id: 'integration', label: '系統整合', element: <Integration /> }
  ]
}
