/**
 * Sealed Sins, 2023-2024.
 */
import hash from 'object-hash';
import { pick, isEqual } from 'lodash';
import { diffArrays } from 'diff';

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
	 * Dumps current stack state.
	 * @returns Stack frame list.
	 */
	public dump() {
		return this.stack;
	}

	/**
	 * Clears current stack state.
	 */
	public clear() {
		this.stack.length = 0;
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
		const frame = { programCounter: 0, path, code };
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
		slice.frame.programCounter++;
		if (slice.frame.programCounter === slice.frame.code.length) {
			this.stack.shift();
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
	 * @returns Stack state (JSON).
	 */
	public save() {
		const state = pick(this, ['stack']);
		return JSON.stringify(state);
	}

	/**
	 * Parses given stack state and restores it.
	 * @param state - Stack state to load (JSON).
	 * @returns Stack.
	 */
	public load(state: string) {
		const data = JSON.parse(state);
		Object.assign(this, data);
		return this;
	}

	/**
	 * Finds frame with a given path and patches its code and program counter accordingly.
	 * @param path - Frame path.
	 * @param code - Frame code.
	 * @returns Patched frame or null (if frame does not exist).
	 */
	public patch(path: StackFrame['path'], code: StackFrame['code']) {
		const frame = this.find(path);
		if (!frame || hash(code) === hash(frame.code)) {
			return null;
		}
		let index = 0;
		for (const change of diffArrays(frame.code, code, { comparator: isEqual })) {
			if (index >= frame.programCounter) {
				break;
			}
			if (change.removed) {
				frame.programCounter -= change.count!;
				index -= change.count!;
				continue;
			}
			if (change.added) {
				frame.programCounter += change.count!;
				index += change.count!;
				continue;
			}
			if (!change.added && !change.removed) {
				index += change.count!;
				continue;
			}
		}
		frame.code = code;
		return frame;
	}
}
