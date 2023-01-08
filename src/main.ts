import sourceMapSupport from 'source-map-support';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { program } from 'commander'; 
import semver from 'semver';
import validatePackageName from 'validate-npm-package-name';
import { getProjectDir, parseProject, Project, stringifyProject } from './project';
import { ask } from './helpers';

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
      placeholders: [],
    };

    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'treatise.yaml'), stringifyProject(project), 'utf8');
  });

program.parse(process.argv);
