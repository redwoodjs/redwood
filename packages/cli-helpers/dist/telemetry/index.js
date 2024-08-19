import opentelemetry, { SpanStatusCode } from "@opentelemetry/api";
function recordTelemetryAttributes(attributes, span) {
  const spanToRecord = span ?? opentelemetry.trace.getActiveSpan();
  if (spanToRecord === void 0) {
    return;
  }
  for (const [key, value] of Object.entries(attributes)) {
    spanToRecord.setAttribute(key, value);
  }
}
function recordTelemetryError(error, span) {
  const spanToRecord = span ?? opentelemetry.trace.getActiveSpan();
  if (spanToRecord === void 0) {
    return;
  }
  const message = error?.message ?? error?.toString() ?? "Unknown error";
  const firstLineOfError = message.split("\n")[0];
  spanToRecord.setStatus({
    code: SpanStatusCode.ERROR,
    message: firstLineOfError
  });
  spanToRecord.recordException(error ?? new Error(firstLineOfError));
}
export {
  recordTelemetryAttributes,
  recordTelemetryError
};
