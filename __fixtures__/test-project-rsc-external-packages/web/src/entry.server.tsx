import { Document } from './Document'
import HomePage from './HomePage'

interface Props {
  css: string[]
  meta?: any[]
}

export const ServerEntry: React.FC<Props> = ({ css, meta }) => {
  return (
    <Document css={css} meta={meta}>
      <HomePage />
    </Document>
  )
}
