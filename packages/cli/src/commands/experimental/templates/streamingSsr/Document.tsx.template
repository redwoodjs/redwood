import React from 'react'

import { Css, Meta } from '@redwoodjs/web'
import type { TagDescriptor } from '@redwoodjs/web'

interface DocumentProps {
  children: React.ReactNode
  css: string[] // array of css import strings
  meta?: TagDescriptor[]
}

export const Document: React.FC<DocumentProps> = ({ children, css, meta }) => {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <Css css={css} />
        <Meta tags={meta} />
      </head>
      <body>
        <div id="redwood-app">{children}</div>
      </body>
    </html>
  )
}
