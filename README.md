# dojo-scripts


[![Build Status](https://travis-ci.org/dojo/scripts.svg?branch=master)](https://travis-ci.org/dojo/scripts )
[![npm version](https://badge.fury.io/js/dojo-scripts.svg)](http://badge.fury.io/js/dojo-scripts)

A package of scripts to aid with Dojo 2 package development.

## Features

### Building

You can build your project using the regular `tsc` command. Some `tsconfig.json` templates are provided to make configuration eaasier.

| TSConfig File            | Description                              |
| ------------------------ | ---------------------------------------- |
| `tsconfig/base.json`     | Provides common tsconfig settings.       |
| `tsconfig/umd.json`      | Overrides the base config and provides UMD module compilation. |
| `tsconfig/esm.json`      | Overrides the base config and provides ESM module compilation. |
| `tsconfig/commonjs.json` | Overrides the base config and provides CommonJS module compilation. |

In your local project, you would extend one of these configs. For example to use UMD modules, your `tsconfig.json` would look like this:

```json
{
  "extends": "./node_modules/@dojo/scripts/tsconfig/umd.json"
}
```

To further enable ESM modules, create a `tsconfig.esm.json` with the following:

```json
{
  "extends": "./node_modules/@dojo/scripts/tsconfig/esm.json"
}
```

You can now use `tsc` to compile your code to the `dist/umd` and `dist/esm` directories.

```shell
# compile UMD
$ tsc

# compile ESM
$ tsc -p tsconfig.esm.json
```

#### Static Files

You can use other npm scripts to copy static assets into your build process. For example the `copyfiles` command can take `.html` files for your functional tests and put them in the `dist/dev` directory for testing.

```json
{
  "scripts": {
    "build:static": "copyfiles \"tests/**/*.html\" dist/dev"
  }
}
```

#### Watching

It can be helpful during development to not have to rerun a full build every time you make a change. To help with this, you can use the `dojo-tsc-watcher` script. This script will watch one or more tsc compiles, and when they all compile successfully, will run a specified command.

For example, to repackage your `dev` and `release` directories automatically on a code change,

```shell
dojo-tsc-watcher -p tsconfig.json tsconfig.esm.json -- npm run package
```

By default, the watcher will *not* run the target script if compilation fails on one of the tsc processes. If you want run the target script regardless of if the compilation succeeded or failed, you can pass the `—force` flag.

#### Linting

This package also includes a base set of tslint rules you can use. Update your `tslint.json` to include,

```json
{
  "extends": "./node_modules/@dojo/scripts/tslint/base.json"
}
```

You can now lint your project with,

```shell
$ tslint -p .
```

### Packaging

The provided `dojo-package` script will take all of the directories in the `dist` directory (`umd`, `cjs`, and `esm`) and merge them together to create  `dev` and `release` directories. When you run tests, they are run from the `dev` directory. Production, or release, code is stored in the `release` directory. The release directory will contain the files from the `dev/src` directory as well as a modified `package.json` from your project root.

Once in this format, you can easily create a `.tar.gz` of your package with `npm pack dist/release`.

### Testing

Projects can extend the provided Intern configs and avoid boilerplate configuration. To use the intern config, create an `intern.json` in your project with the following,

```json
{
  "extends": "./node_modules/@dojo/scripts/intern/base.json",
  "capibilities": {
    "name": "@dojo/your-project"
  }
}
```

In this file, you can add further configuration to override the base config (for example, custom loader configuration).

Now, with a regular `intern.json` you can run Intern from the command line to run your tests.

```shell
# run node unit tests
$ npx intern

# run browser unit tests
$ npx intern config=intern.json@local
```

See the [Intern docs](https://github.com/theintern/intern/blob/master/docs/running.md) for more options on running Intern.

### Releasing

Several scripts are provided to ease the release process.

#### Can Publish Checks

To check if the user is allowed to publish, run the `dojo-can-publish-check` script. The script will fail with a `1` exit code if the user cannot publish.

#### Clean Repo Checks

A safe release is a clean release. To check if there are no uncommitted changes, and the user is `master`, run the`dojo-repo-is-clean-check` script. The script will fail with a `1` exit code if the repo is dirty.

#### Release

The `dojo-release` script can release a dojo package. The `dist/release` directory is what gets released. The script takes a number of arguments:

| Parameter  | Description                              |
| ---------- | ---------------------------------------- |
| `—release` | The version to release                   |
| `—next`    | The next version (`package.json` version gets set to this) |
| `—dry-run` | Shows the commands that will be run but does not run the commands. |
| `—tag`     | The tag to pass to `npm publish`         |

## How do I use this package?

Add this package as a dependency and reference the provided scripts from npm scripts.

For example,

```json
{
    "scripts": {
    "prepublish": "dojo-install-peer-deps",
    "lint": "tslint \"src/**/*.ts\" \"tests/**/*.ts\"",
    "test": "npm run build:umd && intern",
    "test:local": "intern config=intern.json@local",
    "test:browserstack": "intern config=intern.json@browserstack",
    "test:saucelabs": "intern config=intern.json@saucelabs",
    "build:static": "copyfiles \"tests/**/*.html\" \"src/**/*.d.ts\"",
    "build:umd": "tsc -p . && npm run build:static -- dist/umd",
    "build:esm": "tsc -p ./node_modules/@dojo/scripts/tsconfig.esm.json && npm run build:static -- dist/esm",
    "clean": "rimraf dist",
    "dist": "npm run lint && npm run clean && npm run build:umd && npm run build:esm && npm run package",
    "package": "dojo-package",
    "release": "dojo-can-publish-check && dojo-repo-is-clean-check && npm run dist && npm run package && dojo-release"
  },
}
```

## How do I contribute?

We appreciate your interest!  Please see the [Dojo 2 Meta Repository](https://github.com/dojo/meta#readme) for the
Contributing Guidelines and Style Guide.

## Licensing information

© 2017 [JS Foundation](https://js.foundation/). [New BSD](http://opensource.org/licenses/BSD-3-Clause) license.
