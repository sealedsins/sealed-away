/**
 * Sealed Sins, 2023-2024-2024.
 */
import { pick, isEqual } from 'lodash';
import { diff } from '../utils/diff';

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
	 * Stack length.
	 */
	get length() {
		return this.stack.length;
	}

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
	 * @returns Created frame.
	 */
	public push(path: StackFrame['path'], code: StackFrame['code']) {
		if (this.find(path)) {
			throw new StackError('Frame with such path already exists.');
		}
		const frame: StackFrame = { programCounter: 0, path, code };
		this.stack.unshift(frame);
		return frame;
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
	 * Retruns current stack frames.
	 * @returns Stack frames.
	 */
	public dump() {
		return this.stack;
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

	/**
	 * Finds frame with a given path and patches its code.
	 * This method updates the `programCounter` accordingly.
	 * @returns Patched frame or null (if frame does not exist).
	 * @param path - Frame path.
	 * @param code - Frame code.
	 */
	public patch(path: StackFrame['path'], code: StackFrame['code']) {
		const frame = this.find(path);
		if (!frame) {
			return null;
		}
		let { programCounter } = frame;
		let changes = diff(frame.code, code);
		while (programCounter >= 0) {
			const match = changes.find((x) => x.indexSource === programCounter);
			if (!match && programCounter > 0) {
				programCounter--;
				continue;
			}
			if (!match && programCounter === 0) {
				frame.programCounter = 0;
				frame.code = code;
				break;
			}
			if (match && frame.programCounter === programCounter) {
				frame.programCounter = match.indexUpdate;
				frame.code = code;
				break;
			}
			if (match && frame.programCounter !== programCounter) {
				frame.programCounter = match.indexUpdate + 1;
				frame.code = code;
				break;
			}
		}
		return frame;
	}
}
