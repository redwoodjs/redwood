import fs from 'fs'

let rollback = []

export function addFunctionToRollback(func, atEnd = false) {
  const step = { type: 'func', func: func }
  if (atEnd) {
    rollback.unshift(step)
  } else {
    rollback.push(step)
  }
}

export function addFileToRollback(path, atEnd = false) {
  const step = {
    type: 'file',
    path: path,
    content: fs.existsSync(path) ? fs.readFileSync(path) : null,
  }
  if (atEnd) {
    rollback.unshift(step)
  } else {
    rollback.push(step)
  }
}

export async function executeRollback(ctx, task) {
  task.title = 'Reverting generator actions...'
  while (rollback.length > 0) {
    const step = rollback.pop()
    switch (step.type) {
      case 'func':
        await step.func()
        break
      case 'file':
        if (step.content === null) {
          fs.unlinkSync(step.path)
        } else {
          fs.writeFileSync(step.path, step.content)
        }
        break
      default:
        // TODO: Telemetry error.
        break
    }
  }
  task.title = `Reverted because: ${task.task.message.error}`
}

export function resetRollback() {
  rollback.length = 0
}

export function prepareRollbackForTasks(tasks) {
  resetRollback()
  tasks.tasks?.forEach((task) => {
    task.tasks.rollback = executeRollback
  })
}
