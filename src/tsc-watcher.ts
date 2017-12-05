import chalk from 'chalk';

import 'rxjs/add/observable/zip';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { runAsObservable, runAsPromise } from './utils/process';

interface CompilationCompletionEvent {
	command: string;
	output: string;
}

const errorToken = ': error ';
const marker = `Compilation complete. Watching for file changes.`;

const separatorIndex = process.argv.indexOf('--');
let runOnCompilationErrors = false;

function usage() {
	console.error(`Usage: dojo-tsc-watcher [-p packageDir (maybe repeated)] [--force] -- command`);
	process.exit(1);
}

if (separatorIndex === -1) {
	usage();
}

const args = process.argv.slice(2, separatorIndex);

const projectDirs = [];
for (let i = 0; i < args.length; i++) {
	if (args[i] === '-p') {
		if (i + 1 >= args.length) {
			usage();
		}
		else {
			projectDirs.push(args[i + 1]);
		}
	}
	else if (args[i] === '--force') {
		runOnCompilationErrors = true;
	}
}

if (projectDirs.length === 0) {
	projectDirs.push('');
}

const command = process.argv.slice(separatorIndex + 1);

const firstCompiles: Promise<void>[] = [];
const compilationCompleted: Observable<CompilationCompletionEvent>[] = [];

console.log(chalk.yellow('Starting initial compilation...'));

for (const projectDir of projectDirs) {
	const options = { shell: true, cwd: process.cwd(), hideWindows: true };
	const tscArgs = ['-w'];
	if (projectDir !== '') {
		tscArgs.push('-p', projectDir);
	}

	let buffer = '';

	let resolver: any;
	firstCompiles.push(new Promise<void>(resolve => {
		resolver = resolve;
	}));

	const compilationObserver = new Subject<CompilationCompletionEvent>();
	compilationCompleted.push(compilationObserver);

	runAsObservable('./node_modules/.bin/tsc', tscArgs, options).subscribe(chunk => {
		if (chunk.pipe === 'stdout') {
			buffer += chunk.chunk;
		}

		while (true) {
			let index = buffer.indexOf(marker);
			if (index === -1) {
				break;
			}

			resolver();

			compilationObserver.next({
				command: `tsc ${tscArgs.join(' ')}`,
				output: buffer.trim()
			});
			buffer = buffer.slice(index + marker.length);
		}
	}, () => {
		console.error(`tsc ${tscArgs.join(' ')} process exited`);
	}, () => {
		console.log(`tsc ${tscArgs.join(' ')} process exited gracefully`);
	});
}

Promise.all(firstCompiles).then(() => {
	console.log(chalk.yellow('Initial compilation finished. Watching for changes...'));
});

Observable.zip(...compilationCompleted).subscribe(values => {
	let didError = false;

	values.forEach(event => {
		console.log(chalk.white(event.command));
		if (event.output.indexOf(errorToken) >= 0) {
			console.log(chalk.red(event.output));
			didError = true;
		}
		else {
			console.log(chalk.gray(event.output));
		}
	});

	if (!didError || runOnCompilationErrors) {
		console.log(chalk.white(command.join(' ')));
		runAsPromise(command[0], command.slice(1)).then(() => {
			console.log(chalk.green('Done'));
		});
	}
});

