export const getTraceName = (spans: any) => {
  const rootSpans = spans
    .filter((span: any) => span.parent === null)
    .map((span: any) => span.name)

  if (rootSpans.length === 1) {
    return rootSpans[0]
  } else {
    return `[${rootSpans.join(',')}]`
  }
}

export const hasAnyErrors = (spans: any) => {
  return spans.some((span: any) => span.statusCode == 2)
}

export const traceStart = (spans: any) => {
  const bigIntMin = (...args: bigint[]) =>
    args.reduce((m, e) => (e < m ? e : m))
  return bigIntMin(...spans.map((span: any) => span.startNano)).toString(10)
}

export const traceEnd = (spans: any) => {
  const bigIntMax = (...args: bigint[]) =>
    args.reduce((m, e) => (e > m ? e : m))
  return bigIntMax(...spans.map((span: any) => span.endNano)).toString(10)
}

export const traceDuration = (spans: any) => {
  const start = traceStart(spans)
  const end = traceEnd(spans)
  return (BigInt(end) - BigInt(start)).toString(10)
}

export const traceRootSpan = (spans: any) => {
  const roots = spans
    .filter((span: any) => span.parent === null)
    .sort((a: any, b: any) => {
      return BigInt(a.startNano) - BigInt(b.startNano)
    })
  if (roots.length >= 1) {
    return roots[0]
  }
  return null
}
