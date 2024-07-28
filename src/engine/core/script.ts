/**
 * Sealed Sins, 2023-2024.
 */
import traverse from 'traverse';
import zod, { ZodSchema } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { get, mapValues, isPlainObject, isArray, isEqual } from 'lodash';
import { Serializer, Serialize, SerializableEntity, Json } from '../utils/serialize';
import { Stack, StackFrame } from './stack';
import { Scope } from './scope';

/**
 * Script source code.
 */
// prettier-ignore
export type ScriptSource = (
	Array<ScriptNode>
);

/**
 * Script source code node.
 * May represent either a command, an expression, a template or a value.
 */
// prettier-ignore
export type ScriptNode = ( 
	ScriptValue | ScriptExp | ScriptFmt | Array<ScriptNode> | { [key: string]: ScriptNode }
);

/**
 * Script value.
 */
// prettier-ignore
export type ScriptValue = (
	Json
);

/**
 * Script node path.
 */
// prettier-ignore
export type ScriptPath = (
	Array<string | number>
);

/**
 * Script save state.
 * @internal
 */
// prettier-ignore
export type ScriptState = {
	scope: Record<string, ScriptValue>;
	stack: Array<StackFrame<ScriptNode> & {
		path: ScriptPath;
	}>;
}

/**
 * Script event.
 * @typeParam T - Event data type.
 */
export type ScriptEvent<T = unknown> = {
	type: string;
	data?: T;
};

/**
 * Script event listener.
 * @typeParam T - Event data type.
 */
export type ScriptListener<T = unknown> = {
	(event: ScriptEvent<T>): void;
};

/**
 * Script error.
 */
export class ScriptError extends Error {
	public override name = 'ScriptError';

	// prettier-ignore
	constructor(message: string, public path?: ScriptPath) {
		super(message);
	}
}

/**
 * Script expression container.
 */
export class ScriptExp implements SerializableEntity {
	constructor(public readonly exp: string) {
		return;
	}
	public toJSON() {
		return { exp: this.exp };
	}
	public fromJSON(json: Serialize<this>) {
		return new ScriptExp(json.exp);
	}
}

/**
 * Script template container.
 */
export class ScriptFmt implements SerializableEntity {
	constructor(public readonly fmt: string) {
		return;
	}
	public toJSON() {
		return { fmt: this.fmt };
	}
	public fromJSON(json: Serialize<this>) {
		return new ScriptFmt(json.fmt);
	}
}

/**
 * Script interpreter.
 */
export class Script {
	protected subs: Array<ScriptListener<unknown>> = [];
	protected scope = new Scope<ScriptValue>();
	protected stack = new Stack<ScriptNode>();

	private serializer = new Serializer({
		ScriptFmt,
		ScriptExp,
	});

	constructor(protected source: ScriptSource = []) {
		this.stack.push(source);
	}

	/**
	 * Creates new script expression.
	 * @params exp - String expression.
	 * @returns Script expression container.
	 */
	static exp(exp: string) {
		return new ScriptExp(exp);
	}

	/**
	 * Creates new script template.
	 * @params fmt - String template.
	 * @returns Script template container.
	 */
	static fmt(fmt: string) {
		return new ScriptFmt(fmt);
	}

	/**
	 * Returns script execution state.
	 * @returns Boolean indicating execution status.
	 */
	public isDone() {
		return this.stack.isEmpty();
	}

	/**
	 * Gets script variable.
	 * @param name - Variable name.
	 * @returns Variable value.
	 */
	public getVar<T extends ScriptValue>(name: string) {
		return this.scope.get<T>(name);
	}

	/**
	 * Sets script variable.
	 * @param name - Variable name.
	 * @param value - Variable value.
	 */
	public setVar<T extends ScriptValue>(name: string, value: T) {
		return this.scope.set<T>(name, value);
	}

	/**
	 * Emits `event` to active subscribers.
	 * @param event - Event to dispatch.
	 */
	public emit<T>(type: string, data?: T) {
		const event = { type, data };
		this.subs.forEach((listener) => {
			listener.call(this, event);
		});
	}

	/**
	 * Subscribes to incoming events.
	 * Use the `emit` command to trigger subscribers.
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
	 * Patches script with a new source.
	 * @param source - Updated source.
	 */
	public patch(source: ScriptSource) {
		const state = this.save();
		this.source = source;
		this.load(state);
	}

	/**
	 * Saves script state.
	 * @returns Script state.
	 */
	public save() {
		const scope = this.scope.dump();
		const stack = this.stack.dump().map((x) => ({ path: this.path(x.code)!, ...x }));
		const state = { scope, stack } satisfies ScriptState;
		return this.serializer.stringify(state);
	}

