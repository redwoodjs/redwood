// if this script is run directly by node then telemetry will be sent in immediately
;(async function () {
  // Use local framework Telemetry code in case of CI context
  if (process.env.REDWOOD_CI == 1) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-next-line
    const { sendTelemetry } = require('../../telemetry/dist/sendTelemetry')
    await sendTelemetry()
  } else {
    const { sendTelemetry } = require('@redwoodjs/telemetry/dist/sendTelemetry')
    await sendTelemetry()
  }
})()
