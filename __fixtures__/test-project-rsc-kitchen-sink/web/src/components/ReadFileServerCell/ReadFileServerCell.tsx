import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

export const data = async () => {
  const srcPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    '..',
    'src',
    'components',
    'ReadFileServerCell',
    'ReadFileServerCell.tsx'
  )

  const file = fs.readFileSync(srcPath, 'utf-8')

  return { file }
}

export const Loading = () => <div>Reading file...</div>

export const Empty = () => <div>Empty file</div>

export const Failure = ({ error }: CellFailureProps) => (
  <div className="rw-cell-error">{error?.message}</div>
)

type SuccessProps = CellSuccessProps<Awaited<ReturnType<typeof data>>>
export const Success = ({ file }: SuccessProps) => {
  return (
    <div className="read-file-server-cell">
      <p>The source of this server cell:</p>
      <pre
        style={{
          border: '1px solid gray',
          margin: '1em',
          background: '#ddd',
          height: '260px',
          overflowY: 'scroll',
        }}
      >
        <code>{file}</code>
      </pre>
    </div>
  )
}
