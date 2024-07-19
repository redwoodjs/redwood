'use client'

import type { FindUserExamples } from 'types/graphql'

import { Link, routes } from '@redwoodjs/router'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import UserExamples from '../UserExamples/UserExamples'

export const QUERY = gql`
  query FindUserExamples {
    userExamples {
      id
      email
      name
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => {
  return (
    <div className="rw-text-center">
      No userExamples yet.{' '}
      <Link to={routes.newUserExample()} className="rw-link">
        Create one?
      </Link>
    </div>
  )
}

export const Failure = ({ error }: CellFailureProps) => (
  <div className="rw-cell-error">{error?.message}</div>
)

export const Success = ({
  userExamples,
}: CellSuccessProps<FindUserExamples>) => {
  return <UserExamples userExamples={userExamples} />
}
