export const spawn = jest.fn().mockResolvedValue({
  exitCode: 0,
})

export const Logger = {
  log: jest.fn(),
  error: jest.fn(),
  out: jest.fn(),
}
