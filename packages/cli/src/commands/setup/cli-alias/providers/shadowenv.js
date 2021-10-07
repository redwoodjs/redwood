import { getPaths } from '../../../../lib'
import c from '../../../../lib/colors'

export const name = 'Shadowenv'
export const gitIgnoreAdditions = ['.shadowenv.d']
export const notes = [
  c.warning('Potential manual step(s)\n'),
  'More manual setup may be needed in order to use Shadowenv.\n',
  'Please see: https://shopify.github.io/shadowenv/getting-started/\n',
]
export const configOutputPath = `${getPaths().base}/.shadowenv.d/rw.lisp`
