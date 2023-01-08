import { prompt } from 'enquirer';
import chalk from 'chalk';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ask = async (options: any) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await prompt(options) as any;
  return response[options.name];
};

export const error = (message: string, code = 1) => {
  console.error(chalk.red.bold(message));
  process.exit(code);
};
