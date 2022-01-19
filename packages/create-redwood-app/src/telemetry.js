const { sendTelemetry } = require('@redwoodjs/telemetry/dist/sendTelemetry')

// if this script is run directly by node then telemetry will be sent in immediately
;(async function () {
  await sendTelemetry()
})()
