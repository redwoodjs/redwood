import execa from 'execa'

import { getPaths } from 'src/lib'

export const command = 'test'
export const desc = 'Run Jest tests.'

export const handler = () => {
  //need to adjust import settings to be same as Webpack `directory-named-webpack-plugin`
  execa('yarn jest --config=\'{"resolver":"jest-directory-named-resolver"}\'', {
    cwd: getPaths().base,
    shell: true,
    stdio: 'inherit',
  }).catch((e) => {
    console.log(e)
  })
}
