import chalk from 'chalk';
import { EOL } from 'os';
import { runAsPromise } from './utils/process';

const yargs = require('yargs');

const {
	'release': releaseVersion,
	'next': nextVersion,
	'dry-run': dryRun,
	'tag': releaseTag,
	'initial': isInitialRelease
} = yargs
	.option('release', {
		type: 'string'
	})
	.option('next', {
		type: 'string'
	})
	.option('dry-run', {
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
	.argv;

async function command(bin: string, args: string[], options: any = {}, executeOnDryRun = false) {
	if (dryRun && !executeOnDryRun) {
		if (options.cwd) {
			console.log(chalk.gray(`(from ${options.cwd}) ${bin} ${args.join(' ')}`));
		}
		else {
			console.log(chalk.gray(`${bin} ${args.join(' ')}`));
		}
		return Promise.resolve('');
	}

	console.log(chalk.green(`${bin} ${args.join(' ')}...`));

	return runAsPromise(bin, args, options);
}

(async function () {
	const hasDojoRemote = (await command('git', ['remote'], {}, true))
		.split(EOL)
		.filter((remote: string) => remote.trim() === 'dojo').length === 1;

	console.log(chalk.yellow(`Version: ${releaseVersion}`));
	console.log(chalk.yellow(`Next Version: ${nextVersion}`));
	console.log(chalk.yellow(`Dry Run: ${dryRun}`));
	console.log(chalk.yellow(`Push Back: ${hasDojoRemote}`));

	// update the version
	await command('npm', ['version', releaseVersion, '--no-git-tag-version'], { cwd: 'dist/release' }, false);
	await command('npm', ['version', releaseVersion, '--no-git-tag-version'], {}, false);

	// run the release command
	if (isInitialRelease) {
		await command('npm', ['publish', '--tag', releaseTag, '--access', 'public'], { cwd: 'dist/release' });
	}
	else {
		await command('npm', ['publish', '--tag', releaseTag], { cwd: 'dist/release' });
	}

	// commit the changes
	await command('git', ['commit', '-am', `"${releaseVersion}"`], false);

	// tag version
	await command('git', ['tag', `"v${releaseVersion}"`], false);

	// update the package meta version to next
	await command('npm', ['version', nextVersion, '--no-git-tag-version'], {}, false);

	// commit the changes
	await command('git', ['commit', '-am', `"Update package metadata"`], false);

	if (hasDojoRemote) {
		await command('git', ['push', 'dojo', 'master'], false);
		await command('git', ['push', 'dojo', '--tags'], false);
	}
})();
