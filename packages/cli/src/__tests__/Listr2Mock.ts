import type Enquirer from 'enquirer'
import type * as Listr from 'listr2'

type Ctx = Record<string, any>

type TListrTask = Listr.ListrTask<Ctx, typeof Listr.ListrRenderer>
type EnquirerPromptOptions = Parameters<Enquirer['prompt']>[0]
type Function = { length: number; name: string }
type PlainPromptOptions = ReturnType<Extract<EnquirerPromptOptions, Function>>
type ListrPromptOptions = Parameters<
  Listr.ListrTaskWrapper<Ctx, typeof Listr.ListrRenderer>['prompt']
>[0]

function isNotFunctionPromptOptions(
  opts: EnquirerPromptOptions,
): opts is PlainPromptOptions | PlainPromptOptions[] {
  return (
    typeof opts !== 'function' &&
    (Array.isArray(opts) ? opts.every((o) => typeof o !== 'function') : true)
  )
}

class Listr2TaskWrapper {
  task: Listr.ListrTaskObject<Ctx, typeof Listr.ListrRenderer>
  promptOutput: string
  prompt: <T = any>(options: ListrPromptOptions) => Promise<T>
  skip: (msg: string) => void

  // This is part of Listr.TaskWrapper, but we don't need it
  // private options: Record<PropertyKey, any> | undefined

  constructor({
    task,
    prompt,
    skip,
    // options,
  }: {
    task: Listr.ListrTaskObject<Ctx, typeof Listr.ListrRenderer>
    prompt: <T = any>(options: ListrPromptOptions) => Promise<T>
    skip: (msg: string) => void
    options?: Record<PropertyKey, any> | undefined
  }) {
    this.task = task
    this.prompt = prompt
    this.skip = skip
    // this.options = options

    this.promptOutput = ''
  }

  async run() {}
  report() {}
  cancelPrompt() {}
  stdout() {
    return process.stdout
  }

  get title(): string | any[] | undefined {
    return this.task.title
  }
  set title(title: string) {
    this.task.title = title
  }

  get output(): string | undefined {
    return this.task.output
  }

  newListr(tasks: TListrTask[], options?: Listr.ListrOptions) {
    return new Listr2Mock(tasks, options)
  }

  isRetrying() {
    return false
  }
}

export class Listr2Mock {
  static executedTaskTitles: string[]
  static skippedTaskTitles: string[]

  ctx: Ctx
  tasks: TListrTask[]
  listrOptions?: Listr.ListrOptions | undefined

  constructor(
    tasks: TListrTask[],
    listrOptions?: Listr.ListrOptions | undefined,
  ) {
    this.ctx = {}
    this.tasks = tasks
    this.listrOptions = listrOptions
  }

  async run() {
    Listr2Mock.executedTaskTitles = []
    Listr2Mock.skippedTaskTitles = []

    for (const task of this.tasks) {
      const skip = typeof task.skip === 'function' ? task.skip : () => task.skip

      const skipReturnValue = skip(this.ctx)

      if (typeof skipReturnValue === 'string') {
        // skip() => 'message'
        Listr2Mock.skippedTaskTitles.push(skipReturnValue)
        continue
      } else if (skipReturnValue) {
        // skip() => true
        const taskTitle = typeof task.title === 'string' ? task.title : ''
        Listr2Mock.skippedTaskTitles.push(taskTitle)
        continue
      }

      const augmentedTask = new Listr2TaskWrapper({
        // @ts-expect-error - TODO: Fix the types here
        task: task.task,
        prompt: async <T = any>(options: ListrPromptOptions) => {
          const enquirer = this.listrOptions?.injectWrapper?.enquirer as
            | Enquirer<T extends object ? T : never>
            | undefined

          if (!enquirer) {
            throw new Error('Enquirer instance not available')
          }

          // TODO: Fix the types here
          if (!isNotFunctionPromptOptions(options as EnquirerPromptOptions)) {
            throw new Error(
              'Function prompt options are not supported by the mock',
            )
          }

          const enquirerOptions = !Array.isArray(options)
            ? [{ ...options, name: 'default' }]
            : options

          if (enquirerOptions.length === 1) {
            enquirerOptions[0].name = 'default'
          }

          const response = await enquirer.prompt(
            // @ts-expect-error - the type should be EnquirerPromptOptions
            enquirerOptions,
          )

          if (enquirerOptions.length === 1 && 'default' in response) {
            return response.default as T
          }

          return response
        },
        skip: (msg: string) => {
          const taskTitle = typeof task.title === 'string' ? task.title : ''
          Listr2Mock.skippedTaskTitles.push(msg || taskTitle)
        },
      })

      await task.task(
        this.ctx,
        // TODO: fix this by removing the type casts.
        // The reason we have to do this is because of private fields in
        // our own Listr2TaskWrapper and Listr.ListrTaskWrapper
        augmentedTask as unknown as Listr.ListrTaskWrapper<
          Ctx,
          typeof Listr.ListrRenderer
        >,
      )

      // storing the title after running the task in case the task
      // modifies its own title
      if (typeof augmentedTask.title === 'string') {
        Listr2Mock.executedTaskTitles.push(augmentedTask.title)
      } else if (typeof task.title === 'string') {
        Listr2Mock.executedTaskTitles.push(task.title)
      }
    }
  }
}
