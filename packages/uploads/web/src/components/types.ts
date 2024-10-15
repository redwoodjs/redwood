import type React from 'react'

import type { Accept, DropzoneOptions, FileRejection } from 'react-dropzone'

export interface FileRendererProps {
  files: File[]
}

export interface FileRejectionRendererProps {
  fileRejections: FileRejection[]
}

export interface FileHandlingProps {
  onDrop?: (
    acceptedFiles: File[],
    fileRejections: FileRejection[],
    event: React.DragEvent<HTMLElement>,
  ) => void
  acceptedFiles?: File[]
  setAcceptedFiles?: React.Dispatch<React.SetStateAction<File[]>>
  fileRejections?: FileRejection[]
  setFileRejections?: React.Dispatch<React.SetStateAction<FileRejection[]>>
}

export interface FileConstraintsProps {
  accept?: Accept
  maxFiles?: number
  minSize?: number
  maxSize?: number
  multiple?: boolean
}

export interface StylingProps {
  className?: string
  activeClassName?: string
  rejectClassName?: string
  buttonClassName?: string
}

export interface UIElementsProps {
  name?: string
}

export interface ButtonProps {
  buttonClassName?: string
  showButton?: boolean
  buttonText?: string
}

export interface CustomMessagesProps {
  rejectMessage?: MessageProp
  defaultMessage?: MessageProp
  activeMessage?: MessageProp
}

export interface CustomRenderersProps {
  fileRenderer?: React.ComponentType<FileRendererProps>
  fileRejectionRenderer?: React.ComponentType<FileRejectionRendererProps>
}

export interface RedwoodUploadComponentProps
  extends Omit<DropzoneOptions, 'onDrop'> {
  fileHandling?: FileHandlingProps
  fileConstraints?: FileConstraintsProps
  styling?: StylingProps
  uiElements?: UIElementsProps
  button?: ButtonProps
  customMessages?: CustomMessagesProps
  customRenderers?: CustomRenderersProps
  children?: React.ReactNode // Add children prop type
}

export type MessageProp = string | ((args: MessagePropArgs) => string)

interface MessagePropArgs {
  maxFiles: number
  minSize: number
  maxSize: number
  accept: Accept
}
