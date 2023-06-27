/**
 * Required features:
 *  - [x] Can dispatch to a command based on argv
 *  - [x] Can load commands from a file
 *  - [x] Can load commands directly from an array of objects
 *  - [x] Supports a cache file for command definitions
 *  - [ ] Can produce help output
 *  - [ ] Can produce version output
 *  - [ ] Can produce completion output
 *  - [x] Can parse argv based on argument definitions
 *  - [ ] Can execute global middleware functions
 *  - [x] Can execute dispatch specific middleware functions
 *  - [x] Can execute a command handler
 *  - [ ] Can run post/pre command hooks
 */

import { parse } from './parsing'
import { DispatchTree } from './types'

export class CLIManager {
  constructor(private dispatchTree: DispatchTree) {}

  // TODO: Note that this function expects argv to be trimmed to just the command, no node, script path, etc
  public async dispatch(argv: string[]): Promise<any> {
    // TODO: Support a help message - see https://stackoverflow.com/a/9727046 for some guidance on what it should contain
    // TODO: Consider wrapping areas in try/catch to provide better error messages, eg a middleware failed to load

    if (this.dispatchTree === undefined) {
      throw new Error('Dispatch tree not set')
    }

    if (argv.length === 1 && (argv[0] === '--version' || argv[0] === '-v')) {
      // TODO: Show version
      throw new Error('Version not implemented yet')
    }

    // TODO: Support global middleware. Does this fire always even if a command is not found?
    const middlewareEncountered = []

    // find the command definition in the dispatch tree
    let node = this.dispatchTree.tree
    let i = 0
    for (; i < argv.length; i++) {
      const segment = argv[i]

      // check for middleware
      if (
        node.definition?.middleware !== undefined &&
        node.definition.middleware.length > 0
      ) {
        middlewareEncountered.push(...node.definition.middleware)
      }

      // move to the next node
      if (node.children?.[segment]) {
        node = node.children[segment]
      } else {
        break
      }
    }

    if (node.definition === undefined) {
      // TODO: Show help
      throw new Error('Command not found')
    }

    if (node.definition.execute === undefined) {
      // TODO: Show help
      throw new Error('Command does not have an execute function')
    }

    if (
      node.definition.middleware !== undefined &&
      node.definition.middleware.length > 0
    ) {
      middlewareEncountered.push(...node.definition.middleware)
    }

    const commandDefinition = node.definition

    // TODO: This logic around full matching can likely be removed as it should be handled by the parser
    const isFullMatch = i === argv.length
    const expectedPositionalArguments =
      (commandDefinition.positionalArguments?.filter((arg) => arg.required)
        .length ?? 0) > 0

    // Passed too few positional arguments
    if (isFullMatch && expectedPositionalArguments) {
      // TODO: Show help
      throw new Error('Passed too few positional arguments')
    }

    // Passed too many positional arguments
    if (!isFullMatch && !expectedPositionalArguments) {
      // TODO: Show help
      throw new Error('Passed too many positional arguments')
    }

    // TODO: Do we parse the arguments any earlier?
    // extract out the parsed arguments
    const args = parse(
      argv.slice(i),
      commandDefinition.positionalArguments,
      commandDefinition.keywordArguments
    )

    for (let i = 0; i < middlewareEncountered.length; i++) {
      const middlewareFile = await import(middlewareEncountered[i])
      await middlewareFile.execute(args, commandDefinition)
    }

    // TODO: consider any implementation of hooks or pre/post command functions?

    // Import the command execute function and run it
    if (commandDefinition.execute === undefined) {
      throw new Error('Expected command path')
    }
    const commandFile = await import(commandDefinition.execute)
    return await commandFile.execute(args, commandDefinition, argv)
  }
}
