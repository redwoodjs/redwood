import React, { useState, useCallback, useRef, useEffect } from 'react'

import type { FileRejection } from 'react-dropzone'
import { useDropzone } from 'react-dropzone'

import { ACCEPTED_IMAGE_TYPES } from '../core/fileTypes.js'
import { ACCEPTED_DOCUMENT_TYPES } from '../index.js'

import { RedwoodUploadsProvider } from './hooks/useRedwoodUploadsContext.js'
import type { RedwoodUploadComponentProps } from './types.js'

export const RedwoodUploadsComponent: React.FC<RedwoodUploadComponentProps> = ({
  name = 'uploads',
  className,
  fileConstraints,
  children,
  dropzoneContent,
  messageContent,
  setFiles,
  onResetFiles,
  ...dropzoneOptions
}) => {
  const [acceptedFiles, setAcceptedFiles] = useState<File[]>([])
  const [fileRejections, setFileRejections] = useState<FileRejection[]>([])
  const {
    accept = {
      ...ACCEPTED_IMAGE_TYPES,
      ...ACCEPTED_DOCUMENT_TYPES,
    },
    maxFiles = 1,
    minSize = 0,
    maxSize = 1_024 * 1_024,
    multiple = false,
  } = fileConstraints || {}

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setAcceptedFiles(acceptedFiles)
      setFileRejections(fileRejections)
      setFiles?.(acceptedFiles)
    },
    [setFiles],
  )

  const dropzoneRef = useRef<any>(null)

  const resetFiles = useCallback(() => {
    setAcceptedFiles([])
    setFileRejections([])
    setFiles?.([])
  }, [setFiles])

  // Provide the resetFiles function to the parent component
  useEffect(() => {
    if (onResetFiles) {
      onResetFiles(resetFiles)
    }
  }, [onResetFiles, resetFiles])

  const { getRootProps, getInputProps, open, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept,
      maxFiles,
      minSize,
      maxSize,
      multiple: maxFiles > 1 ? true : multiple,
      ...dropzoneOptions,
    })

  const contextValue = {
    open,
    isDragActive,
    isDragReject,
    acceptedFiles,
    fileRejections,
    setAcceptedFiles,
    setFileRejections,
    resetFiles,
  }

  return (
    <RedwoodUploadsProvider value={contextValue}>
      <div>
        <div {...getRootProps({ className, ref: dropzoneRef })}>
          <input {...getInputProps({ name })} />
          {messageContent}
          {dropzoneContent}
        </div>
        {children}
      </div>
    </RedwoodUploadsProvider>
  )
}
