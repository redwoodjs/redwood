import React, { useCallback, useState } from 'react'

import { useDropzone } from 'react-dropzone'
import type { DropEvent, FileRejection, DropzoneOptions } from 'react-dropzone'
import type { toast } from 'react-hot-toast'

import { IMAGE_FILE_TYPES } from '../core/fileTypes.js'

type ErrorMessageFunction = (value: string | number) => string

export type UploadFileComponentProps = DropzoneOptions & {
  id?: string
  key?: string
  name?: string
  className?: string
  children?: React.ReactNode
  acceptedFileTypes?: Record<string, string[]>
  SelectFilesButton: React.ComponentType<{ onClick: () => void }>
  showPreviews?: boolean
  previews?: (
    files: File[],
    removeFile: (index: number) => void,
  ) => React.ReactNode
  onFileAccepted?: (files: File[]) => void
  onDropEvent?: (event: DropEvent) => void
  onDropRejected?: (rejectedFiles: FileRejection[]) => void
  toast?: typeof toast
  errorMessages?: {
    maxFiles?: string | ErrorMessageFunction
    fileType?: string | ErrorMessageFunction
  }
}

export const UploadFilesComponent = ({
  id = 'upload-files-component',
  key = 'upload-files-component',
  name = 'upload',
  className = '',
  onFileAccepted,
  maxFiles = 20,
  acceptedFileTypes = IMAGE_FILE_TYPES,
  children,
  SelectFilesButton,
  showPreviews = false,
  previews,
  toast,
  errorMessages = {
    maxFiles: (max: string | number) =>
      `You can only upload up to ${max} files at a time`,
    fileType: (count: string | number) =>
      `${count} file(s) are not of the accepted type`,
  },
}: UploadFileComponentProps) => {
  const [files, setFiles] = useState<File[]>([])

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: File[]) => {
      if (rejectedFiles.length > 0) {
        if (rejectedFiles.length > maxFiles) {
          if (toast) {
            const message =
              typeof errorMessages.maxFiles === 'function'
                ? errorMessages.maxFiles(maxFiles)
                : errorMessages.maxFiles ||
                  `You can only upload up to ${maxFiles} files at a time`
            toast.error(message)
          }
        } else {
          const nonAcceptedFiles = rejectedFiles.filter(
            (file) =>
              !Object.keys(acceptedFileTypes).some((type) =>
                file.type.startsWith(type),
              ),
          )
          if (nonAcceptedFiles.length > 0) {
            if (toast) {
              const message =
                typeof errorMessages.fileType === 'function'
                  ? errorMessages.fileType(nonAcceptedFiles.length)
                  : errorMessages.fileType ||
                    `${nonAcceptedFiles.length} file(s) are not of the accepted type`
              toast.error(message)
            }
          }
        }
        return
      }

      setFiles((prev) => [...prev, ...acceptedFiles])
      onFileAccepted?.(acceptedFiles)
    },
    [maxFiles, acceptedFileTypes, onFileAccepted, toast, errorMessages],
  )

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (
      acceptedFiles: File[],
      fileRejections: FileRejection[],
      event: DropEvent,
    ) => {
      const rejectedFiles = fileRejections.map((rejection) => rejection.file)
      onDrop(acceptedFiles, rejectedFiles)

      // Handle the event if needed
      if (event.type === 'drop') {
        console.log('Files were dropped')
      }
    },
    accept: acceptedFileTypes,
    maxFiles,
    noClick: true,
  })

  return (
    <div id={id} key={key} {...getRootProps()} className={className}>
      <input {...getInputProps({ name })} />
      {isDragActive ? children : <>{children}</>}

      <SelectFilesButton onClick={open} />

      {files &&
        files.length > 0 &&
        showPreviews &&
        previews?.(files, removeFile)}
    </div>
  )
}
