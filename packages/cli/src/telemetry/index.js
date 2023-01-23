import {
  trace,
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
} from '@opentelemetry/api'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { Resource } from '@opentelemetry/resources'
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

// Disable telemetry via ENV var
// TODO: This cannot be set inside the .env file because we haven't loaded it yet!
if (!process.env.REDWOOD_DISABLE_CLI_TELEMETRY) {
  // TODO: Remove when published, using DiagLogLevel.DEBUG when debugging/implementing
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)

  // TODO: Remove this - I don't think we need any existing instrumentations loaded here for our telemetry requirements
  registerInstrumentations({
    instrumentations: [],
  })

  // TODO: Include the resource data we already gather from telemetry-v1 i.e. Node/Yarn versions, OS data etc.
  // TODO: HELP: Need to await a func here but not sure best way to do that?
  const redwoodPackage = require('../../package.json')
  const resource = Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: redwoodPackage.name,
      [SemanticResourceAttributes.SERVICE_VERSION]: redwoodPackage.version,
    })
  )

  const provider = new NodeTracerProvider({
    resource: resource,
  })

  // Default exporter to collector.redwoodjs.com
  // TODO: This needs to be configured to send to an actual collector
  const exporter = new OTLPTraceExporter()
  const processor = new BatchSpanProcessor(exporter)
  provider.addSpanProcessor(processor)

  // If verbose log every span to the console the moment the span is ended/processed
  if (process.env.REDWOOD_VERBOSE_CLI_TELEMETRY) {
    provider.addSpanProcessor(
      new SimpleSpanProcessor(new ConsoleSpanExporter())
    )
  }

  provider.register()

  process.on('beforeExit', async () => {
    // If there are any active spans end them
    let activeSpan = undefined
    do {
      activeSpan = trace.getActiveSpan()
      if (activeSpan?.isRecording()) {
        activeSpan.end()
      }
    } while (activeSpan !== undefined)

    // Send any remaining telemetry
    await provider.forceFlush()
    await processor.forceFlush()

    // TODO: We probably should be shutting these down but this causes a noticable delay in the process exit
    // await provider.shutdown()
    // await processor.shutdown()
    // await exporter.shutdown()
  })
}
