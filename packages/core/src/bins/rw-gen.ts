import { createRequire } from 'module'

const requireFromInternal = createRequire(
  require.resolve('@redwoodjs/internal/package.json')
)

const bins = requireFromInternal('./package.json')['bin']

requireFromInternal(bins['rw-gen'])
