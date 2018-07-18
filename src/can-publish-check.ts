import { canPublish } from './utils/checks';

const yargs = require('yargs');

const { initial: isInitialRelease } = yargs.option('initial', {
	type: 'boolean',
	default: false,
	description: 'This is the first release'
}).argv;

(async function() {
	if (!(await canPublish(isInitialRelease))) {
		process.exit(1);
	}
})();
