import chalk from 'chalk';
import { runAsPromise } from './utils/process';

const yargs = require('yargs');

const { initial: isInitialRelease } = yargs.option('initial', {
	type: 'boolean',
	default: false,
	description: 'This is the first release'
}).argv;

(async function() {
	let user = '';

	try {
		const whoami = await runAsPromise('npm', ['whoami']);
		user = whoami.trim();
	} catch (e) {
		console.log(chalk.red('failed running "npm whoami". are you not logged into npm?'));
		process.exit(1);
	}

	if (!isInitialRelease) {
		const maintainers = JSON.parse(await runAsPromise('npm', ['view', '.', '--json'])).maintainers.map(
			(maintainer: string) => maintainer.replace(/\s<.*/, '')
		);

		if (maintainers.indexOf(user) < 0) {
			console.log(chalk.red(`cannot publish this package with user ${user}`));
			process.exit(1);
		}
	}
})();
