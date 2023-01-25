import React, { useEffect } from 'react'

import { ClerkLoaded, ClerkProvider, useUser } from '@clerk/clerk-react'

import { createAuth } from '@redwoodjs/auth-clerk-web'
import { navigate } from '@redwoodjs/router'

export const { AuthProvider: ClerkRwAuthProvider, useAuth } = createAuth()

interface Props {
  children: React.ReactNode
}

const ClerkStatusUpdater = () => {
  const { isSignedIn, user, isLoaded } = useUser()
  const { reauthenticate } = useAuth()

  useEffect(() => {
    if (isLoaded) {
      reauthenticate()
    }
  }, [isSignedIn, user, reauthenticate, isLoaded])

  return null
}

export const AuthProvider = ({ children }: Props) => {
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY
  const frontendApi =
    process.env.CLERK_FRONTEND_API_URL || process.env.CLERK_FRONTEND_API

  type ClerkOptions =
    | { publishableKey: string; frontendApi?: never }
    | { publishableKey?: never; frontendApi: string }

  const clerkOptions: ClerkOptions = publishableKey
    ? { publishableKey }
    : { frontendApi }

  return (
    <ClerkProvider {...clerkOptions} navigate={(to) => navigate(to)}>
      <ClerkRwAuthProvider>
        <ClerkLoaded>{children}</ClerkLoaded>
        <ClerkStatusUpdater />
      </ClerkRwAuthProvider>
    </ClerkProvider>
  )
}
