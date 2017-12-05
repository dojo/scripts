import chalk from 'chalk';
import { runAsPromise } from './utils/process';

(async function () {
	const gitOutput = (await runAsPromise('git', ['status', '--porcelain'])).trim();

	if (gitOutput) {
		console.log(chalk.red('there are changes in the working tree'));
		process.exit(1);
	}

	const revParse = (await runAsPromise('git', ['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
	if (revParse !== 'master') {
		console.log(chalk.red('not on master branch'));
		process.exit(1);
	}
})();
