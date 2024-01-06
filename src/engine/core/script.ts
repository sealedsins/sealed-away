/**
 * Sealed Sins, 2023-2024.
 */
import zod, { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { pick, mapValues, isPlainObject, isArray, isEqual } from 'lodash';
import { Stack, StackSlice } from './stack';

/**
 * Script event.
 */
export interface ScriptEvent<T = unknown> {
	type: string;
	data?: T;
}

/**
 * Script event listener.
 */
export interface ScriptListener<T = unknown> {
	(event: ScriptEvent<T>): void;
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
	protected stack = new Stack();
	protected subs: Array<ScriptListener<unknown>> = [];
	protected vars: Record<string, unknown> = {};

	constructor(public source: Array<unknown> = []) {
		this.stack.push([], source);
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
		return this.vars[name] as T;
	}

	/**
	 * Sets script variable.
	 * @param name - Variable name.
	 * @param value - Variable value.
	 */
	public setVar<T = unknown>(name: string, value: T) {
		this.vars[name] = value;
	}

	/**
	 * Emits `event` to active subscribers.
	 * @param event - Event to dispatch.
	 */
	public emit<T>(event: ScriptEvent<T>) {
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
		const stack = this.stack.save();
		const state = JSON.stringify(pick(this, ['source', 'vars']));
		return JSON.stringify({ state, stack });
	}

	/**
	 * Loads script state.
	 * @param state - State to load.
	 * @returns Script.
	 */
	public load(state: string) {
		const data = JSON.parse(state);
		this.stack = this.stack.load(data.stack);
		Object.assign(this, JSON.parse(data.state));
		return this;
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
			this.exec(slice.value, slice);
		} catch (err: any) {
			const path = [...slice.frame.path, slice.index];
			const args = err instanceof ZodError && fromZodError(err, { prefix: 'Arguments' });
			const text = args ? args.message : err.message;
			throw new ScriptError(text, path);
		}
	}

	/**
	 * Renders `template` as a JS expression and returns its value.
	 * @param template - Expression to render.
	 * @internal
	 */
	protected renderExpression(template: string) {
		const render = new Function(...Object.keys(this.vars), `return (${template})`);
		const result = render.call(this.vars, ...Object.values(this.vars));
		return result as unknown;
	}

	/**
	 * Renders `template` as a string template and returns its value.
	 * @param template - Template to render.
	 * @internal
	 */
	protected renderTemplate(template: string) {
		let output = template;
		for (const [match, exp] of template.matchAll(/{{(.+?)}}/gm)) {
			const value = this.renderExpression(exp!);
			output = output.replace(match, `${value}`);
		}
		return output;
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
		this.stack.clear();
		this.stack.push([], this.source.slice(targetIndex));
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
			return this.renderExpression(value.exp);
		} else if (value instanceof ScriptFmt) {
			return this.renderTemplate(value.fmt);
		} else {
			return value;
		}
	}

	/**
	 * Evaluates `value` as a command and executes it.
	 * @param value - Command to execute.
	 * @param slice - Optional stack slice (used to debug some commands).
	 * @remarks Override this method to implement own commands.
	 * @internal
	 */
	protected exec(value: unknown, slice?: StackSlice) {
		const { type, args } = this.unpack(value);
		switch (type) {
			case 'if': {
				const argSchema = zod.object({
					cond: zod.unknown(),
					then: zod.array(zod.unknown()).optional(),
					else: zod.array(zod.unknown()).optional(),
				});
				const path = slice ? [...slice.frame.path, slice.index] : [];
				const { cond, ...branch } = argSchema.parse(args);
				const isTrue = !!this.eval(cond);
				if (isTrue && branch.then) {
					const branchPath = [...path, 'if', 'then'];
					this.stack.push(branchPath, branch.then);
				}
				if (!isTrue && branch.else) {
					const branchPath = [...path, 'if', 'else'];
					this.stack.push(branchPath, branch.else);
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
				new Function(code).call(this.vars);
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
				this.emit(data);
				break;
			}
			default: {
				throw new ScriptError(`Unknown command: ${type}`);
				break;
			}
		}
	}
}
