import { prompt } from 'enquirer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ask = async (options: any) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await prompt(options) as any;
  return response[options.name];
};
