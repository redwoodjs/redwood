import { memoize } from 'lodash'

async function entryClient() {
  // NOTE: `react-server-dom-webpack` uses this global to load modules,
  // so we need to define it here before importing "react-server-dom-webpack."
  globalThis.__webpack_require__ = memoize(function (id: string) {
    const module = import(/* @vite-ignore */ id)
    return module
  })

  const rootEl = document.getElementById('root')
  if (!rootEl) {
    throw new Error('no element with id "root"')
  }

  const React = await import('react')
  const { hydrateRoot } = await import('react-dom/client')
  const { createFromReadableStream } = await import(
    'react-server-dom-webpack/client.browser'
  )
  const { rscStream } = await import('rsc-html-stream/client')

  let data
  data ??= createFromReadableStream(rscStream)

  let SET_STREAM_DATA: (v: Promise<unknown>) => void

  function Content() {
    const [streamData, setStreamData] = React.useState(data)
    const [_isPending, startTransition] = React.useTransition()
    SET_STREAM_DATA = (v) => startTransition(() => setStreamData(v))
    return React.use(streamData)
  }

  hydrateRoot(rootEl, <Content />)
}

entryClient()
