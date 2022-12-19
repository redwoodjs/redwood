import { db } from 'src/lib/db'

export const todos = () => db.todo.findMany()

export const todosWithStringRole = () => db.todo.findMany()
export const todosWithMultipleRoles = () => db.todo.findMany()
export const todosWithInvalidRole = () => db.todo.findMany()
export const todosWithInvalidRoles = () => db.todo.findMany()
export const todosWithMissingRoles = () => db.todo.findMany()
export const todosWithBuiltInDeprecatedDirective = () => db.todo.findMany()
export const todosWithMissingRolesAttribute = () => db.todo.findMany()
export const todosWithMissingRolesAttributeNumeric = () => db.todo.findMany()

export const createTodo = ({ body }) => db.todo.create({ data: { body } })

export const updateTodoStatus = ({ id, status }) =>
  db.todo.update({
    data: { status },
    where: { id },
  })

export const renameTodo = ({ id, body }) =>
  db.todo.update({
    data: { body },
    where: { id },
  })

export const deleteTodo = ({ id }) =>
  db.todo.delete({
    where: { id: 1 },
  })
