import React from 'react'

import { formatFileSize, getReadableErrorMessage } from '../core/utils.js'

import { useRedwoodUploadsContext } from './hooks/useRedwoodUploadsContext.js'
import type { FileRejectionRendererProps } from './types.js'

export const DefaultFileRejectionRenderer: React.FC<
  FileRejectionRendererProps
> = () => {
  const { fileRejections } = useRedwoodUploadsContext()
  const fileRejectionItems = fileRejections.map(({ file, errors }) => (
    <li key={file.name} style={{ marginBottom: '8px' }}>
      {file.name} - {formatFileSize(file.size)}
      <ul>
        {errors.map((e) => (
          <li key={e.code} style={{ color: 'red', fontSize: 'small' }}>
            {getReadableErrorMessage(file, e.code, e.message)}
          </li>
        ))}
      </ul>
    </li>
  ))

  return (
    <>
      {fileRejections.length > 0 && (
        <>
          <h4 style={{ marginBottom: '8px' }}>
            <strong>Rejected files</strong>
          </h4>
          <ul>{fileRejectionItems}</ul>
        </>
      )}
    </>
  )
}
