/**
 * Sealed Sins, 2023-2024.
 */
import zod, { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { get, mapValues, isPlainObject, isArray, isEqual } from 'lodash';
import { Stack, StackFrame } from './stack';
import { Scope } from './scope';
import traverse from 'traverse';

/**
 * Script event.
 * @typeParam T - Event data type.
 */
export interface ScriptEvent<T = unknown> {
	type: string;
	data?: T;
}

/**
 * Script event listener.
 * @typeParam T - Event data type.
 */
export interface ScriptListener<T = unknown> {
	(event: ScriptEvent<T>): void;
}

/**
 * Script save state.
 * @internal
 */
export interface ScriptState {
	scope: Record<string, unknown>;
	stack: Array<
		StackFrame & {
			path: Array<string | number>;
		}
	>;
}

/**
 * Script expression container.
 */
export class ScriptExp {
	constructor(public readonly exp: string) {
		return;
	}
}

/**
 * Script template container.
 */
export class ScriptFmt {
	constructor(public readonly fmt: string) {
		return;
	}
}

/**
 * Script error.
 */
export class ScriptError extends Error {
	public override name = 'ScriptError';

	// prettier-ignore
	constructor(message: string, public path?: Array<string | number>) {
		super(message);
	}
}

/**
 * Script interpreter.
 */
export class Script {
	protected subs: Array<ScriptListener<unknown>> = [];
	protected stack = new Stack();
	protected scope = new Scope();

	constructor(public source: Array<unknown> = []) {
		this.stack.push(source);
	}

	/**
	 * Creates new script expression.
	 */
	static exp(exp: string) {
		return new ScriptExp(exp);
	}

	/**
	 * Creates new script template.
	 */
	static fmt(fmt: string) {
		return new ScriptFmt(fmt);
	}

	/**
	 * Returns script execution state.
	 */
	public isDone() {
		return this.stack.isEmpty();
	}

	/**
	 * Gets script variable.
	 * @param name - Variable name.
	 * @returns Variable value.
	 */
	public getVar<T = unknown>(name: string) {
		return this.scope.get<T>(name);
	}

	/**
	 * Sets script variable.
	 * @param name - Variable name.
	 * @param value - Variable value.
	 */
	public setVar<T = unknown>(name: string, value: T) {
		return this.scope.set<T>(name, value);
	}

	/**
	 * Emits `event` to active subscribers.
	 * @param event - Event to dispatch.
	 */
	public emit<T>(type: string, data?: T) {
		const event = { type, data };
		this.subs.forEach((listener) => listener.call(this, event));
	}

	/**
	 * Subscribes to incoming events.
	 * Use the `emit` command to trigger this.
	 * @param listener - Event listener.
	 * @returns Unsubscribe function.
	 */
	public subscribe<T>(listener: ScriptListener<T>) {
		const subs = this.subs as Array<ScriptListener<T>>;
		subs.push(listener);
		return () => {
			const index = subs.indexOf(listener);
			subs.splice(index, 1);
		};
	}

	/**
	 * Saves script state.
	 * @returns Script state.
	 */
	public save() {
		const scope = this.scope.dump();
		const stack = this.stack.dump().map((x) => ({ path: this.path(x.code)!, ...x }));
		const state = { stack, scope } satisfies ScriptState;
		return JSON.stringify(state);
	}

	/**
	 * Loads script state.
	 *
	 * @remarks
	 * Loading state with a different source may cause unwanted state losses.
	 * Use with caution.
	 *
	 * @param state - State to load.
	 * @returns Script.
	 */
	public load(state: string) {
		try {
			const { scope, stack } = JSON.parse(state) as ScriptState;
			this.scope = new Scope(scope);
			this.stack = new Stack();
			for (const { path, code, programCounter } of stack) {
				const updatedCode = this.node(path) as Array<unknown>;
				if (!updatedCode) {
					continue;
				}
				const frame = this.stack.push(code);
				frame.programCounter = programCounter;
				Stack.patch(frame, updatedCode);
			}
			return this;
		} catch (err) {
			throw new ScriptError(`Error loading save - it may be broken or unsupported.`);
		}
	}

	/**
	 * Executes the next script step.
	 */
	public step() {
		const slice = this.stack.pull();
		if (!slice) {
			return;
		}
		try {
			this.exec(slice.value);
			this.emit('step');
		} catch (err: any) {
			const path = this.path(slice.value) ?? undefined;
			const args = err instanceof ZodError && fromZodError(err, { prefix: 'Arguments' });
			const text = args ? args.message : err.message;
			throw new ScriptError(text, path);
		}
	}

	/**
	 * Unpacks command object into its type and arguments.
	 * @param value - Command to unpack.
	 * @internal
	 */
	protected unpack(value: unknown) {
		if (!isPlainObject(value) || Object.keys(value!).length !== 1) {
			const msg = `Invalid command: ${JSON.stringify(value)}`;
			throw new ScriptError(msg);
		}
		const [type, args] = Object.entries(value!)[0] as [string, unknown];
		return { type, args };
	}

	/**
	 * Jumps to the given `label`.
	 * Labels are allowed only in the top-level code.
	 * @param label - Label to jump.
	 * @internal
	 */
	protected jump(label: string) {
		const targetIndex = this.source.findIndex((cmd) => isEqual(cmd, { label }));
		if (targetIndex < 0) {
			throw new ScriptError(`Label "${label}" is not found`);
		}
		if (this.stack.isEmpty()) {
			this.stack.push(this.source);
		}
		const rootFrame = this.stack.dump()[0]!;
		rootFrame.programCounter = targetIndex;
	}

	/**
	 * Evaluates `value` as an expression.
	 * All instances of `ScriptExp` and `ScriptFmt` are going to be resolved.
	 * @param value - Value to evaluate.
	 * @internal
	 */
	protected eval(value: unknown): unknown {
		if (isPlainObject(value)) {
			return mapValues(value!, (item) => this.eval(item));
		} else if (isArray(value)) {
			return value.map((item) => this.eval(item));
		} else if (value instanceof ScriptExp) {
			return this.scope.renderExpression(value.exp);
		} else if (value instanceof ScriptFmt) {
			return this.scope.renderTemplate(value.fmt);
		} else {
			return value;
		}
	}

	/**
	 * Evaluates `value` as a command and executes it.
	 * @param value - Command to execute.
	 * @remarks Override this method to implement own commands.
	 * @internal
	 */
	protected exec(value: unknown) {
		const { type, args } = this.unpack(value);
		switch (type) {
			case 'if': {
				const argSchema = zod.object({
					cond: zod.unknown(),
					then: zod.array(zod.unknown()).optional(),
					else: zod.array(zod.unknown()).optional(),
				});
				const { cond, ...branch } = argSchema.parse(args);
				const isTrue = !!this.eval(cond);
				if (isTrue && branch.then) {
					this.stack.push(branch.then);
				}
				if (!isTrue && branch.else) {
					this.stack.push(branch.else);
				}
				break;
			}
			case 'label': {
				const argSchema = zod.string();
				argSchema.parse(this.eval(args));
				break;
			}
			case 'jump': {
				const argSchema = zod.string();
				const label = argSchema.parse(this.eval(args));
				this.jump(label);
				break;
			}
			case 'eval': {
				const argSchema = zod.string();
				const code = argSchema.parse(this.eval(args));
				new Function(code).call(this.scope.dump());
				break;
			}
			case 'print': {
				const argSchema = zod.string();
				const text = argSchema.parse(this.eval(args));
				console.log(text);
				break;
			}
			case 'throw': {
				const argSchema = zod.string();
				const text = argSchema.parse(this.eval(args));
				throw new ScriptError(text);
				break;
			}
			case 'set': {
				const argSchema = zod.object({
					name: zod.string(),
					value: zod.any(),
				});
				const { name, value } = argSchema.parse(this.eval(args));
				this.setVar(name, value);
				break;
			}
			case 'emit': {
				const argSchema = zod.object({
					type: zod.string(),
					data: zod.any(),
				});
				const data = argSchema.parse(this.eval(args));
				this.emit(data.type, data.data);
				break;
			}
			default: {
				throw new ScriptError(`Unknown command: ${type}`);
				break;
			}
		}
	}

	/**
	 * Gets source node at a given path.
	 * @param path - Path to check.
	 * @returns Node or null.
	 */
	protected node(path: Array<string | number>): unknown | null {
		if (isEqual(path, [])) {
			return this.source;
		} else {
			return get(this.source, path, null);
		}
	}

	/**
	 * Gets path for a given source node.
	 * @params node - Node to search for.
	 * @returns Node path or null.
	 */
	protected path(node: unknown) {
		const tree = traverse(this.source);
		const path = tree.paths().find((path) => {
			return Object.is(node, tree.get(path));
		});
		if (!path) {
			return null;
		}
		return path.map((index) => {
			const numericIndex = parseInt(index);
			return isNaN(numericIndex) ? index : numericIndex;
		});
	}
}
