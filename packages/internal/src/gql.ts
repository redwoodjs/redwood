import { DocumentNode, getOperationAST } from 'graphql'

export const getOperationType = (operation: DocumentNode) => {
  const document = getOperationAST(operation)
  return document?.operation
}

export const getOperationName = (operation: DocumentNode) => {
  const document = getOperationAST(operation)
  return document?.name?.value
}
