import type { DropzoneOptions, FileRejection } from 'react-dropzone'

export interface FileRendererProps {
  files: File[]
}

export interface FileRejectionRendererProps {
  fileRejections: FileRejection[]
}

export type MessageProp =
  | string
  | ((args: {
      maxFiles: number
      minSize?: number
      maxSize?: number
      accept: DropzoneOptions['accept']
    }) => string)

export interface RedwoodUploadComponentProps extends DropzoneOptions {
  name?: string
  acceptedFiles?: File[]
  setAcceptedFiles?: (files: File[]) => void
  fileRejections?: FileRejection[]
  setFileRejections?: (fileRejections: FileRejection[]) => void
  className?: string
  maxFiles?: number
  minSize?: number
  maxSize?: number
  activeClassName?: string
  rejectClassName?: string
  buttonClassName?: string
  showButton?: boolean
  buttonText?: string
  defaultMessage?: MessageProp // Default message when no file is rejected
  rejectMessage?: MessageProp // Message for file type rejection or too many files
  activeMessage?: MessageProp // Message for active zone
  fileRenderer?: React.ComponentType<FileRendererProps> // Custom component to render files
  fileRejectionRenderer?: React.ComponentType<FileRejectionRendererProps> // Custom component to render file rejections
}
