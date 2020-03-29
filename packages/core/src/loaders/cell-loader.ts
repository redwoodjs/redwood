export default function(source: string) {
  const exports: string[] = []

  const names = [
    'QUERY',
    'Loading',
    'Success',
    'Failure',
    'Empty',
    'beforeQuery',
    'afterQuery',
  ]

  names.forEach((name) => {
    source.match(`export const ${name}`) && exports.push(name)
  })

  const newSource = `import { withCell } from '@redwoodjs/web'
${source}
export default withCell({ ${exports.join(', ')} })`

  // Give 'em what they want!
  return newSource
}
