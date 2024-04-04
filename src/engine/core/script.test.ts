/**
 * Sealed Sins, 2023-2024.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { Script } from './script';

const spyOnLog = () => {
	return vi.spyOn(console, 'log').mockImplementation(() => null);
};

describe('Script', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('implements save and load functionality', () => {
		// prettier-ignore
		const source = [
			{ print: 'Hello A!' }, 
			{ print: 'Hello B!' }, 
			{ print: 'Hello C!' },
		];

		const log = spyOnLog();
		const scriptOrigin = new Script(source);
		scriptOrigin.step();
		expect(log).toHaveBeenLastCalledWith('Hello A!');
		const save = scriptOrigin.save();
		scriptOrigin.step();
		expect(log).toHaveBeenLastCalledWith('Hello B!');

		const scriptLoaded = new Script(source).load(save);
		scriptLoaded.step();
		expect(log).toHaveBeenLastCalledWith('Hello B!');
		scriptLoaded.step();
		expect(log).toHaveBeenLastCalledWith('Hello C!');
	});

	it('implements save patching functionality', () => {
		const log = spyOnLog();
		const scriptOrigin = new Script([
			{ print: 'Hello A!' },
			{ print: 'Hello B!' },
			{ print: 'Hello C!' },
		]);
		scriptOrigin.step();
		expect(log).toHaveBeenLastCalledWith('Hello A!');
		scriptOrigin.step();
		expect(log).toHaveBeenLastCalledWith('Hello B!');
		const save = scriptOrigin.save();
		scriptOrigin.step();
		expect(log).toHaveBeenLastCalledWith('Hello C!');
		expect(scriptOrigin.isDone()).toBe(true);

		const scriptLoaded = new Script([
			{ print: 'Hello A!' },
			{ print: 'Hello B!' },
			{ print: 'Hello C1!' },
			{ print: 'Hello C2!' },
			{ print: 'Hello D!' },
		]).load(save);
		scriptLoaded.step();
		expect(log).toHaveBeenLastCalledWith('Hello C1!');
		scriptLoaded.step();
		expect(log).toHaveBeenLastCalledWith('Hello C2!');
		scriptLoaded.step();
		expect(log).toHaveBeenLastCalledWith('Hello D!');
		expect(scriptLoaded.isDone()).toBe(true);
	});

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

	it('throws a correct stack trace in a loaded state', () => {
		// prettier-ignore
		const source = [
			{ print: 'Hello A!' }, 
			{ print: 'Hello B!' }, 
			{ throw: 'Hello C!' },
		];

		const log = spyOnLog();
		const scriptOrigin = new Script(source);
		scriptOrigin.step();
		expect(log).toHaveBeenLastCalledWith('Hello A!');
		const save = scriptOrigin.save();
		scriptOrigin.step();
		expect(log).toHaveBeenLastCalledWith('Hello B!');

		const scriptLoaded = new Script(source).load(save);
		scriptLoaded.step();
		expect(log).toHaveBeenLastCalledWith('Hello B!');
		expect(() => scriptLoaded.step()).toThrowError(
			expect.objectContaining({
				name: 'ScriptError',
				message: 'Hello C!',
				path: [2],
			}),
		);
	});

	it('throws a human-readable message in case of a bad arguments', () => {
		// prettier-ignore
		const script = new Script([
			{ print: {} },
		]);
		expect(() => script.step()).toThrowError(
			expect.objectContaining({
				name: 'ScriptError',
				message: 'Arguments: Expected string, received object',
				path: [0],
			}),
		);
	});

	it('emits `step` event', () => {
		const script = new Script([
			{ print: 'Hello A!' },
			{ print: 'Hello B!' },
			{ print: 'Hello C!' },
		]);
		spyOnLog();
		const listener = vi.fn();
		script.subscribe(listener);
		script.step();
		script.step();
		script.step();
		expect(listener).toHaveBeenCalledTimes(3);
		expect(script.isDone()).toBe(true);
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

	it('implements `emit` command', () => {
		const script = new Script([
			{ emit: { type: 'test' } },
			{ emit: { type: 'test', data: 'A' } },
			{ emit: { type: 'test', data: 'B' } },
			{ emit: { type: 'poop' } },
		]);
		const listener = vi.fn();
		const unsubscribe = script.subscribe(listener);
		script.step();
		expect(listener).toHaveBeenCalledWith({ type: 'test' });
		script.step();
		expect(listener).toHaveBeenCalledWith({ type: 'test', data: 'A' });
		script.step();
		expect(listener).toHaveBeenCalledWith({ type: 'test', data: 'B' });
		unsubscribe();
		listener.mockReset();
		script.step();
		expect(listener).not.toHaveBeenCalled();
	});
});
