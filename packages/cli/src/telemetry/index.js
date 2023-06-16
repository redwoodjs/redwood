import { spawn } from 'child_process'
import os from 'os'
import path from 'path'

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import opentelemetry from '@opentelemetry/api'
// import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import {
  NodeTracerProvider,
  BatchSpanProcessor,
} from '@opentelemetry/sdk-trace-node'
import fs from 'fs-extra'

import { getPaths } from '@redwoodjs/project-config'

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

/**
 * Custom exporter which writes spans to a file inside of .redwood/spans
 */
class CustomFileExporter {
  /**
   * @type string
   * @private
   */
  #storageFileName

  /**
   * @type fs.WriteStream
   * @private
   */
  #storageFileStream

  constructor() {
    this.#storageFileName = `${Date.now()}.json`

    // Ensure the path exists
    const storageFilePath = path.join(
      getPaths().generated.base,
      'telemetry',
      this.#storageFileName
    )
    fs.ensureDirSync(path.dirname(storageFilePath))

    // Open the file for writing, open a JSON array
    this.#storageFileStream = fs.createWriteStream(storageFilePath, {
      flags: 'w',
      autoClose: false,
    })
    this.#storageFileStream.write('[')
  }

  /**
   * Called to export sampled {@link ReadableSpan}s.
   * @param spans the list of sampled Spans to be exported.
   */
  export(spans, resultCallback) {
    for (let i = 0; i < spans.length; i++) {
      const span = spans[i]
      delete span['_spanProcessor'] // This is a circular reference and will cause issues with JSON.stringify
      this.#storageFileStream.write(JSON.stringify(span, undefined, 2))
      if (i < spans.length - 1) {
        this.#storageFileStream.write(',')
      }
    }
    resultCallback({ code: 0 })
  }

  /** Stops the exporter. */
  shutdown() {
    // Close the JSON array and then close the file
    if (this.#storageFileStream.writable) {
      this.#storageFileStream.write(']')
      this.#storageFileStream.close()
    }
  }

  /** Immediately export all spans */
  forceFlush() {
    // Do nothing
  }
}

export async function startTelemetry() {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR)

  // Minimal resources
  const resource = Resource.default().merge(new Resource({}))

  // Tracing
  traceProvider = new NodeTracerProvider({
    resource: resource,
  })
  // traceExporter = new OTLPTraceExporter({
  //   url:
  //     process.env.REDWOOD_REDIRECT_TELEMETRY ||
  //     'https://quark.quantumparticle.io/v1/traces',
  // })
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
    await traceExporter?.shutdown()

    // Send the telemetry in a background process, so we don't block the CLI
    // We must account for some platform specific behaviour
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
      ['node', path.join(__dirname, 'sendTelemetry.js')],
      spawnOptions
    )
    child.unref()
  } catch (error) {
    console.error('Telemetry error')
    console.error(error)
  }
}
