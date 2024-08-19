import type { AttributeValue, Span } from '@opentelemetry/api';
type TelemetryAttributes = {
    [key: string]: AttributeValue;
};
/**
 * Safely records attributes to the opentelemetry span
 *
 * @param attributes An object of key-value pairs to be individually recorded as attributes
 * @param span An optional span to record the attributes to. If not provided, the current active span will be used
 */
export declare function recordTelemetryAttributes(attributes: TelemetryAttributes, span?: Span): void;
/**
 * Safely records an error to the opentelemetry span
 *
 * @param error An error to record to the span
 * @param span An optional span to record the error to. If not provided, the current active span will be used
 */
export declare function recordTelemetryError(error: any, span?: Span): void;
export {};
//# sourceMappingURL=index.d.ts.map