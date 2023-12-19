import App from './App'
import { Document } from './Document'

interface Props {
  css: string[]
  meta?: any[]
}

export const ServerEntry: React.FC<Props> = ({ css, meta }) => {
  return (
    <Document css={css} meta={meta}>
      <App />
    </Document>
  )
}
