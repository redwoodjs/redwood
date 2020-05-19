import execa from 'execa'
import { getPaths } from 'src/lib'

export const command = 'lint'
export const desc = 'Lint your files.'
export const builder = {
  fix: { type: 'boolean', default: false },
}

export const handler = ({ fix }) => {
  execa('yarn eslint', [fix && '--fix', 'web/src', 'api/src'].filter(Boolean), {
    cwd: getPaths().base,
    shell: true,
    stdio: 'inherit',
  })
}
