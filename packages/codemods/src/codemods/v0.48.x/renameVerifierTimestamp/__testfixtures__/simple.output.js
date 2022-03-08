import {
  verifyEvent,
  signPayload,
} from '@redwoodjs/api/webhooks'

export const handler = async (event, _context) => {
  signPayload('timestampSchemeVerifier', {
    event,
    options: {
      currentTimestampOverride: Date.now()
    }
  })

  verifyEvent('timestampSchemeVerifier', {
    event,
    options: {
      currentTimestampOverride: Date.now() - 60*1000 // one minute ago
    }
  })

  const options = {
    currentTimestampOverride: Date.now(),
  }

  verifyEvent('timestampSchemeVerifier', {
    event,
    options,
  })

  const verifierOptions = {
    currentTimestampOverride: Date.now(),
  }

  verifyEvent('timestampSchemeVerifier', {
    event,
    options: verifierOptions,
  })
}
