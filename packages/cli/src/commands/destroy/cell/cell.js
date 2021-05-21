import { yargsDefaults } from '../../generate'
import { files as cellFiles } from '../../generate/cell/cell'
import { createYargsForComponentDestroy } from '../helpers'

export const { command, description, builder, handler, tasks } =
  createYargsForComponentDestroy({
    componentName: 'cell',
    filesFn: cellFiles,
    optionsObj: {
      ...yargsDefaults,
      list: {
        alias: 'l',
        default: null,
        description:
          'Use when you want to generate a cell for a list of the model name.',
        type: 'string',
      },
    },
  })
