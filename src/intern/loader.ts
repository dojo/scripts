declare const shimAmdDependencies: any;

intern.registerLoader((options: any) => {
	function assign(object: any, ...args: any[]) {
		for (const arg of args) {
			Object.keys(arg).forEach((key) => {
				object[key] = arg[key];
			});
		}

		return object;
	}

	const {
		packages = [],
		map = {},
		baseUrl = intern.config.basePath,
		loaderPath = 'node_modules/@dojo/loader/loader.js',
		shimPath = 'node_modules/@dojo/framework/shim/util/amd.js'
	} = options;

	return intern
		.loadScript(loaderPath)
		.then(() => intern.loadScript(shimPath))
		.then(() => {
			(require as any).config(
				shimAmdDependencies(
					assign({ baseUrl }, options, {
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
						map: assign({}, map, {
							globalize: {
								cldr: 'cldrjs/dist/cldr',
								'cldr/event': 'cldrjs/dist/cldr/event',
								'cldr/supplemental': 'cldrjs/dist/cldr/supplemental',
								'cldr/unresolved': 'cldrjs/dist/cldr/unresolved'
							}
						})
					})
				)
			);
		})
		.then(() => {
			// load @dojo/framework/shim/main to import the ts helpers
			return new Promise<void>((resolve) => {
				(require as any)(['@dojo/framework/shim/main'], () => {
					resolve();
				});
			});
		})
		.then(() => {
			return (modules: string[]) => {
				return new Promise<void>((resolve, reject) => {
					(require as any)(modules, () => resolve());
				});
			};
		});
});
