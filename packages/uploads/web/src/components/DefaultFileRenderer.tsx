import React from 'react'

import type { FileRendererProps } from './types.js'

export const DefaultFileRenderer: React.FC<FileRendererProps> = ({ files }) => {
  return (
    <>
      <h4>Accepted Files</h4>
      <ul>
        {files.map((file) => (
          <li key={file.name}>
            {file.type.startsWith('image/') && (
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                style={{
                  maxWidth: '200px',
                  maxHeight: '200px',
                  marginTop: '10px',
                  marginRight: '10px',
                }}
              />
            )}
            {file.name} - {file.size} bytes
          </li>
        ))}
      </ul>
    </>
  )
}
