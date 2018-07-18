import chalk from 'chalk';
import * as yargs from 'yargs';
import * as parse from 'parse-git-config';
import { runAsPromise } from './utils/process';
import { canPublish, isRepoClean } from './utils/checks';

const {
	release: releaseVersion,
	next: nextVersion,
	'dry-run': dryRun,
	'push-back': pushBack,
	'skip-checks': skipChecks,
	tag: releaseTag,
	initial: isInitialRelease,
	registry: npmRegistry
}: {
	release: string;
	next: string;
	'dry-run': boolean;
	'push-back': boolean;
	'skip-checks': boolean;
	tag: string;
	initial: boolean;
	registry: string | undefined;
} = yargs
	.option('release', {
		type: 'string',
		demandOption: true
	})
	.option('next', {
		type: 'string',
		demandOption: true
	})
	.option('dry-run', {
		type: 'boolean',
		default: false
	})
	.option('skip-checks', {
		type: 'boolean',
		default: false
	})
	.option('push-back', {
		type: 'boolean',
		default: false
	})
	.option('tag', {
		type: 'string',
		default: 'next'
	})
	.option('initial', {
		type: 'boolean',
		default: false
	})
	.option('registry', {
		type: 'string',
		describe: 'NPM registry to publish to'
	}).argv as any;

async function command(bin: string, args: string[], options: any = {}, executeOnDryRun = false) {
	if (dryRun && !executeOnDryRun) {
		if (options.cwd) {
			console.log(chalk.gray(`(from ${options.cwd}) ${bin} ${args.join(' ')}`));
		} else {
			console.log(chalk.gray(`${bin} ${args.join(' ')}`));
		}
		return Promise.resolve('');
	}

	console.log(chalk.green(`${bin} ${args.join(' ')}...`));

	return runAsPromise(bin, args, options);
}

function getGitRemote(gitBaseRemote: string): string | false {
	const gitConfig = parse.sync();
	const remotes = Object.keys(gitConfig)
		.filter((key) => key.indexOf('remote') === 0)
		.filter((key) => gitConfig[key].url.indexOf(gitBaseRemote) === 0)
		.map((key) => gitConfig[key].url);

	return remotes.length ? remotes[0] : false;
}

(async function() {
	const gitRemote = getGitRemote('git@github.com:dojo/');
	const npmRegistryArgs = npmRegistry ? ['--registry', npmRegistry] : [];

	console.log(chalk.yellow(`Version: ${releaseVersion}`));
	console.log(chalk.yellow(`Next Version: ${nextVersion}`));
	console.log(chalk.yellow(`Dry Run: ${dryRun}`));
	console.log(chalk.yellow(`Push Back: ${pushBack}`));
	if (gitRemote) {
		console.log(chalk.yellow(`Dojo Remote: ${gitRemote}`));
	} else {
		console.log(chalk.red(`Dojo Remote: not found`));
		if (pushBack) {
			process.exit(1);
			return;
		}
	}

	if (skipChecks && !dryRun) {
		console.log(chalk.red(`You can only skip-checks on a dry-run!`));
		process.exit(1);
		return;
	}

	if (!skipChecks && (!(await canPublish(isInitialRelease)) || !(await isRepoClean()))) {
		process.exit(1);
		return;
	}

	// update the version
	await command('npm', ['version', releaseVersion, '--no-git-tag-version'], { cwd: 'dist/release' }, false);
	await command('npm', ['version', releaseVersion, '--no-git-tag-version'], {}, false);

	// run the release command
	if (isInitialRelease) {
		await command('npm', ['publish', '--tag', releaseTag, '--access', 'public', ...npmRegistryArgs], {
			cwd: 'dist/release'
		});
	} else {
		await command('npm', ['publish', '--tag', releaseTag, ...npmRegistryArgs], { cwd: 'dist/release' });
	}

	// commit the changes
	await command('git', ['commit', '-am', `"${releaseVersion}"`], false);

	// tag version
	await command('git', ['tag', `"v${releaseVersion}"`], false);

	// update the package meta version to next
	await command('npm', ['version', nextVersion, '--no-git-tag-version'], {}, false);

	// commit the changes
	await command('git', ['commit', '-am', `"Update package metadata"`], false);

	if (pushBack && gitRemote) {
		await command('git', ['push', gitRemote, 'master'], false);
		await command('git', ['push', gitRemote, '--tags'], false);
	}
})();
