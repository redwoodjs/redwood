// process.env.REDWOOD_DISABLE_TELEMETRY = '1'
jest.mock('@redwoodjs/telemetry', () => {
  return {
    errorTelemetry: () => {},
    timedTelemetry: async (_argv, _options, func) => {
      return await func()
    },
  }
})
