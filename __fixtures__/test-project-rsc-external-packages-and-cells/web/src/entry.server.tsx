import type { TagDescriptor } from '@redwoodjs/web/dist/components/htmlTags'

import { Document } from './Document'

interface Props {
  css: string[]
  meta?: TagDescriptor[]
}

export const ServerEntry: React.FC<Props> = ({ css, meta }) => {
  return (
    <Document css={css} meta={meta}>
      <div>App</div>
    </Document>
  )
}
