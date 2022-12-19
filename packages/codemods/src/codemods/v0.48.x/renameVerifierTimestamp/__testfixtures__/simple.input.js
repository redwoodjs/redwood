import { verifyEvent, signPayload } from '@redwoodjs/api/webhooks'

export const handler = async (event, _context) => {
  signPayload('timestampSchemeVerifier', {
    event,
    options: {
      timestamp: Date.now(),
    },
  })

  verifyEvent('timestampSchemeVerifier', {
    event,
    options: {
      timestamp: Date.now() - 60 * 1000, // one minute ago
    },
  })

  const options = {
    timestamp: Date.now(),
  }

  verifyEvent('timestampSchemeVerifier', {
    event,
    options,
  })

  const verifierOptions = {
    timestamp: Date.now(),
  }

  verifyEvent('timestampSchemeVerifier', {
    event,
    options: verifierOptions,
  })
}
