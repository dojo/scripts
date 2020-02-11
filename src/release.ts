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
	branch: releaseBranch,
	tag: releaseTag,
	initial: isInitialRelease,
	registry: npmRegistry,
	org
}: {
	release: string;
	next: string;
	'dry-run': boolean;
	'push-back': boolean;
	'skip-checks': boolean;
	branch: string;
	tag: string;
	initial: boolean;
	registry: string | undefined;
	org: string;
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
	.option('branch', {
		type: 'string',
		default: 'master'
	})
	.option('tag', {
		type: 'string',
		default: 'next'
	})
	.option('initial', {
		type: 'boolean',
		default: false
	})
	.option('org', {
		type: 'string',
		description: 'The organization of the package'
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

	console.log(chalk.yellow(`Version: ${releaseVersion}`));
	console.log(chalk.yellow(`Next Version: ${nextVersion}`));
	console.log(chalk.yellow(`Release Branch: ${releaseBranch}`));
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

	if (!skipChecks && (!(await canPublish(isInitialRelease, org)) || !(await isRepoClean(releaseBranch)))) {
		process.exit(1);
		return;
	}

	// update the version
	await command('npm', ['version', releaseVersion, '--no-git-tag-version'], { cwd: 'dist/release' }, true);
	await command('npm', ['version', releaseVersion, '--no-git-tag-version'], {}, false);

	const npmPublishArgs = [
		'publish',
		'--tag',
		releaseTag,
		...(isInitialRelease ? ['--access', 'public'] : []),
		...(npmRegistry ? ['--registry', npmRegistry] : [])
	];

	// run the publish command
	await command('npm', npmPublishArgs, { cwd: 'dist/release' });

	if (dryRun) {
		await command('npm', ['pack', './release'], { cwd: 'dist' }, true);
	}

	// commit the changes
	await command('git', ['commit', '-am', `"${releaseVersion}"`], false);

	// tag version
	await command('git', ['tag', `"v${releaseVersion}"`], false);

	// update the package meta version to next
	await command('npm', ['version', nextVersion, '--no-git-tag-version'], { cwd: 'dist/release' }, true);
	await command('npm', ['version', nextVersion, '--no-git-tag-version'], {}, false);

	// commit the changes
	await command('git', ['commit', '-am', `"Update package metadata"`], false);

	if (pushBack && gitRemote) {
		await command('git', ['push', gitRemote, releaseBranch], false);
		await command('git', ['push', gitRemote, '--tags'], false);
	}
})();
