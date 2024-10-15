import React, { useEffect, useState } from 'react'

import { useDropzone } from 'react-dropzone'
import type { FileRejection } from 'react-dropzone'

import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_DOCUMENT_TYPES,
} from '../core/fileTypes.js'

import { DefaultFileRejectionRenderer } from './DefaultFileRejectionRenderer.js'
import { DefaultFileRenderer } from './DefaultFileRenderer.js'
import type { RedwoodUploadComponentProps } from './types.js'

export const RedwoodUploadsComponent: React.FC<RedwoodUploadComponentProps> = ({
  fileHandling,
  fileConstraints,
  styling,
  uiElements,
  button,
  customMessages,
  customRenderers,
  children,
  ...dropzoneOptions
}) => {
  const {
    onDrop,
    acceptedFiles,
    setAcceptedFiles,
    fileRejections,
    setFileRejections,
  } = fileHandling || {}

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

  const {
    className = '',
    activeClassName = '',
    rejectClassName = '',
    buttonClassName = '',
  } = styling || {}

  const { name = 'uploads' } = uiElements || {}

  const { buttonText = 'Select files', showButton = false } = button || {}

  const {
    rejectMessage = 'Invalid file(s). Please check requirements and try again.',
    defaultMessage = "Drag 'n' drop some files here, or click to select files",
    activeMessage = "Drag 'n' drop some files here, or click to select files",
  } = customMessages || {}

  const {
    fileRenderer: FileRendererComponent = DefaultFileRenderer,
    fileRejectionRenderer:
      FileRejectionRendererComponent = DefaultFileRejectionRenderer,
  } = customRenderers || {}

  const [internalAcceptedFiles, setInternalAcceptedFiles] = useState<File[]>([])
  const [internalFileRejections, setInternalFileRejections] = useState<
    FileRejection[]
  >([])

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
      setInternalAcceptedFiles(acceptedFiles)
      setInternalFileRejections(fileRejections)
      onDrop?.(
        acceptedFiles,
        fileRejections,
        event as unknown as React.DragEvent<HTMLElement>,
      )
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

  // Function to generate the active message
  const getActiveMessage = (): string => {
    if (typeof activeMessage === 'function') {
      return activeMessage({ maxFiles, minSize, maxSize, accept })
    }
    return activeMessage
  }

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
        <p>
          {isDragReject
            ? getRejectMessage()
            : isDragActive
              ? getActiveMessage()
              : getDefaultMessage()}
        </p>
        {children}
      </div>

      {showButton && (
        <button type="button" className={buttonClassName} onClick={open}>
          {buttonText}
        </button>
      )}
      <aside>
        {((acceptedFiles?.length ?? 0) > 0 ||
          internalAcceptedFiles.length > 0) && (
          <FileRendererComponent
            files={acceptedFiles ?? internalAcceptedFiles}
          />
        )}
        {((fileRejections?.length ?? 0) > 0 ||
          internalFileRejections.length > 0) && (
          <FileRejectionRendererComponent
            fileRejections={fileRejections || internalFileRejections}
          />
        )}
      </aside>
    </section>
  )
}
