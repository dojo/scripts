import chalk from 'chalk';
import { runAsPromise } from './process';

export async function canPublish(isInitialRelease: boolean) {
	let user = '';

	try {
		const whoami = await runAsPromise('npm', ['whoami']);
		user = whoami.trim();
	} catch (e) {
		console.log(chalk.red('failed running "npm whoami". are you not logged into npm?'));
		return false;
	}

	if (!isInitialRelease) {
		const maintainers = JSON.parse(await runAsPromise('npm', ['view', '.', '--json'])).maintainers.map(
			(maintainer: string) => maintainer.replace(/\s<.*/, '')
		);

		if (maintainers.indexOf(user) < 0) {
			console.log(chalk.red(`cannot publish this package with user ${user}`));
			return false;
		}
	}

	return true;
}

export async function isRepoClean(releaseBranch: string) {
	const gitOutput = (await runAsPromise('git', ['status', '--porcelain'])).trim();

	if (gitOutput) {
		console.log(chalk.red('there are changes in the working tree'));
		return false;
	}

	const revParse = (await runAsPromise('git', ['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
	if (revParse !== releaseBranch) {
		console.log(chalk.red(`not on master ${releaseBranch}`));
		return false;
	}

	return true;
}
