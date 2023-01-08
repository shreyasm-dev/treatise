import sourceMapSupport from 'source-map-support';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { resolve, isAbsolute } from 'path';
import { program } from 'commander'; 
import copy from 'recursive-copy';
import semver from 'semver';
import validatePackageName from 'validate-npm-package-name';
import { getProjectDir, parseProject, Project, replacePlaceholder, stringifyProject } from './project';
import { ask } from './helpers';
import { projectFileName } from './constants';

sourceMapSupport.install();

const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8'));

program
  .name(pkg.name)
  .description(pkg.description)
  .version(pkg.version);

program
  .command('init')
  .description('Create a new template')
  .action(async () => {
    const projectName = await ask({
      type: 'input',
      name: 'projectName',
      message: 'Project name',
      validate: (input: string) => {
        if (!input) {
          return 'Project name cannot be empty';
        }

        const { errors } = validatePackageName(input);
        if (errors) {
          return errors.join(', ');
        }

        return true;
      },
    });

    let dir = resolve(process.cwd(), projectName);

    const exists = existsSync(resolve(process.cwd(), projectName));
    if (exists) {
      console.log(`Directory ${projectName} already exists`);

      const newDirName = await ask({
        type: 'input',
        name: 'newDirName',
        message: 'New directory name',
        validate: (input: string) => {
          if (!input) {
            return 'Directory name cannot be empty';
          }
  
          const { errors } = validatePackageName(input);
          if (errors) {
            return errors.join(', ');
          }

          return input !== projectName;
        },
      });

      dir = resolve(process.cwd(), newDirName);
    }

    const projectVersion = await ask({
      type: 'input',
      name: 'projectVersion',
      message: 'Project version',
      initial: '1.0.0',
      validate: (input: string) => {
        if (!semver.valid(input)) {
          return 'Invalid semver string';
        }

        return true;
      },
    });

    const projectDescription = await ask({
      type: 'input',
      name: 'projectDescription',
      message: 'Project description',
      initial: '',
    });

    const project: Project = {
      template: {
        name: projectName,
        version: projectVersion,
        description: projectDescription,
      },
      placeholder: [],
    };

    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, projectFileName), stringifyProject(project), 'utf8');
  });

program
  .command('create <template>')
  .description('Create a new project from a template')
  .action(async (template: string) => {
    const dir = getProjectDir(isAbsolute(template) ? template : resolve(process.cwd(), template));
    const project = parseProject(dir);

    const creationDir = await ask({
      type: 'input',
      name: 'creationDir',
      message: 'Creation directory',
      validate: (input: string) => {
        if (!input) {
          return 'Creation directory cannot be empty';
        }

        const { errors } = validatePackageName(input);
        if (errors) {
          return errors.join(', ');
        }

        return existsSync(resolve(process.cwd(), input)) ? 'Directory already exists' : true;
      },
    });

    console.log(`Copying folder and removing ${projectFileName} file...`);

    const res = await copy(dir, resolve(process.cwd(), creationDir));
    console.log(`Copied ${res.length} files, now removing ${projectFileName} file...`);
    rmSync(resolve(process.cwd(), creationDir, projectFileName));
    console.log(`Removed ${projectFileName} file. Done copying.`);

    const placeholders = [];

    for (const placeholder of project.placeholder) {
      const value = await ask({
        type: 'input',
        name: 'value',
        message: placeholder.name,
        initial: placeholder.default,
      });

      placeholders.push({
        name: placeholder.name,
        value,
      });
    }

    for (const placeholder of placeholders) {
      replacePlaceholder(resolve(process.cwd(), creationDir), placeholder.name, placeholder.value);
    }

    console.log('Done creating project.');
  });

program.parse(process.argv);
