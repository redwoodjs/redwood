import { spawn } from 'child_process'
import os from 'os'
import path from 'path'

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import opentelemetry from '@opentelemetry/api'
import {
  NodeTracerProvider,
  BatchSpanProcessor,
} from '@opentelemetry/sdk-trace-node'

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
    // We must account for some platform specific behaviour when spawning the process
    const spawnOptions =
      os.type() === 'Windows_NT'
        ? {
            // The following options run the process in the background without a console window, even though they don't look like they would.
            // See https://github.com/nodejs/node/issues/21825#issuecomment-503766781 for information
            detached: false,
            windowsHide: false,
            shell: true,
            stdio: 'inherit',
          }
        : {
            detached: true,
            stdio: 'inherit',
          }
    const child = spawn(
      'yarn',
      ['node', path.join(__dirname, 'send.js')],
      spawnOptions
    )
    child.unref()
  } catch (error) {
    console.error('Telemetry error')
    console.error(error)
  }
}
