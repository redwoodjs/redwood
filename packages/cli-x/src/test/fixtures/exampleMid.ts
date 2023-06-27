import { CommandDefinition } from "../../types";

export async function execute(args: any, command: CommandDefinition){
  return ['middleware-execute', args, command]
}
