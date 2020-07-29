import { relative, basename } from 'path'

import Listr from 'listr'
import { getProject, RWProject } from '@redwoodjs/structure'

export interface File {
  path: string
  contents: string
  overwrite?: boolean
}

export const writeFilesTask = (
  files: File[],
  { project, overwrite }: { project: RWProject; overwrite: boolean } = {
    project: getProject(),
    overwrite: false,
  }
) => {
  return new Listr(
    files.map(({ path, contents, overwrite: alwaysOverwrite }) => {
      return {
        title: `Writing \`./${relative(project.pathHelper.base, path)}\`...`,
        task: () => {
          // Create the directory if it doesn't exist.
          project.host.mkdirSync(path.replace(basename(path), ''))

          if (alwaysOverwrite || overwrite) {
            project.host.writeFileSync(path, contents)
          } else if (!project.host.existsSync(path)) {
            project.host.writeFileSync(path, contents)
          } else {
            throw new Error(`${path} already exists.`)
          }
        },
      }
    })
  )
}
