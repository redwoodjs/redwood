import { LocationProvider } from '@redwoodjs/router'

import App from './App'
import { Document } from './Document'

interface Props {
  url: string
  css: string[]
  meta?: any[]
}

export const ServerEntry: React.FC<Props> = ({ url, css, meta }) => {
  return (
    <LocationProvider location={{ pathname: url }}>
      <Document css={css} meta={meta}>
        <App />
      </Document>
    </LocationProvider>
  )
}
