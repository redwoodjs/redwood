import forTerminal from 'youch-terminal'
import Youch from 'youch'

/**
 * This function will print a pretty version of an error in the terminal.
 */
export const handleError = async (error: Error): Promise<string> => {
  const output = await new Youch(error, null).toJSON()
  return forTerminal(output)
}
