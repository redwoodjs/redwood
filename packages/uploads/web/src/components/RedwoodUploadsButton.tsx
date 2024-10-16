import React from 'react'

import { useRedwoodUploadsContext } from './hooks/useRedwoodUploadsContext.js'

interface RedwoodUploadsButtonProps {
  children: React.ReactNode
  className?: string
}

export const RedwoodUploadsButton: React.FC<RedwoodUploadsButtonProps> = ({
  children,
  className,
}) => {
  const { open } = useRedwoodUploadsContext()

  return (
    <button type="button" onClick={open} className={className}>
      {children}
    </button>
  )
}
