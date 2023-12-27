/**
 * Sealed Sins, 2023.
 */
import zod, { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { isPlainObject, isArray, isEmpty, isEqual, mapValues } from 'lodash';
import traverse from 'traverse';

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
	constructor(message: string, public path?: Array<string>) {
		super(message);
	}
}

/**
 * Script interpreter.
 */
export class Script {
	private vars: Record<string, unknown> = {};
	private stack: Array<unknown> = [];

	constructor(public readonly source: Array<unknown> = []) {
		this.pushStack(...source);
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
		return isEmpty(this.stack);
	}

	/**
	 * Saves script state to a string.
	 */
	public save() {
		return JSON.stringify({
			source: this.source,
			vars: this.vars,
			stack: this.stack,
		});
	}

	/**
	 * Loads script state from a string.
	 */
	public load(state: string) {
		try {
			const schema = zod.object({
				source: zod.array(zod.unknown()),
				vars: zod.record(zod.string(), zod.unknown()),
				stack: zod.array(zod.any()),
			});
			const parsed = schema.parse(JSON.parse(state));
			Object.assign(this, parsed);
			return this;
		} catch (err) {
			throw new ScriptError('Invalid save state.');
		}
	}

	/**
	 * Gets script variable.
	 */
	public getVar<T = unknown>(name: string) {
		return this.vars[name] as T;
	}

	/**
	 * Sets script variable.
	 */
	public setVar<T = unknown>(name: string, value: T) {
		this.vars[name] = value;
	}

	/**
	 * Executes the next script step.
	 */
	// prettier-ignore
	public step() {
		const cmd = this.stack.shift();
		if (!cmd) {
			return;
		}
		try {
			this.exec(cmd);
		} catch (err: any) {
			const vld = err instanceof ZodError && fromZodError(err, { prefix: 'Command Arguments' });
			const msg = vld ? vld.message : err.message;
			throw new ScriptError(msg, this.trace(cmd));
		}
	}

	/**
	 * Renders `template` as a JS expression and returns its value.
	 * @internal
	 */
	protected renderExpression(template: string) {
		const render = new Function(...Object.keys(this.vars), `return (${template})`);
		const result = render.call(this.vars, ...Object.values(this.vars));
		return result as unknown;
	}

	/**
	 * Renders `template` as a string template and returns its value.
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
	 * Performs search for a given `value` within script `source` and returns its path.
	 * @internal
	 */
	protected trace(value: unknown) {
		return traverse.paths(this.source).find((path) => {
			return traverse.get(this.source, path) === value;
		});
	}

	/**
	 * Unpacks command object into its type and arguments.
	 * @internal
	 */
	protected unpack(value: unknown) {
		if (!isPlainObject(value) || isEmpty(value)) {
			const json = JSON.stringify(value);
			const text = `Invalid command: ${json}`;
			throw new ScriptError(text);
		}
		const entries = Object.entries(value as object);
		if (entries.length > 1) {
			const json = JSON.stringify(value);
			const text = `Multiple directives are not allowed: ${json}`;
			throw new ScriptError(text);
		}
		const [type, args] = entries[0]!;
		return { type, args };
	}

	/**
	 * Pulls the top of the execution stack.
	 * @internal
	 */
	protected peekStack() {
		return this.stack[0];
	}

	/**
	 * Pushes commands to the top of the execution stack.
	 * @internal
	 */
	protected pushStack(...args: Array<unknown>) {
		this.stack.unshift(...args);
	}

	/**
	 * Jumps to the given `label`.
	 * Labels are allowed only in the top-level code.
	 * @internal
	 */
	protected jump(label: string) {
		const index = this.source.findIndex((cmd) => isEqual(cmd, { label }));
		if (index >= 0) {
			this.stack = this.source.slice(index);
		} else {
			throw new ScriptError(`Label "${label}" is not found`);
		}
	}

	/**
	 * Evaluates `value` as an expression.
	 * All instances of `ScriptExp` and `ScriptFmt` are going to be resolved.
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
					this.pushStack(...branch.then);
				}
				if (!isTrue && branch.else) {
					this.pushStack(...branch.else);
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
			case 'save': {
				const argSchema = zod.string();
				const slot = argSchema.parse(args);
				const data = this.save();
				localStorage.setItem(slot, data);
				break;
			}
			case 'load': {
				const argSchema = zod.string();
				const slot = argSchema.parse(args);
				const data = localStorage.getItem(slot);
				if (!data) {
					throw new ScriptError(`Empty save slot: ${slot}`);
				} else {
					this.load(data);
				}
				break;
			}
			default: {
				throw new ScriptError(`Unknown command: ${type}`);
				break;
			}
		}
	}
}
