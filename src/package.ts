import * as fs from 'fs';
import * as path from 'path';
import { ContentTransform, copy, glob, parseWithFullExtension } from './utils/file';

const destDirectories = [
	{
		dest: 'dev',
		flat: false,
		packageJson: false
	},
	{
		dest: 'release',
		flat: true,
		packageJson: true
	}
];

// find all the directories in dist
const sources = fs
	.readdirSync('dist')
	.filter((file) => destDirectories.reduce((result, d) => (file.indexOf(d.dest) >= 0 ? result + 1 : result), 0) === 0)
	.filter((file) => fs.statSync(path.join('dist', file)).isDirectory());

const extensionMapByDir: { [key: string]: { [key: string]: string } } = {
	esm: {
		'.js': '.mjs',
		'.js.map': '.mjs.map'
	}
};

const contentTransformsByDir: { [key: string]: { [key: string]: ContentTransform } } = {
	cjs: {
		'.js.map': fixSourceMap
	},
	esm: {
		'.mjs': remapMjsSourceMap,
		'.mjs.map': fixMjsSourceMap
	},
	umd: {
		'.js.map': fixSourceMap
	}
};

destDirectories.forEach(({ dest: destDir, flat, packageJson }) => {
	const destDirFullPath = path.join('dist', destDir);

	sources.forEach((sourceDir) => {
		const sourceDirFullPath = flat ? path.join('dist', sourceDir, 'src') : path.join('dist', sourceDir);
		const extensionMap = extensionMapByDir[sourceDir] || {};
		const transformMap = contentTransformsByDir[sourceDir] || {};

		glob(sourceDirFullPath).forEach((file) => {
			const sourceFile = path.join(sourceDirFullPath, file);
			const parsed = parseWithFullExtension(file);

			if (extensionMap[parsed.extension]) {
				parsed.extension = extensionMap[parsed.extension];
			}

			const destFile = path.join(destDirFullPath, parsed.path, parsed.file + parsed.extension);

			copy(sourceFile, destFile, flat, transformMap[parsed.extension]);
		});
	});

	if (packageJson) {
		// copy package.json
		const packageJson = JSON.parse(fs.readFileSync('package.json').toString());
		['private', 'scripts', 'files'].forEach((k) => delete packageJson[k]);

		fs.writeFileSync(path.join(destDirFullPath, 'package.json'), JSON.stringify(packageJson, undefined, 4));

		// copy README.md
		if (fs.existsSync('README.md')) {
			const readmeContent = fs.readFileSync('README.md');
			fs.writeFileSync(path.join(destDirFullPath, 'README.md'), readmeContent);
		}
	}
});

function remapMjsSourceMap(contents: string): string {
	return contents.replace(/(\/\/.*sourceMappingURL=.*?)(\.js\.map)/g, '$1.mjs.map');
}

function fixSourceMap(contents: string, flat: boolean): string {
	if (flat) {
		const json = JSON.parse(contents);

		if (json.sources) {
			json.sources = json.sources.map((source: string) => path.basename(source));
		}

		return JSON.stringify(json);
	}

	return contents;
}

function fixMjsSourceMap(contents: string, flat: boolean): string {
	contents = fixSourceMap(contents, flat);

	const json = JSON.parse(contents);

	if (json.file) {
		json.file = json.file.replace(/\.js$/g, '.mjs');
	}

	return JSON.stringify(json);
}
