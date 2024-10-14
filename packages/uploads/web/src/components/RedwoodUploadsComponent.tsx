import React, { useEffect } from 'react'

import { useDropzone } from 'react-dropzone'

import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_DOCUMENT_TYPES,
} from '../core/fileTypes.js'

import { DefaultFileRejectionRenderer } from './DefaultFileRejectionRenderer.js'
import { DefaultFileRenderer } from './DefaultFileRenderer.js'
import type { RedwoodUploadComponentProps } from './types.js'

export const RedwoodUploadsComponent: React.FC<RedwoodUploadComponentProps> = ({
  onDrop,
  acceptedFiles,
  setAcceptedFiles,
  fileRejections,
  setFileRejections,
  accept = {
    ...ACCEPTED_IMAGE_TYPES,
    ...ACCEPTED_DOCUMENT_TYPES,
  }, // Default accept for images and documents
  name = 'uploads',
  maxFiles = 1,
  minSize = 0, // Minimum file size in bytes default to 0
  maxSize = 1_024 * 1_024, // 1MB default size
  multiple = false,
  className = '',
  activeClassName = '',
  rejectClassName = '',
  buttonClassName = '',
  showButton = false, // Optionally show a button for selecting files
  buttonText = 'Select files',
  rejectMessage = 'Invalid file(s). Please check requirements and try again.', // Simplified reject message
  defaultMessage = "Drag 'n' drop some files here, or click to select files", // Custom default message
  fileRenderer: FileRendererComponent = DefaultFileRenderer, // Default to simple file renderer
  fileRejectionRenderer:
    FileRejectionRendererComponent = DefaultFileRejectionRenderer, // Default to simple file renderer
  ...dropzoneOptions
}) => {
  const {
    getRootProps,
    getInputProps,
    open, // `open` allows opening the file dialog programmatically
    isDragActive,
    isDragReject,
  } = useDropzone({
    onDrop: (acceptedFiles, fileRejections, event) => {
      setAcceptedFiles?.(acceptedFiles)
      setFileRejections?.(fileRejections)
      onDrop?.(acceptedFiles, fileRejections, event)
    },
    accept,
    maxFiles,
    minSize,
    maxSize,
    multiple: maxFiles > 1 ? true : multiple, // Set multiple to true if maxFiles > 1
    noClick: showButton,
    ...dropzoneOptions,
  })
  useEffect(() => {
    if (acceptedFiles && acceptedFiles.length === 0) {
      getRootProps().ref.current?.dropzone?.removeAllFiles()
    }
  }, [acceptedFiles, getRootProps])

  useEffect(() => {
    if (fileRejections && fileRejections.length === 0) {
      getRootProps().ref.current?.dropzone?.removeAllFiles()
    }
  }, [fileRejections, getRootProps])

  // Function to generate the reject message
  const getRejectMessage = (): string => {
    if (typeof rejectMessage === 'function') {
      return rejectMessage({ maxFiles, minSize, maxSize, accept })
    }
    return rejectMessage
  }

  // Function to generate the default message
  const getDefaultMessage = (): string => {
    if (typeof defaultMessage === 'function') {
      return defaultMessage({ maxFiles, minSize, maxSize, accept })
    }
    return defaultMessage
  }

  const combinedClassName = `${className} ${
    isDragActive ? activeClassName : ''
  } ${isDragReject ? rejectClassName : ''}`

  return (
    <section>
      <div {...getRootProps({ className: combinedClassName })}>
        <input {...getInputProps({ name })} />
        <p>{isDragReject ? getRejectMessage() : getDefaultMessage()}</p>
      </div>

      {showButton && (
        <button type="button" className={buttonClassName} onClick={open}>
          {buttonText}
        </button>
      )}
      <aside>
        {acceptedFiles && acceptedFiles.length > 0 && (
          <FileRendererComponent files={acceptedFiles} />
        )}
        {fileRejections && fileRejections.length > 0 && (
          <FileRejectionRendererComponent fileRejections={fileRejections} />
        )}
      </aside>
    </section>
  )
}
