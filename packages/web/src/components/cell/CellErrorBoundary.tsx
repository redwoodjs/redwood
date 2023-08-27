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
    console.log(error, errorInfo)
  }

  render() {
    const { fallback: Fallback } = this.props
    if (this.state.hasError) {
      return (
        <Fallback
          error={this.state.error}
          errorCode={
            this.state.error?.graphQLErrors?.[0]?.extensions?.['code'] as string
          }
          // @TODO (STREAMING) query-result not available here
        />
      )
    }

    return this.props.children
  }
}
