import React from 'react'

import type { CellFailureProps } from './cellTypes'

type CellErrorBoundaryProps = {
  // Note that the fallback has to be an FC, not a Node
  // because the error comes from this component's state
  fallback: React.FC<CellFailureProps>
  children: React.ReactNode
}

interface ErrState {
  hasError: boolean
  error?: QueryOperationResult['error']
}

export class CellErrorBoundary extends React.Component<
  CellErrorBoundaryProps,
  ErrState
> {
  constructor(props: CellErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // @TODO do something with this?
    console.log('Cell failure: ', {
      error,
      errorInfo,
    })
  }

  render() {
    // The fallback is constructed with all the props required, except error and errorCode
    // in createSusepndingCell.tsx
    const { fallback: Fallback } = this.props

    // Fallback is guaranteed!
    if (this.state.hasError) {
      return (
        <Fallback
          error={this.state.error}
          errorCode={
            this.state.error?.graphQLErrors?.[0]?.extensions?.['code'] as string
          }
        />
      )
    }

    return this.props.children
  }
}
