export const getFirstSpan = (spans: any[]): any => {
  if (spans.length > 1) {
    return spans.sort((a, b) => a.startNano - b.startNano)[0]
  } else {
    return spans[0] ?? null
  }
}

export const getLastSpan = (spans: any[]): any => {
  if (spans.length > 1) {
    return spans.sort((a, b) => a.endNano - b.endNano)[0]
  } else {
    return spans[0] ?? null
  }
}

export const nanoToDate = (nano: string): Date => {
  return new Date(parseInt(nano.substring(0, nano.length - 6)))
}
