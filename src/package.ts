import * as fs from 'fs';
import * as path from 'path';

const target = 'all';

// find all the directories in dist
const sources = fs.readdirSync('dist')
	.filter(file => file.indexOf('all') < 0)
	.filter(file => fs.statSync(path.join('dist', file)).isDirectory());

function glob(base: string): string[] {
	let files: string[] = [];

	fs.readdirSync(base).forEach(file => {
		const fullPath = path.join(base, file);

		if (fs.statSync(fullPath).isDirectory()) {
			glob(fullPath).forEach(subFile => {
				files.push(path.join(file, subFile));
			});
		}
		else {
			files.push(file);
		}
	});

	return files;
}

function copy(sourceFile: string, destFile: string) {
	// dest file path must exist all the way down
	const directoriesThatNeedToExist = [];
	let base = path.dirname(destFile);

	while (!fs.existsSync(base)) {
		directoriesThatNeedToExist.push(base);
		base = path.dirname(base);
	}

	directoriesThatNeedToExist.reverse().forEach(dir => {
		fs.mkdirSync(dir);
	});

	fs.writeFileSync(destFile, fs.readFileSync(sourceFile));
}

const destDirFullPath = path.join('dist', target);

sources.forEach(sourceDir => {
	const sourceDirFullPath = path.join('dist', sourceDir, 'src');

	if (sourceDir === 'esm') {
	}

	glob(sourceDirFullPath).forEach(file => {
		const sourceFile = path.join(sourceDirFullPath, file);
		const destFile = path.join(destDirFullPath, file);

		copy(sourceFile, destFile);
	});
});
