import type React from 'react'

import type { Accept, DropzoneOptions } from 'react-dropzone'

export interface FileConstraintsProps {
  accept?: Accept
  maxFiles?: number
  minSize?: number
  maxSize?: number
  multiple?: boolean
}

export interface RedwoodUploadComponentProps
  extends Omit<DropzoneOptions, 'onDrop'> {
  id?: string
  key?: string
  name?: string
  className?: string
  fileConstraints?: FileConstraintsProps
  children?: React.ReactNode
  dropzoneContent?: React.ReactNode
  messageContent?: React.ReactNode
  setFiles?: React.Dispatch<React.SetStateAction<File[]>>
  onResetFiles?: (resetFunction: () => void) => void
}

export type MessageProp = string | ((args: MessagePropArgs) => string)

interface MessagePropArgs {
  maxFiles: number
  minSize: number
  maxSize: number
  accept: Accept
}
