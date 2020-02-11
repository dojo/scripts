import { canPublish } from './utils/checks';

const yargs = require('yargs');

const { initial: isInitialRelease, org } = yargs
	.option('org', {
		type: 'string',
		description: 'The organization of the package'
	})
	.option('initial', {
		type: 'boolean',
		default: false,
		description: 'This is the first release'
	}).argv;

(async function() {
	if (!(await canPublish(isInitialRelease, org))) {
		process.exit(1);
	}
})();
