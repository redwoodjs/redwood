import React, { useState } from 'react'

function SpanSegment({
  trace,
  span,
  depth = 0,
  traceStartNano,
  traceEndNano,
}: {
  trace: any
  span: any
  depth?: number
  traceStartNano: string
  traceEndNano: string
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  const traceStart = BigInt.asUintN(63, BigInt(traceStartNano))
  const traceEnd = BigInt.asUintN(63, BigInt(traceEndNano))
  const traceDuration = Number(traceEnd - traceStart)

  const spanStart = BigInt.asUintN(63, BigInt(span.startNano))
  const spanEnd = BigInt.asUintN(63, BigInt(span.endNano))

  const startBasis = (
    (Number(spanStart - traceStart) / traceDuration) *
    99.999
  ).toFixed(0)
  const duringBasis = (
    (Number(spanEnd - spanStart) / traceDuration) *
    99.999
  ).toFixed(0)
  const endBasis = (
    (Number(traceEnd - spanEnd) / traceDuration) *
    99.999
  ).toFixed(0)

  const children = trace.spans
    .filter((child: any) => child.parent === span.id)
    .sort((a: any, b: any) =>
      a.startNano > b.startNano ? 1 : b.startNano > a.startNano ? -1 : 0
    )

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-row ">
        <div
          className="basis-2/5 flex flex-row gap-2"
          style={{ paddingLeft: depth * 16 }}
        >
          {children.length > 0 && (
            <button
              className="text-left"
              onClick={() => setIsExpanded(!isExpanded)}
              disabled={children.length === 0}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          <button
            className="text-left"
            onClick={() => setShowDetails(!showDetails)}
          >
            {span.name}
          </button>
        </div>
        <div className="basis-3/5 border-l border-gray-400">
          <div className="px-2 flex flex-row w-full min-w-full">
            <div style={{ flexBasis: `${startBasis}%` }}>⠀</div>
            <div
              style={{
                flexBasis: `${duringBasis}%`,
                backgroundColor: '#00AA00',
              }}
            >
              ⠀
            </div>
            <div style={{ flexBasis: `${endBasis}%` }}>⠀</div>
          </div>
        </div>
      </div>
      {showDetails && (
        <div className="flex flex-col gap-1 border border-gray-400 p-2">
          <details>
            <summary>Attributes</summary>
            <div className="flex flex-col gap-1">
              {Object.entries(JSON.parse(span.attributes)).map(
                ([key, value]) => {
                  return (
                    <div key={key} className="flex flex-row gap-2">
                      <div className="font-bold">{key}</div>
                      <div className="grow">{JSON.stringify(value)}</div>
                    </div>
                  )
                }
              )}
            </div>
          </details>
          <details>
            <summary>Events</summary>
            <div className="flex flex-col gap-1">
              {Object.entries(JSON.parse(span.events)).map(([key, value]) => {
                return (
                  <div key={key} className="flex flex-row gap-2">
                    <div className="font-bold">{key}</div>
                    <div className="grow">{JSON.stringify(value)}</div>
                  </div>
                )
              })}
            </div>
          </details>
          <details>
            <summary>Resources</summary>
            <div className="flex flex-col gap-1">
              {Object.entries(JSON.parse(span.resources)).map(
                ([key, value]) => {
                  return (
                    <div key={key} className="flex flex-row gap-2">
                      <div className="font-bold">{key}</div>
                      <div className="grow">{JSON.stringify(value)}</div>
                    </div>
                  )
                }
              )}
            </div>
          </details>
        </div>
      )}
      {isExpanded && (
        <div>
          {children.map((child: any) => (
            <SpanSegment
              key={child.id}
              trace={trace}
              span={child}
              depth={depth + 1}
              traceStartNano={traceStartNano}
              traceEndNano={traceEndNano}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TimelineView({ trace }: { trace: any }) {
  const rootSpans = trace.spans
    .filter((span: any) => span.parent == null)
    .sort((a: any, b: any) =>
      a.startNano > b.startNano ? 1 : b.startNano > a.startNano ? -1 : 0
    )

  const traceStartNano = trace.spans
    .map((span: any) => span.startNano)
    .sort((a: any, b: any) => (a > b ? 1 : b > a ? -1 : 0))[0]

  const traceEndNano = trace.spans
    .map((span: any) => span.endNano)
    .sort((a: any, b: any) => (a > b ? -1 : b > a ? 1 : 0))[0]

  return (
    <div className="flex flex-col gap-1">
      {rootSpans.map((span: any) => (
        <SpanSegment
          key={span.id}
          trace={trace}
          span={span}
          traceStartNano={traceStartNano}
          traceEndNano={traceEndNano}
        />
      ))}
    </div>
  )
}

export default TimelineView
