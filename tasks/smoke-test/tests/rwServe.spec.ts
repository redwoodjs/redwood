import devServerTest from '../playwright-fixtures/rwServe.fixture'

import { smokeTest } from './common'

devServerTest('Smoke test with rw serve', ({ port, page }) =>
  smokeTest({ webServerPort: port, page })
)
