import { TypeScriptOperationVariablesToObject } from '@graphql-codegen/typescript'
import {
  ParsedResolversConfig,
  BaseResolversVisitor,
  getConfigValue,
  DeclarationKind,
  getBaseTypeNode,
  indent,
} from '@graphql-codegen/visitor-plugin-common'
import autoBind from 'auto-bind'
import {
  FieldDefinitionNode,
  ListTypeNode,
  NamedTypeNode,
  NonNullTypeNode,
  GraphQLSchema,
  EnumTypeDefinitionNode,
} from 'graphql'

import { TypeScriptResolversPluginConfig } from './config.js'

type Truthy<T> = T extends false | '' | 0 | null | undefined ? never : T // from lodash

function truthy<T>(value: T): value is Truthy<T> {
  return !!value
}

export const ENUM_RESOLVERS_SIGNATURE =
  'export type EnumResolverSignature<T, AllowedValues = any> = { [key in keyof T]?: AllowedValues };'

export interface ParsedTypeScriptResolversConfig extends ParsedResolversConfig {
  useIndexSignature: boolean
  wrapFieldDefinitions: boolean
  allowParentTypeOverride: boolean
  optionalInfoArgument: boolean
}

export class TypeScriptResolversVisitor extends BaseResolversVisitor<
  TypeScriptResolversPluginConfig,
  ParsedTypeScriptResolversConfig
