/**
 * Sealed Sins, 2023-2024.
 */
import { diffArray } from '../utils/diff';

/**
 * Exeuction Stack Frame.
 * @typeParam T - Frame command type.
 * @typeParam M - Frame metadata.
 */
export type StackFrame<T = unknown> = {
	programCounter: number;
	code: Array<T>;
};

/**
 * Execution Stack Slice.
 * @typeParam T - Frame command type.
 * @typeParam M - Frame metadata.
 */
export type StackSlice<T = unknown> = {
	frame: StackFrame<T>;
	index: number;
	value: T;
};

/**
 * Execution Stack Error.
 */
export class StackError extends Error {
	public override name = 'StackError';
}

/**
 * Execution Stack.
 * @typeParam T - Frame command type.
 * @typeParam M - Frame metadata.
 */
export class Stack<T = unknown, M = never> {
	private stack: Array<StackFrame<T>> = [];

	/**
	 * Patches given frame with a new code, updating the program counter accordingly.
	 * @param frame - Stack frame.
	 * @param code - Updated code.
	 * @returns Given stack frame.
	 */
	public static patch<T>(frame: StackFrame<T>, code: StackFrame<T>['code']) {
		let index = 0;
		for (const change of diffArray(frame.code, code)) {
			if (index >= frame.programCounter) {
				break;
			}
			if (change.removed) {
				frame.programCounter = frame.programCounter - 1;
				index = index - 1;
				continue;
			}
			if (change.added) {
				frame.programCounter = frame.programCounter + 1;
				index = index + 1;
				continue;
			}
			if (!change.added && !change.removed) {
				index++;
				continue;
			}
		}
		frame.code = code;
		return frame;
	}

	/**
	 * Returns stack status.
	 * @returns Boolean indicating stack status.
	 */
	public isEmpty() {
		return !this.peek();
	}

	/**
	 * Dumps current stack state.
	 * @remarks Stack data is returned in reverse order.
	 * @returns Stack frame data.
	 */
	public dump() {
		return this.stack.reverse();
	}

	/**
	 * Clears current stack state.
	 */
	public clear() {
		this.stack.length = 0;
	}

	/**
	 * Pushes new frame to the top of the stack.
	 * @param code - Frame code.
	 * @returns Created frame.
	 */
	public push(code: StackFrame<T>['code']): StackFrame<T> {
		const frame = { programCounter: 0, code };
		this.stack.unshift(frame);
		return frame;
	}

	/**
	 * Peeks a slice from the top of the stack.
	 * @returns Stack slice from the top of the stack.
	 */
	public peek(): StackSlice<T> | null {
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
	public pull(): StackSlice<T> | null {
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
}
