import * as vm from 'vm';
import { Context } from 'vm';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import { SinonSandbox } from 'sinon';
import * as istanbul from 'istanbul-lib-instrument';

const { afterEach, beforeEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

describe('intern/loader', () => {
	let sandbox: SinonSandbox;
	let internMock: any;
	let requireMock: any;
	let context: Context;
	let shimMock: any;
	let loaderPromise: Promise<any> | undefined;

	const instrumenter = istanbul.createInstrumenter({
		esModules: true
	});

	const sourceFile = path.resolve(__dirname, '../../../src/intern/loader.js');
	const loaderCode = fs.readFileSync(sourceFile).toString();
	const instrumentedCode = instrumenter.instrumentSync(loaderCode, sourceFile);

	function reportCoverage() {
		intern.emit('coverage', {
			coverage: (<any>context)['__coverage__'],
			source: '',
			sessionId: intern.config.sessionId
		});
	}

	function runTest(before: Function, after: Function) {
		return new Promise((resolve, reject) => {
			before();
			vm.runInContext(instrumentedCode, context);

			if (loaderPromise) {
				loaderPromise.then((result) => {
					after(result);
					resolve();
				});
			} else {
				setTimeout(() => {
					reportCoverage();

					after();
					resolve();
				}, 100);
			}
		});
	}

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		requireMock = sandbox.stub().callsArg(1);
		(<any>requireMock).config = sandbox.stub();

		loaderPromise = undefined;

		internMock = {
			registerLoader: (cb: Function) => {
				loaderPromise = cb({
					baseUrl: '/options'
				});
			},
			loadScript: sandbox.spy(() => Promise.resolve()),
			config: {
				basePath: '/config'
			}
		};

		shimMock = sandbox.stub().returnsArg(0);

		context = vm.createContext({
			intern: internMock,
			require: requireMock,
			shimAmdDependencies: shimMock
		});
	});

	afterEach(() => {
		sandbox.restore();
	});

	it('registers the intern loader', async () =>
		runTest(
			() => {
				sandbox.stub(internMock, 'registerLoader');
			},
			() => {
				assert.isTrue(internMock.registerLoader.called);
			}
		));

	it('loads the AMD util', async () =>
		runTest(
			() => {},
			() => {
				assert.isTrue(internMock.loadScript.calledWith('node_modules/@dojo/loader/loader.js'));
				assert.isTrue(internMock.loadScript.calledWith('node_modules/@dojo/framework/shim/util/amd.js'));
			}
		));

	it('configures the loader with the baseurl from options', async () =>
		runTest(
			() => {},
			() => {
				assert.equal(requireMock.config.args[0][0].baseUrl, '/options');
			}
		));

	it('configures the loader with the baseurl from config', async () =>
		runTest(
			() => {
				sandbox.stub(internMock, 'registerLoader').callsArgWith(0, {});
			},
			() => {
				assert.equal(requireMock.config.args[0][0].baseUrl, '/config');
			}
		));

	it('loads framework/shim/main', async () =>
		runTest(
			() => {},
			() => {
				assert.equal(requireMock.args[0][0], '@dojo/framework/shim/main');
			}
		));

	it('creates a loader that uses require', async () =>
		new Promise((resolve) => {
			runTest(
				() => {},
				(result: any) => {
					result(['some-module']).then(() => {
						assert.isTrue(requireMock.calledWith(['some-module']));
						resolve();
					});
				}
			);
		}));
});
