# treatise

Easy project generation and templating

## Installation

```bash
npm install -g treatise
```

## Command Usage

```
Usage: treatise [options] [command]

Easy project generation and templating

Options:
  -V, --version          output the version number
  -h, --help             display help for command

Commands:
  new|n                  Create a new template
  create|c               Create a new project from a template
  alias|a <name> <path>  Create an alias for a template
  help [command]         display help for command
```

## Using Templates

In template folders, you can enclose things in `{{ }}` to substitute it for a placeholder. Example:

`treatise.toml`

```toml
[template]
name = "My Template"
description = "A template for my projects"
version = 1.0.0

[[placeholder]]
name = "x"
description = "Placeholder 1"
default = "hello"

[[placeholder]]
name = "y"
description = "Placeholder 2"
```

`{{x}}world.txt`

```
{{x}} world!
```

`{{x}}/{{y}}.txt`

```
This is {{y}}.
```

Tree representation:

```
.
├── treatise.toml
├── {{x}}world.txt
└── {{x}}
    └── {{y}}.txt
```

If a user then creates a project from this template, using `hello` and `world` as the values for `x` and `y`, respectively, the resulting tree would be:

```
.
├── helloworld.txt
└── hello
    └── world.txt
```

Note that `treatise.toml` is auto-deleted. The contents of the files would look similar.

`treatise.toml` has different syntax than was shown in the example, due to how to the TOML parser constructs from a schema, but you can use either syntax. I.e, you can use either `[[placeholder]]` or `placeholder = []` in the TOML file.
