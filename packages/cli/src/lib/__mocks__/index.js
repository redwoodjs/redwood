export const runCommandTask = jest.fn((commands) => {
  return commands.map(({ cmd, args }) => `${cmd} ${args.join(' ')}`)
})

export const getPaths = () => ({ api: {}, web: {} })
