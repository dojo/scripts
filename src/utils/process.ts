import * as childProcess from 'child_process';

export async function runAsPromise(command: string, args: string[]): Promise<any> {
	return new Promise((resolve, reject) => {
		const process = childProcess.spawn(command, args);
		let stdout = '';
		let stderr = '';

		process.stdout.on('data', data => {
			stdout = stdout + data.toString();
		});

		process.stderr.on('data', data => {
			stderr = stderr + data.toString();
		});

		process.once('close', (code) => {
			if (code <= 0) {
				resolve(stdout);
			}
			else {
				reject(stderr);
			}
		});
	});
}
