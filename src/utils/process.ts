import * as childProcess from 'child_process';
import { Observable } from 'rxjs/Observable';

export interface ProcessOutput {
	pipe: 'stdout' | 'stderr';
	chunk: string;
}

export async function runAsPromise(command: string, args: string[], options: any = {}): Promise<any> {
	return new Promise((resolve, reject) => {
		let stderr = '';
		let stdout = '';

		runAsObservable(command, args, options).subscribe(chunk => {
			if (chunk.pipe === 'stdout') {
				stdout += chunk.chunk;
			}
			else if (chunk.pipe === 'stderr') {
				stderr += chunk.chunk;
			}
		}, () => {
			reject(stderr);
		}, () => {
			resolve(stdout);
		});
	});
}

export function runAsObservable(command: string, args: string[], options: any = {}) {
	return new Observable<ProcessOutput>(subscriber => {
		const process = childProcess.spawn(command, args, {
			shell: true,
			...options
		});

		process.stdout.setEncoding('utf8');
		process.stderr.setEncoding('utf8');

		process.stdout.on('data', data => {
			subscriber.next({
				pipe: 'stdout',
				chunk: data.toString()
			});
		});

		process.stderr.on('data', data => {
			subscriber.next({
				pipe: 'stderr',
				chunk: data.toString()
			});
		});

		process.once('close', (code) => {
			if (code <= 0) {
				subscriber.complete();
			}
			else {
				subscriber.error();
			}
		});
	});
}
