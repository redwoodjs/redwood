import { parseDatamodel } from '@redwoodjs/record'

export const handler = async () => {
  await parseDatamodel()
}
