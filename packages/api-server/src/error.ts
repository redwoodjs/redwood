import Youch from 'youch'
import forTerminal from 'youch-terminal'

/**
 * This function will print a pretty version of an error in the terminal.
 */
export const handleError = async (error: Error): Promise<string> => {
  const output = await new Youch(error, null).toJSON()
  return forTerminal(output)
}
