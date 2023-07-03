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
  console.time('Computed resource information')
  const customResourceData = await getResources()
  console.timeEnd('Computed resource information')
  const resource = Resource.default().merge(new Resource(customResourceData))

  const url =
    process.env.REDWOOD_REDIRECT_TELEMETRY ||
    'https://quark.quantumparticle.io/v1/traces'
  const traceExporter = new OTLPTraceExporter({
    url,
  })
  console.log(`Sending telemetry data to '${url}'`)

  // Go through all telemetry files and send the new spans to the telemetry collector
  for (const [index, file] of telemetryFiles.entries()) {
    // '_' denotes a file that has already been sent
    if (file.startsWith('_')) {
      continue
    }
    console.log(`Sending data from telemetry file '${file}'`)

    // Read the saved spans
    let spans = []
    try {
      spans = fs.readJSONSync(path.join(telemetryDir, file))
    } catch (error) {
      console.error(`Error reading telemetry file '${file}'`)
      console.error(error)
      console.error('Deleting this file to prevent further errors')
      fs.unlinkSync(path.join(telemetryDir, file))
      continue
    }

    /**
     * We have to fix some of the span properties because we serialized the span
     * to JSON and then deserialized it. This means that some of the properties that
     * were functions are now just objects and that some of the properties were
     * renamed.
     */
    for (const span of spans) {
      span.resource = resource
      span.attributes ??= span._attributes ?? {}
      span.spanContext = () => span._spanContext

      // This is only for visibility - we current do not record any events on the backend anyway.
      // We do this for the time being because we don't want unsanitized error messages to be sent
      span.events = []
    }

    traceExporter.export(spans, ({ code, error }) => {
      if (code !== 0) {
        console.error('Encountered:')
        console.error(error)
        console.error('while exporting the following spans:')
        console.error(spans)
      }
    })

    /**
     * We have to rewrite the file because we recomputed the resource information
     * and we also denote that the spans have been sent by adding a '_' prefix to
     * the file name.
     */
    fs.writeJSONSync(path.join(telemetryDir, `_${file}`), spans, { spaces: 2 })
    fs.unlinkSync(path.join(telemetryDir, file))
    telemetryFiles[index] = `_${file}`
  }

  // Shutdown to ensure all spans are sent
  traceExporter.shutdown()

  // Verbose means we keep the last 8 telemetry files as a log otherwise we delete all of them
  if (process.env.REDWOOD_VERBOSE_TELEMETRY) {
    console.log(
      "Keeping only the last 8 telemetry files for inspection because 'REDWOOD_VERBOSE_TELEMETRY' is set."
    )
    const sortedTelemetryFiles = telemetryFiles.sort((a, b) => {
      return (
        parseInt(b.split('.')[0].replace('_', '')) -
        parseInt(a.split('.')[0].replace('_', ''))
      )
    })
    for (let i = 8; i < sortedTelemetryFiles.length; i++) {
      console.log(`Removing telemetry file '${sortedTelemetryFiles[i]}'`)
      fs.unlinkSync(path.join(telemetryDir, sortedTelemetryFiles[i]))
    }
  } else {
    console.log(
      "Removing telemetry files, set 'REDWOOD_VERBOSE_TELEMETRY' to keep the last 8 telemetry files for inspection."
    )
    telemetryFiles.forEach((file) => {
      console.log(`Removing telemetry file '${file}'`)
      fs.unlinkSync(path.join(telemetryDir, file))
    })
  }
}

main()
