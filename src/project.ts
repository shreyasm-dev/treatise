import { readdirSync, readFileSync } from 'fs';
import { resolve, normalize } from 'path';
import { parse, stringify } from 'yaml';
import semver from 'semver';
import validatePackageName from 'validate-npm-package-name';
import { projectFileName } from './constants';

// Project yaml file structure
//
// [template]
// name: <string>
// description: <string>
// version: <string>
//
// [[placeholder]]
// name: <string>
// description: <string>
// default: <string>
//

export const getProjectDir = (dir: string): string => {
  dir = normalize(dir);

  if (dir === '/') {
    if (readdirSync(dir).includes(projectFileName)) {
      return dir;
    }

    throw new Error(`No ${projectFileName} file found`);
  }

  const files = readdirSync(dir);
  if (files.includes(projectFileName)) {
    return dir;
  }

  return getProjectDir(resolve(dir, '..'));
};

export const parseProject = (dir: string): Project => {
  const project = parse(readFileSync(resolve(dir, projectFileName), 'utf8')) as Project;

  const { errors } = validatePackageName(project.template.name);
  if (errors) {
    throw new Error(`Invalid project name: ${errors.join(', ')}`);
  }

  if (!semver.valid(project.template.version)) {
    throw new Error(`Invalid semver string: ${project.template.version}`);
  }

  for (const placeholder of project.placeholders) {
    const { errors: placeholderErrors } = validatePackageName(placeholder.name);
    if (placeholderErrors) {
      throw new Error(`Invalid placeholder name: ${placeholderErrors.join(', ')}`);
    }
  }

  return project;
};

export const stringifyProject = (project: Project): string => stringify(project);

export interface Project {
  template: {
    name: string;
    description: string;
    version: string;
  };
  placeholders: Placeholder[];
}

export interface Placeholder {
  name: string;
  description: string;
  default: string;
}
