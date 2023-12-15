import '@testing-library/jest-dom/extend-expect'
import '@testing-library/jest-dom'

import { startMSW } from './src/web/mockRequests'

beforeAll(async () => {
  await startMSW('node', {
    onUnhandledRequest: 'error',
  })
})
