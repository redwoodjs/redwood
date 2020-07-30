import { relative, basename } from 'path'

import Listr from 'listr'
import { getProject, RWProject } from '@redwoodjs/structure'

export interface FileActions {
  path: string
  contents: string
  action: 'create' | 'replace' | 'delete'
}

export const writeFilesTask = (
  actions: FileActions[],
  { project, overwrite }: { project: RWProject; overwrite: boolean } = {
    project: getProject(),
    overwrite: false,
  }
) => {
  return new Listr(
    actions.map(({ path, contents, action }) => {
      const alwaysOverwrite = action === 'replace'

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

export const actionsToJSON = (files: FileActions[]) => {
  // remove the "action" part
  const j: Record<string, string | null> = {}
  for (const { path, contents } of files) {
    j[path] = contents
  }
  return JSON.stringify(j, undefined, 2)
}
