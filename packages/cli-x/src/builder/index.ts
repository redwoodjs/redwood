import fs from 'fs-extra'

import { CommandDefinition, DispatchTree } from '../types'

/**
 * A class for building dispatch trees
 */
export class DispatchTreeBuilder {
  private dispatchTree: DispatchTree

  private aliasesToProcess: Set<string[]>

  // Creation is only allowed through the static startBuilding method
  private constructor() {
    this.dispatchTree = {
      meta: {
        key: undefined,
        version: undefined,
      },
      tree: {},
    }
    this.aliasesToProcess = new Set()
  }

  // ---
  // Building
  // ---

  /**
   * Start building a new dispatch tree
   *
   * @returns A new DispatchTreeBuilder instance
   */
  static startBuilding(): DispatchTreeBuilder {
    return new DispatchTreeBuilder()
  }

  /**
   * Add a command to the dispatch tree from a definition object
   *
   * @param definition A command definition object
   */
  addCommandFromDefinition(definition: CommandDefinition): DispatchTreeBuilder {
    this.addToDispatchTree(definition)

    return this
  }

  /**
   * Add a command to the dispatch tree from a file which exports the command definition properties
   *
   * @param path The absolute path to the file containing the command definition
   */
  async addCommandFromFile(path: string): Promise<DispatchTreeBuilder> {
    const content = await import(path)

    let hasRequiredProperties = true
    hasRequiredProperties &&= content.trigger !== undefined

    if (!hasRequiredProperties) {
      throw new Error('Command definition is missing required properties')
    }

    this.addCommandFromDefinition({
      trigger: content.trigger,
      aliases: content.aliases,
      description: content.description,
      positionalArguments: content.positionalArguments,
      keywordArguments: content.keywordArguments,
      middleware: content.middleware,
      execute: content.execute,
    })

    return this
  }

  /**
   * Set a key for the dispatch tree which can be used to identify/validate the tree
   *
   * @param key A unique key for the dispatch tree
   */
  setKey(key: string): DispatchTreeBuilder {
    this.dispatchTree.meta.key = key

    return this
  }

  /**
   * Set a version for the dispatch tree which can be shown to users
   *
   * @param version The version which can be shown to users
   */
  setVersion(version: string): DispatchTreeBuilder {
    this.dispatchTree.meta.version = version

    return this
  }

  /**
   * Finish building the dispatch tree, performing any final processing and validation
   *
   * @returns The completed dispatch tree
   */
  finishBuilding(): DispatchTree {
    this.addAliasesToDispatchTree()
    this.validateDispatchTree()

    return this.dispatchTree
  }

  // ---
  // Internal
  // ---

  private addToDispatchTree(definition: CommandDefinition): void {
    // split the trigger into segments which will be used to create the hierarchy
    const triggerSegments = definition.trigger.split(' ')

    // start at the roow
    let node = this.dispatchTree.tree

    // navigate the branches, creating any that don't exist
    let segment = ''
    for (let i = 0; i < triggerSegments.length; i++) {
      segment = triggerSegments[i]

      // a command with an execute function cannot have subcommands
      if (node.definition?.execute !== undefined) {
        throw new Error(
          `Command '${node.definition.trigger}' has an execute function and cannot have subcommands`
        )
      }

      // ensure this branch exists
      if (node.children === undefined) {
        node.children = {
          [segment]: {},
        }
      } else if (node.children[segment] === undefined) {
        node.children[segment] = {}
      }

      // move into the next branch
      node = node.children[segment]
    }

    // a command with subcommands cannot have an execute function
    if (node.children !== undefined && definition.execute !== undefined) {
      throw new Error(
        `Command '${definition.trigger}' has subcommands and cannot have an execute function`
      )
    }

    // create or update the definition
    if (node.definition === undefined) {
      node.definition = definition

      // register any aliases to process at the end
      if (
        definition.aliases !== undefined &&
        definition.aliases.length > 0 &&
        !this.aliasesToProcess.has(triggerSegments)
      ) {
        this.aliasesToProcess.add(triggerSegments)
      }
    } else {
      if (
        node.definition.execute !== undefined &&
        definition.execute !== undefined
      ) {
        throw new Error(
          `Command '${node.definition.trigger}' already has an execute function`
        )
      }

      // insert any previously undefined properties
      node.definition.description ??= definition.description
      node.definition.execute ??= definition.execute

      // TODO: do we want to allow updates to the arguments?

      // upsert any middleware
      if (
        definition.middleware !== undefined &&
        definition.middleware.length > 0
      ) {
        node.definition.middleware ??= []
        node.definition.middleware.push(...definition.middleware)
      }

      // upsert any aliases
      if (definition.aliases !== undefined && definition.aliases.length > 0) {
        node.definition.aliases ??= []
        node.definition.aliases.push(...definition.aliases)

        // register any aliases to process at the end
        if (!this.aliasesToProcess.has(triggerSegments)) {
          this.aliasesToProcess.add(triggerSegments)
        }
      }
    }
  }

