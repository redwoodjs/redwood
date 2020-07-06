import execa from 'execa'

export type Command = {
  title: string
  cmd: string
  args: string[]
  opts: execa.Options
}
