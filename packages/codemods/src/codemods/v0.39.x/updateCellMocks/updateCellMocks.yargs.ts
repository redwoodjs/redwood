import path from 'path'

import fg from 'fast-glob'
import task from 'tasuku'

import getRWPaths from '../../../lib/getRWPaths'
import runTransform from '../../../lib/runTransform'

export const command = 'update-cell-mocks'
export const description =
  '(v0.38->v0.39) Updates standard cell mocks to export functions, instead of objects'

export const handler = () => {
  const rwPaths = getRWPaths()

  const cellMocks = fg.sync('**/*.mock.{js,ts}', {
    cwd: rwPaths.web.src,
    absolute: true,
  })

  task(
    'Updating Cell mocks',
    async ({ setWarning, setOutput }: task.TaskInnerApi) => {
      if (cellMocks.length < 1) {
        setWarning('No cell mocks found')
      } else {
        await runTransform({
          transformPath: path.join(__dirname, 'updateCellMocks.js'),
          targetPaths: cellMocks,
        })
      }

      setOutput('All done! Run `yarn rw lint --fix` to prettify your code')
    }
  )
}