  private addAliasesToDispatchTree(): void {
    // we need to process the aliases in order of length, from longest to shortest
    // this ensures aliases can contain other aliases
    const aliasesToProcess = Array.from(this.aliasesToProcess)
    aliasesToProcess.sort((a, b) => b.length - a.length)

    for (let i = 0; i < aliasesToProcess.length; i++) {
      const aliasSegments = aliasesToProcess[i]

      // find the node for the alias
      let parentNode = this.dispatchTree.tree
      for (let j = 0; j < aliasSegments.length - 1; j++) {
        const segment = aliasSegments[j]
        if (parentNode.children?.[segment]) {
          parentNode = parentNode.children[segment]
        } else {
          throw new Error(
            `Alias cannot be registered for the command '${aliasSegments.join(
              ' '
            )}' as the command does not exist`
          )
        }
      }

      if (parentNode.children === undefined) {
        throw new Error(
          `Alias cannot be registered for the command '${aliasSegments.join(
            ' '
          )}' as the command does not exist`
        )
      }

      const aliasNode =
        parentNode.children[aliasSegments[aliasSegments.length - 1]]
      if (aliasNode === undefined) {
        throw new Error(
          `Alias cannot be registered for the command '${aliasSegments.join(
            ' '
          )}' as the command does not exist`
        )
      }

      const aliases = aliasNode.definition?.aliases
      if (aliases === undefined || aliases.length === 0) {
        throw new Error(
          `Alias cannot be registered for the command '${aliasSegments.join(
            ' '
          )}' as the command does not have any aliases`
        )
      }

      for (let j = 0; j < aliases.length; j++) {
        const alias = aliases[j]

        if (parentNode.children[alias] !== undefined) {
          throw new Error(
            `Alias '${alias}' cannot be registered for the command '${aliasSegments.join(
              ' '
            )}' as that command already exists`
          )
        }

        // this is should be okay because everything in a node should be serializable
        // apparently this stringify/parse method is faster than structuredClone
        const copiedNode = JSON.parse(JSON.stringify(aliasNode))
        copiedNode.isAliasNode = true
        parentNode.children[alias] = copiedNode
      }
    }
  }

  private validateDispatchTree(): void {
    if (this.dispatchTree.meta.key === undefined) {
      throw new Error('Dispatch tree must have a key')
    }

    if (this.dispatchTree.meta.version === undefined) {
      throw new Error('Dispatch tree must have a version')
    }

    // TODO: other validation?
    // - most validation should be done during building is there anything else we need to do here?
    // - no leaf nodes should be missing an execute function?
  }
}

// TODO: I originally thought this would do a lot more, but it's pretty simple maybe this should be left to the consumer?
/**
 * A class for loading and saving dispatch trees to and from files
 */
export class DispatchTreeIO {
  /**
   * Load a dispatch tree from a file and validate it includes the provided key
   *
   * @param path The path to load the dispatch tree object from
   * @param key The key to validate the dispatch tree against
   *
   * @returns The loaded dispatch tree
   */
  static load(path: string): DispatchTree {
    return fs.readJSONSync(path)
  }

  /**
   * Write the dispatch tree to a file
   *
   * @param path The path to write the dispatch tree object to
   * @param dispatchTree The dispatch tree to save
   */
  static save(path: string, dispatchTree: DispatchTree): void {
    fs.writeJSONSync(path, dispatchTree, { spaces: 2 })
  }
}
