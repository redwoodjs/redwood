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
      minFiles?: number
      minSize: number
      accept: DropzoneOptions['accept']
    }) => string)

export interface RedwoodUploadComponentProps extends DropzoneOptions {
  name?: string
  className?: string
  maxFiles?: number
  minFiles?: number
  activeClassName?: string
  rejectClassName?: string
  buttonClassName?: string
  showButton?: boolean
  buttonText?: string
  rejectMessage?: MessageProp // Message for file type rejection or too many files
  defaultMessage?: MessageProp // Default message when no file is rejected
  fileRenderer?: React.ComponentType<FileRendererProps> // Custom component to render files
  fileRejectionRenderer?: React.ComponentType<FileRejectionRendererProps> // Custom component to render file rejections
}
