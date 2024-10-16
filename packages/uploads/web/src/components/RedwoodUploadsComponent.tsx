import type { CSSProperties } from 'react'
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'

import type { FileRejection } from 'react-dropzone'
import { useDropzone } from 'react-dropzone'

import { ACCEPTED_IMAGE_TYPES } from '../core/fileTypes.js'
import { ACCEPTED_DOCUMENT_TYPES } from '../index.js'

import { RedwoodUploadsProvider } from './hooks/useRedwoodUploadsContext.js'
import type { RedwoodUploadComponentProps } from './types.js'

const baseStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '24px',
  borderWidth: 2,
  borderRadius: 2,
  borderColor: '#eeeeee', // Light gray
  borderStyle: 'dashed',
  backgroundColor: '#fafafa', // Very light gray (almost white)
  color: '#000000', // Black
  outline: 'none',
  transition: 'border .24s ease-in-out',
}

const focusedStyle = {
  borderColor: '#2196f3', // Bright blue
}

const acceptStyle = {
  borderColor: '#00e676', // Bright green
}

const rejectStyle = {
  borderColor: '#ff1744', // Bright red
}

export const RedwoodUploadsComponent: React.FC<RedwoodUploadComponentProps> = ({
  name = 'uploads',
  className,
  fileConstraints,
  children,
  dropzoneContent,
  messageContent: customMessageContent, // Rename the prop
  setFiles,
  onResetFiles,
  allowPaste = false,
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

  const handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (items) {
        const files = Array.from(items)
          .filter((item) => item.kind === 'file')
          .map((item) => item.getAsFile())
          .filter((file): file is File => file !== null)

        if (files.length > 0) {
          onDrop(files, [])
        }
      }
    },
    [onDrop],
  )

  const {
    getRootProps,
    getInputProps,
    open,
    isDragActive,
    isDragReject,
    isFocused,
    isDragAccept,
  } = useDropzone({
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
    isFocused,
    isDragAccept,
    acceptedFiles,
    fileRejections,
    setAcceptedFiles,
    setFileRejections,
    resetFiles,
  }

  const defaultMessageContent = (
    <p>
      {isDragActive
        ? 'Drop the files here...'
        : isDragReject
          ? 'File type not accepted, sorry!'
          : "Drag 'n' drop some files here, or click to select files"}
    </p>
  )
  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragActive ? acceptStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isFocused, isDragAccept, isDragActive, isDragReject],
  ) as CSSProperties

  const rootProps = {
    ...getRootProps({ className, ref: dropzoneRef, style }),
    onPaste: allowPaste ? handlePaste : undefined,
  }

  return (
    <RedwoodUploadsProvider value={contextValue}>
      <div>
        <div {...rootProps}>
          <input {...getInputProps({ name })} />
          {customMessageContent || defaultMessageContent}
          {dropzoneContent}
        </div>
        {children}
      </div>
    </RedwoodUploadsProvider>
  )
}
