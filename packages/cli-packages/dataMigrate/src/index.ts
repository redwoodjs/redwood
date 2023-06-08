import {
  command as installCommand,
  description as installDescription,
  builder as installBuilder,
  handler as installHandler,
} from './commands/install'
import {
  command as upCommand,
  description as upDescription,
  builder as upBuilder,
  handler as upHandler,
} from './commands/up'

export const commands = [
  {
    command: upCommand,
    description: upDescription,
    builder: upBuilder,
    handler: upHandler,
  },
  {
    command: installCommand,
    description: installDescription,
    builder: installBuilder,
    handler: installHandler,
  },
]
