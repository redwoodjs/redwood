import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import { globalValues } from './actions'

import './RandomNumberServerCell.css'

interface DataArgs {
  global?: boolean
}

export const data = async ({ global }: DataArgs) => {
  const num = Math.round(Math.random() * 1000)
  if (global) {
    globalValues.num ??= num
  }

  return { num: global ? globalValues.num : num }
}

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }: CellFailureProps) => (
  <div className="rw-cell-error">{error?.message}</div>
)

type SuccessProps = CellSuccessProps<Awaited<ReturnType<typeof data>>> &
  DataArgs

export const Success = ({ num, global }: SuccessProps) => {
  return (
    <div className="random-number-server-cell">
      <h2>RandomNumberServerCell{global && ' (global)'}</h2>
      <div>{num}</div>
    </div>
  )
}
