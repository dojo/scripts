declare const shimAmdDependencies: any;
declare const intern: any;

intern.registerLoader(async (options: any) => {
	await intern.loadScript('node_modules/@dojo/loader/loader.js');
	await intern.loadScript('node_modules/@dojo/shim/util/amd.js');

	const { packages = [], baseUrl = intern.config.basePath } = options;
	packages.push({
		name: 'sinon',
		location: 'node_modules/sinon/pkg',
		main: 'sinon'
	});

	(<any> require).config(shimAmdDependencies({
		baseUrl,
		...options,
		packages
	}));

	// load @dojo/shim/main to import the ts helpers
	await new Promise<void>((resolve) => {
		(<any> require)(['@dojo/shim/main'], () => {
			resolve();
		});
	});

	return (modules: string[]) => {
		return new Promise<void>((resolve, reject) => {
			(<any> require)(modules, () => resolve());
		});
	};
});
