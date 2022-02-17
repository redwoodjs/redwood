import rwServeTest from '../playwright-fixtures/rwServe.fixture'

import { smokeTest } from './common'

rwServeTest('Smoke test with rw serve', ({ port, page }) =>
  smokeTest({ webServerPort: port, page })
)
