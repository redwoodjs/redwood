import fs from 'fs'
import path from 'path'

import { getPaths } from '@redwoodjs/project-config'

export const updateScaffoldStyles = () => {
  const scaffoldCSSPath = path.join(getPaths().web.src, 'scaffold.css')

  if (fs.existsSync(scaffoldCSSPath)) {
    let scaffoldCSS = fs.readFileSync(scaffoldCSSPath, 'utf8')

    scaffoldCSS =
      scaffoldCSS +
      [
        '',
        '.rw-input-error:focus {',
        '  outline: none;',
        '  border-color: #c53030;',
        '  box-shadow: 0 0 5px #c53030;',
        '}',
        '',
      ].join('\n')

    fs.writeFileSync(scaffoldCSSPath, scaffoldCSS)
  }
}
