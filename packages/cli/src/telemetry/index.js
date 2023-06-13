import path from 'path'

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import opentelemetry from '@opentelemetry/api'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import {
  NodeTracerProvider,
  BatchSpanProcessor,
} from '@opentelemetry/sdk-trace-node'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import fs from 'fs-extra'

import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'
import { getPaths } from '@redwoodjs/project-config'

import { name as packageName, version as packageVersion } from '../../package'
import { isLockSet, unsetLock } from '../lib/locking'

/**
 * @type NodeTracerProvider
 */
let traceProvider

/**
 * @type BatchSpanProcessor
 */
let traceProcessor

/**
 * @type OTLPTraceExporter
 */
let traceExporter

export async function startTelemetry() {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR)

  // Minimal resources
  const resource = Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: packageName,
      [SemanticResourceAttributes.SERVICE_VERSION]: packageVersion,
    })
  )

  // Tracing
  traceProvider = new NodeTracerProvider({
    resource: resource,
  })
  traceExporter = new OTLPTraceExporter({
    url:
      process.env.REDWOOD_REDIRECT_TELEMETRY ||
      'https://quark.quantumparticle.io/v1/traces',
  })
  traceProcessor = new BatchSpanProcessor(traceExporter)
  traceProvider.addSpanProcessor(traceProcessor)
  traceProvider.register()

  process.on('SIGTERM', async () => {
    await shutdownTelemetry()
  })
  process.on('SIGINT', async () => {
    // TODO: Should we record a SIGINT as a telemetry event?
    await shutdownTelemetry()
  })
}

export async function shutdownTelemetry() {
  try {
    // Add the "resources" we computed in the background
    const telemetryComputeFile = path.join(
      getPaths().generated.base,
      'telemetryCompute.json'
    )

    // TODO: Should we do something more sophisticated here?
    // Wait up to 1s for the results
    const pausePeriod = 50
    const maxPauses = 20
    let pauses = 0
    while (isLockSet('TELEMETRY_COMPUTE') && pauses < maxPauses) {
      await new Promise((r) => setTimeout(r, pausePeriod))
      pauses += 1
    }
    unsetLock('TELEMETRY_COMPUTE')

    try {
      const data = JSON.parse(
        fs.readFileSync(telemetryComputeFile, { encoding: 'utf8' })
      )
      console.log({ data })
      recordTelemetryAttributes(data)
    } catch (_error) {
      console.error(_error)
      // TODO: Consider handling this error
    }

    console.log(opentelemetry.trace.getActiveSpan())

    opentelemetry.trace.getActiveSpan()?.end()
    await traceProvider?.shutdown()
    await traceProcessor?.shutdown()
    await traceExporter?.shutdown()
  } catch (error) {
    console.error('Telemetry error')
    console.error(error)
  }
}
