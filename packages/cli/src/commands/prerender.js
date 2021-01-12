import { runPrerender } from '@redwoodjs/prerender'

export const command = 'prerender'
export const aliases = ['render']
export const description = 'Prerender pages of a redwood app (experimental)'

export const builder = (yargs) => {
  yargs.option('input', {
    alias: 'input',
    default: false,
    description: 'Input file to prerender',
    type: 'string',
  })

  yargs.option('output', {
    alias: 'output',
    default: false,
    description: 'Output path',
    type: 'string',
  })
}

export const handler = async ({ input, output }) => {
  console.log('args', {
    input,
    output,
  })
  runPrerender({
    input,
    output,
  })
}
