import React, { useContext } from 'react'

import type { FileRejection } from 'react-dropzone'
export interface RedwoodUploadsContextType {
  open: () => void
  isDragActive: boolean
  isDragReject: boolean
  acceptedFiles: File[]
  fileRejections: FileRejection[]
  setAcceptedFiles: React.Dispatch<React.SetStateAction<File[]>>
  setFileRejections: React.Dispatch<React.SetStateAction<FileRejection[]>>
}

const RedwoodUploadsContext = React.createContext<
  RedwoodUploadsContextType | undefined
>(undefined)

export const useRedwoodUploadsContext = () => {
  const context = useContext(RedwoodUploadsContext)
  if (context === undefined) {
    throw new Error('useDropzoneContext must be used within a DropzoneProvider')
  }
  return context
}

export const RedwoodUploadsProvider = RedwoodUploadsContext.Provider
