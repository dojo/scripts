import { execSync as exec } from 'child_process';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('package.json').toString());

const peerDeps = packageJson.peerDependencies;
let packageCmd = 'npm install';
let message = '';
let peerDepsFound = false;

for (let name in peerDeps) {
	packageCmd = `${packageCmd} ${name}@"${peerDeps[name]}"`;
	message = `${message}installing peer dependency ${name} with version ${peerDeps[name]}\n`;
	peerDepsFound = true;
}

if (peerDepsFound) {
	packageCmd = `${packageCmd} --no-save`;
	console.log(message);
	try {
		exec(packageCmd, { stdio: 'ignore' });
		console.log('complete.');
	}
	catch (error) {
		console.error(error);
		console.error('failed.');
	}
}
else {
	console.log('No peer dependencies detected.');
}
