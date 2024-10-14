import React from 'react'

import type { FileRejectionRendererProps } from './types.js'

export const DefaultFileRejectionRenderer: React.FC<
  FileRejectionRendererProps
> = ({ fileRejections }) => {
  const fileRejectionItems = fileRejections.map(({ file, errors }) => (
    <li key={file.name}>
      {file.name} - {file.size} bytes
      <ul>
        {errors.map((e) => (
          <li key={e.code}>{e.message}</li>
        ))}
      </ul>
    </li>
  ))

  return (
    <>
      <h4>Rejected files</h4>
      <ul>{fileRejectionItems}</ul>
    </>
  )
}
