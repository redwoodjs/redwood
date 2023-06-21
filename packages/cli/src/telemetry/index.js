import path from 'path'

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import opentelemetry from '@opentelemetry/api'
import {
  NodeTracerProvider,
  BatchSpanProcessor,
} from '@opentelemetry/sdk-trace-node'

import { spawnBackgroundProcess } from '../lib/background'

import { CustomFileExporter } from './exporter'

/**
 * @type NodeTracerProvider
 */
let traceProvider

/**
 * @type BatchSpanProcessor
 */
let traceProcessor

/**
 * @type CustomFileExporter
 */
let traceExporter

export async function startTelemetry() {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR)

  // Tracing
  traceProvider = new NodeTracerProvider()
  traceExporter = new CustomFileExporter()
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
    opentelemetry.trace.getActiveSpan()?.end()
    await traceProvider?.shutdown()
    await traceProcessor?.shutdown()
    traceExporter?.shutdown()

    // Send the telemetry in a background process, so we don't block the CLI
    spawnBackgroundProcess('telemetry', 'yarn', [
      'node',
      path.join(__dirname, 'send.js'),
    ])
  } catch (error) {
    console.error('Telemetry error')
    console.error(error)
  }
}
