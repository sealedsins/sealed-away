/**
 * Sealed Sins, 2023-2024.
 */
import { describe, it, expect } from 'vitest';
import { Stack } from './stack';

describe('Stack', () => {
	it('implements basic stack functionality', () => {
		const stack = new Stack();
		// prettier-ignore
		stack.push([], [
			['print', 'a'], 
			['print', 'b'], 
			['block', [['print', 'c'], ['print', 'd']]], 
			['print', 'e'],
		]);

		// Check initial state.
		expect(stack.peek()).toMatchObject({
			frame: { path: [] },
			index: 0,
			value: ['print', 'a'],
		});

		// Imitate running an interpreter.
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 0,
			value: ['print', 'a'],
		});
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 1,
			value: ['print', 'b'],
		});

		// Imitate creating a new frame.
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 2,
			value: [
				'block',
				[
					['print', 'c'],
					['print', 'd'],
				],
			],
		});
		// prettier-ignore
		stack.push([2, 'block'], [
			['print', 'c'], 
			['print', 'd'],
		]);

		// Execute the nested block frame.
		expect(stack.pull()).toMatchObject({
			frame: { path: [2, 'block'] },
			index: 0,
			value: ['print', 'c'],
		});
		expect(stack.pull()).toMatchObject({
			frame: { path: [2, 'block'] },
			index: 1,
			value: ['print', 'd'],
		});

		// Execute the rest of the root context.
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 3,
			value: ['print', 'e'],
		});
		expect(stack.isEmpty()).toBe(true);
	});

	it('implements save and load functionality', () => {
		const stack = new Stack();
		// prettier-ignore
		stack.push([], [
			['print', 'a'], 
			['print', 'b'], 
			['print', 'c'],
		]);

		// Save and check initial state.
		const stateInitial = stack.save();
		expect(typeof stateInitial).toBe('string');
		expect(stack.peek()).toMatchObject({
			frame: { path: [] },
			index: 0,
			value: ['print', 'a'],
		});

		// Execute the root frame.
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 0,
			value: ['print', 'a'],
		});
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 1,
			value: ['print', 'b'],
		});
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 2,
			value: ['print', 'c'],
		});
		expect(stack.isEmpty()).toBe(true);

		// Load state and execute 2/3 of the root context.
		stack.load(stateInitial);
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 0,
			value: ['print', 'a'],
		});
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 1,
			value: ['print', 'b'],
		});
		expect(stack.isEmpty()).toBe(false);

		// Create another save and execute the rest of the root context.
		const stateWithOneItem = stack.save();
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 2,
			value: ['print', 'c'],
		});
		expect(stack.isEmpty()).toBe(true);

		// Load recent state and execute it again.
		stack.load(stateWithOneItem);
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 2,
			value: ['print', 'c'],
		});
		expect(stack.isEmpty()).toBe(true);
	});

	it('implements patching functionality (same line)', () => {
		const stack = new Stack();

		// prettier-ignore
		stack.push([], [
			['print', 'a'],
			['print', 'b'],
			['print', 'c'],
			['print', 'd'],
		]);

		// Reach line "print d".
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 0,
			value: ['print', 'a'],
		});
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 1,
			value: ['print', 'b'],
		});
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 2,
			value: ['print', 'c'],
		});
		expect(stack.peek()).toMatchObject({
			frame: { path: [] },
			index: 3,
			value: ['print', 'd'],
		});

		// Patch.
		// prettier-ignore
		stack.patch([], [
			['print', 'a'],
			['print', 'b1'],
			['print', 'b2'],
			['print', 'b3'],
			['print', 'c'],
			['print', 'd'],
			['print', 'e'],
		]);

		// Execute the rest of the stack.
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 5,
			value: ['print', 'd'],
		});
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 6,
			value: ['print', 'e'],
		});
	});

	it('implements patching functionality (previous line)', () => {
		const stack = new Stack();

		// prettier-ignore
		stack.push([], [
			['print', 'a'],
			['print', 'b'],
			['print', 'c'],
		]);

		// Reach line "print c".
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 0,
			value: ['print', 'a'],
		});
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 1,
			value: ['print', 'b'],
		});
		expect(stack.peek()).toMatchObject({
			frame: { path: [] },
			index: 2,
			value: ['print', 'c'],
		});

		// Patch.
		// prettier-ignore
		stack.patch([], [
			['print', 'a'],
			['print', 'b'],
			['print', 'c1'],
			['print', 'c2'],
			['print', 'c3'],
			['print', 'd'],
			['print', 'e'],
		]);

		// Execute the rest of the stack.
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 2,
			value: ['print', 'c1'],
		});
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 3,
			value: ['print', 'c2'],
		});
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 4,
			value: ['print', 'c3'],
		});
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 5,
			value: ['print', 'd'],
		});
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 6,
			value: ['print', 'e'],
		});
		expect(stack.isEmpty()).toBe(true);
	});
});
