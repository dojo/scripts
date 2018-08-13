import * as yargs from 'yargs';
import { isRepoClean } from './utils/checks';

const {
	branch: releaseBranch
}: {
	branch: string;
} = yargs.option('branch', {
	type: 'string',
	default: 'master'
}).argv as any;

(async function() {
	if (!(await isRepoClean(releaseBranch))) {
		process.exit(1);
	}
})();
