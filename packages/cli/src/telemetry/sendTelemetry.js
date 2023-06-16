import path from 'path'

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import fs from 'fs-extra'

import { getPaths } from '@redwoodjs/project-config'

import { getResources } from './resource'

async function main() {
  // Get all telemetry files
  const telemetryDir = path.join(getPaths().generated.base, 'telemetry')
  fs.ensureDirSync(telemetryDir)
  const telemetryFiles = fs.readdirSync(
    path.join(getPaths().generated.base, 'telemetry')
  )

  // Compute all the resource information
  const customResourceData = await getResources()
  const resource = Resource.default().merge(new Resource(customResourceData))

  const traceExporter = new OTLPTraceExporter({
    url:
      process.env.REDWOOD_REDIRECT_TELEMETRY ||
      'https://quark.quantumparticle.io/v1/traces',
  })

  // Go through all new telemetry files and send the spans to the telemetry collector
  for (const [index, file] of telemetryFiles.entries()) {
    // '_' denotes a file that has already been sent
    if (file.startsWith('_')) {
      continue
    }

    // Read the saved spans
    const spans = JSON.parse(
      fs.readFileSync(path.join(telemetryDir, file), { encoding: 'utf8' })
    )

    /**
     * We have to fix some of the span properties because we serialize the span
     * to JSON and then deserialize it. This means that some of the properties that
     * were functions are now just objects and that some of the properties were
     * renamed.
     */
    for (const span of spans) {
      span.resource = resource
      span.attributes ??= span._attributes ?? {}
      span.spanContext = () => span._spanContext
    }

    traceExporter.export(spans, ({ code: _code }) => {
      // code will be non-zero if there was an error exporting
      // we would probably want visibility into this
    })

    // Mark the file as sent by renaming it with a '_' prefix
    fs.renameSync(
      path.join(telemetryDir, file),
      path.join(telemetryDir, `_${file}`)
    )
    telemetryFiles[index] = `_${file}`
  }

  // Shutdown to ensure all spans are sent
  traceExporter.shutdown()

  // Verbose now means we keep the last 5 telemetry files
  if (process.env.REDWOOD_VERBOSE_TELEMETRY) {
    const sortedTelemetryFiles = telemetryFiles.sort((a, b) => {
      return (
        parseInt(b.split('.')[0].replace('_', '')) -
        parseInt(a.split('.')[0].replace('_', ''))
      )
    })
    for (let i = 5; i < sortedTelemetryFiles.length; i++) {
      fs.unlinkSync(path.join(telemetryDir, sortedTelemetryFiles[i]))
    }
  } else {
    telemetryFiles.forEach((file) => {
      fs.unlinkSync(path.join(telemetryDir, file))
    })
  }
}
main()
