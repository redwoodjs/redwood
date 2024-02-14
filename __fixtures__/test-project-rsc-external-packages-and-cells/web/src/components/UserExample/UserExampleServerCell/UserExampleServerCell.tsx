import type Prisma from '@prisma/client'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import { db } from 'api/src/lib/db'

import UserExample from 'src/components/UserExample/UserExample'

interface DataArgs {
  id: number
}

export const DATA = async ({ id }: DataArgs) => {
  const userExample = await db.userExample.findUnique({
    where: { id },
  })

  return { userExample }
}

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>UserExample not found</div>

export const Failure = ({ error }: CellFailureProps) => (
  <div className="rw-cell-error">{error?.message}</div>
)

export const Success = ({
  userExample,
}: CellSuccessProps<{ userExample: Prisma.UserExample }>) => {
  return <UserExample userExample={userExample} />
}
