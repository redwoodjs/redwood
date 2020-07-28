import { FileNode } from '../ide'
import { RWProject } from '../model'
import { URL_file } from '../x/URL'
import { Icon, OutlineItem } from './types'

export function getOutline(project: RWProject): OutlineItem {
  return {
    label: 'Redwood.js',
    icon: Icon.redwood,
    expanded: true,
    async children() {
      return [
        {
          label: 'Routes.js',
          link: project.router.uri,
          doc: `${DOCS}/redwood-router`,
          icon: Icon.pages,
          add: 'rw generate page ...',
          async children() {
            return project.router.routes.map((route) => {
              return {
                id: route.id,
                label: route.outlineLabel,
                description: route.outlineDescription,
                link: route.outlineLink,
                icon: Icon.page,
              }
            })
          },
        },
        {
          label: 'pages',
          icon: Icon.pages,
          onAdd: 'rw generate page ...',
          link: URL_file(project.pathHelper.web.pages),
          async children() {
            return project.pages.map((page) => {
              return {
                id: page.id,
                label: page.basename,
                link: page.uri,
                icon: Icon.page,
                description: page.route?.path,
                async children() {
                  return [
                    rw_commands({
                      label: 'destroy',
                      cmd: 'rw destroy page ' + page.basenameNoExt,
                      tooltip: '',
                    }),
                  ]
                },
              }
            })
          },
        },
        {
          label: 'components',
          add: 'rw generate component ...',
          icon: Icon.components,
          link: URL_file(project.pathHelper.web.components),
          async children() {
            return fromFiles(project.components)
          },
        },
        {
          label: 'layouts',
          add: 'rw generate layout ...',
          icon: Icon.layouts,
          link: URL_file(project.pathHelper.web.layouts),
          async children() {
            return fromFiles(project.layouts)
          },
        },
        {
          label: 'cells',
          add: 'rw generate cell ...',
          icon: Icon.cells,
          link: URL_file(project.pathHelper.web.components),
          async children() {
            return fromFiles(project.cells)
          },
        },
        {
          label: 'services',
          add: 'rw generate service ...',
          icon: Icon.services,
          link: URL_file(project.pathHelper.api.services),
          async children() {
            return fromFiles(project.services)
          },
        },
        {
          label: 'functions',
          add: 'rw generate function ...',
          doc: `${DOCS}/serverless-functions`,
          icon: Icon.functions,
          link: URL_file(project.pathHelper.api.functions),
          // TODO: link to published function
          // http://localhost:8911/graphql
          async children() {
            return fromFiles(project.functions)
          },
        },
        {
          label: 'schema.prisma',
          icon: Icon.prisma,
          link: URL_file(project.pathHelper.api.dbSchema),
          async children() {
            const dmmf = await project.prismaDMMF()
            const models = dmmf.datamodel.models.map((model) => {
              return {
                label: model.name,
                icon: Icon.model,
                async children() {
                  const fields = model.fields.map((f) => {
                    return { label: f.name, description: `:${f.type}` }
                  })
                  const commands = rw_commands(
                    {
                      label: 'generate sdl',
                      tooltip: 'create graphql interface to access this model',
                      cmd: `generate sdl ${model.name}`,
                    },
                    {
                      label: 'generate scaffold',
                      cmd: `generate scaffold ${model.name}`,
                      tooltip:
                        'generate pages, SDL, and a services object for this model',
                    }
                  )
                  return [...fields, commands]
                },
              }
            })
            const commands = rw_commands(
              {
                cmd: 'db save',
                tooltip: 'save migration file with new changes',
              },
              {
                cmd: 'db up',
                tooltip: 'apply migrations',
              }
            )
            return [...models, commands]
          },
        },
        {
          label: 'redwood.toml',
          icon: Icon.redwood,
          link: URL_file(project.pathHelper.base, 'redwood.toml'),
        },
        rw_commands({
          cmd: 'generate ...',
          tooltip: 'start interactive redwood generator',
        }),
      ]
    },
  }
}

const DOCS = 'https://redwoodjs.com/docs'

// TODO: add link to docs https://redwoodjs.com/docs/serverless-functions

interface RWOpts {
  cmd: string
  label?: string
  tooltip: string
}

function rw_commands(...opts: RWOpts[]): OutlineItem {
  return {
    label: '',
    key: 'actions',
    tooltip: 'Redwood CLI actions',
    icon: Icon.rw_cli,
    async children() {
      return opts.map(rw_command)
    },
  }
}

function rw_command(opts: RWOpts) {
  const { cmd, label, tooltip } = opts
  let link = cmd
  if (!(cmd.startsWith('rw') || cmd.startsWith('redwood'))) {
    link = 'redwood ' + cmd
  }
  return {
    label: label ?? cmd,
    description: label ? cmd : '',
    tooltip,
    link,
  }
}

function fromFiles(fileNodes: FileNode[]): OutlineItem[] {
  return fileNodes.map(fromFile)
}

function fromFile(fileNode: FileNode): OutlineItem {
  return {
    key: fileNode.id,
    label: fileNode.basename,
    link: fileNode.uri,
  }
}
