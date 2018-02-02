import * as fs from 'fs';
import * as path from 'path';

export function glob(base: string): string[] {
	let files: string[] = [];

	fs.readdirSync(base).forEach((file) => {
		const fullPath = path.join(base, file);

		if (fs.statSync(fullPath).isDirectory()) {
			glob(fullPath).forEach((subFile) => {
				files.push(path.join(file, subFile));
			});
		} else {
			files.push(file);
		}
	});

	return files;
}

export interface ContentTransform {
	(content: string): string;
}

export function copy(sourceFile: string, destFile: string, transform?: ContentTransform) {
	// dest file path must exist all the way down
	const directoriesThatNeedToExist = [];
	let base = path.dirname(destFile);

	while (!fs.existsSync(base)) {
		directoriesThatNeedToExist.push(base);
		base = path.dirname(base);
	}

	directoriesThatNeedToExist.reverse().forEach((dir) => {
		fs.mkdirSync(dir);
	});

	let content: string | Buffer = fs.readFileSync(sourceFile);
	if (transform) {
		content = transform(content.toString());
	}

	fs.writeFileSync(destFile, content);
}

export function parseWithFullExtension(filePath: string): { path: string; file: string; extension: string } {
	const parsed = path.parse(filePath);
	let extension = '';

	const extensionIndex = parsed.base.indexOf('.');
	if (extensionIndex >= 0) {
		extension = parsed.base.substr(extensionIndex);
	}

	return {
		path: parsed.dir,
		file: parsed.base.substr(0, parsed.base.length - extension.length),
		extension
	};
}
