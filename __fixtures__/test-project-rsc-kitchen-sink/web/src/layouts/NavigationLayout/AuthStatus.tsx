'use client'

import { useEffect, useState } from 'react'

import { useAuth } from 'src/auth'

interface Props {
  initialIsAuthenticated: boolean
}

export const AuthStatus = ({ initialIsAuthenticated }: Props) => {
  const [internalIsAuthenticated, setInternalIsAuthenticated] = useState(
    initialIsAuthenticated
  )
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    setInternalIsAuthenticated(isAuthenticated)
  }, [isAuthenticated])

  return (
    <span className="auth-status">{internalIsAuthenticated ? '🟢' : '🔴'}</span>
  )
}
