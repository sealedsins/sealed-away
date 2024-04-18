/**
 * Sealed Sins, 2023-2024.
 */
import { describe, it, expect } from 'vitest';
import { Stack } from './stack';

describe('Stack', () => {
	it('implements basic stack functionality', () => {
		const stack = new Stack();

		// prettier-ignore
		stack.push([
			{print: 'a'},
			{print: 'b'},
			{block: [{print: 'c'}, {print: 'd'}]},
			{print: 'e'},
		]);

		// Check initial state.
		expect(stack.peek()).toMatchObject({
			value: { print: 'a' },
		});

		// Imitate running an interpreter.
		expect(stack.pull()).toMatchObject({
			value: { print: 'a' },
		});
		expect(stack.pull()).toMatchObject({
			value: { print: 'b' },
		});

		// Imitate creating a new frame.
		// prettier-ignore
		expect(stack.pull()).toMatchObject({
			value: {
				block: [
					{ print: 'c' }, 
					{ print: 'd' },
				],
			},
		});
		// prettier-ignore
		stack.push([
			{ print: 'c' }, 
			{ print: 'd' },
		]);

		// Execute the nested block frame.
		expect(stack.pull()).toMatchObject({
			value: { print: 'c' },
		});
		expect(stack.pull()).toMatchObject({
			value: { print: 'd' },
		});

		// Execute the rest of the root context.
		expect(stack.pull()).toMatchObject({
			value: { print: 'e' },
		});
		expect(stack.isEmpty()).toBe(true);
	});

	it('implements patching functionality (same line, code is added before)', () => {
		const stack = new Stack();

		// prettier-ignore
		const rootFrame = stack.push([
			{print: 'a'},
			{print: 'b'},
			{print: 'c'},
			{print: 'd'},
		]);

		// Reach line "print d".
		expect(stack.pull()).toMatchObject({
			value: { print: 'a' },
		});
		expect(stack.pull()).toMatchObject({
			value: { print: 'b' },
		});
		expect(stack.pull()).toMatchObject({
			value: { print: 'c' },
		});
		expect(stack.peek()).toMatchObject({
			value: { print: 'd' },
		});

		// Patch.
		// prettier-ignore
		Stack.patch(rootFrame, [
			{print: 'a'},
			{print: 'b1'},
			{print: 'b2'},
			{print: 'b3'},
			{print: 'c'},
			{print: 'd'},
			{print: 'e'},
		]);

		// Execute the rest of the stack.
		expect(stack.pull()).toMatchObject({
			value: { print: 'd' },
		});
		expect(stack.pull()).toMatchObject({
			value: { print: 'e' },
		});
	});

	it('implements patching functionality (same line, code is added after)', () => {
		const stack = new Stack();

		// prettier-ignore
		const rootFrame = stack.push([
			{print: 'a'},
			{print: 'b'},
			{print: 'c'},
		]);

		// Reach line "print c".
		expect(stack.pull()).toMatchObject({
			value: { print: 'a' },
		});
		expect(stack.pull()).toMatchObject({
			value: { print: 'b' },
		});
		expect(stack.peek()).toMatchObject({
			value: { print: 'c' },
		});

		// Patch.
		// prettier-ignore
		Stack.patch(rootFrame, [
			{print: 'a'},
			{print: 'b'},
			{print: 'c1'},
			{print: 'c2'},
			{print: 'c3'},
			{print: 'd'},
			{print: 'e'},
		]);

		// Execute the rest of the stack.
		expect(stack.pull()).toMatchObject({
			value: { print: 'c1' },
		});
		expect(stack.pull()).toMatchObject({
			value: { print: 'c2' },
		});
		expect(stack.pull()).toMatchObject({
			value: { print: 'c3' },
		});
		expect(stack.pull()).toMatchObject({
			value: { print: 'd' },
		});
		expect(stack.pull()).toMatchObject({
			value: { print: 'e' },
		});
		expect(stack.isEmpty()).toBe(true);
	});

	it('implements patching functionality (same line, replaced)', () => {
		const stack = new Stack();

		// prettier-ignore
		const rootFrame = stack.push([
			{print: 'a'},
			{print: 'b'},
			{print: 'c'},
			{print: 'd'},
		]);

		// Reach line "print b".
		expect(stack.pull()).toMatchObject({
			value: { print: 'a' },
		});
		expect(stack.pull()).toMatchObject({
			value: { print: 'b' },
		});

		// Patch.
		// prettier-ignore
		Stack.patch(rootFrame, [
			{print: 'a'},
			{print: 'b1'},
			{print: 'b2'},
			{print: 'b3'},
			{print: 'c'},
			{print: 'd'},
			{print: 'e'},
		]);

		// Execute the rest of the stack.
		expect(stack.pull()).toMatchObject({
			value: { print: 'c' },
		});
		expect(stack.pull()).toMatchObject({
			value: { print: 'd' },
		});
		expect(stack.pull()).toMatchObject({
			value: { print: 'e' },
		});
		expect(stack.isEmpty()).toBe(true);
	});
});
