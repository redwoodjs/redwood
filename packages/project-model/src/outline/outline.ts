import { RWProject } from '../model'
import { FileNode } from '../ide'
import { OutlineItem, Icon } from './types'

/*
- all items have icons. in vscode you can create items without icons but
  they introduce layout consistency issues.
*/

export function getOutline(project: RWProject): OutlineItem {
  return {
    label: 'Redwood.js',
    icon: Icon.redwood,
    async children() {
      return [
        {
          label: 'pages',
          onAdd: 'rw g page',
          link: `file://${project.pathHelper.web.pages}`,
          async children() {
            return fromFiles(project.pages)
          },
        },
        {
          label: 'Routes.js',
          link: project.router.uri,
          onAdd: 'rw g page',
          async children() {
            return project.router.routes.map((route) => {
              return {
                id: route.id,
                label: route.outlineLabel,
                description: route.outlineDescription,
                link: route.outlineLink,
                icon: route.isAuthenticated ? Icon.route_private : Icon.route,
              }
            })
          },
        },
        {
          label: 'components',
          onAdd: 'rw g component',
          link: `file://${project.pathHelper.web.components}`,
          async children() {
            return fromFiles(project.components)
          },
        },
        {
          label: 'layouts',
          onAdd: 'rw g layout',
          link: `file://${project.pathHelper.web.layouts}`,
          async children() {
            return fromFiles(project.layouts)
          },
        },
        {
          label: 'cells',
          onAdd: 'rw g cell',
          link: `file://${project.pathHelper.web.components}`,
          async children() {
            return fromFiles(project.cells)
          },
        },
        {
          label: 'services',
          onAdd: 'rw g service',
          link: `file://${project.pathHelper.api.services}`,
          async children() {
            return fromFiles(project.services)
          },
        },
        {
          label: 'functions',
          onAdd: 'rw g function',
          link: `file://${project.pathHelper.api.functions}`,
          async children() {
            return fromFiles(project.functions)
          },
        },
        {
          label: 'schema.prisma',
          link: `file://${project.pathHelper.api.dbSchema}`,
          async children() {
            const dmmf = await project.prismaDMMF()
            return dmmf.datamodel.models.map((model) => {
              return {
                label: model.name,
                async children() {
                  const fields = model.fields.map((f) => {
                    return { label: f.name, description: `:${f.type}` }
                  })
                  const actions: OutlineItem[] = [
                    {
                      label: 'generate sdl',
                      description:
                        'create graphql interface to access this model',
                      link: `rw g sdl ${model.name}`,
                    },
                    {
                      label: 'generate scaffold',
                      description:
                        'generate pages, SDL, and a services object for this model',
                      link: `rw g scaffold ${model.name}`,
                    },
                  ]
                  return [...fields, ...actions]
                },
              }
            })
          },
        },
      ]
    },
  }
}

function fromFiles(fileNodes: FileNode[]): OutlineItem[] {
  return fileNodes.map(fromFile)
}

function fromFile(fileNode: FileNode): OutlineItem {
  return {
    key: fileNode.id,
    label: fileNode.basenameNoExt,
    link: fileNode.uri,
  }
}

/**
 * this is used for
 * @param uri
 * @param root
 */
export async function findOutlineItemForFile(
  uri: string,
  root: OutlineItem
): Promise<OutlineItem | undefined> {
  if (root.link === uri) return root
  // bail out early on branches are not potential parents
  if (root.link) if (!uri.startsWith(root.link)) return undefined
  const children = root.children ? await root.children() : []
  for (const c of children) {
    const ff = await findOutlineItemForFile(uri, c)
    if (ff) return ff
  }
}
