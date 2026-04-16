import { lazy } from 'react'

export const SettingsPage = lazy(() => import('@/pages/settings/Settings.tsx'))

export const Users = lazy(() => import('@/pages/settings/users/Users.tsx'))

export const Permissions = lazy(
  () => import('@/pages/settings/permissions/Permissions.tsx')
)

export const Integration = lazy(
  () => import('@/pages/settings/integration/Integration.tsx')
)
