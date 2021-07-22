import '@testing-library/jest-dom/extend-expect'
import '@testing-library/jest-dom'

import { startMSW } from './src/mockRequests'

beforeAll(async () => {
  await startMSW('node', {
    onUnhandledRequest: 'error',
  })
})
