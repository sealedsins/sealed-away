import { Stack } from './stack';

describe('Stack', () => {
	it('implements basic stack functionality', () => {
		const stack = new Stack<string>();
		// prettier-ignore
		stack.push([], [
			'print a', 
			'print b', 
			'block [print c, print d]', 
			'print e',
		]);

		// Check initial state.
		expect(stack.peek()).toMatchObject({
			frame: { path: [] },
			index: 0,
			value: 'print a',
		});

		// Imitate running an interpreter.
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 0,
			value: 'print a',
		});
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 1,
			value: 'print b',
		});

		// Imitate creating a new frame.
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 2,
			value: 'block [print c, print d]',
		});
		stack.push([2, 'block'], ['print c', 'print d']);

		// Execute the nested block frame.
		expect(stack.pull()).toMatchObject({
			frame: { path: [2, 'block'] },
			index: 0,
			value: 'print c',
		});
		expect(stack.pull()).toMatchObject({
			frame: { path: [2, 'block'] },
			index: 1,
			value: 'print d',
		});

		// Execute the rest of the root context.
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 3,
			value: 'print e',
		});
		expect(stack.isEmpty()).toBe(true);
	});

	it('implements save and load functionality', () => {
		const stack = new Stack();
		// prettier-ignore
		stack.push([], [
			'print a', 
			'print b', 
			'print c',
		]);

		// Save and check initial state.
		const stateInitial = stack.save();
		expect(typeof stateInitial).toBe('string');
		expect(stack.peek()).toMatchObject({
			frame: { path: [] },
			index: 0,
			value: 'print a',
		});

		// Execute the root frame.
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 0,
			value: 'print a',
		});
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 1,
			value: 'print b',
		});
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 2,
			value: 'print c',
		});
		expect(stack.isEmpty()).toBe(true);

		// Load state and execute 2/3 of the root context.
		stack.load(stateInitial);
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 0,
			value: 'print a',
		});
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 1,
			value: 'print b',
		});
		expect(stack.isEmpty()).toBe(false);

		// Create another save and execute the rest of the root context.
		const stateWithOneItem = stack.save();
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 2,
			value: 'print c',
		});
		expect(stack.isEmpty()).toBe(true);

		// Load recent state and execute it again.
		stack.load(stateWithOneItem);
		expect(stack.pull()).toMatchObject({
			frame: { path: [] },
			index: 2,
			value: 'print c',
		});
		expect(stack.isEmpty()).toBe(true);
	});
});
