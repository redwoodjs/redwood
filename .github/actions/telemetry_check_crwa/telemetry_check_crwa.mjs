import { exec } from '@actions/exec'

import http from "http"

console.log(`Telemetry is being redirected to ${process.env.REDWOOD_REDIRECT_TELEMETRY}`)
const port = parseInt(process.env.REDWOOD_REDIRECT_TELEMETRY.split(":")[2])

// All the fields we expect inside a telemetry packet
const expectedPacketFields = [
  "type",
  "command",
  "duration",
  "uid",
  "ci",
  "redwoodCi",
  "NODE_ENV",
  "os",
  "osVersion",
  // "shell", // Not expected on windows
  "nodeVersion",
  "yarnVersion",
  "npmVersion",
  "redwoodVersion",
  "system",
  "complexity",
  "sides",
  // "bundler" // TODO: Should we add the experimental bundler option?
]

// Setup fake telemetry server
const server = http.createServer((req, res) => {
  let data = ""
  req.on("data", (chunk) => {
    data += chunk
  })
  req.on("end", () => {
    res.writeHead(200)
    res.end()

    const packet = JSON.parse(data)

    let hasAllFields = true
    for (const field of expectedPacketFields) {
      if(packet[field] === undefined){
        hasAllFields = false
        console.error(`Telemetry packet is missing field "${field}"`)
      }
    }

    const isCI = packet.ci ?? false

    if((hasAllFields && isCI)){
      console.log("Valid telemetry received")
      process.exit(0)
    }else{
      console.error("Invalid telemetry received")
      console.error(packet)
      process.exit(1)
    }
  })
});
server.listen(port, "127.0.0.1", () => {
  console.log(`Telemetry listener is running on http://127.0.0.1:${port}`);
});

// Run create-redwood-app
try {
  await exec(`yarn node ./packages/create-redwood-app/dist/create-redwood-app.js ../crwa-telemetry --typescript false --git false --yarn-install false`)
} catch (error) {
  console.error(error)
}

// If we didn't hear the telemetry after 2 mins since running crwa then let's fail
await new Promise(r => setTimeout(r, 120_000));
console.error("No telemetry response within 120 seconds. Failing...")
process.exit(1)
