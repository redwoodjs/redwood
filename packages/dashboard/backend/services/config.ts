import { DashboardConfig } from 'backend/types'

import { getConfig } from '@redwoodjs/internal/dist/config'

export const dashboardConfig = async (
  _parent: unknown
): Promise<DashboardConfig> => {
  return getConfig().dashboard
}
