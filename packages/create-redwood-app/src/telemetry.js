import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import opentelemetry, { SpanStatusCode } from '@opentelemetry/api'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import {
  NodeTracerProvider,
  BatchSpanProcessor,
} from '@opentelemetry/sdk-trace-node'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import envinfo from 'envinfo'
import system from 'systeminformation'

import { name as packageName, version as packageVersion } from '../package'

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
 * @type Span
 */
let rootSpan

export async function startTelemetry() {
  // Logger
  // TODO: This line should be removed or at least the log level raised after experimentation
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)

  // Resources
  const info = JSON.parse(
    await envinfo.run(
      {
        System: ['OS', 'Shell'],
        Binaries: ['Node', 'Yarn', 'npm'],
        npmPackages: '@redwoodjs/*',
        IDEs: ['VSCode'],
      },
      { json: true }
    )
  )

  // get shell name instead of path
  const shell = info.System?.Shell // Windows doesn't always provide shell info, I guess
  if (shell?.path?.match('/')) {
    info.System.Shell.name = info.System.Shell.path.split('/').pop()
  } else if (shell?.path.match('\\')) {
    info.System.Shell.name = info.System.Shell.path.split('\\').pop()
  }
  const cpu = await system.cpu()
  const mem = await system.mem()

  const resource = Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: packageName,
      // TODO: Get a better way of recording what version of CRWA is running because this is just null...
      [SemanticResourceAttributes.SERVICE_VERSION]: packageVersion,
      [SemanticResourceAttributes.OS_TYPE]: info.System?.OS?.split(' ')[0],
      [SemanticResourceAttributes.OS_VERSION]: info.System?.OS?.split(' ')[1],
      'shell.name': info.System?.Shell?.name,
      'node.version': info.Binaries?.Node?.version,
      'yarn.version': info.Binaries?.Yarn?.version,
      'npm.version': info.Binaries?.npm?.version,
      'vscode.version': info.IDEs?.VSCode?.version,
      'cpu.count': cpu.physicalCores,
      'memory.gb': Math.round(mem.total / 1073741824),
    })
  )

  // Tracing
  traceProvider = new NodeTracerProvider({
    resource: resource,
  })
  traceExporter = new OTLPTraceExporter({
    // TODO: Point this to somewhere permanent
    // url: 'https://telemetry.redwoodjs.com/v1/traces',
  })
  traceProcessor = new BatchSpanProcessor(traceExporter)
  traceProvider.addSpanProcessor(traceProcessor)
  traceProvider.register()

  // Start root span
  const tracer = opentelemetry.trace.getTracer('crwa-tracer')
  rootSpan = tracer.startSpan(
    'root',
    undefined,
    opentelemetry.context.ROOT_CONTEXT
  )
}

export async function shutdownTelemetry({ exception } = {}) {
  if (rootSpan?.isRecording()) {
    if (exception !== undefined) {
      // TODO: Think about how best to redact this exception information
      rootSpan.recordException(exception)
      rootSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: exception.message,
      })
    }
    rootSpan.end()
  }
  try {
    await traceProvider?.shutdown()
    await traceProcessor?.shutdown()
    await traceExporter?.shutdown()
  } catch (error) {
    console.error('Telemetry error')
    console.error(error)
  }
}
