import requireDir from 'require-dir';
import argv from 'yargs-parser';

const validateCommandExports = ({ commandProps, ...rest }) => {
  if (typeof rest.default !== 'function') {
    throw 'you must export a default function';
  }

  if (!commandProps) {
    throw 'you must export an object called `commandProps`';
  }

  const { description } = commandProps;
  if (!description) {
    throw 'you must add a `description` to  your `commandProps`';
  }
};

export const getCommands = (commandsPath = '../commands') => {
  const foundCommands = requireDir(commandsPath, {
    recurse: false,
    extensions: ['.js'],
  });

  return Object.keys(foundCommands).reduce((newCommands, commandName) => {
    const command = foundCommands[commandName];
    try {
      validateCommandExports(command);
    } catch (e) {
      throw `your "${commandName}" command is exporting the correct requirements: ${e}`;
    }

    const { commandProps, ...rest } = command;
    const newCommandProps = {
      name: commandProps.name || commandName,
      ...commandProps,
    };

    return [
      ...newCommands,
      {
        commandProps: newCommandProps,
        ...rest,
      },
    ];
  }, []);
};

export const parseArgs = () => {
  return argv(process.argv.slice(2));
};
