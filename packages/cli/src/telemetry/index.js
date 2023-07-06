import path from 'path'

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import opentelemetry from '@opentelemetry/api'
import {
  NodeTracerProvider,
  SimpleSpanProcessor,
  SamplingDecision,
} from '@opentelemetry/sdk-trace-node'

import { spawnBackgroundProcess } from '../lib/background'

import { CustomFileExporter } from './exporter'

/**
 * @type NodeTracerProvider
 */
let traceProvider

/**
 * @type SimpleSpanProcessor
 */
let traceProcessor

/**
 * @type CustomFileExporter
 */
let traceExporter

/**
 * @type boolean
 */
let isStarted = false

/**
 * @type boolean
 */
let isShutdown = false

export async function startTelemetry() {
  if (isStarted) {
    return
  }
  isStarted = true

  try {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR)

    // Tracing
    traceProvider = new NodeTracerProvider({
      sampler: {
        shouldSample: () => {
          return {
            decision: isShutdown
              ? SamplingDecision.NOT_RECORD
              : SamplingDecision.RECORD_AND_SAMPLED,
          }
        },
        toString: () => {
          return 'AlwaysSampleWhenNotShutdown'
        },
      },
    })
    traceExporter = new CustomFileExporter()
    traceProcessor = new SimpleSpanProcessor(traceExporter)
    traceProvider.addSpanProcessor(traceProcessor)
    traceProvider.register()

    // Ensure to shutdown telemetry when the process exits
    process.on('exit', () => {
      shutdownTelemetry()
    })
  } catch (error) {
    console.error('Telemetry error')
    console.error(error)
  }
}

export function shutdownTelemetry() {
  if (isShutdown || !isStarted) {
    return
  }
  isShutdown = true

  try {
    // End the active spans
    while (opentelemetry.trace.getActiveSpan()?.isRecording()) {
      opentelemetry.trace.getActiveSpan()?.end()
    }

    // Shutdown exporter to ensure all data is flushed
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
