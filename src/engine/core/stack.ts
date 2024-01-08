/**
 * Sealed Sins, 2023-2024-2024.
 */
import { pick, isEqual } from 'lodash';

/**
 * Call Stack Frame.
 */
export interface StackFrame {
	path: Array<string | number>;
	programCounter: number;
	code: Array<unknown>;
}

/**
 * Call Stack Slice.
 */
export interface StackSlice {
	frame: StackFrame;
	index: number;
	value: unknown;
}

/**
 * Call Stack Error.
 */
export class StackError extends Error {
	public override name = 'StackError';
}

/**
 * Call Stack.
 */
export class Stack {
	private stack: Array<StackFrame> = [];

	/**
	 * Returns stack status.
	 * @returns Boolean indicating stack status.
	 */
	public isEmpty() {
		return !this.peek();
	}

	/**
	 * Clears stack.
	 */
	public clear() {
		this.stack = [];
	}

	/**
	 * Pushes new frame to the top of the stack.
	 * @param path - Frame path metadata (used for debug).
	 * @param code - Frame code.
	 */
	public push(path: StackFrame['path'], code: StackFrame['code']) {
		if (this.find(path)) {
			throw new StackError('Frame with such path already exists.');
		}
		this.stack.unshift({
			path,
			programCounter: 0,
			code,
		});
	}

	/**
	 * Pulls a slice from the top of the stack.
	 * @returns Stack slice from the top of the stack.
	 */
	public pull(): StackSlice | null {
		const frame = this.stack[0];
		if (!frame) {
			return null;
		}
		const value = frame.code[frame.programCounter];
		if (!value) {
			this.stack.shift();
			return this.pull();
		}
		const slice: StackSlice = {
			frame,
			index: frame.programCounter,
			value,
		};
		frame.programCounter++;
		return slice;
	}

	/**
	 * Peeks a slice from the top of the stack.
	 * @returns Stack slice from the top of the stack.
	 */
	public peek() {
		const slice = this.pull();
		if (!slice) {
			return slice;
		}
		slice.frame.programCounter--;
		return slice;
	}

	/**
	 * Finds frame with a given path and returns it.
	 * @returns Target frame or null.
	 */
	public find(path: StackFrame['path']) {
		const frame = this.stack.find((frame) => isEqual(frame.path, path));
		return frame ?? null;
	}

	/**
	 * Stringifies stack state and returns it.
	 * @returns Stringified stack state.
	 */
	public save() {
		const state = pick(this, ['stack']);
		return JSON.stringify(state);
	}

	/**
	 * Parses given stack state and restores it.
	 * @param state - State to load.
	 * @returns Stack.
	 */
	public load(state: string) {
		const data = JSON.parse(state);
		Object.assign(this, data);
		return this;
	}
}
