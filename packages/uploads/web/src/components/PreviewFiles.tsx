import React from 'react'

import { useRedwoodUploadsContext } from './hooks/useRedwoodUploadsContext.js'

export const PreviewFiles: React.FC = () => {
  const { acceptedFiles } = useRedwoodUploadsContext()
  return (
    <>
      {acceptedFiles.length > 0 && (
        <>
          <h4 style={{ marginBottom: '8px' }}>
            <strong>Accepted Files</strong>
          </h4>
          <ul>
            {acceptedFiles.map((file) => {
              const previewUrl = URL.createObjectURL(file)
              return (
                <li key={file.name}>
                  {file.type.startsWith('image/') && (
                    <img
                      src={previewUrl}
                      alt={file.name}
                      style={{
                        maxWidth: '200px',
                        maxHeight: '200px',
                        marginTop: '10px',
                        marginRight: '10px',
                      }}
                      onLoad={() => {
                        URL.revokeObjectURL(previewUrl)
                      }}
                    />
                  )}
                  {file.name} - {file.size} bytes
                </li>
              )
            })}
          </ul>
        </>
      )}
    </>
  )
}
