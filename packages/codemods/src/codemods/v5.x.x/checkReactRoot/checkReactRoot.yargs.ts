import task, { TaskInnerAPI } from 'tasuku'

import { checkReactRoot } from './checkReactRoot'

export const command = 'check-react-root'
export const description = '(v5.x.x->v5.x.x) Converts world to bazinga'

export const handler = () => {
  task('Check React Root', ({ setOutput }: TaskInnerAPI) => {
    checkReactRoot()
    setOutput('All done!')
  })
}
