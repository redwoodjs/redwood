import { parseDatamodel } from '@redwoodjs/record'

export const handler = async () => {
  await parseDatamodel()
  console.info('Calling handler in datamodel.js')
}
