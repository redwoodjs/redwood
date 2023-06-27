import { CommandDefinition } from "../../types";

export async function execute(args: any, command: CommandDefinition){
  return ['command-execute', args, command]
}
