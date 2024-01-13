/**
 * Sealed Sins, 2023-2024-2024.
 */
import { pick, isEqual } from 'lodash';

/**
 * Call Stack frame.
 */
export interface StackFrame {
	path: Array<string | number>;
	programCounter: number;
	code: Array<unknown>;
}

/**
 * Call Stack slice.
 */
export interface StackSlice {
	frame: StackFrame;
	index: number;
	value: unknown;
}

/**
 * Call Stack history item.
 * @internal
 */
// prettier-ignore
export type StackChange = (
	| { type: 'push' }
	| { type: 'pull:shift'; frame: StackFrame }
	| { type: 'pull:increment' }
);

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
	private history: Array<StackChange> = [];
	private stack: Array<StackFrame> = [];

	/**
	 * Returns stack status.
	 * @returns Boolean indicating stack status.
	 */
	public isEmpty() {
		return !this.peek();
	}

	/**
	 * Dumps current stack state.
	 * @returns Stack frame list.
	 */
	public dump() {
		return this.stack;
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
		const frame = {
			programCounter: 0,
			path,
			code,
		};
		this.history.push({ type: 'push' });
		this.stack.unshift(frame);
	}

	/**
	 * Peeks a slice from the top of the stack.
	 * @returns Stack slice from the top of the stack.
	 */
	public peek(): StackSlice | null {
		const frame = this.stack[0];
		const value = frame?.code[frame.programCounter];
		if (!frame || !value) {
			return null;
		}
		return {
			frame,
			index: frame.programCounter,
			value,
		};
	}

	/**
	 * Pulls a slice from the top of the stack.
	 * @returns Stack slice from the top of the stack.
	 */
	public pull(): StackSlice | null {
		const slice = this.peek();
		if (!slice) {
			return null;
		}
		const frame = slice.frame;
		frame.programCounter++;
		if (frame.programCounter === frame.code.length) {
			this.history.push({ type: 'pull:shift', frame });
			this.stack.shift();
		} else {
			this.history.push({ type: 'pull:increment' });
		}
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
		const state = pick(this, ['stack', 'history']);
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

	/**
	 * Undoes the last stack action.
	 */
	public undo() {
		const change = this.history.pop();
		if (!change) {
			return;
		}
		switch (change.type) {
			case 'push': {
				this.stack.shift();
				break;
			}
			case 'pull:shift': {
				const frame = change.frame;
				frame.programCounter = frame.code.length - 1;
				this.stack.unshift(frame);
				break;
			}
			case 'pull:increment': {
				const frame = this.stack[0]!;
				frame.programCounter--;
				break;
			}
			default: {
				throw new StackError('Unknown history item');
				break;
			}
		}
	}
}
