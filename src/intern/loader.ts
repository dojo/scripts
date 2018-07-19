declare const shimAmdDependencies: any;

intern.registerLoader(async (options: any) => {
	const {
		packages = [],
		map = {},
		baseUrl = intern.config.basePath,
		loaderPath = 'node_modules/@dojo/loader/loader.js',
		shimPath = 'node_modules/@dojo/framework/shim/util/amd.js'
	} = options;

	await intern.loadScript(loaderPath);
	await intern.loadScript(shimPath);

	(<any>require).config(
		shimAmdDependencies({
			baseUrl,
			...options,
			packages: [
				...packages,
				{
					name: 'cldr-data',
					location: 'node_modules/cldr-data'
				},
				{
					name: 'cldrjs',
					location: 'node_modules/cldrjs'
				},
				{
					name: 'globalize',
					location: 'node_modules/globalize',
					main: 'dist/globalize'
				},
				{
					name: 'css-select-umd',
					location: 'node_modules/css-select-umd',
					main: 'dist/index.js'
				},
				{
					name: 'diff',
					location: 'node_modules/diff',
					main: 'dist/diff.js'
				},
				{
					name: 'sinon',
					location: 'node_modules/sinon/pkg',
					main: 'sinon'
				}
			],
			map: {
				...map,
				globalize: {
					cldr: 'cldrjs/dist/cldr',
					'cldr/event': 'cldrjs/dist/cldr/event',
					'cldr/supplemental': 'cldrjs/dist/cldr/supplemental',
					'cldr/unresolved': 'cldrjs/dist/cldr/unresolved'
				}
			}
		})
	);

	// load @dojo/framework/shim/main to import the ts helpers
	await new Promise<void>((resolve) => {
		(<any>require)(['@dojo/framework/shim/main'], () => {
			resolve();
		});
	});

	return (modules: string[]) => {
		return new Promise<void>((resolve, reject) => {
			(<any>require)(modules, () => resolve());
		});
	};
});
