import type { KeywordArgument, PositionalArgument } from './parsing'

export interface CommandDefinition {
  trigger: string

  aliases?: string[]

  description?: string

  positionalArguments?: PositionalArgument[]
  keywordArguments?: KeywordArgument[]

  middleware?: string[]

  execute?: string
}

//

export interface DispatchTree {
  meta: DispatchTreeMeta
  tree: DispatchNode
}

export interface DispatchTreeMeta {
  key?: string
  version?: string
}

export interface DispatchNode {
  definition?: CommandDefinition
  children?: Record<string, DispatchNode>
  isAliasNode?: boolean
}
