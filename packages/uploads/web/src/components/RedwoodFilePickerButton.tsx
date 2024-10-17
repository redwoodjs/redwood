import React from 'react'

import { useRedwoodUploadsContext } from './hooks/useRedwoodUploadsContext.js'

interface RedwoodFilePickerButtonProps {
  children: React.ReactNode
  className?: string
}

export const RedwoodFilePickerButton: React.FC<
  RedwoodFilePickerButtonProps
> = ({ children, className }) => {
  const { open } = useRedwoodUploadsContext()

  return (
    <button type="button" onClick={open} className={className}>
      {children}
    </button>
  )
}
