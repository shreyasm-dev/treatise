import { readdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { resolve, normalize } from 'path';
import { JsonMap, parse, stringify } from '@iarna/toml';
import semver from 'semver';
import validatePackageName from 'validate-npm-package-name';
import { projectFileName } from './constants';
import { error } from './helpers';

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
    
    error(`No ${projectFileName} file found`);
  }

  const files = readdirSync(dir);
  if (files.includes(projectFileName)) {
    return dir;
  }

  return getProjectDir(resolve(dir, '..'));
};

export const parseProject = (dir: string): Project => {
  const project = parse(readFileSync(resolve(dir, projectFileName), 'utf8')) as unknown as Project;

  const { errors } = validatePackageName(project.template.name);
  if (errors) {
    error(`Invalid project name: ${errors.join(', ')}`);
  }

  if (!semver.valid(project.template.version)) {
    error(`Invalid semver string: ${project.template.version}`);
  }

  for (const placeholder of project.placeholders) {
    const { errors: placeholderErrors } = validatePackageName(placeholder.name);
    if (placeholderErrors) {
      error(`Invalid placeholder name: ${placeholderErrors.join(', ')}`);
    }
  }

  return project;
};

export const stringifyProject = (project: Project): string => stringify(project as unknown as JsonMap);

export const replacePlaceholder = (dir: string, placeholder: string, value: string): void => {
  readdirSync(dir, { withFileTypes: true }).forEach((dirent) => {
    const path = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      replacePlaceholder(path, placeholder, value);
    } else {
      const content = readFileSync(path, 'utf8');
      writeFileSync(path, content.replace(new RegExp(`{{${placeholder}}}`, 'g'), value));
    }

    renameSync(path, resolve(dir, dirent.name.replace(new RegExp(`{{${placeholder}}}`, 'g'), value)));
  });
};

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
  default?: string;
}