	/**
	 * Loads script state.
	 * @param state - State to load.
	 * @returns Script.
	 */
	public load(state: string) {
		try {
			const { scope, stack } = this.serializer.parse<ScriptState>(state);
			this.scope = new Scope<ScriptValue>(scope);
			this.stack = new Stack<ScriptNode>();
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
		} catch (err: any) {
			const path = this.path(slice.value) ?? undefined;
			const text = err.message ?? err.toString();
			throw new ScriptError(text, path);
		}
	}

	/**
	 * Jumps to the given `label`.
	 * @remarks Labels are allowed only in the top-level code.
	 * @param label - Label to jump.
	 */
	public jump(label: string) {
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
	 * Gets source node at a given path.
	 * @param path - Path to check.
	 * @returns Node reference or null.
	 * @internal
	 */
	protected node(path: ScriptPath): ScriptNode | null {
		if (isEqual(path, [])) {
			return this.source;
		} else {
			return get(this.source, path, null);
		}
	}

	/**
	 * Searches for the given `node` path in the script source.
	 * @params node - Node to search for.
	 * @returns Node path or null.
	 * @internal
	 */
	protected path(node: ScriptNode): ScriptPath | null {
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

	/**
	 * Unpacks `node` as a command object into its type and arguments.
	 * @param value - Command to unpack.
	 * @returns Command type and arguments.
	 * @internal
	 */
	protected unpack(node: ScriptNode) {
		if (!isPlainObject(node) || Object.keys(node!).length !== 1) {
			const msg = `Invalid command: ${JSON.stringify(node)}`;
			throw new ScriptError(msg);
		}
		const commandValue = Object.entries(node!)[0];
		const [type, args] = commandValue as [string, Record<string, ScriptNode>];
		return { type, args };
	}

	/**
	 * Validates given `value` against the `schema`.
	 * @remarks This method does not clone the original value.
	 * @param schema - Schema to use.
	 * @param value - Value to validate.
	 * @returns Original value.
	 */
	protected validate<T>(schema: ZodSchema<T>, value: unknown) {
		const validation = schema.safeParse(value);
		if (validation.success) {
			return value as T;
		}
		const { message: text } = fromZodError(validation.error, { prefix: null });
		throw new ScriptError(text);
	}

	/**
	 * Evaluates `node` as an expression and returns its value.
	 * All instances of `ScriptExp` and `ScriptFmt` are going to be resolved.
	 * @param value - Value to evaluate.
	 * @returns Evaulated node value.
	 * @internal
	 */
	protected eval(node: ScriptNode): unknown {
		if (isPlainObject(node)) {
			return mapValues(node as object, (item) => this.eval(item));
		} else if (isArray(node)) {
			return node.map((item) => this.eval(item));
		} else if (node instanceof ScriptExp) {
			return this.scope.renderExpression(node.exp);
		} else if (node instanceof ScriptFmt) {
			return this.scope.renderTemplate(node.fmt);
		} else {
			return node;
		}
	}

	/**
	 * Evaluates `node` as a command and executes it.
	 * @param node - Command to execute.
	 * @remarks Override this method to implement own commands.
	 * @internal
	 */
	protected exec(node: ScriptNode) {
		const { type, args } = this.unpack(node);
		switch (type) {
			case 'if': {
				const argSchema = zod.object({
					cond: zod.any(),
					then: zod.array(zod.any()).optional(),
					else: zod.array(zod.any()).optional(),
				});
				const { cond, ...branch } = this.validate(argSchema, args);
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
				this.validate(argSchema, this.eval(args));
				break;
			}
			case 'jump': {
				const argSchema = zod.string();
				const label = this.validate(argSchema, this.eval(args));
				this.jump(label);
				break;
			}
			case 'eval': {
				const argSchema = zod.string();
				const code = this.validate(argSchema, this.eval(args));
				new Function(code).call(this.scope.dump());
				break;
			}
			case 'print': {
				const argSchema = zod.string();
				const text = this.validate(argSchema, this.eval(args));
				console.log(text);
				break;
			}
			case 'throw': {
				const argSchema = zod.string();
				const text = this.validate(argSchema, this.eval(args));
				throw new ScriptError(text);
				break;
			}
			case 'set': {
				const argSchema = zod.object({
					name: zod.string(),
					value: zod.any(),
				});
				const { name, value } = this.validate(argSchema, this.eval(args));
				this.setVar(name, value);
				break;
			}
			case 'emit': {
				const argSchema = zod.object({
					type: zod.string(),
					data: zod.any(),
				});
				const data = this.validate(argSchema, this.eval(args));
				this.emit(data.type, data.data);
				break;
			}
			default: {
				throw new ScriptError(`Unknown command: ${type}`);
				break;
			}
		}
	}
}
