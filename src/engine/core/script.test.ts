/**
 * Sealed Sins, 2023.
 */
import { Script } from './script';

const spyOnLog = () => {
	return jest.spyOn(console, 'log').mockImplementation();
};

const spyOnStorage = () => {
	const setItem = jest.spyOn(Storage.prototype, 'setItem');
	const getItem = jest.spyOn(Storage.prototype, 'getItem');
	return { setItem, getItem };
};

describe('Script', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	// it('is serializable', () => {
	// 	const scriptOrigin = new Script([
	// 		{ print: 'Hello A!' },
	// 		{ print: 'Hello B!' },
	// 		{ print: 'Hello C!' },
	// 	]);
	// 	const log = spyOnLog();

	// 	scriptOrigin.step();
	// 	expect(log).toHaveBeenLastCalledWith('Hello A!');
	// 	const save = scriptOrigin.save();
	// 	scriptOrigin.step();
	// 	expect(log).toHaveBeenLastCalledWith('Hello B!');

	// 	const scriptLoaded = new Script().load(save);
	// 	scriptLoaded.step();
	// 	expect(log).toHaveBeenLastCalledWith('Hello B!');
	// 	scriptLoaded.step();
	// 	expect(log).toHaveBeenLastCalledWith('Hello C!');
	// });

	// it('is extenadble', () => {
	// 	const Scene = class extends Script {
	// 		protected override exec(value: unknown) {
	// 			const { type, args } = this.unpack(value);
	// 			switch (type) {
	// 				case 'page': {
	// 					this.setVar('state', this.eval(args));
	// 					break;
	// 				}
	// 				default: {
	// 					super.exec(value);
	// 					break;
	// 				}
	// 			}
	// 		}
	// 	};
	// 	// prettier-ignore
	// 	const scene = new Scene([
	// 		{ page: 'Hello!' },
	// 		{ page: 'World!' },
	// 	]);
	// 	scene.step();
	// 	expect(scene.getVar('state')).toBe('Hello!');
	// 	scene.step();
	// 	expect(scene.getVar('state')).toBe('World!');
	// });

	it('throws a correct stack trace in the root', () => {
		// prettier-ignore
		const script = new Script([
			{ label: 'start' }, 
			{ throw: 'error' },
		]);
		script.step();
		expect(() => script.step()).toThrowError(
			expect.objectContaining({
				name: 'ScriptError',
				message: 'error',
				path: [1],
			}),
		);
	});

	it('throws a correct stack trace in the nested block', () => {
		const script = new Script([
			{ label: 'start' },
			{
				if: {
					cond: true,
					then: [{ throw: 'error' }],
				},
			},
		]);
		script.step();
		script.step();
		expect(() => script.step()).toThrowError(
			expect.objectContaining({
				name: 'ScriptError',
				message: 'error',
				path: [1, 'if', 'then', 0],
			}),
		);
	});

	it('throws a human-readable message in case of a bad arguments', () => {
		const script = new Script([{ print: {} }]);
		expect(() => script.step()).toThrowError(
			expect.objectContaining({
				name: 'ScriptError',
				message: 'Arguments: Expected string, received object',
				path: [0],
			}),
		);
	});

	it('implements `if` command', () => {
		const script = new Script([
			{
				if: {
					cond: Script.exp('test > 0'),
					then: [{ print: 'Hello!' }],
					else: [{ print: 'World!' }],
				},
			},
			{
				if: {
					cond: Script.exp('test > 0'),
					then: [{ print: 'Hello!' }],
					else: [{ print: 'World!' }],
				},
			},
		]);
		const log = spyOnLog();
		script.setVar('test', +1);
		script.step(); // if
		script.step(); // print
		expect(log).toHaveBeenLastCalledWith('Hello!');
		script.setVar('test', -1);
		script.step(); // if
		script.step(); // print
		expect(log).toHaveBeenLastCalledWith('World!');
	});

	it('implements `jump` command', () => {
		// prettier-ignore
		const script = new Script([
			{ label: 'start' },
				{ jump: 'hello' },
			{ label: 'world' },
				{ print: 'World!' },
				{ jump: 'start' },
			{ label: 'hello' },
				{ print: 'Hello!' },
				{ jump: 'world' },
		]);
		const log = spyOnLog();
		script.step(); // label start
		script.step(); // jump
		script.step(); // label world
		script.step(); // print
		expect(log).toHaveBeenLastCalledWith('Hello!');
		script.step(); // jump world
		script.step(); // label world
		script.step(); // print
		expect(log).toHaveBeenLastCalledWith('World!');
	});

	it('implements `eval` command', () => {
		// prettier-ignore
		const script = new Script([
			{ eval: 'this.a = 150' }, 
			{ eval: 'this.b = 100' },
		]);
		script.step();
		expect(script.getVar('a')).toBe(150);
		script.step();
		expect(script.getVar('b')).toBe(100);
	});

	it('implements `print` command', () => {
		const script = new Script([
			{ print: 'Hello World!' },
			{ print: Script.fmt('Hello {{ world }}!') },
			{ print: Script.exp('"Hello " + world + "!"') },
		]);
		const log = spyOnLog();
		script.setVar('world', 'World');
		script.step();
		expect(log).toHaveBeenLastCalledWith('Hello World!');
		script.step();
		expect(log).toHaveBeenLastCalledWith('Hello World!');
		script.step();
		expect(log).toHaveBeenLastCalledWith('Hello World!');
	});

	it('implements `throw` command', () => {
		const script = new Script([
			{ throw: 'Hello World!' },
			{ throw: Script.fmt('Hello {{ world }}!') },
			{ throw: Script.exp('"Hello " + world + "!"') },
		]);
		const log = spyOnLog();
		script.setVar('world', 'World');
		expect(() => script.step()).toThrowError('Hello World!');
		expect(() => script.step()).toThrowError('Hello World!');
		expect(() => script.step()).toThrowError('Hello World!');
	});

	it('implements `set` command', () => {
		const script = new Script([
			{ set: { name: 'a', value: 100 } },
			{ set: { name: 'b', value: Script.exp('a') } },
			{ set: { name: 'c', value: Script.exp('a + b') } },
		]);
		script.step();
		expect(script.getVar('a')).toBe(100);
		script.step();
		expect(script.getVar('b')).toBe(100);
		script.step();
		expect(script.getVar('c')).toBe(200);
	});
});
