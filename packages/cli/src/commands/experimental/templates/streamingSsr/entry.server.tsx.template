import { LocationProvider } from '@redwoodjs/router'
import { ServerContextProvider } from '@redwoodjs/web/dist/serverContext'

import App from './App'
import { Document } from './Document'

interface Props {
  routeContext: any
  url: string
  css: string[]
  meta?: any[]
}

export const ServerEntry: React.FC<Props> = ({
  routeContext,
  url,
  css,
  meta,
}) => {
  return (
    <ServerContextProvider value={routeContext}>
      <LocationProvider location={{ pathname: url }}>
        <Document css={css} meta={meta}>
          <App />
        </Document>
      </LocationProvider>
    </ServerContextProvider>
  )
}
