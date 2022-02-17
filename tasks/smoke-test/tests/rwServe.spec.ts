import rwServeTest from '../playwright-fixtures/rwServe.fixture'

import { smokeTest } from './common'

rwServeTest('Smoke test with rw serve', ({ port, page }) =>
  smokeTest({ webServerPort: port, page })
)

// @TODO it might be useful to have this visual check
// But gitpod screenshot doesnt seem to match up with github runners
// Possibly due to fonts
// rwServeTest('Visual check', async ({ page, port }) => {
//   await page.goto(`http://localhost:${port}/`)

//   // Wait till cell has finished rendering
//   await page.textContent('text=Welcome to the blog!')

//   expect(await page.screenshot()).toMatchSnapshot('landing.png', {
//     threshold: 0.2, // reduce sensitivity of visual comparison
//   })
// })
