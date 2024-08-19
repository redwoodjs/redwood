import { beforeAll, describe, test } from 'vitest'

import { generateSignature } from '../lib/generateSignature.js'

describe('Generate signature', () => {
  beforeAll(() => {
    process.env.RW_UPLOADS_SECRET = 'bazinga'
  })

  test('It creates a signature', () => {
    const out = generateSignature('/tmp/myfile.txt', 500)
    console.log(`👉 \n ~ out:`, out)
  })
})