> {
  constructor(
    pluginConfig: TypeScriptResolversPluginConfig,
    schema: GraphQLSchema
  ) {
    super(
      pluginConfig,
      {
        avoidOptionals: getConfigValue(pluginConfig.avoidOptionals, false),
        useIndexSignature: getConfigValue(
          pluginConfig.useIndexSignature,
          false
        ),
        wrapFieldDefinitions: getConfigValue(
          pluginConfig.wrapFieldDefinitions,
          false
        ),
        allowParentTypeOverride: getConfigValue(
          pluginConfig.allowParentTypeOverride,
          false
        ),
        optionalInfoArgument: getConfigValue(
          pluginConfig.optionalInfoArgument,
          false
        ),
      } as ParsedTypeScriptResolversConfig,
      schema
    )
    autoBind(this)
    this.setVariablesTransformer(
      new TypeScriptOperationVariablesToObject(
        this.scalars,
        this.convertName,
        this.config.avoidOptionals,
        this.config.immutableTypes,
        this.config.namespacedImportName,
        [],
        this.config.enumPrefix,
        this.config.enumValues
      )
    )

    if (this.config.useIndexSignature) {
      this._declarationBlockConfig = {
        blockTransformer(block) {
          return `ResolversObject<${block}>`
        },
      }
    }
  }

  protected transformParentGenericType(parentType: string): string {
    if (this.config.allowParentTypeOverride) {
      return `ParentType = ${parentType}`
    }

    return `ParentType extends ${parentType} = ${parentType}`
  }

  protected formatRootResolver(
    schemaTypeName: string,
    resolverType: string,
    declarationKind: DeclarationKind
  ): string {
    const avoidOptionals =
      this.config.avoidOptionals?.resolvers ??
      this.config.avoidOptionals === true
    return `${schemaTypeName}${
      avoidOptionals ? '' : '?'
    }: ${resolverType}${this.getPunctuation(declarationKind)}`
  }

  private clearOptional(str: string): string {
    if (str.startsWith('Maybe')) {
      return str.replace(/Maybe<(.*?)>$/, '$1')
    }

    return str
  }

  ListType(node: ListTypeNode): string {
    return `Maybe<${super.ListType(node)}>`
  }

  protected wrapWithListType(str: string): string {
    return `${this.config.immutableTypes ? 'ReadonlyArray' : 'Array'}<${str}>`
  }

  protected getParentTypeForSignature(node: FieldDefinitionNode) {
    if (
      this._federation.isResolveReferenceField(node) &&
      this.config.wrapFieldDefinitions
    ) {
      return 'UnwrappedObject<ParentType>'
    }
    return 'ParentType'
  }

  NamedType(node: NamedTypeNode): string {
    return `Maybe<${super.NamedType(node)}>`
  }

  NonNullType(node: NonNullTypeNode): string {
    const baseValue = super.NonNullType(node)

    return this.clearOptional(baseValue)
  }

  private rwGetFieldContextType(
    parentName: string,
    node: FieldDefinitionNode
  ): string {
    if (this._fieldContextTypeMap[`${parentName}.${node.name}`]) {
      return this._fieldContextTypeMap[`${parentName}.${node.name}`].type
    }
    return 'ContextType'
  }

  private rwGetContextType(
    parentName: string,
    node: FieldDefinitionNode
  ): string {
    let contextType = this.rwGetFieldContextType(parentName, node)

    for (const directive of node.directives || []) {
      console.log('directive', directive)
      const name = directive.name as unknown as string
      const directiveMap = this._directiveContextTypesMap[name]
      if (directiveMap) {
        contextType = `${directiveMap.type}<${contextType}>`
      }
    }
    return contextType
  }

  FieldDefinition(
    node: FieldDefinitionNode,
    key: string | number,
    parent: any
  ): (parentName: string) => string | null {
    const hasArguments = node.arguments && node.arguments.length > 0
    const declarationKind = 'type'

    return (parentName: string) => {
      const original: FieldDefinitionNode = parent[key]
      const baseType = getBaseTypeNode(original.type)
      const realType = baseType.name.value
      const parentType = this.schema.getType(parentName)

      if (!parentType) {
        throw new Error('Parent type is ' + parentType)
      }

      if (this._federation.skipField({ fieldNode: original, parentType })) {
        return null
      }

      const contextType = this.rwGetContextType(parentName, node)

      const typeToUse = this.getTypeToUse(realType)
      const mappedType = this._variablesTransformer.wrapAstTypeWithModifiers(
        typeToUse,
        original.type
      )
      const subscriptionType = this.schema.getSubscriptionType()
      const isSubscriptionType =
        subscriptionType && subscriptionType.name === parentName

      let argsType = hasArguments
        ? this.convertName(
            parentName +
              (this.config.addUnderscoreToArgsType ? '_' : '') +
              this.convertName(node.name, {
                useTypesPrefix: false,
                useTypesSuffix: false,
              }) +
              'Args',
            {
              useTypesPrefix: true,
            },
            true
          )
        : null

      if (argsType !== null) {
        if (!original.arguments) {
          throw new Error('no args')
        }

        const argsToForceRequire = original.arguments.filter(
          (arg) => !!arg.defaultValue || arg.type.kind === 'NonNullType'
        )

        if (!argsToForceRequire) {
          throw new Error('argsToForceRequire')
        }

        if (argsToForceRequire.length > 0) {
          argsType = this.applyRequireFields(argsType, argsToForceRequire)
        } else if (original.arguments.length > 0) {
          argsType = this.applyOptionalFields(argsType, original.arguments)
        }
      }

      const parentTypeSignature = this._federation.transformParentType({
        fieldNode: original,
        parentType,
        parentTypeSignature: this.getParentTypeForSignature(node),
      })
      const mappedTypeKey = isSubscriptionType
        ? `${mappedType}, "${node.name}"`
        : mappedType

      const directiveMappings: string[] =
        node.directives
          ?.map(
            (directive) =>
              (this.config.directiveResolverMappings || {})[
                directive.name as any
              ]
          )
          .filter(Boolean)
          .reverse() ?? []

      const defaultResolverName = hasArguments ? 'Resolver' : 'OptArgsResolver'

      const resolverType = isSubscriptionType
        ? 'SubscriptionResolver'
        : directiveMappings[0] ?? defaultResolverName

      const avoidOptionals =
        this.config.avoidOptionals?.resolvers ??
        this.config.avoidOptionals === true
      const signature: {
        name: string
        modifier: string
        type: string
        genericTypes: string[]
      } = {
        name: node.name as any,
        modifier: avoidOptionals ? '' : '?',
        type: resolverType,
        genericTypes: [
          mappedTypeKey,
          parentTypeSignature,
          contextType,
          argsType,
        ].filter(truthy),
      }

      if (this._federation.isResolveReferenceField(node)) {
        this._hasFederation = true
        signature.type = 'ReferenceResolver'

        if (signature.genericTypes.length >= 3) {
          signature.genericTypes = signature.genericTypes.slice(0, 3)
        }
      }

      return indent(
        `${signature.name}${signature.modifier}: ${
          signature.type
        }<${signature.genericTypes.join(', ')}>${this.getPunctuation(
          declarationKind
        )}`
      )
    }
  }

  protected getPunctuation(_declarationKind: DeclarationKind): string {
    return ';'
  }

  protected buildEnumResolverContentBlock(
    node: EnumTypeDefinitionNode,
    mappedEnumType: string
  ): string {
    const valuesMap = `{ ${(node.values || [])
      .map(
        (v) =>
          `${v.name as any as string}${
            this.config.avoidOptionals ? '' : '?'
          }: any`
      )
      .join(', ')} }`

    this._globalDeclarations.add(ENUM_RESOLVERS_SIGNATURE)

    return `EnumResolverSignature<${valuesMap}, ${mappedEnumType}>`
  }

  protected buildEnumResolversExplicitMappedValues(
    node: EnumTypeDefinitionNode,
    valuesMapping: { [valueName: string]: string | number }
  ): string {
    return `{ ${(node.values || [])
      .map((v) => {
        const valueName = v.name as any as string
        const mappedValue = valuesMapping[valueName]

        return `${valueName}: ${
          typeof mappedValue === 'number' ? mappedValue : `'${mappedValue}'`
        }`
      })
      .join(', ')} }`
  }
}
