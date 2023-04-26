import task, { TaskInnerAPI } from 'tasuku'

import { checkReactRoot, updateReactDeps } from './checkReactRoot'

export const command = 'check-react-root'

export const description = '(v5.x.x->v5.x.x) Converts world to bazinga'

export const handler = () => {
  task('Check react root', ({ setOutput }: TaskInnerAPI) => {
    checkReactRoot()
    setOutput('All done!')
  })

  task('Update react deps', ({ setOutput }: TaskInnerAPI) => {
    updateReactDeps()
    setOutput('All done!')
  })
}
