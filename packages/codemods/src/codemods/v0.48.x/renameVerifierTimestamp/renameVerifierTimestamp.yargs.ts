import path from 'path'

import fg from 'fast-glob'
import task from 'tasuku'
import type { TaskInnerAPI } from 'tasuku'

import { getPaths } from '@redwoodjs/project-config'

import runTransform from '../../../lib/runTransform'

export const command = 'rename-verifier-timestamp'
export const description =
  '(v0.47.x->v0.48.x) Renames the timestamp webhook verifier option'

/**
 * The functions dir can look like like...
 *
 * functions
 * ├── graphql.js
 * ├── healthz.js
 * ├── jsonproduct.js
 * ├── payment.js
 * ├── paysonCallback.js
 * ├── prisma.js
 * ├── shipping
 * │   ├── shipping.scenarios.ts
 * │   ├── shipping.test.ts
 * │   └── shipping.ts
 * ├── snipcartWebhooks.js
 * ├── swishCallback.js
 * └── swishCheckout.js
 */
export const handler = () => {
  task(
    'Rename timestamp to currentTimestampOverride',
    async ({ setError }: TaskInnerAPI) => {
      try {
        await runTransform({
          transformPath: path.join(__dirname, 'renameVerifierTimestamp.js'),
          targetPaths: fg.sync('/**/*.{js,ts}', {
            cwd: getPaths().api.functions,
            absolute: true,
          }),
        })
      } catch (e: any) {
        setError('Failed to codemod your project \n' + e?.message)
      }
    }
  )
}
