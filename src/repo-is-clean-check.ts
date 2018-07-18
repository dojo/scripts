import { isRepoClean } from './utils/checks';

(async function() {
	if (!(await isRepoClean())) {
		process.exit(1);
	}
})();
