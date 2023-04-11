const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api')
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http')
const { registerInstrumentations } = require('@opentelemetry/instrumentation')
const {
  FastifyInstrumentation,
} = require('@opentelemetry/instrumentation-fastify')
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http')
const { Resource } = require('@opentelemetry/resources')
const {
  NodeTracerProvider,
  SimpleSpanProcessor,
} = require('@opentelemetry/sdk-trace-node')
const {
  SemanticResourceAttributes,
} = require('@opentelemetry/semantic-conventions')
const { PrismaInstrumentation } = require ('@prisma/instrumentation')

// You may wish to set this to DiagLogLevel.DEBUG when you need to debug opentelemetry itself
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)

const resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'redwood-app',
    [SemanticResourceAttributes.SERVICE_VERSION]: '0.0.0',
  })
)

const exporter = new OTLPTraceExporter({
  // Update this URL to point to where your OTLP compatible collector is listening
  // The redwood development studio (`yarn rw exp studio`) can collect your telemetry at `http://127.0.0.1:4318/v1/traces`
  url: 'http://127.0.0.1:4318/v1/traces',
})

// You may wish to switch to BatchSpanProcessor in production as it is the recommended choice for performance reasons
const processor = new SimpleSpanProcessor(exporter)

const provider = new NodeTracerProvider({
  resource: resource,
})
provider.addSpanProcessor(processor)

// Optionally register instrumentation libraries here
registerInstrumentations({
  tracerProvider: provider,
  instrumentations: [
    new HttpInstrumentation(),
    new FastifyInstrumentation(),
    new PrismaInstrumentation({
      middleware: true,
    })
  ],
})

provider.register()
