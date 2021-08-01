import type { CellFailureProps } from '@redwoodjs/web'

const FailureState = ({ error }: CellFailureProps) => {
  return <div style={{ color: 'red' }}>Error: {error.message}</div>
}

export default FailureState
