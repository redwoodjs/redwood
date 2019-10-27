import { exec } from 'child_process'

import { getHammerBaseDir } from '@hammerframework/hammer-core'

const Dev = () => {
  exec('yarn dev', { cwd: getHammerBaseDir() }, (err, stdout, stderr) => {
    if (err) {
      console.error(err)
      return
    }
    console.log(stdout, stderr)
  })
  return null
}

export const commandProps = {
  name: 'dev',
  alias: 'd',
  description: 'Launch api, web and prisma dev servers',
}

export default Dev
