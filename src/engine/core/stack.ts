/**
 * Sealed Sins, 2023-2024.
 */
import { pick } from 'lodash';

/**
 * Call Stack Frame.
 * @internal
 */
export interface StackFrame<T = unknown> {
	path: Array<string | number>;
	programCounter: number;
	code: Array<T>;
}

/**
 * Call Stack Slice.
 */
export interface StackSlice<T = unknown> {
	frame: StackFrame<T>;
	index: number;
	value: T;
}

/**
 * Call Stack.
 */
export class Stack<T = unknown> {
	private stack: Array<StackFrame<T>> = [];

	/**
	 * Returns stack status.
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
	public push(path: StackFrame<T>['path'], code: StackFrame<T>['code']) {
		const programCounter = 0;
		this.stack.unshift({ path, programCounter, code });
	}

	/**
	 * Pulls a slice from the top of the stack.
	 */
	public pull(): StackSlice<T> | null {
		const frame = this.stack[0];
		if (!frame) {
			return null;
		}
		const value = frame.code[frame.programCounter];
		if (!value) {
			this.stack.shift();
			return this.pull();
		}
		const slice: StackSlice<T> = {
			frame,
			index: frame.programCounter,
			value,
		};
		frame.programCounter++;
		return slice;
	}

	/**
	 * Peeks a slice from the top of the stack.
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
	 * Stringifies stack state and returns it.
	 */
	public save() {
		const data = pick(this, ['stack', 'index']);
		const json = JSON.stringify(data);
		return btoa(json);
	}

	/**
	 * Parses given stack state and restores it.
	 * @param state - State to load.
	 */
	public load(state: string) {
		const data = JSON.parse(atob(state));
		Object.assign(this, data);
		return this;
	}
}
